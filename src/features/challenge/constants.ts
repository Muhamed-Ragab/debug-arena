export const SEED_CATEGORIES = [
  {
    description:
      "Component lifecycle, hook dependencies, memoization, and rendering bugs.",
    name: "React Rendering",
    slug: "react-rendering",
  },
  {
    description:
      "Race conditions, deadlocks, connection leaks, N+1 queries, and concurrency hazards.",
    name: "Backend Concurrency",
    slug: "backend-concurrency",
  },
] as const;

export const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Easy",
  hard: "Hard",
  medium: "Medium",
};

export const STATUS_LABEL: Record<string, string> = {
  archived: "Archived",
  draft: "Draft",
  published: "Published",
};
