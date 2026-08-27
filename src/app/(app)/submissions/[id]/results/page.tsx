import { notFound, redirect } from "next/navigation";
import { getSubmissionById } from "@/features/challenge/queries";
import { ResultsScreen } from "@/features/results/components/ResultsScreen";
import type { ScorePart } from "@/features/results/types";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

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

function getFixQualityDesc(score: number): string {
  if (score >= 20) {
    return "Sound and effective solution approach";
  }
  if (score >= 12) {
    return "Partially addresses the bug";
  }
  return "Fix failed test assertions or details omitted";
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

type SubmissionData = NonNullable<
  Awaited<ReturnType<typeof getSubmissionById>>
>;

function computeSubmissionScores(submission: SubmissionData) {
  const proposedFixObj =
    typeof submission.proposedFix === "object" &&
    submission.proposedFix !== null
      ? (submission.proposedFix as {
          code?: string;
          score?: number;
          solution?: string;
        })
      : null;

  const userSolution =
    proposedFixObj?.solution ||
    (typeof submission.proposedFix === "string"
      ? submission.proposedFix
      : undefined);

  let locScore = 0;
  let locDesc = "Incorrect location or line unselected";
  if (submission.localizationCorrect) {
    locScore = 25;
    locDesc = "Exact bug location identified";
  } else if (submission.localizationAnswer?.includes("Near")) {
    locScore = 15;
    locDesc = "Near the bug location (within 2 lines)";
  }

  const rcScore = Math.max(0, Math.min(25, submission.rootCauseScore ?? 0));

  let fixScore = proposedFixObj?.score;
  if (fixScore === undefined) {
    if (submission.fixCorrect) {
      fixScore = 25;
    } else if (rcScore > 0) {
      fixScore = Math.max(8, Math.round(rcScore * 0.85));
    } else {
      fixScore = 0;
    }
  }

  const prevScore = Math.max(
    0,
    Math.min(
      25,
      submission.preventionScore ??
        (rcScore > 0 ? Math.max(10, Math.round(rcScore * 0.8) + 3) : 10)
    )
  );

  const scoreParts: ScorePart[] = [
    {
      desc: locDesc,
      label: "Localization",
      max: 25,
      score: locScore,
    },
    {
      desc: getRootCauseDesc(rcScore),
      label: "Root Cause",
      max: 25,
      score: rcScore,
    },
    {
      desc: getFixQualityDesc(fixScore),
      label: "Fix Quality",
      max: 25,
      score: fixScore,
    },
    {
      desc:
        prevScore >= 20
          ? "Strong prevention analysis and best practices"
          : "Basic prevention coverage",
      label: "Prevention",
      max: 25,
      score: prevScore,
    },
  ];

  const total =
    submission.totalScore ??
    Math.max(
      0,
      Math.min(
        100,
        scoreParts.reduce((s, p) => s + p.score, 0) -
          (submission.hintsUsed ?? 0) * 10
      )
    );

  return { scoreParts, total, userSolution };
}

export default async function SubmissionResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const submission = await getSubmissionById(id);

  if (!submission) {
    notFound();
  }

  if (submission.userId !== session.user.id && session.user.role !== "admin") {
    notFound();
  }

  const { scoreParts, total, userSolution } =
    computeSubmissionScores(submission);

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
      userSolution={userSolution}
    />
  );
}
