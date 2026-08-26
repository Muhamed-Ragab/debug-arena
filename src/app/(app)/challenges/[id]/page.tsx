import { notFound } from "next/navigation";
import { ChallengeScreen } from "@/features/challenge/components/ChallengeScreen";
import { getChallengeById } from "@/features/challenge/queries";
import type { DiffLine } from "@/features/challenge/types";
import type { Category, Challenge, Difficulty } from "@/lib/domain/types";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dbChallenge = await getChallengeById(id);

  if (!dbChallenge) {
    notFound();
  }

  const buggyArtifact = dbChallenge.buggyArtifact as {
    entryFile?: string;
    points?: number;
    timeLimit?: string;
    files?: Array<{ name: string; code: string; isEntry?: boolean }>;
  };

  const referenceFix = dbChallenge.referenceFix as {
    diff?: DiffLine[];
    files?: Array<{ name: string; code: string }>;
  };

  const diff = (dbChallenge.difficulty.charAt(0).toUpperCase() +
    dbChallenge.difficulty.slice(1)) as Difficulty;

  const entryFile =
    buggyArtifact.files?.find((f) => f.isEntry) ?? buggyArtifact.files?.[0];
  const codeLines = entryFile?.code ? entryFile.code.split("\n") : undefined;
  const fileName = entryFile?.name ?? buggyArtifact.entryFile ?? "main.ts";

  const challenge: Challenge = {
    category: dbChallenge.categoryName as Category,
    difficulty: diff,
    filePath: fileName,
    id: dbChallenge.id,
    points: buggyArtifact.points ?? 200,
    time: buggyArtifact.timeLimit ? `~${buggyArtifact.timeLimit}` : "~25m",
    timeLimit: buggyArtifact.timeLimit ?? "25 min",
    title: dbChallenge.title,
  };

  const scenarioParagraphs = dbChallenge.prompt
    ? dbChallenge.prompt.split("\n\n").filter(Boolean)
    : undefined;

  return (
    <ChallengeScreen
      challenge={challenge}
      codeLines={codeLines}
      diffLines={referenceFix.diff}
      fileName={fileName}
      hints={dbChallenge.hints}
      scenarioParagraphs={scenarioParagraphs}
    />
  );
}
