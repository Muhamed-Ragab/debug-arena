import type { Category, Difficulty } from "../lib/types";
import { Atom, Cpu, Network, MemoryStick, type LucideIcon } from "lucide-react";

export interface CategoryConfig {
  label: string;
  /** bright foreground color (text + dot) */
  color: string;
  /** dim color used for the card left accent bar */
  dim: string;
  /** translucent badge background */
  bg: string;
  /** translucent badge border */
  border: string;
  Icon: LucideIcon;
}

export const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  react: {
    label: "React Rendering",
    color: "#22d3ee",
    dim: "#06b6d4",
    bg: "rgba(6, 182, 212, 0.1)",
    border: "rgba(6, 182, 212, 0.2)",
    Icon: Atom,
  },
  concurrency: {
    label: "Backend Concurrency",
    color: "#fbbf24",
    dim: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.2)",
    Icon: Cpu,
  },
  distributed: {
    label: "Distributed Systems",
    color: "#a78bfa",
    dim: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.1)",
    border: "rgba(139, 92, 246, 0.2)",
    Icon: Network,
  },
  memory: {
    label: "Memory & Performance",
    color: "#fb7185",
    dim: "#f43f5e",
    bg: "rgba(244, 63, 94, 0.1)",
    border: "rgba(244, 63, 94, 0.2)",
    Icon: MemoryStick,
  },
};

export interface DifficultyConfig {
  color: string;
  bg: string;
  border: string;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  Easy: {
    color: "#34d399",
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.2)",
  },
  Medium: {
    color: "#facc15",
    bg: "rgba(234, 179, 8, 0.1)",
    border: "rgba(234, 179, 8, 0.2)",
  },
  Hard: {
    color: "#fb923c",
    bg: "rgba(249, 115, 22, 0.1)",
    border: "rgba(249, 115, 22, 0.2)",
  },
  Expert: {
    color: "#f87171",
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.2)",
  },
};

export const CATEGORY_ORDER: Category[] = [
  "react",
  "concurrency",
  "distributed",
  "memory",
];

export const DIFFICULTY_ORDER: Difficulty[] = ["Easy", "Medium", "Hard", "Expert"];
