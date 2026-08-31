import { generateText, Output } from "ai";
import { getAIModel } from "@/lib/ai/client";
import { AI_PRIMARY_MODEL, REQUEST_TIMEOUT_MS } from "@/lib/ai/constants";
import { env } from "@/lib/env/env";
import { ActionError } from "@/lib/safe-action/errors";
import type {
  ChallengeFile,
  ChallengeHint,
  DiffLine,
  GeneratedChallengeDraft,
  GenerateQuestionParams,
  RefineQuestionParams,
} from "../types";
import { type RawParsedChallenge, rawLlmChallengeSchema } from "../validation";

function findLookAhead(
  linesA: string[],
  linesB: string[],
  idxA: number,
  idxB: number
): number {
  for (let offset = 1; offset < 10; offset += 1) {
    if (
      idxA + offset < linesA.length &&
      linesA[idxA + offset] === linesB[idxB]
    ) {
      return offset;
    }
  }
  return -1;
}

function processMismatch(
  buggyLines: string[],
  fixedLines: string[],
  initialBuggyIndex: number,
  initialFixedIndex: number,
  diff: DiffLine[]
): [number, number] {
  let i = initialBuggyIndex;
  let j = initialFixedIndex;
  const hasBuggy = i < buggyLines.length;
  const hasFixed = j < fixedLines.length;

  const lookAheadBuggy = hasFixed
    ? findLookAhead(buggyLines, fixedLines, i, j)
    : -1;
  const lookAheadFixed = hasBuggy
    ? findLookAhead(fixedLines, buggyLines, j, i)
    : -1;

  if (lookAheadBuggy !== -1) {
    for (let k = 0; k < lookAheadBuggy; k += 1) {
      diff.push({ line: i + 1, text: buggyLines[i], type: "del" });
      i += 1;
    }
    return [i, j];
  }

  if (lookAheadFixed !== -1) {
    for (let k = 0; k < lookAheadFixed; k += 1) {
      diff.push({ line: j + 1, text: fixedLines[j], type: "add" });
      j += 1;
    }
    return [i, j];
  }

  if (hasBuggy) {
    diff.push({ line: i + 1, text: buggyLines[i], type: "del" });
    i += 1;
  }

  if (hasFixed) {
    diff.push({ line: j + 1, text: fixedLines[j], type: "add" });
    j += 1;
  }

  return [i, j];
}

/**
 * Computes unified diff lines comparing buggy code to fixed code.
 */
export function computeUnifiedDiff(
  buggyCode: string,
  fixedCode: string
): DiffLine[] {
  const buggyLines = buggyCode.split("\n");
  const fixedLines = fixedCode.split("\n");
  const diff: DiffLine[] = [];

  let i = 0;
  let j = 0;

  while (i < buggyLines.length || j < fixedLines.length) {
    const hasBuggy = i < buggyLines.length;
    const hasFixed = j < fixedLines.length;

    if (hasBuggy && hasFixed && buggyLines[i] === fixedLines[j]) {
      diff.push({ line: i + 1, text: buggyLines[i], type: "ctx" });
      i += 1;
      j += 1;
    } else {
      const [nextI, nextJ] = processMismatch(
        buggyLines,
        fixedLines,
        i,
        j,
        diff
      );
      i = nextI;
      j = nextJ;
    }
  }

  return diff;
}

/**
 * Detects the buggy line range in the buggy entry file.
 */
export function detectBuggyLines(
  buggyCode: string,
  fixedCode: string
): [number, number] {
  const bLines = buggyCode.split("\n");
  const fLines = fixedCode.split("\n");

  let firstDiff = -1;
  let lastDiff = -1;

  for (let i = 0; i < Math.max(bLines.length, fLines.length); i += 1) {
    if (bLines[i] !== fLines[i]) {
      if (firstDiff === -1) {
        firstDiff = i + 1;
      }
      lastDiff = Math.min(i + 1, bLines.length);
    }
  }

  if (firstDiff === -1) {
    return [1, 1];
  }

  return [firstDiff, Math.max(firstDiff, lastDiff)];
}

function resolveEntryFile(parsed: RawParsedChallenge): string {
  if (parsed.buggyArtifact.entryFile) {
    return parsed.buggyArtifact.entryFile;
  }
  const entryFileObj = parsed.buggyArtifact.files.find((f) => f.isEntry);
  if (entryFileObj) {
    return entryFileObj.name;
  }
  return parsed.buggyArtifact.files[0]?.name || "index.ts";
}

function resolveDiffLines(
  parsed: RawParsedChallenge,
  buggyEntry?: ChallengeFile,
  fixedEntry?: ChallengeFile
): DiffLine[] {
  const diff = parsed.referenceFix?.diff;
  if (diff !== null && diff !== undefined && diff.length > 0) {
    return diff;
  }
  if (buggyEntry && fixedEntry) {
    return computeUnifiedDiff(buggyEntry.code, fixedEntry.code);
  }
  return [];
}

function resolveBuggyLines(
  parsed: RawParsedChallenge,
  buggyEntry?: ChallengeFile,
  fixedEntry?: ChallengeFile
): [number, number] {
  const specified = parsed.buggyArtifact.buggyLines;
  if (specified !== null && specified[0] > 0 && specified[1] >= specified[0]) {
    return specified;
  }
  if (buggyEntry && fixedEntry) {
    return detectBuggyLines(buggyEntry.code, fixedEntry.code);
  }
  return [1, 1];
}

function resolveHints(rawHints: RawParsedChallenge["hints"]): ChallengeHint[] {
  if (!rawHints || rawHints.length === 0) {
    return [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt: "Inspect where variable state is captured vs updated.",
      },
      {
        order: 2,
        penaltyPoints: 20,
        socraticPrompt:
          "Look closely at the lifecycle and closure references inside the callback.",
      },
      {
        order: 3,
        penaltyPoints: 30,
        socraticPrompt:
          "Consider using a functional updater or dependency array to ensure fresh references.",
      },
    ];
  }

  return rawHints.map((h, idx) => ({
    order: idx + 1,
    penaltyPoints: h.penaltyPoints || (idx + 1) * 10,
    socraticPrompt: h.socraticPrompt,
  }));
}

function getPointsByDifficulty(diff: "easy" | "medium" | "hard"): number {
  if (diff === "easy") {
    return 100;
  }
  if (diff === "hard") {
    return 300;
  }
  return 200;
}

function getTimeLimitByDifficulty(diff: "easy" | "medium" | "hard"): string {
  if (diff === "easy") {
    return "15 min";
  }
  if (diff === "hard") {
    return "30 min";
  }
  return "20 min";
}

function normalizeFileEntries(files: unknown): unknown {
  if (!Array.isArray(files)) {
    return files;
  }
  return (files as unknown[]).map((file) => {
    if (file === null || file === undefined || typeof file !== "object") {
      return file;
    }
    const fileObj = file as Record<string, unknown>;
    if (fileObj.isEntry === undefined) {
      return { ...fileObj, isEntry: false };
    }
    return fileObj;
  });
}

function coerceBuggyArtifactField(value: unknown): unknown {
  if (value === null || value === undefined || typeof value !== "object") {
    return value;
  }
  const ba = value as Record<string, unknown>;
  const baCopy: Record<string, unknown> = { ...ba };
  if (baCopy.buggyLines === undefined) {
    baCopy.buggyLines = null;
  }
  if (baCopy.points === undefined) {
    baCopy.points = null;
  }
  if (baCopy.timeLimit === undefined) {
    baCopy.timeLimit = null;
  }
  if (Array.isArray(baCopy.files)) {
    baCopy.files = normalizeFileEntries(baCopy.files);
  }
  return baCopy;
}

function coerceReferenceFixField(value: unknown): unknown {
  if (value === undefined) {
    return null;
  }
  if (value === null || typeof value !== "object") {
    return value;
  }
  const rf = value as Record<string, unknown>;
  const rfCopy: Record<string, unknown> = { ...rf };
  if (rfCopy.diff === undefined) {
    rfCopy.diff = null;
  }
  if (rfCopy.explanation === undefined) {
    rfCopy.explanation = null;
  }
  if (rfCopy.files === undefined) {
    rfCopy.files = null;
  }
  return rfCopy;
}

function applyNullableDefaults(target: Record<string, unknown>): void {
  const nullableKeys = [
    "categorySlug",
    "hiddenTests",
    "hints",
    "preventionNotes",
    "rootCauseSummary",
  ] as const;
  for (const key of nullableKeys) {
    if (target[key] === undefined) {
      target[key] = null;
    }
  }
}

function coerceRawInput(raw: unknown): unknown {
  if (raw === null || raw === undefined || typeof raw !== "object") {
    return raw;
  }
  const obj = raw as Record<string, unknown>;
  const copy: Record<string, unknown> = { ...obj };
  const buggyArtifactValue = copy.buggyArtifact;
  if (
    buggyArtifactValue !== null &&
    buggyArtifactValue !== undefined &&
    typeof buggyArtifactValue === "object"
  ) {
    copy.buggyArtifact = coerceBuggyArtifactField(buggyArtifactValue);
  }
  applyNullableDefaults(copy);
  copy.referenceFix = coerceReferenceFixField(copy.referenceFix);
  return copy;
}

/**
 * Normalizes and validates the challenge draft.
 * Lenient: fills defaults for preventionNotes, rootCauseSummary and referenceFix
 * when LLM omits them so Groq json_schema strict validation never fails end-to-end.
 */
export function normalizeChallengeDraft(
  raw: unknown,
  fallbackCategory = "react-rendering",
  fallbackDifficulty: "easy" | "medium" | "hard" = "medium"
): GeneratedChallengeDraft {
  const coerced = coerceRawInput(raw);
  const parsed = rawLlmChallengeSchema.parse(coerced);
  const targetDifficulty = parsed.difficulty || fallbackDifficulty;
  const entryFileName = resolveEntryFile(
    parsed as unknown as RawParsedChallenge
  );

  const buggyEntry =
    parsed.buggyArtifact.files.find((f) => f.name === entryFileName) ||
    parsed.buggyArtifact.files[0];

  // Lenient fallback for referenceFix when LLM omitted it (the reported bug)
  const rawReferenceFix = parsed.referenceFix as
    | RawParsedChallenge["referenceFix"]
    | null
    | undefined;
  const safeReferenceFix: RawParsedChallenge["referenceFix"] =
    rawReferenceFix ?? {
      diff: null,
      explanation: "Fixed root cause bug.",
      files: parsed.buggyArtifact.files.map((f) => ({
        code: f.code,
        name: f.name,
      })),
    };
  // If LLM omitted files or explanation, fill from buggy artifact
  if (!safeReferenceFix.files || safeReferenceFix.files.length === 0) {
    safeReferenceFix.files = parsed.buggyArtifact.files.map((f) => ({
      code: f.code,
      name: f.name,
    }));
  }
  if (!safeReferenceFix.explanation) {
    safeReferenceFix.explanation = "Fixed root cause bug.";
  }
  if (safeReferenceFix.diff === undefined) {
    safeReferenceFix.diff = null;
  }

  const fixedEntry =
    safeReferenceFix.files.find((f) => f.name === entryFileName) ||
    safeReferenceFix.files[0];

  const parsedForDiff = {
    ...parsed,
    referenceFix: safeReferenceFix,
  } as unknown as RawParsedChallenge;

  const computedDiff = resolveDiffLines(parsedForDiff, buggyEntry, fixedEntry);
  const buggyLines = resolveBuggyLines(parsedForDiff, buggyEntry, fixedEntry);
  const hints = resolveHints(
    (parsed.hints as RawParsedChallenge["hints"]) ?? null
  );

  const points =
    parsed.buggyArtifact.points ?? getPointsByDifficulty(targetDifficulty);
  const timeLimit =
    parsed.buggyArtifact.timeLimit ??
    getTimeLimitByDifficulty(targetDifficulty);

  const preventionNotes =
    (parsed.preventionNotes as string | null | undefined) ||
    "Apply strict code reviews and type safety.";
  const rootCauseSummary =
    (parsed.rootCauseSummary as string | null | undefined) ||
    `Root cause is a ${targetDifficulty} ${parsed.buggyArtifact.language || "typescript"} bug in ${entryFileName} that breaks expected behavior; see reference fix explanation.`;
  const categorySlug =
    (parsed.categorySlug as string | null | undefined) || fallbackCategory;
  const hiddenTests =
    (parsed.hiddenTests as RawParsedChallenge["hiddenTests"]) || [];

  return {
    buggyArtifact: {
      buggyLines,
      entryFile: entryFileName,
      files: parsed.buggyArtifact.files.map((f) => ({
        ...f,
        isEntry: f.name === entryFileName,
      })),
      language: parsed.buggyArtifact.language || "typescript",
      points,
      timeLimit,
    },
    categorySlug,
    difficulty: targetDifficulty,
    format: parsed.format || "code_snippet",
    hiddenTests: hiddenTests || [],
    hints,
    preventionNotes,
    prompt: parsed.prompt,
    referenceFix: {
      diff: computedDiff,
      explanation: safeReferenceFix.explanation || "Fixed root cause bug.",
      files: safeReferenceFix.files,
    },
    rootCauseSummary,
    title: parsed.title,
  };
}

function handleLlmError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (
    msg.includes("model_not_found") ||
    msg.includes("decommissioned") ||
    msg.includes("does not exist")
  ) {
    const modelErrorMessage = `AI model "${AI_PRIMARY_MODEL}" is unavailable (decommissioned). Update src/lib/ai/constants.ts to a current Groq model. Original: ${msg}`;
    const cause = err instanceof Error ? err : new Error(String(err));
    throw new ActionError(modelErrorMessage, { cause });
  }
  if (
    msg.includes("isEntry") ||
    msg.includes("invalid JSON schema") ||
    msg.includes("response_format") ||
    msg.includes("json_schema")
  ) {
    const cause = err instanceof Error ? err : new Error(String(err));
    throw new ActionError(
      `LLM JSON schema validation failed for "${AI_PRIMARY_MODEL}": ${msg}. Check src/features/admin/validation.ts strict compliance (required must include all properties).`,
      { cause }
    );
  }
  throw err as Error;
}

/**
 * Calls Groq LLM to generate a brand new challenge draft.
 */

export type GeneratorStrategy = (
  params: GenerateQuestionParams
) => Promise<GeneratedChallengeDraft>;
export type RefinerStrategy = (
  params: RefineQuestionParams
) => Promise<GeneratedChallengeDraft>;

export const getGeneratorStrategy = (apiKey?: string): GeneratorStrategy => {
  const effectiveKey = apiKey === undefined ? env.GROQ_API_KEY : apiKey;
  if (!effectiveKey) {
    return () =>
      Promise.reject(
        new Error(
          "AI API key is missing. Please configure GROQ_API_KEY to generate questions."
        )
      );
  }

  // ponytail: resolve model facade dynamically per strategy invocation
  const model = getAIModel(AI_PRIMARY_MODEL, effectiveKey);

  return async (params) => {
    const categoryName =
      params.categoryName || params.categorySlug || "React & Fullstack Web";
    const difficulty = params.difficulty || "medium";
    const language = params.language || "typescript";
    const bugPattern = params.bugPattern || "realistic production bug";
    const topic =
      params.topic || "subtle race condition or state synchronization bug";

    const promptPoints = getPointsByDifficulty(difficulty);
    const promptTimeLimit = getTimeLimitByDifficulty(difficulty);

    const systemPrompt = `You are a Principal Software Engineer and Educational Challenge Architect at Debug Arena.
Your mission is to generate a realistic, educational, and high-quality coding debug challenge for developers.

CRITICAL REQUIREMENTS:
1. The bug must be realistic (e.g. stale closure, race condition, off-by-one, memory leak, unhandled promise, N+1 query, mutation, improper cleanup).
2. The code must be clean, syntactically valid ${language}, and modern.
3. The buggy code and reference fix MUST have a clear, precise root cause bug.
4. You MUST output ALL required top-level keys: title, categorySlug, difficulty, format, prompt, buggyArtifact, referenceFix, rootCauseSummary, preventionNotes, hints, hiddenTests. Omitting preventionNotes, referenceFix or rootCauseSummary causes schema validation failure.
5. buggyArtifact must contain entryFile, files (each with name, code, isEntry), language, points, timeLimit, buggyLines.
6. referenceFix must contain files (same names as buggyArtifact, with corrected code), explanation (1-3 sentences), diff (array or null to auto-compute).
7. rootCauseSummary: 1-2 sentences concise explanation of the exact bug cause.
8. preventionNotes: 1-2 sentences on how to prevent this class of bug.
9. hints: exactly 3 socratic hints each with order, penaltyPoints, socraticPrompt.
10. hiddenTests: 1-3 vitest tests that validate the fix imports from entry file.

OUTPUT SHAPE EXAMPLE (keys must be present, adapt values to the requested topic):
{
  "title": "Stale Closure in WebSocket Listener",
  "categorySlug": "react-rendering",
  "difficulty": "easy",
  "format": "code_snippet",
  "prompt": "A React component connects to a WebSocket... Identify and fix the issue.",
  "buggyArtifact": { "entryFile": "Chat.tsx", "language": "typescript", "points": 100, "timeLimit": "15 min", "buggyLines": [19,19], "files": [{"name":"Chat.tsx","code":"...","isEntry":true}] },
  "referenceFix": { "explanation": "Fixed stale closure by using functional updater setMessages(prev => [...prev, data])", "files": [{"name":"Chat.tsx","code":"..."}], "diff": null },
  "rootCauseSummary": "Stale closure over initial messages state due to empty dependency array",
  "preventionNotes": "Use functional state updater when new state depends on previous value inside stable callbacks",
  "hints": [{"order":1,"penaltyPoints":5,"socraticPrompt":"What value does messages hold inside the callback?"},{"order":2,"penaltyPoints":5,"socraticPrompt":"How can you update state based on previous value without stale variable?"},{"order":3,"penaltyPoints":5,"socraticPrompt":"What change to the updater ensures latest state with empty deps?"}],
  "hiddenTests": [{"name":"multiple-messages","description":"Component should render all received messages.","testCode":"...vitest..."}]
}
Ensure preventionNotes, rootCauseSummary and referenceFix are always populated with meaningful content.`;

    const userPrompt = `Generate a debugging challenge with the following parameters:
- Category: ${categoryName} (slug: ${params.categorySlug || "react-rendering"})
- Difficulty: ${difficulty}
- Language: ${language}
- Bug Pattern: ${bugPattern}
- Specific Scenario / Topic: ${topic}
- Additional Admin Instructions: ${params.additionalInstructions || "None"}
- Target Points: ${promptPoints}
- Target Time Limit: ${promptTimeLimit}

You MUST respond with a JSON object containing ALL keys: title, categorySlug, difficulty, format, prompt, buggyArtifact, referenceFix, rootCauseSummary, preventionNotes, hints, hiddenTests.
Pay special attention to populate preventionNotes (1-2 sentences), rootCauseSummary (1-2 sentences), and referenceFix (files + explanation + diff). Those three are required and were missing in prior failures.`;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS * 2
    );
    try {
      const { output } = await generateText({
        abortSignal: controller.signal,
        model,
        output: Output.object({
          schema: rawLlmChallengeSchema,
        }),
        prompt: userPrompt,
        system: systemPrompt,
        temperature: 0.4,
      });
      return normalizeChallengeDraft(
        output,
        params.categorySlug,
        params.difficulty
      );
    } catch (err) {
      handleLlmError(err);
    } finally {
      clearTimeout(timeout);
    }
  };
};

export const getRefinerStrategy = (apiKey?: string): RefinerStrategy => {
  const effectiveKey = apiKey === undefined ? env.GROQ_API_KEY : apiKey;
  if (!effectiveKey) {
    return () =>
      Promise.reject(
        new Error(
          "AI API key is missing. Please configure GROQ_API_KEY to refine questions."
        )
      );
  }

  // ponytail: resolve model facade dynamically per strategy invocation
  const model = getAIModel(AI_PRIMARY_MODEL, effectiveKey);

  return async (params) => {
    const systemPrompt = `You are a Principal Software Engineer and Educational Challenge Architect.
You are helping an admin refine and polish an existing debugging challenge for Debug Arena.
Preserve the existing structure and schema, but apply the requested refinements cleanly.
CRITICAL: You MUST output ALL required top-level keys: title, categorySlug, difficulty, format, prompt, buggyArtifact, referenceFix, rootCauseSummary, preventionNotes, hints, hiddenTests.
Never omit preventionNotes, referenceFix or rootCauseSummary. referenceFix must contain files, explanation and diff. Hints must be exactly 3 entries.`;

    const userPrompt = `Here is the current challenge draft:
${JSON.stringify(params.currentDraft, null, 2)}

ADMIN REFINEMENT INSTRUCTION:
"${params.instruction}"

Apply the instruction and output the refined challenge draft as a JSON object containing ALL keys: title, categorySlug, difficulty, format, prompt, buggyArtifact, referenceFix, rootCauseSummary, preventionNotes, hints, hiddenTests.
Ensure preventionNotes, rootCauseSummary and referenceFix are always populated.`;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS * 2
    );
    try {
      const { output } = await generateText({
        abortSignal: controller.signal,
        model,
        output: Output.object({
          schema: rawLlmChallengeSchema,
        }),
        prompt: userPrompt,
        system: systemPrompt,
        temperature: 0.3,
      });
      return normalizeChallengeDraft(
        output,
        params.currentDraft.categorySlug,
        params.currentDraft.difficulty
      );
    } catch (err) {
      handleLlmError(err);
    } finally {
      clearTimeout(timeout);
    }
  };
};

// Deprecated legacy exports
export function generateQuestionDraft(
  params: GenerateQuestionParams
): Promise<GeneratedChallengeDraft> {
  const strategy = getGeneratorStrategy();
  return strategy(params);
}

export function refineQuestionDraft(
  params: RefineQuestionParams
): Promise<GeneratedChallengeDraft> {
  const strategy = getRefinerStrategy();
  return strategy(params);
}
