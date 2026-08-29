export const CATEGORY_COLOR_PRESETS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
] as const;

export const CATEGORY_ICON_PRESETS = [
  "Bug",
  "Layers",
  "Zap",
  "Shield",
  "Cpu",
  "Lock",
  "Code",
  "Database",
  "Globe",
  "Wrench",
] as const;

export const SEED_CATEGORIES = [
  {
    color: "#3b82f6",
    description:
      "Component lifecycle, hook dependencies, memoization, and rendering bugs.",
    icon: "Layers",
    isActive: true,
    name: "React Rendering",
    slug: "react-rendering",
    sortOrder: 0,
  },
  {
    color: "#10b981",
    description:
      "Race conditions, deadlocks, connection leaks, N+1 queries, and concurrency hazards.",
    icon: "Cpu",
    isActive: true,
    name: "Backend Concurrency",
    slug: "backend-concurrency",
    sortOrder: 1,
  },
  {
    color: "#f59e0b",
    description:
      "State synchronization, prop drilling, stale closures, and global store inconsistencies.",
    icon: "Database",
    isActive: true,
    name: "State Management",
    slug: "state-management",
    sortOrder: 2,
  },
  {
    color: "#ef4444",
    description:
      "REST contract mismatches, pagination, idempotency, and versioning pitfalls.",
    icon: "Globe",
    isActive: true,
    name: "API Design",
    slug: "api-design",
    sortOrder: 3,
  },
  {
    color: "#8b5cf6",
    description:
      "Bundle size, render cost, memoization, lazy loading, and runtime bottlenecks.",
    icon: "Zap",
    isActive: true,
    name: "Performance",
    slug: "performance",
    sortOrder: 4,
  },
  {
    color: "#06b6d4",
    description:
      "XSS, CSRF, auth bypass, injection, and secrets exposure vulnerabilities.",
    icon: "Shield",
    isActive: true,
    name: "Security",
    slug: "security",
    sortOrder: 5,
  },
] as const;
