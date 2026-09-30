import {
  Braces,
  CircleHelp,
  Code,
  Cpu,
  Database,
  Globe,
  Layers,
  Lock,
  type LucideIcon,
  Server,
  Shield,
  Wrench,
  Zap,
} from "lucide-react";
import { CHALLENGE_POINTS_BY_DIFFICULTY } from "./scoring";
import type { Difficulty } from "./types";

export type { Difficulty } from "./types";

export interface CategoryMeta {
  bg: string;
  border: string;
  color: string;
  dim: string;
  Icon: LucideIcon;
  label: string;
}

export type CategoryConfig = CategoryMeta;

export interface CategoryAppearanceInput {
  color?: string | null;
  icon?: string | null;
  name: string;
}

export interface DifficultyMeta {
  bg: string;
  border: string;
  color: string;
  pts: number;
}

const FALLBACK_COLOR = "#6b7280";
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const ICONS: Record<string, LucideIcon> = {
  Braces,
  Bug: Code,
  Code,
  Cpu,
  Database,
  Globe,
  Layers,
  Lock,
  Server,
  Shield,
  Wrench,
  Zap,
};

export function getCategoryAppearance(
  category: CategoryAppearanceInput
): CategoryMeta {
  const color =
    category.color && COLOR_PATTERN.test(category.color)
      ? category.color
      : FALLBACK_COLOR;
  return {
    bg: `color-mix(in srgb, ${color} 12%, transparent)`,
    border: `color-mix(in srgb, ${color} 28%, transparent)`,
    color,
    dim: `color-mix(in srgb, ${color} 16%, transparent)`,
    Icon: (category.icon && ICONS[category.icon]) || CircleHelp,
    label: category.name,
  };
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyMeta> = {
  Easy: {
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.25)",
    color: "#10b981",
    pts: CHALLENGE_POINTS_BY_DIFFICULTY.easy,
  },
  Hard: {
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.25)",
    color: "#ef4444",
    pts: CHALLENGE_POINTS_BY_DIFFICULTY.hard,
  },
  Medium: {
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.25)",
    color: "#f59e0b",
    pts: CHALLENGE_POINTS_BY_DIFFICULTY.medium,
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = ["Easy", "Medium", "Hard"];

export const DIFFICULTY_LABEL_KEY_MAP: Record<Difficulty, string> = {
  Easy: "difficulty.easy",
  Hard: "difficulty.hard",
  Medium: "difficulty.medium",
};
