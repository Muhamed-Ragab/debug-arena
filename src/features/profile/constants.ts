import type { Category } from "@/lib/domain/types";
import type { AvatarPreset } from "./types";

export const DEFAULT_CATEGORIES: Category[] = [
  "State Mutations",
  "Race Conditions",
  "Security Flaws",
  "Memory Leaks",
];

export const AVATAR_PRESETS: AvatarPreset[] = [
  { color: "#4f46e5", id: "indigo" },
  { color: "#22d3ee", id: "cyan" },
  { color: "#f59e0b", id: "amber" },
  { color: "#8b5cf6", id: "violet" },
  { color: "#f43f5e", id: "rose" },
  { color: "#10b981", id: "emerald" },
];
