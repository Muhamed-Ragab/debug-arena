import type { GetLeaderboardOptions } from "./service";
import {
  calculateUserRank as calculateUserRankService,
  getTopLeaderboard as getTopLeaderboardService,
} from "./service";
import type { LeaderboardEntry } from "./types";

export { invalidateLeaderboardCache } from "./cache";

export async function calculateUserRank(userId: string): Promise<string> {
  return await calculateUserRankService(userId);
}

export async function getTopLeaderboard(
  options: GetLeaderboardOptions = {}
): Promise<LeaderboardEntry[]> {
  return await getTopLeaderboardService(options);
}
