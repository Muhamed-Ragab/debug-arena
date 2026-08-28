import { notFound, redirect } from "next/navigation";
import { getSubmissionById } from "@/features/challenge/queries";
import { ResultsScreen } from "@/features/results/components/ResultsScreen";
import { buildResultsViewModel } from "@/features/results/service";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

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
  const vm = buildResultsViewModel(submission);
  return (
    <ResultsScreen
      aiFeedback={vm.aiFeedback}
      canonicalExplanation={vm.canonicalExplanation}
      challengeTitle={vm.challengeTitle}
      evaluationDetails={vm.evaluationDetails as never}
      maxScore={vm.maxScore}
      preventionNotes={vm.preventionNotes}
      scoreParts={vm.scoreParts}
      totalScore={vm.totalScore}
      userExplanation={vm.userExplanation}
      userSolution={vm.userSolution}
    />
  );
}
