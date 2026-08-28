import {
  getAdminCategories as getAdminCategoriesService,
  getAdminChallengeById as getAdminChallengeByIdService,
  getAdminChallenges as getAdminChallengesService,
} from "./service";

export async function getAdminCategories() {
  return await getAdminCategoriesService();
}

export async function getAdminChallenges() {
  return await getAdminChallengesService();
}

export async function getAdminChallengeById(challengeId: string) {
  return await getAdminChallengeByIdService(challengeId);
}
