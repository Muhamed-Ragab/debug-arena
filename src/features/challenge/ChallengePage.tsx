"use client";

import { useRouter } from "next/navigation";
import { ChallengeScreen } from "./components/ChallengeScreen";
import { useChallenge } from "./hooks/useChallenge";

export function ChallengePage({ id }: { id?: string }) {
  const router = useRouter();
  const challenge = useChallenge(id);

  return (
    <ChallengeScreen
      challenge={challenge}
      onSubmit={() => router.push(`/challenges/${challenge.id}/results`)}
    />
  );
}
