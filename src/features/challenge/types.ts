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
