import type { LucideIcon } from "lucide-react";
import type * as schema from "@/db/schema";
import type { Category } from "@/lib/domain/types";

export type UserRow = typeof schema.users.$inferSelect;
export type AccountRow = typeof schema.accounts.$inferSelect;
export type CategoryStatRow = typeof schema.userCategoryStats.$inferSelect;
export type CategoryRow = typeof schema.categories.$inferSelect;
export type ProfileLinkRow = typeof schema.profileLinks.$inferSelect;
export type SubmissionRow = typeof schema.submissions.$inferSelect;
export type ChallengeRow = typeof schema.challenges.$inferSelect;
export type LoginAttemptRow = typeof schema.loginAttempts.$inferSelect;

export type UserWithRelations = UserRow & {
  accounts: AccountRow[];
  categoryStats: (CategoryStatRow & { category: CategoryRow | null })[];
  profileLinks: ProfileLinkRow[];
  submissions: (SubmissionRow & {
    challenge: ChallengeRow & { category: CategoryRow | null };
  })[];
};

export type UserForSettings = UserRow & {
  accounts: AccountRow[];
  loginAttempts: LoginAttemptRow[];
};

export type PublishedChallenge = ChallengeRow & {
  category: CategoryRow | null;
};

export interface ProfileRepository {
  deleteUser: (userId: string) => Promise<void>;
  findByIdForSettings: (userId: string) => Promise<UserForSettings | null>;
  findByIdWithRelations: (userId: string) => Promise<{
    user: UserWithRelations | null;
    publishedChallenges: PublishedChallenge[];
  }>;
  findCategoryStats: (
    userId: string,
    category: string
  ) => Promise<CategoryStatRow | null>;
  updateUser: (
    userId: string,
    data: Partial<typeof schema.users.$inferInsert>
  ) => Promise<UserRow | null>;
  upsertCategoryStats: (
    data: typeof schema.userCategoryStats.$inferInsert
  ) => Promise<CategoryStatRow | null>;
}

export interface AvatarPreset {
  color: string;
  id: string;
}

export interface RadarPoint {
  fullMark: number;
  score: number;
  subject: string;
}

export interface StrengthPoint {
  Easy: number;
  Expert: number;
  Hard: number;
  Medium: number;
  name: string;
}

export interface RecentSubmission {
  category: Category;
  id?: string;
  pts: number;
  score: number;
  title: string;
}

export interface CategoryStat {
  category: Category;
  score: number;
  solved: number;
}

export interface ProfileStat {
  Icon?: LucideIcon;
  iconColor?: string;
  label: string;
  value: string;
}

export type ProviderId = "github" | "google" | "gitlab" | "discord";

export type DeviceType = "desktop" | "mobile" | "tablet";

export interface SessionData {
  browser: string;
  current: boolean;
  device: string;
  deviceType: DeviceType;
  id: string;
  /** Masked IP for display only. */
  ip: string;
  /** Human-readable last-active label. */
  lastActive: string;
  /** Coarse, IP-derived location — never precise. */
  location: string;
  /** Surfaced when a login is new / unexpected. */
  newLogin?: boolean;
  os: string;
}

export interface LinkedAccount {
  accountId?: string;
  connected: boolean;
  /** Email shown when connected. */
  email?: string;
  /** The method used to sign in to this session. */
  isCurrentSignIn: boolean;
  /** Primary provider for avatar/display name. */
  isPrimary: boolean;
  label: string;
  provider: ProviderId;
}

export interface UserProfileData {
  categoryStats: CategoryStat[];
  profile: {
    avatarColor?: string;
    bio: string;
    displayName: string;
    handle: string;
    image?: string | null;
    jobTitle?: string;
    joined: string;
    name: string;
    points: string;
    rank: string;
    streak: string;
  };
  profileStats: ProfileStat[];
  radarData: RadarPoint[];
  recentSubmissions: (RecentSubmission & {
    id?: string;
    submittedAt?: string;
  })[];
  strengthData: StrengthPoint[];
}

export interface UserSettingsData {
  accounts: LinkedAccount[];
  profile: {
    avatarColor?: string;
    avatarUrl?: string;
    bio?: string;
    displayName?: string;
    handle?: string;
    interests?: string[];
    isPublic?: boolean;
    jobTitle?: string;
  };
  sessions: SessionData[];
}
