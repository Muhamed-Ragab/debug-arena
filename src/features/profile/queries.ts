import {
  getUserProfileData as getUserProfileDataService,
  getUserSettingsData as getUserSettingsDataService,
} from "./service";
import type { UserProfileData, UserSettingsData } from "./types";

export async function getUserProfileData(
  userId: string
): Promise<UserProfileData | null> {
  return await getUserProfileDataService(userId);
}

export async function getUserSettingsData(
  userId: string
): Promise<UserSettingsData | null> {
  return await getUserSettingsDataService(userId);
}
