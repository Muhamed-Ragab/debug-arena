import type { LucideIcon } from "lucide-react";
import type { Category } from "@/lib/domain/types";

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
