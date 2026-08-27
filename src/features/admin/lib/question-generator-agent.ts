import { z } from "zod";
import { env } from "@/lib/env";

export interface DiffLine {
  line?: number;
  text: string;
  type: "ctx" | "add" | "del";
}

export interface ChallengeFile {
  code: string;
  isEntry?: boolean;
  name: string;
}

export interface ChallengeHiddenTest {
  description: string;
  name: string;
  testCode: string;
}

export interface ChallengeHint {
  order: number;
  penaltyPoints: number;
  socraticPrompt: string;
}

export interface GeneratedChallengeDraft {
  buggyArtifact: {
    buggyLines: [number, number];
    entryFile: string;
    files: ChallengeFile[];
    language: string;
    points: number;
    timeLimit: string;
  };
  categorySlug: string;
  difficulty: "easy" | "medium" | "hard";
  format: "code_snippet" | "log_only" | "ui_recording";
  hiddenTests?: ChallengeHiddenTest[];
  hints: ChallengeHint[];
  preventionNotes: string;
  prompt: string;
  referenceFix: {
    diff: DiffLine[];
    explanation: string;
    files: ChallengeFile[];
  };
  rootCauseSummary: string;
  title: string;
}

export interface GenerateQuestionParams {
  additionalInstructions?: string;
  bugPattern?: string;
  categoryName?: string;
  categorySlug?: string;
  difficulty?: "easy" | "medium" | "hard";
  format?: "code_snippet" | "log_only" | "ui_recording";
  language?: string;
  topic?: string;
}

export interface RefineQuestionParams {
  currentDraft: GeneratedChallengeDraft;
  instruction: string;
}

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const PRIMARY_MODEL = "llama-3.3-70b-versatile";
const REQUEST_TIMEOUT_MS = 14_000;

// Schema for raw LLM JSON parsing
const rawLlmChallengeSchema = z.object({
  buggyArtifact: z.object({
    buggyLines: z.tuple([z.number(), z.number()]).optional(),
    entryFile: z.string().default("index.ts"),
    files: z.array(
      z.object({
        code: z.string(),
        isEntry: z.boolean().optional(),
        name: z.string(),
      })
    ),
    language: z.string().default("typescript"),
    points: z.number().optional(),
    timeLimit: z.string().optional(),
  }),
  categorySlug: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  format: z
    .enum(["code_snippet", "log_only", "ui_recording"])
    .default("code_snippet"),
  hiddenTests: z
    .array(
      z.object({
        description: z.string(),
        name: z.string(),
        testCode: z.string(),
      })
    )
    .optional(),
  hints: z.array(
    z.object({
      order: z.number(),
      penaltyPoints: z.number().default(10),
      socraticPrompt: z.string(),
    })
  ),
  preventionNotes: z.string(),
  prompt: z.string(),
  referenceFix: z.object({
    diff: z
      .array(
        z.object({
          line: z.number().optional(),
          text: z.string(),
          type: z.enum(["ctx", "add", "del"]),
        })
      )
      .optional(),
    explanation: z.string().default(""),
    files: z.array(
      z.object({
        code: z.string(),
        name: z.string(),
      })
    ),
  }),
  rootCauseSummary: z.string(),
  title: z.string(),
});

type RawParsedChallenge = z.infer<typeof rawLlmChallengeSchema>;

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
  i: number,
  j: number,
  diff: DiffLine[]
): [number, number] {
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
 * Fallback synthesizer for offline/local development without LLM API key.
 */
export function generateFallbackChallenge(
  params: GenerateQuestionParams
): GeneratedChallengeDraft {
  const category = params.categorySlug || "react-rendering";
  const difficulty = params.difficulty || "medium";
  const topic = params.topic || "State synchronization failure";

  if (
    category === "backend-concurrency" ||
    params.topic?.toLowerCase().includes("concurrency") ||
    params.topic?.toLowerCase().includes("race")
  ) {
    const buggyCode = `import { db } from "./db";

export async function transferFunds(fromId: string, toId: string, amount: number) {
  const sender = await db.account.findUnique({ where: { id: fromId } });
  if (!sender || sender.balance < amount) {
    throw new Error("Insufficient balance");
  }

  const recipient = await db.account.findUnique({ where: { id: toId } });
  if (!recipient) {
    throw new Error("Recipient account not found");
  }

  // BUG: Non-atomic read-then-write without row locks allows double-spending under concurrent requests
  await db.account.update({
    where: { id: fromId },
    data: { balance: sender.balance - amount },
  });

  await db.account.update({
    where: { id: toId },
    data: { balance: recipient.balance + amount },
  });

  return { success: true, transferred: amount };
}`;

    const fixedCode = `import { db } from "./db";

export async function transferFunds(fromId: string, toId: string, amount: number) {
  return await db.$transaction(async (tx) => {
    // FIX: Atomic check and decrement with row locking or conditional query
    const sender = await tx.account.update({
      where: { id: fromId, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });

    if (!sender) {
      throw new Error("Insufficient balance or sender not found");
    }

    await tx.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    });

    return { success: true, transferred: amount };
  });
}`;

    const points = getPointsByDifficulty(difficulty);

    return normalizeChallengeDraft(
      {
        buggyArtifact: {
          buggyLines: [14, 23],
          entryFile: "transfer.ts",
          files: [
            {
              code: buggyCode,
              isEntry: true,
              name: "transfer.ts",
            },
          ],
          language: "typescript",
          points,
          timeLimit: "20 min",
        },
        categorySlug: "backend-concurrency",
        difficulty,
        format: "code_snippet",
        hiddenTests: [
          {
            description:
              "Concurrent balance deductions must not result in negative balance",
            name: "Prevents race condition during simultaneous transfers",
            testCode: `
              const results = await Promise.all([
                transferFunds("acc-1", "acc-2", 80),
                transferFunds("acc-1", "acc-3", 80)
              ]);
            `,
          },
        ],
        hints: [
          {
            order: 1,
            penaltyPoints: 10,
            socraticPrompt:
              "What happens if two requests execute the balance check at the exact same millisecond before either update runs?",
          },
          {
            order: 2,
            penaltyPoints: 20,
            socraticPrompt:
              "Notice that the balance read and write occur across separate asynchronous statements without transactional isolation.",
          },
          {
            order: 3,
            penaltyPoints: 30,
            socraticPrompt:
              "Wrap the updates in an atomic database transaction with conditional balance decrements or row-level locking.",
          },
        ],
        preventionNotes:
          "Always perform financial balance deductions inside atomic transactions using conditional updates (`WHERE balance >= amount`) or `SELECT FOR UPDATE` pessimistic locks.",
        prompt:
          "## Scenario: Double Spending in Concurrent Wallet Transfers\n\nUsers report that when clicking the 'Send' button twice in rapid succession, money is transferred twice even when they do not have sufficient funds for both transactions.\n\n### Task\n1. Identify why the balance verification allows concurrent requests to slip through.\n2. Fix the implementation to guarantee atomic execution under high concurrency.",
        referenceFix: {
          explanation:
            "Wrapped the balance decrement and credit operations inside an atomic transaction using conditional decrement to eliminate race conditions.",
          files: [
            {
              code: fixedCode,
              name: "transfer.ts",
            },
          ],
        },
        rootCauseSummary:
          "Time-of-check to time-of-use (TOCTOU) race condition caused by non-atomic database reads and updates without transactional row locking.",
        title: "Concurrent Wallet Transfer Race Condition",
      },
      "backend-concurrency",
      difficulty
    );
  }

  // Default: React Rendering / Lifecycle bug
  const buggyCode = `import { useState, useEffect } from "react";

export function EventFeed({ channelId }: { channelId: string }) {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const socket = new WebSocket(\`wss://events.internal/\${channelId}\`);

    socket.onmessage = (event) => {
      // BUG: Stale closure on 'messages' state causes earlier messages to be overwritten
      setMessages([...messages, event.data]);
    };

    return () => {
      socket.close();
    };
  }, [channelId]);

  return (
    <div>
      <h3>Live Feed</h3>
      <ul>
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}`;

  const fixedCode = `import { useState, useEffect } from "react";

export function EventFeed({ channelId }: { channelId: string }) {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const socket = new WebSocket(\`wss://events.internal/\${channelId}\`);

    socket.onmessage = (event) => {
      // FIX: Functional updater ensures message is appended to latest state
      setMessages((prev) => [...prev, event.data]);
    };

    return () => {
      socket.close();
    };
  }, [channelId]);

  return (
    <div>
      <h3>Live Feed</h3>
      <ul>
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}`;

  const points = getPointsByDifficulty(difficulty);

  return normalizeChallengeDraft(
    {
      buggyArtifact: {
        buggyLines: [10, 11],
        entryFile: "EventFeed.tsx",
        files: [
          {
            code: buggyCode,
            isEntry: true,
            name: "EventFeed.tsx",
          },
        ],
        language: "typescript",
        points,
        timeLimit: "15 min",
      },
      categorySlug: category,
      difficulty,
      format: "code_snippet",
      hiddenTests: [
        {
          description:
            "Rapid sequential WebSocket messages must all be retained in state",
          name: "Accumulates rapid streaming messages without drops",
          testCode: "expect(messages.length).toBe(3);",
        },
      ],
      hints: [
        {
          order: 1,
          penaltyPoints: 10,
          socraticPrompt:
            "Observe the dependency array of useEffect. What value of `messages` does the socket message handler capture at initialization?",
        },
        {
          order: 2,
          penaltyPoints: 20,
          socraticPrompt:
            "When the WebSocket callback fires multiple times without useEffect re-running, it always references the initial snapshot of `messages`.",
        },
        {
          order: 3,
          penaltyPoints: 30,
          socraticPrompt:
            "Use the functional state updater form `setMessages(prev => ...)` to access the fresh state without re-binding the WebSocket connection.",
        },
      ],
      preventionNotes:
        "Enable the `react-hooks/exhaustive-deps` ESLint rule, and prefer functional state updates `setState(prev => ...)` in long-lived event subscriptions.",
      prompt:
        "## Scenario: Dropped Messages in Live Event Feed\n\nUsers report that only the last received message appears in the live feed, and previous items vanish whenever a new event arrives.\n\n### Task\n1. Explain why previous messages are discarded.\n2. Fix the component so that incoming messages append reliably to the feed.",
      referenceFix: {
        explanation:
          "Replaced direct state closure reference with functional state updater `setMessages(prev => [...prev, event.data])` to prevent stale closure over initial state.",
        files: [
          {
            code: fixedCode,
            name: "EventFeed.tsx",
          },
        ],
      },
      rootCauseSummary:
        "Stale closure in WebSocket message listener handler capturing initial empty messages array state instead of using functional state updater.",
      title: `${topic || "Stale State in WebSocket Event Feed"}`,
    },
    category,
    difficulty
  );
}

/**
 * Calls Groq LLM to generate a brand new challenge draft.
 */
export async function generateQuestionDraft(
  params: GenerateQuestionParams
): Promise<GeneratedChallengeDraft> {
  const apiKey = process.env.GROQ_API_KEY || env.GROQ_API_KEY;
  if (!apiKey) {
    return generateFallbackChallenge(params);
  }

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
4. The output must be PURE JSON matching the requested schema. Do NOT include markdown code blocks or explanations outside the JSON.`;

  const userPrompt = `Generate a debugging challenge with the following parameters:
- Category: ${categoryName}
- Difficulty: ${difficulty}
- Language: ${language}
- Bug Pattern: ${bugPattern}
- Specific Scenario / Topic: ${topic}
- Additional Admin Instructions: ${params.additionalInstructions || "None"}

Produce a JSON object with this exact structure:
{
  "title": "Clear catchy challenge title",
  "categorySlug": "${params.categorySlug || "react-rendering"}",
  "difficulty": "${difficulty}",
  "format": "code_snippet",
  "prompt": "Markdown description of scenario, bug symptoms, and developer task",
  "buggyArtifact": {
    "entryFile": "MainComponent.tsx",
    "files": [
      {
        "name": "MainComponent.tsx",
        "code": "/* Full buggy code */",
        "isEntry": true
      }
    ],
    "buggyLines": [10, 12],
    "language": "${language}",
    "points": ${promptPoints},
    "timeLimit": "${promptTimeLimit}"
  },
  "referenceFix": {
    "files": [
      {
        "name": "MainComponent.tsx",
        "code": "/* Full fixed code */"
      }
    ],
    "explanation": "Clear explanation of how the fix resolves the root cause"
  },
  "rootCauseSummary": "Deep technical breakdown of the exact failure mechanism, event loop, closure, or state issue",
  "preventionNotes": "Concrete best practices, ESLint rules, and architectural guards to prevent this class of bug",
  "hints": [
    { "order": 1, "penaltyPoints": 10, "socraticPrompt": "Socratic question pointing user to look in the right area" },
    { "order": 2, "penaltyPoints": 20, "socraticPrompt": "Deeper hint explaining the mechanism that is failing" },
    { "order": 3, "penaltyPoints": 30, "socraticPrompt": "Specific remediation guidance without giving away exact line code" }
  ],
  "hiddenTests": [
    { "name": "Verification test name", "description": "What it verifies", "testCode": "Test assertion code" }
  ]
}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(GROQ_ENDPOINT, {
      body: JSON.stringify({
        messages: [
          { content: systemPrompt, role: "system" },
          { content: userPrompt, role: "user" },
        ],
        model: PRIMARY_MODEL,
        response_format: { type: "json_object" },
        temperature: 0.4,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(
        `[Groq Agent] LLM API responded with ${response.status}. Using fallback synthesizer.`
      );
      return generateFallbackChallenge(params);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      return generateFallbackChallenge(params);
    }

    const parsedJson = JSON.parse(rawContent);
    return normalizeChallengeDraft(
      parsedJson,
      params.categorySlug,
      params.difficulty
    );
  } catch (err) {
    console.warn("[Groq Agent] Error generating question draft:", err);
    return generateFallbackChallenge(params);
  }
}

/**
 * Refines an existing challenge draft based on an admin's feedback or prompt.
 */
export async function refineQuestionDraft(
  params: RefineQuestionParams
): Promise<GeneratedChallengeDraft> {
  const apiKey = process.env.GROQ_API_KEY || env.GROQ_API_KEY;
  if (!apiKey) {
    const draft = structuredClone(params.currentDraft);
    if (params.instruction.toLowerCase().includes("hard")) {
      draft.difficulty = "hard";
      draft.buggyArtifact.points = 300;
    } else if (params.instruction.toLowerCase().includes("easy")) {
      draft.difficulty = "easy";
      draft.buggyArtifact.points = 100;
    }
    draft.prompt += `\n\n> Note: Refined per admin instruction: ${params.instruction}`;
    return draft;
  }

  const systemPrompt = `You are a Principal Software Engineer and Educational Challenge Architect.
You are helping an admin refine and polish an existing debugging challenge for Debug Arena.
Preserve the existing structure and schema, but apply the requested refinements cleanly.
Respond with pure JSON only matching the exact challenge schema.`;

  const userPrompt = `Here is the current challenge draft:
${JSON.stringify(params.currentDraft, null, 2)}

ADMIN REFINEMENT INSTRUCTION:
"${params.instruction}"

Apply the instruction and output the refined challenge draft as a valid JSON object.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(GROQ_ENDPOINT, {
      body: JSON.stringify({
        messages: [
          { content: systemPrompt, role: "system" },
          { content: userPrompt, role: "user" },
        ],
        model: PRIMARY_MODEL,
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(
        `[Groq Agent] LLM API responded with ${response.status}. Returning unmodified draft.`
      );
      return params.currentDraft;
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      return params.currentDraft;
    }

    const parsedJson = JSON.parse(rawContent);
    return normalizeChallengeDraft(
      parsedJson,
      params.currentDraft.categorySlug,
      params.currentDraft.difficulty
    );
  } catch (err) {
    console.warn("[Groq Agent] Error refining question draft:", err);
    return params.currentDraft;
  }
}
