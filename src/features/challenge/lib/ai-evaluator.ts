import { generateText, Output } from "ai";
import { z } from "zod";
import type { AIEvaluationResult } from "@/features/challenge/types";
import { getAIModel } from "@/lib/ai/client";
import { AI_FAST_MODEL, AI_PRIMARY_MODEL } from "@/lib/ai/constants";
import { env } from "@/lib/env/env";
import { cosineSimilarity, generateDeterministicEmbedding } from "./embedding";

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
  hintLevel: number;
  prompt: string;
  selectedLine?: number | null;
  userExplanation?: string;
}

export type EvaluatorStrategy = (
  params: EvaluateExplanationParams
) => Promise<AIEvaluationResult>;
export type HintStrategy = (params: SocraticHintParams) => Promise<string>;

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

const aiEvaluationSchema = z.object({
  alignmentPercent: z.number().min(0).max(100),
  constructiveFeedback: z.string(),
  enhancementSuggestions: z.array(z.string()),
  fixScore: z.number().min(0).max(25),
  isCorrect: z.boolean(),
  keyConceptsIdentified: z.array(z.string()),
  missedMechanisms: z.array(z.string()),
  needsEnhancement: z.boolean(),
  preventionAnalysis: z.string(),
  preventionScore: z.number().min(0).max(25),
  rootCauseScore: z.number().min(0).max(25),
});

export const getEvaluatorStrategy = (apiKey?: string): EvaluatorStrategy => {
  const effectiveKey = apiKey || env.GROQ_API_KEY;
  if (!effectiveKey) {
    return (params) =>
      Promise.resolve(
        fallbackEvaluation(
          params.userExplanation,
          params.canonicalRootCause,
          params.solutionExplanation,
          params.canonicalPreventionNotes
        )
      );
  }

  // ponytail: resolve model facade dynamically per strategy invocation
  const model = getAIModel(AI_PRIMARY_MODEL, effectiveKey);

  return async (params) => {
    const {
      userExplanation,
      solutionExplanation,
      canonicalRootCause,
      canonicalPreventionNotes,
      challengeTitle,
      buggyCodeSnippet,
      proposedFix,
    } = params;

    const systemPrompt = `You are an expert principal software engineer and staff debugging mentor at Debug Arena.
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
4. Alignment Percent (0 to 100%): Semantic alignment with the canonical explanation.`;

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
"""`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({
          schema: aiEvaluationSchema,
        }),
        prompt: userPrompt,
        system: systemPrompt,
        temperature: 0.1,
      });

      return {
        ...output,
        confidence: "high",
        isAiGraded: true,
        modelUsed: AI_PRIMARY_MODEL,
      };
    } catch (err: unknown) {
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
  };
};

export const getSocraticHintStrategy = (apiKey?: string): HintStrategy => {
  const effectiveKey = apiKey || env.GROQ_API_KEY;
  if (!effectiveKey) {
    return (params) =>
      Promise.resolve(
        `Think about how the state and lifecycle interact when ${params.challengeTitle.toLowerCase()} occurs.`
      );
  }

  const model = getAIModel(AI_FAST_MODEL, effectiveKey);

  return async (params) => {
    const {
      challengeTitle,
      prompt,
      codeSnippet,
      selectedLine,
      userExplanation,
      hintLevel,
    } = params;

    const systemPrompt = `You are a Socratic debugging mentor.
Provide ONE concise hint (1-2 sentences maximum) that guides the developer toward the bug without giving away the direct code fix.
- Level 1: Ask a targeted question about the suspicious flow or variable lifecycle.
- Level 2: Point to the mechanism or asynchronous timing discrepancy.
- Level 3: Specifically highlight the exact interaction or missing guard without writing the fix code.`;

    const userPrompt = `
Challenge: ${challengeTitle}
Context: ${prompt}
Hint Level: ${hintLevel} / 3
${selectedLine ? `User selected Line ${selectedLine}` : ""}
${userExplanation ? `User's current hypothesis: "${userExplanation}"` : ""}

Code Snippet:
${codeSnippet}`;

    try {
      const { text } = await generateText({
        model,
        prompt: userPrompt,
        system: systemPrompt,
        temperature: 0.3,
      });

      return (
        text.trim() ||
        "Consider how asynchronous execution affects state in this scenario."
      );
    } catch {
      return "Look closely at the lifecycle boundaries and invariants.";
    }
  };
};

// Deprecated exact-match legacy exports to not break callers that haven't updated yet,
// they just wrap the strategies with the default env keys.
export function evaluateExplanationWithGroq(
  params: EvaluateExplanationParams,
  apiKey?: string
): Promise<AIEvaluationResult> {
  const strategy = getEvaluatorStrategy(apiKey);
  return strategy(params);
}

export function generateSocraticHintWithGroq(
  params: SocraticHintParams,
  apiKey?: string
): Promise<string> {
  const strategy = getSocraticHintStrategy(apiKey);
  return strategy(params);
}
