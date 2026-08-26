import type { Challenge } from "@/lib/domain/types";
import { getChallengeById } from "../data/challenges";

export function useChallenge(id: string | undefined): Challenge {
  return getChallengeById(id);
}
