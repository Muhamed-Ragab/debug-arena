import type * as schema from "@/db/schema";

export type ChallengeRow = typeof schema.challenges.$inferSelect;
export type HintRow = typeof schema.hints.$inferSelect;
export type SubmissionRow = typeof schema.submissions.$inferSelect;
export type CategoryRow = typeof schema.categories.$inferSelect;
export type UserRow = typeof schema.users.$inferSelect;

export interface PublishedChallengeDTO {
  buggyArtifact: ChallengeRow["buggyArtifact"];
  categoryId: ChallengeRow["categoryId"];
  categoryName: CategoryRow["name"];
  categorySlug: CategoryRow["slug"];
  createdAt: ChallengeRow["createdAt"];
  difficulty: ChallengeRow["difficulty"];
  format: ChallengeRow["format"];
  hints: HintRow[];
  id: ChallengeRow["id"];
  preventionNotes: ChallengeRow["preventionNotes"];
  prompt: ChallengeRow["prompt"];
  referenceFix: ChallengeRow["referenceFix"];
  rootCauseSummary: ChallengeRow["rootCauseSummary"];
  status: ChallengeRow["status"];
  submissions: SubmissionRow[];
  title: ChallengeRow["title"];
}

export interface ChallengeDetailDTO {
  buggyArtifact: ChallengeRow["buggyArtifact"];
  categoryId: ChallengeRow["categoryId"];
  categoryName: CategoryRow["name"];
  categorySlug: CategoryRow["slug"];
  createdAt: ChallengeRow["createdAt"];
  difficulty: ChallengeRow["difficulty"];
  format: ChallengeRow["format"];
  hints: HintRow[];
  id: ChallengeRow["id"];
  preventionNotes: ChallengeRow["preventionNotes"];
  prompt: ChallengeRow["prompt"];
  referenceFix: ChallengeRow["referenceFix"];
  rootCauseSummary: ChallengeRow["rootCauseSummary"];
  status: ChallengeRow["status"];
  title: ChallengeRow["title"];
}

export type SubmissionWithRelations = SubmissionRow & {
  challenge: ChallengeRow & { category: CategoryRow };
  user: UserRow;
};

export interface UserChallengeStatsData {
  totalPublishedCount: number;
  user: (UserRow & { submissions: SubmissionRow[] }) | null;
}

export interface ChallengeRepository {
  findById: (id: string) => Promise<ChallengeDetailDTO | null>;
  findChallengeByIdForDetail: (
    id: string
  ) => Promise<(ChallengeDetailDTO & { submissions: SubmissionRow[] }) | null>;
  findHintsByChallengeId: (id: string) => Promise<HintRow[]>;
  findPublished: () => Promise<PublishedChallengeDTO[]>;
  findSubmissionById: (id: string) => Promise<SubmissionWithRelations | null>;
  findUserChallengeStatsData: (
    userId: string
  ) => Promise<UserChallengeStatsData>;
  insertSubmission: (
    data: typeof schema.submissions.$inferInsert
  ) => Promise<SubmissionRow>;
}

export type RightTab = "explain" | "fix" | "hints";

export type DiffLineType = "ctx" | "add" | "del";

export interface DiffLine {
  line?: number;
  text: string;
  type: DiffLineType;
}

export type FileTreeNode =
  | { type: "folder"; name: string; depth: number }
  | { type: "file"; name: string; depth: number; highlight?: boolean };

export interface AIEvaluationResult {
  alignmentPercent: number;
  confidence?: "high" | "medium" | "low";
  constructiveFeedback: string;
  enhancementSuggestions?: string[];
  fixScore?: number; // 0-25
  isAiGraded: boolean;
  isCorrect: boolean;
  keyConceptsIdentified: string[];
  missedMechanisms: string[];
  modelUsed?: string;
  needsEnhancement: boolean;
  preventionAnalysis: string;
  preventionScore?: number; // 0-25
  rootCauseScore: number; // 0-25
}

export interface HintItem {
  order: number;
  penaltyPoints: number;
  socraticPrompt: string;
}

export interface UserChallengeStats {
  rank: string;
  solvedRatio: string;
  streak: string;
}

export interface SubmitChallengeInput {
  challengeId: string;
  hintsRevealedCount: number;
  localizationLines: number[];
  proposedFixCode: string;
  rootCauseExplanation: string;
  solutionExplanation: string;
  timeSpentSeconds: number;
  userId: string;
}
