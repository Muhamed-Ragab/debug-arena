import { generateText, Output } from "ai";
import { getAIModel } from "@/lib/ai/client";
import { AI_PRIMARY_MODEL } from "@/lib/ai/constants";
import { env } from "@/lib/env/env";
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
      diff.push({ text: fixedLines[j], type: "add" });
      j += 1;
    }
    return [i, j];
  }

  if (hasBuggy) {
    diff.push({ line: i + 1, text: buggyLines[i], type: "del" });
    i += 1;
  }

  if (hasFixed) {
    diff.push({ text: fixedLines[j], type: "add" });
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
  if (parsed.referenceFix.diff && parsed.referenceFix.diff.length > 0) {
    return parsed.referenceFix.diff;
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
  if (specified && specified[0] > 0 && specified[1] >= specified[0]) {
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

/**
 * Normalizes and validates the challenge draft.
 */
export function normalizeChallengeDraft(
  raw: unknown,
  fallbackCategory = "react-rendering",
  fallbackDifficulty: "easy" | "medium" | "hard" = "medium"
): GeneratedChallengeDraft {
  const parsed = rawLlmChallengeSchema.parse(raw);
  const targetDifficulty = parsed.difficulty || fallbackDifficulty;
  const entryFileName = resolveEntryFile(parsed);

  const buggyEntry =
    parsed.buggyArtifact.files.find((f) => f.name === entryFileName) ||
    parsed.buggyArtifact.files[0];
  const fixedEntry =
    parsed.referenceFix.files.find((f) => f.name === entryFileName) ||
    parsed.referenceFix.files[0];

  const computedDiff = resolveDiffLines(parsed, buggyEntry, fixedEntry);
  const buggyLines = resolveBuggyLines(parsed, buggyEntry, fixedEntry);
  const hints = resolveHints(parsed.hints);

  const points =
    parsed.buggyArtifact.points ?? getPointsByDifficulty(targetDifficulty);
  const timeLimit =
    parsed.buggyArtifact.timeLimit ??
    getTimeLimitByDifficulty(targetDifficulty);

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
    categorySlug: parsed.categorySlug || fallbackCategory,
    difficulty: targetDifficulty,
    format: parsed.format || "code_snippet",
    hiddenTests: parsed.hiddenTests || [],
    hints,
    preventionNotes:
      parsed.preventionNotes || "Apply strict code reviews and type safety.",
    prompt: parsed.prompt,
    referenceFix: {
      diff: computedDiff,
      explanation: parsed.referenceFix.explanation || "Fixed root cause bug.",
      files: parsed.referenceFix.files,
    },
    rootCauseSummary: parsed.rootCauseSummary,
    title: parsed.title,
  };
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
3. The buggy code and reference fix MUST have a clear, precise root cause bug.`;

    const userPrompt = `Generate a debugging challenge with the following parameters:
- Category: ${categoryName}
- Difficulty: ${difficulty}
- Language: ${language}
- Bug Pattern: ${bugPattern}
- Specific Scenario / Topic: ${topic}
- Additional Admin Instructions: ${params.additionalInstructions || "None"}
- Target Points: ${promptPoints}
- Target Time Limit: ${promptTimeLimit}`;

    const { output } = await generateText({
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
Preserve the existing structure and schema, but apply the requested refinements cleanly.`;

    const userPrompt = `Here is the current challenge draft:
${JSON.stringify(params.currentDraft, null, 2)}

ADMIN REFINEMENT INSTRUCTION:
"${params.instruction}"

Apply the instruction and output the refined challenge draft.`;

    const { output } = await generateText({
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
