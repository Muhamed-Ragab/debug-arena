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
    label: "category.names.backendConcurrency",
  },
  "Logic Inversions": {
    bg: "rgba(139, 92, 246, 0.1)",
    border: "rgba(139, 92, 246, 0.25)",
    color: "#8b5cf6",
    dim: "rgba(139, 92, 246, 0.15)",
    Icon: Bug,
    label: "category.names.logicInversions",
  },
  "Memory Leaks": {
    bg: "rgba(236, 72, 153, 0.1)",
    border: "rgba(236, 72, 153, 0.25)",
    color: "#ec4899",
    dim: "rgba(236, 72, 153, 0.15)",
    Icon: MemoryStick,
    label: "category.names.memoryLeaks",
  },
  "Off-by-One": {
    bg: "rgba(59, 130, 246, 0.1)",
    border: "rgba(59, 130, 246, 0.25)",
    color: "#3b82f6",
    dim: "rgba(59, 130, 246, 0.15)",
    Icon: AlertTriangle,
    label: "category.names.offByOne",
  },
  "Race Conditions": {
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.25)",
    color: "#f59e0b",
    dim: "rgba(245, 158, 11, 0.15)",
    Icon: RefreshCw,
    label: "category.names.raceConditions",
  },
  "React Rendering": {
    bg: "rgba(59, 130, 246, 0.1)",
    border: "rgba(59, 130, 246, 0.25)",
    color: "#3b82f6",
    dim: "rgba(59, 130, 246, 0.15)",
    Icon: Zap,
    label: "category.names.reactRendering",
  },
  "Security Flaws": {
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.25)",
    color: "#ef4444",
    dim: "rgba(239, 68, 68, 0.15)",
    Icon: Lock,
    label: "category.names.securityFlaws",
  },
  "State Mutations": {
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.25)",
    color: "#10b981",
    dim: "rgba(16, 185, 129, 0.15)",
    Icon: Database,
    label: "category.names.stateMutations",
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

export const CATEGORY_LABEL_KEY_MAP: Record<Category, string> = {
  "Backend Concurrency": "category.names.backendConcurrency",
  "Logic Inversions": "category.names.logicInversions",
  "Memory Leaks": "category.names.memoryLeaks",
  "Off-by-One": "category.names.offByOne",
  "Race Conditions": "category.names.raceConditions",
  "React Rendering": "category.names.reactRendering",
  "Security Flaws": "category.names.securityFlaws",
  "State Mutations": "category.names.stateMutations",
};

export const DIFFICULTY_LABEL_KEY_MAP: Record<Difficulty, string> = {
  Easy: "difficulty.easy",
  Expert: "difficulty.expert",
  Hard: "difficulty.hard",
  Medium: "difficulty.medium",
};
