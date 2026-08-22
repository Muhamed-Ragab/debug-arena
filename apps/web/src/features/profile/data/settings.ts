import type { Category } from "../../../lib/types";

export type DeviceType = "desktop" | "mobile" | "tablet";

export interface SessionData {
  id: string;
  device: string;
  browser: string;
  os: string;
  deviceType: DeviceType;
  /** Coarse, IP-derived location — never precise. */
  location: string;
  /** Masked IP for display only. */
  ip: string;
  /** Human-readable last-active label. */
  lastActive: string;
  current: boolean;
  /** Surfaced when a login is new / unexpected. */
  newLogin?: boolean;
}

export const SESSIONS: SessionData[] = [
  {
    id: "sess_current",
    device: "MacBook Pro",
    browser: "Chrome 124",
    os: "macOS 14.4",
    deviceType: "desktop",
    location: "Berlin, DE",
    ip: "84.23.141.x",
    lastActive: "Active now",
    current: true,
  },
  {
    id: "sess_mobile",
    device: "iPhone 15 Pro",
    browser: "Safari 17",
    os: "iOS 17.4",
    deviceType: "mobile",
    location: "Berlin, DE",
    ip: "84.23.142.x",
    lastActive: "2 hours ago",
    current: false,
  },
  {
    id: "sess_new",
    device: "ThinkPad X1",
    browser: "Firefox 125",
    os: "Ubuntu 22.04",
    deviceType: "desktop",
    location: "Warsaw, PL",
    ip: "193.41.8.x",
    lastActive: "12 minutes ago",
    current: false,
    newLogin: true,
  },
  {
    id: "sess_tablet",
    device: "iPad Air",
    browser: "Safari 17",
    os: "iPadOS 17.4",
    deviceType: "tablet",
    location: "Lisbon, PT",
    ip: "188.93.4.x",
    lastActive: "Yesterday",
    current: false,
  },
];

export type ProviderId = "github" | "google" | "gitlab" | "discord";

export interface LinkedAccount {
  provider: ProviderId;
  label: string;
  connected: boolean;
  /** Email shown when connected. */
  email?: string;
  /** Primary provider for avatar/display name. */
  isPrimary: boolean;
  /** The method used to sign in to this session. */
  isCurrentSignIn: boolean;
}

export const LINKED_ACCOUNTS: LinkedAccount[] = [
  {
    provider: "github",
    label: "GitHub",
    connected: true,
    email: "marcus@github.example",
    isPrimary: true,
    isCurrentSignIn: true,
  },
  {
    provider: "google",
    label: "Google",
    connected: true,
    email: "marcus.reyes@gmail.example",
    isPrimary: false,
    isCurrentSignIn: false,
  },
  {
    provider: "gitlab",
    label: "GitLab",
    connected: false,
    isPrimary: false,
    isCurrentSignIn: false,
  },
  {
    provider: "discord",
    label: "Discord",
    connected: false,
    isPrimary: false,
    isCurrentSignIn: false,
  },
];

export interface ProfileDefaults {
  displayName: string;
  handle: string;
  bio: string;
  avatarColor: string;
  interests: Category[];
}

export const PROFILE_DEFAULT: ProfileDefaults = {
  displayName: "Marcus Reyes",
  handle: "marcus_r",
  bio: "Backend engineer. I break distributed systems so you don't have to.",
  avatarColor: "#4f46e5",
  interests: ["react", "concurrency", "distributed", "memory"],
};

/** Mock set of already-claimed handles for the availability check. */
export const TAKEN_HANDLES = new Set([
  "admin",
  "root",
  "debug",
  "test",
  "mreyes",
  "support",
]);

export interface AvatarPreset {
  id: string;
  color: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "indigo", color: "#4f46e5" },
  { id: "cyan", color: "#22d3ee" },
  { id: "amber", color: "#f59e0b" },
  { id: "violet", color: "#8b5cf6" },
  { id: "rose", color: "#f43f5e" },
  { id: "emerald", color: "#10b981" },
];

/**
 * Whether the account has a password / secondary factor set. When false,
 * unlinking the last remaining sign-in method must be blocked (orphan guard).
 */
export const PASSWORD_SET = false;
