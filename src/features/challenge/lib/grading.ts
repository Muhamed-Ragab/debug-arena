import type { AIEvaluationResult } from "./ai-evaluator";
import { cosineSimilarity, generateDeterministicEmbedding } from "./embedding";
import type { SandboxExecutionResult } from "./sandbox";

export interface GradingInput {
  aiEvaluation?: AIEvaluationResult;
  buggyLines: [number, number];
  canonicalPreventionNotes: string;
  canonicalRootCause: string;
  hintsUsedCount: number;
  hintsUsedPenalty: number;
  localizationLines?: number[];
  proposedFixCode?: string;
  rootCauseExplanation: string;
  sandboxResult: SandboxExecutionResult;
  solutionExplanation?: string;
}

export interface ScorePart {
  desc: string;
  label: string;
  max: number;
  score: number;
}

export interface GradingResult {
  aiFeedback: string;
  canonicalExplanation: string;
  fixCorrect: boolean;
  isAiGraded: boolean;
  localizationCorrect: boolean;
  preventionNotes: string[];
  preventionScore: number;
  rootCauseScore: number;
  scoreParts: ScorePart[];
  totalScore: number;
}

const SENTENCE_SPLIT_REGEX = /(?<=[.?!])\s+/;

function evaluateLocalization(
  lines: number[] | undefined,
  [start, end]: [number, number]
): { correct: boolean; desc: string; score: number } {
  const lineArray = lines ?? [];

  if (lineArray.length === 0) {
    return {
      correct: false,
      desc: "No lines marked or incorrect location",
      score: 0,
    };
  }

  // Check if any selected line is directly inside the buggy line range
  const exactMatch = lineArray.some((l) => l >= start && l <= end);
  if (exactMatch) {
    const desc =
      lineArray.length > 1
        ? `Exact bug location identified (Lines ${lineArray.join(", ")})`
        : `Exact bug location identified (Line ${lineArray[0]})`;
    return {
      correct: true,
      desc,
      score: 25,
    };
  }

  // Check proximity (within 2 lines)
  const nearMatch = lineArray.some((l) => l >= start - 2 && l <= end + 2);
  if (nearMatch) {
    return {
      correct: true,
      desc: "Near the bug location (within 2 lines)",
      score: 15,
    };
  }

  return {
    correct: false,
    desc: "Incorrect lines selected",
    score: 0,
  };
}

function evaluateRootCause(
  userExplanation: string,
  canonical: string,
  aiEvaluation?: AIEvaluationResult
): { desc: string; score: number } {
  if (aiEvaluation) {
    return {
      desc: aiEvaluation.constructiveFeedback,
      score: aiEvaluation.rootCauseScore,
    };
  }

  if (!userExplanation || userExplanation.trim().length < 5) {
    return {
      desc: "No explanation provided for the root cause.",
      score: 0,
    };
  }
  const userEmbedding = generateDeterministicEmbedding(userExplanation);
  const canonicalEmbedding = generateDeterministicEmbedding(canonical);
  const similarity = cosineSimilarity(userEmbedding, canonicalEmbedding);

  if (similarity >= 0.65) {
    return {
      desc: "Accurately diagnosed failure mechanism and state lifecycle.",
      score: 25,
    };
  }
  if (similarity >= 0.45) {
    return {
      desc: "Partially identified the failure mechanism, but missed key lifecycle subtleties.",
      score: 18,
    };
  }
  if (similarity >= 0.25) {
    return {
      desc: "Identified surface symptoms, but missed the underlying root cause mechanism.",
      score: 10,
    };
  }
  return {
    desc: "Explanation does not match the canonical failure mechanism.",
    score: 5,
  };
}

function evaluateFix(
  sandboxResult: SandboxExecutionResult,
  proposedFixCode?: string,
  solutionExplanation?: string,
  aiEvaluation?: AIEvaluationResult
): { correct: boolean; desc: string; score: number } {
  if (aiEvaluation?.fixScore !== undefined) {
    const isPassing = aiEvaluation.fixScore >= 17;
    return {
      correct: isPassing,
      desc: isPassing
        ? "Sound and effective solution approach"
        : "Fix partially addresses the issue or introduces regressions",
      score: aiEvaluation.fixScore,
    };
  }

  if (sandboxResult.passed) {
    return {
      correct: true,
      desc: "All regression tests passed in sandbox environment.",
      score: 25,
    };
  }

  if (sandboxResult.passedTests > 0) {
    const ratio = sandboxResult.passedTests / sandboxResult.totalTests;
    return {
      correct: false,
      desc: `Passed ${sandboxResult.passedTests}/${sandboxResult.totalTests} tests. Some edge cases failed.`,
      score: Math.round(ratio * 20),
    };
  }

  if (
    (proposedFixCode && proposedFixCode.trim().length > 0) ||
    (solutionExplanation && solutionExplanation.trim().length > 10)
  ) {
    return {
      correct: false,
      desc: "Proposed fix code failed test suite assertions.",
      score: 5,
    };
  }

  return {
    correct: false,
    desc: "No fix or invalid solution proposed.",
    score: 0,
  };
}

function generateFeedback(
  totalScore: number,
  aiEvaluation?: AIEvaluationResult
): string {
  if (aiEvaluation?.constructiveFeedback) {
    return aiEvaluation.constructiveFeedback;
  }
  if (totalScore >= 85) {
    return "Outstanding diagnosis! You identified the exact failure mechanism and provided a solid, resilient fix.";
  }
  if (totalScore >= 65) {
    return "Solid debugging work. You identified the primary symptoms and addressed the bug, but compare your explanation with the canonical root cause to see the exact mechanism details.";
  }
  return "Good effort. Review the canonical root-cause breakdown and prevention notes to master this bug pattern.";
}

/**
 * Grades a user challenge submission combining localization check, vector similarity or Groq AI evaluation,
 * sandbox unit test verification, prevention assessment, and hint penalties.
 */
export function gradeSubmission(input: GradingInput): GradingResult {
  const loc = evaluateLocalization(input.localizationLines, input.buggyLines);
  const rc = evaluateRootCause(
    input.rootCauseExplanation,
    input.canonicalRootCause,
    input.aiEvaluation
  );
  const fix = evaluateFix(
    input.sandboxResult,
    input.proposedFixCode,
    input.solutionExplanation,
    input.aiEvaluation
  );

  const preventionScore =
    input.aiEvaluation?.preventionScore === undefined
      ? Math.min(
          25,
          Math.max(
            10,
            Math.round(rc.score * 0.8) +
              ((input.solutionExplanation?.length ?? 0) > 20 ? 5 : 0)
          )
        )
      : input.aiEvaluation.preventionScore;

  const preventionDesc =
    input.aiEvaluation?.preventionAnalysis ??
    (preventionScore >= 20
      ? "Strong prevention analysis and safeguards"
      : "Basic understanding; CI/architectural safeguards omitted");

  const rawParts: ScorePart[] = [
    {
      desc: loc.desc,
      label: "Localization",
      max: 25,
      score: loc.score,
    },
    {
      desc: rc.desc,
      label: "Root Cause",
      max: 25,
      score: rc.score,
    },
    {
      desc: fix.desc,
      label: "Fix Quality",
      max: 25,
      score: fix.score,
    },
    {
      desc: preventionDesc,
      label: "Prevention",
      max: 25,
      score: preventionScore,
    },
  ];

  const subtotal = rawParts.reduce((sum, p) => sum + p.score, 0);
  const totalScore = Math.max(
    0,
    Math.min(100, subtotal - input.hintsUsedPenalty)
  );

  let preventionNotes: string[] = [];
  if (input.aiEvaluation?.preventionAnalysis) {
    preventionNotes.push(input.aiEvaluation.preventionAnalysis);
  }

  if (input.canonicalPreventionNotes) {
    const splitNotes = input.canonicalPreventionNotes
      .split(SENTENCE_SPLIT_REGEX)
      .filter((s) => s.trim().length > 0);
    preventionNotes.push(...splitNotes);
  }

  if (preventionNotes.length === 0) {
    preventionNotes = [
      "Add automated regression tests in CI to verify this interaction pattern.",
      "Implement architectural guardrails and type-safe constraints.",
    ];
  }

  return {
    aiFeedback: generateFeedback(totalScore, input.aiEvaluation),
    canonicalExplanation: input.canonicalRootCause,
    fixCorrect: fix.correct,
    isAiGraded: Boolean(input.aiEvaluation?.isAiGraded),
    localizationCorrect: loc.correct,
    preventionNotes,
    preventionScore,
    rootCauseScore: rc.score,
    scoreParts: rawParts,
    totalScore,
  };
}
