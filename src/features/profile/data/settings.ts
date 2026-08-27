import type { Category } from "@/lib/domain/types";

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

export const SESSIONS: SessionData[] = [
  {
    browser: "Chrome 124",
    current: true,
    device: "MacBook Pro",
    deviceType: "desktop",
    id: "sess_current",
    ip: "84.23.141.x",
    lastActive: "Active now",
    location: "Berlin, DE",
    os: "macOS 14.4",
  },
  {
    browser: "Safari 17",
    current: false,
    device: "iPhone 15 Pro",
    deviceType: "mobile",
    id: "sess_mobile",
    ip: "84.23.142.x",
    lastActive: "2 hours ago",
    location: "Berlin, DE",
    os: "iOS 17.4",
  },
  {
    browser: "Firefox 125",
    current: false,
    device: "ThinkPad X1",
    deviceType: "desktop",
    id: "sess_new",
    ip: "193.41.8.x",
    lastActive: "12 minutes ago",
    location: "Warsaw, PL",
    newLogin: true,
    os: "Ubuntu 22.04",
  },
  {
    browser: "Safari 17",
    current: false,
    device: "iPad Air",
    deviceType: "tablet",
    id: "sess_tablet",
    ip: "188.93.4.x",
    lastActive: "Yesterday",
    location: "Lisbon, PT",
    os: "iPadOS 17.4",
  },
];

export type ProviderId = "github" | "google" | "gitlab" | "discord";

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

export const LINKED_ACCOUNTS: LinkedAccount[] = [
  {
    connected: true,
    email: "marcus@github.example",
    isCurrentSignIn: true,
    isPrimary: true,
    label: "GitHub",
    provider: "github",
  },
  {
    connected: true,
    email: "marcus.reyes@gmail.example",
    isCurrentSignIn: false,
    isPrimary: false,
    label: "Google",
    provider: "google",
  },
  {
    connected: false,
    isCurrentSignIn: false,
    isPrimary: false,
    label: "GitLab",
    provider: "gitlab",
  },
  {
    connected: false,
    isCurrentSignIn: false,
    isPrimary: false,
    label: "Discord",
    provider: "discord",
  },
];

export interface ProfileDefaults {
  avatarColor: string;
  bio: string;
  displayName: string;
  handle: string;
  interests: Category[];
}

export const PROFILE_DEFAULT: ProfileDefaults = {
  avatarColor: "#4f46e5",
  bio: "Backend engineer. I break distributed systems so you don't have to.",
  displayName: "Marcus Reyes",
  handle: "marcus_r",
  interests: [
    "State Mutations",
    "Race Conditions",
    "Security Flaws",
    "Memory Leaks",
  ],
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
  color: string;
  id: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { color: "#4f46e5", id: "indigo" },
  { color: "#22d3ee", id: "cyan" },
  { color: "#f59e0b", id: "amber" },
  { color: "#8b5cf6", id: "violet" },
  { color: "#f43f5e", id: "rose" },
  { color: "#10b981", id: "emerald" },
];

/**
 * Whether the account has a password / secondary factor set. When false,
 * unlinking the last remaining sign-in method must be blocked (orphan guard).
 */
export const PASSWORD_SET = false;
