export interface AdminChallengeItem {
  buggyArtifact: unknown;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  createdAt: Date;
  difficulty: "easy" | "medium" | "hard";
  format: "code_snippet" | "log_only" | "ui_recording";
  hints: unknown[];
  id: string;
  preventionNotes: string | null;
  prompt: string;
  referenceFix: unknown;
  rootCauseSummary: string;
  solvesCount: number;
  source: "manual" | "ai_generated" | "postmortem_import";
  status: "draft" | "published" | "archived";
  submissionsCount: number;
  title: string;
}

export interface CategoryOption {
  description: string | null;
  id: string;
  name: string;
  slug: string;
}
