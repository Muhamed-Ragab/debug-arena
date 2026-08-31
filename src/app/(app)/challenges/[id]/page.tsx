import { notFound } from "next/navigation";
import { AdminReadOnlyBanner } from "@/features/challenge/components/AdminReadOnlyBanner";
import { ChallengeScreen } from "@/features/challenge/components/ChallengeScreen";
import { challengeService } from "@/features/challenge/service";
import type { DiffLine } from "@/features/challenge/types";
import { getServerSession } from "@/lib/auth/session";
import type { Category, Challenge, Difficulty } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession();
  const sessionRole = session?.user
    ? (session.user as { role?: string }).role
    : undefined;
  const dbChallenge = await challengeService.getChallengeById(id);

  if (
    !dbChallenge ||
    (dbChallenge.status !== "published" && sessionRole !== "admin")
  ) {
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

  const isAdmin = sessionRole === "admin";

  return (
    <div className="flex h-full w-full flex-col">
      {isAdmin ? (
        <div className="shrink-0 p-3">
          <AdminReadOnlyBanner />
        </div>
      ) : null}
      <div className="min-h-0 flex-1">
        <ChallengeScreen
          challenge={challenge}
          codeLines={codeLines}
          diffLines={referenceFix.diff}
          fileName={fileName}
          hints={dbChallenge.hints}
          isReadOnly={isAdmin}
          scenarioParagraphs={scenarioParagraphs}
        />
      </div>
    </div>
  );
}
