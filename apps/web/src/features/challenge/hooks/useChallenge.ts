import { getChallengeById } from "../data/challenges";
import type { Challenge } from "../../../lib/types";

export function useChallenge(id: string | undefined): Challenge {
  return getChallengeById(id);
}
