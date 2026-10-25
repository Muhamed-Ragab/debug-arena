import { SEED_CATEGORIES } from "@/features/category/constants";
import type { Category } from "@/lib/domain/types";
import type { AvatarPreset } from "./types";

export const DEFAULT_CATEGORIES: Category[] = SEED_CATEGORIES.map(
  (c) => c.name as Category
);

export const AVATAR_PRESETS: AvatarPreset[] = [
  { color: "#4f46e5", id: "indigo" },
  { color: "#22d3ee", id: "cyan" },
  { color: "#f59e0b", id: "amber" },
  { color: "#8b5cf6", id: "violet" },
  { color: "#f43f5e", id: "rose" },
  { color: "#10b981", id: "emerald" },
];

export const EXPORT_SUBMISSION_CSV_HEADERS = [
  "ID",
  "Challenge Title",
  "Category",
  "Difficulty",
  "Total Score",
  "Fix Correct",
  "Localization Correct",
  "Hints Used",
  "Time Spent (s)",
  "Root Cause Explanation",
  "Prevention Answer",
  "AI Feedback",
  "Submitted At",
] as const;

export const CSV_FORMULA_TRIGGER_REGEX = /^[=+\-@\t\r|%]/;
export const NUMERIC_STRING_REGEX = /^-?\d+(\.\d+)?$/;
export const DEFAULT_SUBMISSION_EXPORT_LIMIT = 1000;

export const EXPORT_MESSAGES = {
  ERROR: "Failed to export submissions. Please try again.",
  GENERATE_ERROR: "Failed to generate export file. Please try again.",
  PREPARING: (format: string) => `Preparing ${format.toUpperCase()} export...`,
  SUCCESS: (filename: string) => `Successfully downloaded ${filename}`,
} as const;
