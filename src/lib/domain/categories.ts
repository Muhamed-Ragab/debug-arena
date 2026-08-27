import {
  AlertTriangle,
  Bug,
  Cpu,
  Database,
  Lock,
  type LucideIcon,
  MemoryStick,
  RefreshCw,
  Zap,
} from "lucide-react";
import type { Category, Difficulty } from "./types";

export type { Category, Difficulty } from "./types";

export interface CategoryMeta {
  bg: string;
  border: string;
  color: string;
  dim: string;
  Icon: LucideIcon;
  label: string;
}

export type CategoryConfig = CategoryMeta;

export interface DifficultyMeta {
  bg: string;
  border: string;
  color: string;
  pts: number;
}

export const CATEGORY_CONFIG: Record<Category, CategoryMeta> = {
  "Backend Concurrency": {
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.25)",
    color: "#f59e0b",
    dim: "rgba(245, 158, 11, 0.15)",
    Icon: Cpu,
    label: "Backend Concurrency",
  },
  "Logic Inversions": {
    bg: "rgba(139, 92, 246, 0.1)",
    border: "rgba(139, 92, 246, 0.25)",
    color: "#8b5cf6",
    dim: "rgba(139, 92, 246, 0.15)",
    Icon: Bug,
    label: "Logic Inversions",
  },
  "Memory Leaks": {
    bg: "rgba(236, 72, 153, 0.1)",
    border: "rgba(236, 72, 153, 0.25)",
    color: "#ec4899",
    dim: "rgba(236, 72, 153, 0.15)",
    Icon: MemoryStick,
    label: "Memory Leaks",
  },
  "Off-by-One": {
    bg: "rgba(59, 130, 246, 0.1)",
    border: "rgba(59, 130, 246, 0.25)",
    color: "#3b82f6",
    dim: "rgba(59, 130, 246, 0.15)",
    Icon: AlertTriangle,
    label: "Off-by-One",
  },
  "Race Conditions": {
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.25)",
    color: "#f59e0b",
    dim: "rgba(245, 158, 11, 0.15)",
    Icon: RefreshCw,
    label: "Race Conditions",
  },
  "React Rendering": {
    bg: "rgba(59, 130, 246, 0.1)",
    border: "rgba(59, 130, 246, 0.25)",
    color: "#3b82f6",
    dim: "rgba(59, 130, 246, 0.15)",
    Icon: Zap,
    label: "React Rendering",
  },
  "Security Flaws": {
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.25)",
    color: "#ef4444",
    dim: "rgba(239, 68, 68, 0.15)",
    Icon: Lock,
    label: "Security Flaws",
  },
  "State Mutations": {
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.25)",
    color: "#10b981",
    dim: "rgba(16, 185, 129, 0.15)",
    Icon: Database,
    label: "State Mutations",
  },
};

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyMeta> = {
  Easy: {
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.25)",
    color: "#10b981",
    pts: 100,
  },
  Expert: {
    bg: "rgba(139, 92, 246, 0.1)",
    border: "rgba(139, 92, 246, 0.25)",
    color: "#8b5cf6",
    pts: 500,
  },
  Hard: {
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.25)",
    color: "#ef4444",
    pts: 300,
  },
  Medium: {
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.25)",
    color: "#f59e0b",
    pts: 200,
  },
};

export const CATEGORY_ORDER: Category[] = [
  "React Rendering",
  "Backend Concurrency",
  "Race Conditions",
  "Off-by-One",
  "Memory Leaks",
  "Security Flaws",
  "Logic Inversions",
  "State Mutations",
];

export const DIFFICULTY_ORDER: Difficulty[] = [
  "Easy",
  "Medium",
  "Hard",
  "Expert",
];
