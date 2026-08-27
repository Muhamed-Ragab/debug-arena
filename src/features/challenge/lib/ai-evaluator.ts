import { env } from "@/lib/env";
import { cosineSimilarity, generateDeterministicEmbedding } from "./embedding";

export interface AIEvaluationResult {
  alignmentPercent: number;
  confidence?: "high" | "medium" | "low";
  constructiveFeedback: string;
  enhancementSuggestions?: string[];
  fixScore?: number; // 0-25
  isAiGraded: boolean;
  isCorrect: boolean;
  keyConceptsIdentified: string[];
  missedMechanisms: string[];
  modelUsed?: string;
  needsEnhancement: boolean;
  preventionAnalysis: string;
  preventionScore?: number; // 0-25
  rootCauseScore: number; // 0-25
}

export interface EvaluateExplanationParams {
  buggyCodeSnippet?: string;
  canonicalPreventionNotes?: string;
  canonicalRootCause: string;
  challengeTitle: string;
  proposedFix?: string;
  solutionExplanation?: string;
  userExplanation: string;
}

export interface SocraticHintParams {
  challengeTitle: string;
  codeSnippet: string;
  hintLevel: number; // 1, 2, or 3
  prompt: string;
  selectedLine?: number | null;
  userExplanation?: string;
}

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const PRIMARY_MODEL = "llama-3.3-70b-versatile";
const FAST_MODEL = "llama-3.1-8b-instant";
const REQUEST_TIMEOUT_MS = 6000;

/**
 * Fallback evaluator using deterministic vector embeddings and rule heuristics when AI is offline or key is missing.
 */
function fallbackEvaluation(
  userExplanation: string,
  canonicalRootCause: string,
  solutionExplanation?: string,
  canonicalPreventionNotes?: string
): AIEvaluationResult {
  if (!userExplanation || userExplanation.trim().length < 5) {
    return {
      alignmentPercent: 0,
      confidence: "low",
      constructiveFeedback:
        "No substantial explanation was provided. Compare your thoughts with the canonical root cause to understand the mechanism.",
      enhancementSuggestions: [
        "Explain the underlying execution flow and state lifecycle that triggered the bug.",
        "Provide a concrete remediation approach targeting the root cause.",
      ],
      fixScore: 0,
      isAiGraded: false,
      isCorrect: false,
      keyConceptsIdentified: [],
      missedMechanisms: ["Failure mechanism explanation missing"],
      needsEnhancement: true,
      preventionAnalysis:
        "Implement automated CI regression tests and strict linting rules.",
      preventionScore: 0,
      rootCauseScore: 0,
    };
  }

  const userEmbedding = generateDeterministicEmbedding(userExplanation);
  const canonicalEmbedding = generateDeterministicEmbedding(canonicalRootCause);
  const similarity = cosineSimilarity(userEmbedding, canonicalEmbedding);
  const alignmentPercent = Math.round(similarity * 100);

  let rootCauseScore = 8;
  let feedback =
    "Partial diagnosis. Review the canonical root-cause breakdown to master this pattern.";
  let isCorrect = false;
  let needsEnhancement = true;
  const enhancementSuggestions: string[] = [];

  if (similarity >= 0.7) {
    rootCauseScore = 25;
    feedback =
      "Excellent diagnosis! You identified the exact failure mechanism and state transitions.";
    isCorrect = true;
    needsEnhancement = false;
  } else if (similarity >= 0.45) {
    rootCauseScore = 18;
    feedback =
      "Solid explanation. You captured the core issue, though some low-level mechanism details or edge cases were omitted.";
    isCorrect = true;
    needsEnhancement = true;
    enhancementSuggestions.push(
      "Elaborate on the specific state transitions and race/closure lifecycle conditions."
    );
  } else if (similarity >= 0.25) {
    rootCauseScore = 12;
    feedback =
      "You identified surface symptoms, but missed the underlying root cause mechanism.";
    isCorrect = false;
    needsEnhancement = true;
    enhancementSuggestions.push(
      "Focus on why the bug occurs at an architectural level rather than just what the user experiences."
    );
  } else {
    feedback =
      "The explanation does not match the canonical failure mechanism. Review the root cause details.";
    isCorrect = false;
    needsEnhancement = true;
    enhancementSuggestions.push(
      "Compare your diagnosis with the canonical breakdown to identify the exact failing component."
    );
  }

  let fixScore = 15;
  if (solutionExplanation && solutionExplanation.trim().length >= 10) {
    const solEmbedding = generateDeterministicEmbedding(solutionExplanation);
    const solSim = cosineSimilarity(solEmbedding, canonicalEmbedding);
    fixScore = Math.max(8, Math.min(25, Math.round(solSim * 25 + 5)));
    if (solSim < 0.5) {
      enhancementSuggestions.push(
        "Ensure your proposed fix directly eliminates the root cause rather than patching symptoms."
      );
    }
  } else {
    fixScore = Math.max(5, Math.round(rootCauseScore * 0.8));
    enhancementSuggestions.push(
      "Include a detailed explanation of your proposed code solution."
    );
  }

  let preventionScore = 15;
  if (canonicalPreventionNotes) {
    const prevEmbedding = generateDeterministicEmbedding(
      canonicalPreventionNotes
    );
    const combinedText = `${userExplanation} ${solutionExplanation || ""}`;
    const combinedEmbedding = generateDeterministicEmbedding(combinedText);
    const prevSim = cosineSimilarity(combinedEmbedding, prevEmbedding);
    preventionScore = Math.max(10, Math.min(25, Math.round(prevSim * 25 + 5)));
  } else {
    preventionScore = Math.max(
      10,
      Math.min(25, Math.round(rootCauseScore * 0.8) + 3)
    );
  }

  return {
    alignmentPercent,
    confidence: isCorrect ? "medium" : "low",
    constructiveFeedback: feedback,
    enhancementSuggestions:
      enhancementSuggestions.length > 0
        ? enhancementSuggestions
        : [
            "Consider adding automated regression tests and architectural guardrails.",
          ],
    fixScore,
    isAiGraded: false,
    isCorrect,
    keyConceptsIdentified: isCorrect
      ? ["Core failure pattern recognized"]
      : ["Surface symptoms analyzed"],
    missedMechanisms: isCorrect
      ? []
      : ["Exact architectural root cause nuances"],
    needsEnhancement,
    preventionAnalysis:
      canonicalPreventionNotes ||
      "Add unit test regression suites and architectural guardrails.",
    preventionScore,
    rootCauseScore,
  };
}

/**
 * Evaluates a user's bug explanation against the canonical root cause using Groq LLM (Llama 3.3 70B / 3.1 8B).
 * Directly compares user answers against canonical answers, deciding correctness, enhancement needs, and dynamic feedback.
 */
export async function evaluateExplanationWithGroq(
  params: EvaluateExplanationParams,
  apiKey: string | undefined = env.GROQ_API_KEY
): Promise<AIEvaluationResult> {
  const {
    userExplanation,
    solutionExplanation,
    canonicalRootCause,
    canonicalPreventionNotes,
    challengeTitle,
    buggyCodeSnippet,
    proposedFix,
  } = params;

  if (!apiKey || apiKey.trim().length === 0) {
    return fallbackEvaluation(
      userExplanation,
      canonicalRootCause,
      solutionExplanation,
      canonicalPreventionNotes
    );
  }

  const systemPrompt = `
You are an expert principal software engineer and staff debugging mentor at Debug Arena.
Your task is to evaluate a candidate engineer's written root cause explanation and proposed solution/fix for a software bug by deeply comparing their answer against the canonical ground truth.

Evaluation Directives:
- Do NOT rely purely on keyword overlap or text similarity. Understand the underlying computer science, logic, and debugging reasoning in both answers.
- Assess whether the candidate's explanation is fundamentally CORRECT (isCorrect: true/false).
- Assess whether the candidate's diagnosis or fix NEEDS ENHANCEMENT (needsEnhancement: true/false). An answer needs enhancement if it is partially correct, vague in mechanism details, misses edge cases, lacks preventive measures, or could be significantly improved.
- Provide actionable ENHANCEMENT SUGGESTIONS detailing specifically how the engineer can level up their answer or fix.
- Provide tailored CONSTRUCTIVE FEEDBACK comparing what they wrote directly against what actually happened.

Scoring Criteria:
1. Root Cause Score (0 to 25 points):
   - 22-25: Perfectly diagnosed the exact root-cause failure mechanism, execution flow, and state transitions. (isCorrect: true, needsEnhancement: false)
   - 17-21: Correctly identified the core bug and primary mechanism, with minor wording differences or minor omitted details. (isCorrect: true, needsEnhancement: true/false)
   - 11-16: Identified surface symptoms or proximate cause, but missed the deeper architectural mechanism. (isCorrect: false, needsEnhancement: true)
   - 0-10: Incorrect diagnosis, vague hand-waving, or completely missed the bug. (isCorrect: false, needsEnhancement: true)
2. Fix Score (0 to 25 points):
   - 22-25: Proposed solution / fix is completely sound, resilient, and directly eliminates the root cause.
   - 17-21: Good fix that addresses the symptom and core bug, with minor edge cases unaddressed.
   - 11-16: Partial fix or workaround that does not fully solve the underlying problem.
   - 0-10: Ineffective, introduces new bugs, or no fix proposed.
3. Prevention Score (0 to 25 points):
   - 20-25: Demonstrates strong understanding of architectural safeguards, type safety, and CI regression testing.
   - 10-19: Basic understanding of bug prevention.
   - 0-9: No prevention insight.
4. Alignment Percent (0 to 100%): Semantic alignment with the canonical explanation.

Respond STRICTLY with a valid JSON object matching this schema:
{
  "isCorrect": boolean,
  "needsEnhancement": boolean,
  "enhancementSuggestions": string[],
  "rootCauseScore": number,
  "fixScore": number,
  "preventionScore": number,
  "alignmentPercent": number,
  "keyConceptsIdentified": string[],
  "missedMechanisms": string[],
  "constructiveFeedback": string,
  "preventionAnalysis": string
}
`;

  const userPrompt = `
Challenge: "${challengeTitle}"

Canonical Root Cause:
"""
${canonicalRootCause}
"""

${canonicalPreventionNotes ? `Canonical Prevention Notes:\n"""\n${canonicalPreventionNotes}\n"""\n` : ""}
${buggyCodeSnippet ? `Buggy Code:\n"""\n${buggyCodeSnippet}\n"""\n` : ""}
${proposedFix ? `Candidate's Proposed Fix Code:\n"""\n${proposedFix}\n"""\n` : ""}

Candidate's Root Cause Diagnosis:
"""
${userExplanation}
"""

Candidate's Proposed Solution & Fix Explanation:
"""
${solutionExplanation || userExplanation}
"""
`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      body: JSON.stringify({
        messages: [
          { content: systemPrompt, role: "system" },
          { content: userPrompt, role: "user" },
        ],
        model: PRIMARY_MODEL,
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        `[Groq AI] API call returned status ${response.status}. Falling back to deterministic evaluation.`
      );
      return fallbackEvaluation(
        userExplanation,
        canonicalRootCause,
        solutionExplanation,
        canonicalPreventionNotes
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return fallbackEvaluation(
        userExplanation,
        canonicalRootCause,
        solutionExplanation,
        canonicalPreventionNotes
      );
    }

    return parseGroqEvaluationResponse(content, data.model);
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    console.warn(
      "[Groq AI] Request failed or timed out. Using fallback evaluation:",
      err instanceof Error ? err.message : err
    );
    return fallbackEvaluation(
      userExplanation,
      canonicalRootCause,
      solutionExplanation,
      canonicalPreventionNotes
    );
  }
}

interface RawGroqEvaluation {
  alignmentPercent?: number;
  confidence?: "high" | "medium" | "low";
  constructiveFeedback?: string;
  enhancementSuggestions?: string[];
  fixScore?: number;
  isCorrect?: boolean;
  keyConceptsIdentified?: string[];
  missedMechanisms?: string[];
  needsEnhancement?: boolean;
  preventionAnalysis?: string;
  preventionScore?: number;
  rootCauseScore?: number;
}

function parseGroqEvaluationResponse(
  content: string,
  modelName: string | undefined
): AIEvaluationResult {
  const parsed = JSON.parse(content) as RawGroqEvaluation;

  const rawRcScore = Number(parsed.rootCauseScore);
  const rootCauseScore = Number.isFinite(rawRcScore)
    ? Math.max(0, Math.min(25, Math.round(rawRcScore)))
    : 15;

  const rawFixScore = Number(parsed.fixScore);
  const fixScore = Number.isFinite(rawFixScore)
    ? Math.max(0, Math.min(25, Math.round(rawFixScore)))
    : Math.max(10, Math.round(rootCauseScore * 0.9));

  const rawPrevScore = Number(parsed.preventionScore);
  const preventionScore = Number.isFinite(rawPrevScore)
    ? Math.max(0, Math.min(25, Math.round(rawPrevScore)))
    : 18;

  const rawAlignment = Number(parsed.alignmentPercent);
  const alignmentPercent = Number.isFinite(rawAlignment)
    ? Math.max(0, Math.min(100, Math.round(rawAlignment)))
    : 70;

  const isCorrect =
    typeof parsed.isCorrect === "boolean"
      ? parsed.isCorrect
      : rootCauseScore >= 17;

  const needsEnhancement =
    typeof parsed.needsEnhancement === "boolean"
      ? parsed.needsEnhancement
      : rootCauseScore < 22 || fixScore < 22;

  let enhancementSuggestions: string[] = [];
  if (Array.isArray(parsed.enhancementSuggestions)) {
    enhancementSuggestions = parsed.enhancementSuggestions.filter(
      (s): s is string => typeof s === "string" && s.trim().length > 0
    );
  } else if (needsEnhancement) {
    enhancementSuggestions = [
      "Review the canonical mechanism to strengthen low-level failure precision.",
    ];
  }

  return {
    alignmentPercent,
    confidence: "high",
    constructiveFeedback:
      parsed.constructiveFeedback ||
      "Good effort. Compare your explanation with the canonical root cause.",
    enhancementSuggestions,
    fixScore,
    isAiGraded: true,
    isCorrect,
    keyConceptsIdentified: parsed.keyConceptsIdentified || [
      "Identified bug symptoms",
    ],
    missedMechanisms: parsed.missedMechanisms || [],
    modelUsed: modelName ?? PRIMARY_MODEL,
    needsEnhancement,
    preventionAnalysis:
      parsed.preventionAnalysis ||
      "Add automated unit tests and architectural constraints.",
    preventionScore,
    rootCauseScore,
  };
}

/**
 * Generates progressive Socratic hints using Groq LLM without spoiling the direct solution.
 */
export async function generateSocraticHintWithGroq(
  params: SocraticHintParams,
  apiKey: string | undefined = env.GROQ_API_KEY
): Promise<string> {
  const {
    challengeTitle,
    prompt,
    codeSnippet,
    selectedLine,
    userExplanation,
    hintLevel,
  } = params;

  if (!apiKey || apiKey.trim().length === 0) {
    return `Think about how the state and lifecycle interact when ${challengeTitle.toLowerCase()} occurs.`;
  }

  const systemPrompt = `
You are a Socratic debugging mentor.
Provide ONE concise hint (1-2 sentences maximum) that guides the developer toward the bug without giving away the direct code fix.
- Level 1: Ask a targeted question about the suspicious flow or variable lifecycle.
- Level 2: Point to the mechanism or asynchronous timing discrepancy.
- Level 3: Specifically highlight the exact interaction or missing guard without writing the fix code.
`;

  const userPrompt = `
Challenge: ${challengeTitle}
Context: ${prompt}
Hint Level: ${hintLevel} / 3
${selectedLine ? `User selected Line ${selectedLine}` : ""}
${userExplanation ? `User's current hypothesis: "${userExplanation}"` : ""}

Code Snippet:
${codeSnippet}
`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      body: JSON.stringify({
        max_tokens: 150,
        messages: [
          { content: systemPrompt, role: "system" },
          { content: userPrompt, role: "user" },
        ],
        model: FAST_MODEL,
        temperature: 0.3,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return `Examine the variable updates and execution order closely in ${challengeTitle}.`;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return (
      data.choices?.[0]?.message?.content?.trim() ||
      "Consider how asynchronous execution affects state in this scenario."
    );
  } catch {
    clearTimeout(timeoutId);
    return "Look closely at the lifecycle boundaries and invariants.";
  }
}
