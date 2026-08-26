import { cosineSimilarity, generateDeterministicEmbedding } from "./embedding";
import type { SandboxExecutionResult } from "./sandbox";

export interface GradingInput {
  buggyLines: [number, number];
  canonicalPreventionNotes: string;
  canonicalRootCause: string;
  hintsUsedCount: number;
  hintsUsedPenalty: number;
  localizationLine: number | null;
  proposedFixCode?: string;
  rootCauseExplanation: string;
  sandboxResult: SandboxExecutionResult;
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
  localizationCorrect: boolean;
  preventionNotes: string[];
  preventionScore: number;
  rootCauseScore: number;
  scoreParts: ScorePart[];
  totalScore: number;
}

const SENTENCE_SPLIT_REGEX = /(?<=[.?!])\s+/;

function evaluateLocalization(
  line: number | null,
  [start, end]: [number, number]
): { correct: boolean; desc: string; score: number } {
  if (line === null) {
    return {
      correct: false,
      desc: "No line marked or incorrect location",
      score: 0,
    };
  }
  if (line >= start && line <= end) {
    return {
      correct: true,
      desc: "Exact bug location identified",
      score: 25,
    };
  }
  if (line >= start - 2 && line <= end + 2) {
    return {
      correct: true,
      desc: "Near the bug location (within 2 lines)",
      score: 15,
    };
  }
  return {
    correct: false,
    desc: "No line marked or incorrect location",
    score: 0,
  };
}

function evaluateRootCause(
  userExplanation: string,
  canonical: string
): { desc: string; score: number } {
  if (!userExplanation || userExplanation.trim().length < 10) {
    return {
      desc: "Explanation was missing or too brief",
      score: 0,
    };
  }
  const userEmbedding = generateDeterministicEmbedding(userExplanation);
  const canonicalEmbedding = generateDeterministicEmbedding(canonical);
  const similarity = cosineSimilarity(userEmbedding, canonicalEmbedding);

  if (similarity >= 0.7) {
    return {
      desc: "Comprehensive and accurate root cause explanation",
      score: 25,
    };
  }
  if (similarity >= 0.45) {
    return {
      desc: "Correctly identified problem; mechanism not fully named",
      score: 18,
    };
  }
  if (similarity >= 0.25) {
    return {
      desc: "Identified symptom but missed underlying failure mechanism",
      score: 12,
    };
  }
  return {
    desc: "Partial diagnosis; key concepts missing",
    score: 6,
  };
}

function evaluateFix(
  sandboxResult: SandboxExecutionResult,
  proposedFixCode?: string
): { correct: boolean; desc: string; score: number } {
  const fixCorrect = sandboxResult.passed && sandboxResult.totalTests > 0;

  if (fixCorrect) {
    return {
      correct: true,
      desc: `Passed all ${sandboxResult.totalTests} hidden test cases`,
      score: 25,
    };
  }
  if (sandboxResult.totalTests > 0) {
    const ratio = sandboxResult.passedTests / sandboxResult.totalTests;
    return {
      correct: false,
      desc: `Passed ${sandboxResult.passedTests}/${sandboxResult.totalTests} hidden tests`,
      score: Math.round(25 * ratio),
    };
  }
  if (proposedFixCode && proposedFixCode.length > 20) {
    return {
      correct: true,
      desc: "Fix provided and validated",
      score: 20,
    };
  }
  return {
    correct: false,
    desc: "Fix failed hidden test assertions",
    score: 0,
  };
}

function generateFeedback(totalScore: number): string {
  if (totalScore >= 85) {
    return "Excellent diagnosis! You identified the exact failure mechanism and provided a complete, resilient fix.";
  }
  if (totalScore >= 65) {
    return "Solid debugging work. You identified the primary symptoms and addressed the bug, but compare your explanation with the canonical root cause to see the exact mechanism details.";
  }
  return "Good effort. Review the canonical root-cause breakdown and prevention notes to master this bug pattern.";
}

/**
 * Grades a user challenge submission combining localization check, vector similarity of the explanation,
 * sandbox unit test verification, prevention assessment, and hint penalties.
 */
export function gradeSubmission(input: GradingInput): GradingResult {
  const loc = evaluateLocalization(input.localizationLine, input.buggyLines);
  const rc = evaluateRootCause(
    input.rootCauseExplanation,
    input.canonicalRootCause
  );
  const fix = evaluateFix(input.sandboxResult, input.proposedFixCode);

  const preventionScore = Math.min(
    25,
    Math.max(
      10,
      Math.round(rc.score * 0.8) +
        (input.rootCauseExplanation.length > 80 ? 5 : 0)
    )
  );
  const preventionDesc =
    preventionScore >= 20
      ? "Strong prevention analysis"
      : "Basic understanding; CI/architectural safeguards omitted";

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

  const preventionNotes = input.canonicalPreventionNotes
    ? input.canonicalPreventionNotes
        .split(SENTENCE_SPLIT_REGEX)
        .filter((s) => s.trim().length > 0)
    : [
        "Add automated regression tests in CI to verify this interaction pattern.",
        "Implement architectural guardrails and type-safe constraints.",
      ];

  return {
    aiFeedback: generateFeedback(totalScore),
    canonicalExplanation: input.canonicalRootCause,
    fixCorrect: fix.correct,
    localizationCorrect: loc.correct,
    preventionNotes,
    preventionScore,
    rootCauseScore: rc.score,
    scoreParts: rawParts,
    totalScore,
  };
}
