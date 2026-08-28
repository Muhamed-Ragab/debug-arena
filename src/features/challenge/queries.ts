import {
  getChallengeByIdMapped,
  getPublishedChallengesMapped,
  getSubmissionById as getSubmissionByIdService,
  getUserChallengeStats as getUserChallengeStatsService,
} from "./service";
import type { UserChallengeStats } from "./types";

export async function getPublishedChallenges() {
  return await getPublishedChallengesMapped();
}

export async function getUserChallengeStats(
  userId?: string | null
): Promise<UserChallengeStats> {
  return await getUserChallengeStatsService(userId);
}

export async function getChallengeById(challengeId: string) {
  return await getChallengeByIdMapped(challengeId);
}

export async function getSubmissionById(submissionId: string) {
  return await getSubmissionByIdService(submissionId);
}

export { challengeRepository } from "./repository";
