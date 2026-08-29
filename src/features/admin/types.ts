import type * as schema from "@/db/schema";

export type ChallengeRow = typeof schema.challenges.$inferSelect;
export type HintRow = typeof schema.hints.$inferSelect;
export type SubmissionRow = typeof schema.submissions.$inferSelect;
export type CategoryRow = typeof schema.categories.$inferSelect;
export type ChallengeEmbeddingRow =
  typeof schema.challengeEmbeddings.$inferSelect;

export type AdminChallengeRow = ChallengeRow & {
  category: CategoryRow;
  hints: HintRow[];
  submissions: SubmissionRow[];
};

export type AdminChallengeDetailRow = ChallengeRow & {
  category: CategoryRow;
  hints: HintRow[];
  submissions: SubmissionRow[];
};

export interface AdminRepository {
  deleteChallengeCascade: (challengeId: string) => Promise<void>;
  deleteHintsByChallengeId: (challengeId: string) => Promise<void>;
  findCategories: () => Promise<CategoryRow[]>;
  findChallengeById: (id: string) => Promise<AdminChallengeDetailRow | null>;
  findChallenges: () => Promise<AdminChallengeRow[]>;
  insertChallenge: (
    data: typeof schema.challenges.$inferInsert
  ) => Promise<ChallengeRow>;
  insertHints: (hints: (typeof schema.hints.$inferInsert)[]) => Promise<void>;
  updateChallenge: (
    id: string,
    data: Partial<typeof schema.challenges.$inferInsert>
  ) => Promise<void>;
  upsertEmbedding: (
    challengeId: string,
    content: string,
    embedding: (typeof schema.challengeEmbeddings.$inferInsert)["embedding"]
  ) => Promise<void>;
}

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
export interface DiffLine {
  line?: number;
  text: string;
  type: "ctx" | "add" | "del";
}

export interface ChallengeFile {
  code: string;
  isEntry?: boolean;
  name: string;
}

export interface ChallengeHiddenTest {
  description: string;
  name: string;
  testCode: string;
}

export interface ChallengeHint {
  order: number;
  penaltyPoints: number;
  socraticPrompt: string;
}

export interface GeneratedChallengeDraft {
  buggyArtifact: {
    buggyLines: [number, number];
    entryFile: string;
    files: ChallengeFile[];
    language: string;
    points: number;
    timeLimit: string;
  };
  categorySlug: string;
  difficulty: "easy" | "medium" | "hard";
  format: "code_snippet" | "log_only" | "ui_recording";
  hiddenTests?: ChallengeHiddenTest[];
  hints: ChallengeHint[];
  preventionNotes: string;
  prompt: string;
  referenceFix: {
    diff: DiffLine[];
    explanation: string;
    files: ChallengeFile[];
  };
  rootCauseSummary: string;
  title: string;
}

export interface GenerateQuestionParams {
  additionalInstructions?: string;
  bugPattern?: string;
  categoryName?: string;
  categorySlug?: string;
  difficulty?: "easy" | "medium" | "hard";
  format?: "code_snippet" | "log_only" | "ui_recording";
  language?: string;
  topic?: string;
}

export interface RefineQuestionParams {
  currentDraft: GeneratedChallengeDraft;
  instruction: string;
}

export interface SaveChallengeInput {
  buggyArtifact?: unknown;
  categorySlug: string;
  difficulty: string;
  format?: string;
  hints: Array<{
    order?: number;
    penaltyPoints?: number;
    socraticPrompt: string;
  }>;
  id?: string | null;
  preventionNotes?: string | null;
  prompt: string;
  referenceFix?: unknown;
  rootCauseSummary: string;
  source?: string;
  status: string;
  title: string;
}
