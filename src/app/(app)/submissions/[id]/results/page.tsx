import { notFound } from "next/navigation";
import { getSubmissionById } from "@/features/challenge/queries";
import { ResultsScreen } from "@/features/results/components/ResultsScreen";
import type { ScorePart } from "@/features/results/types";

const SENTENCE_SPLIT_REGEX = /(?<=[.?!])\s+/;

function getRootCauseDesc(score: number | null): string {
  const s = score ?? 0;
  if (s >= 20) {
    return "Accurately diagnosed failure mechanism";
  }
  if (s >= 12) {
    return "Partially identified the failure mechanism";
  }
  return "Key failure mechanism omitted";
}

function getAiFeedback(total: number): string {
  if (total >= 85) {
    return "Excellent diagnosis! You identified the exact failure mechanism and provided a complete, resilient fix.";
  }
  if (total >= 65) {
    return "Solid debugging work. You addressed the core issue. Compare your explanation with the canonical root cause to see the specific mechanism details.";
  }
  return "Good effort. Review the canonical root-cause breakdown and prevention notes to master this bug pattern.";
}

export default async function SubmissionResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const submission = await getSubmissionById(id);

  if (!submission) {
    notFound();
  }

  const scoreParts: ScorePart[] = [
    {
      desc: submission.localizationCorrect
        ? "Exact bug location identified"
        : "Incorrect location or line unselected",
      label: "Localization",
      max: 25,
      score: submission.localizationCorrect ? 25 : 0,
    },
    {
      desc: getRootCauseDesc(submission.rootCauseScore),
      label: "Root Cause",
      max: 25,
      score: submission.rootCauseScore ?? 0,
    },
    {
      desc: submission.fixCorrect
        ? "Passed hidden unit test suite"
        : "Fix failed unit test assertions",
      label: "Fix Quality",
      max: 25,
      score: submission.fixCorrect ? 25 : 0,
    },
    {
      desc:
        (submission.preventionScore ?? 15) >= 20
          ? "Strong prevention analysis and best practices"
          : "Basic prevention coverage",
      label: "Prevention",
      max: 25,
      score: submission.preventionScore ?? 15,
    },
  ];

  const total =
    submission.totalScore ?? scoreParts.reduce((s, p) => s + p.score, 0);

  const preventionNotes = submission.canonicalPreventionNotes
    ? submission.canonicalPreventionNotes
        .split(SENTENCE_SPLIT_REGEX)
        .filter((s) => s.trim().length > 0)
    : [
        "Add automated regression tests in CI to verify this interaction pattern.",
        "Implement architectural guardrails and type-safe constraints.",
      ];

  return (
    <ResultsScreen
      aiFeedback={getAiFeedback(total)}
      canonicalExplanation={submission.canonicalRootCause}
      challengeTitle={submission.challengeTitle}
      maxScore={100}
      preventionNotes={preventionNotes}
      scoreParts={scoreParts}
      totalScore={total}
      userExplanation={
        submission.rootCauseExplanation ?? "No explanation submitted."
      }
    />
  );
}
