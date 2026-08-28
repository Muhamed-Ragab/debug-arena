export interface ScorePart {
  desc: string;
  label: string;
  max: number;
  score: number;
}

export interface EvaluationDetails {
  alignmentPercent?: number;
  confidence?: string;
  enhancementSuggestions?: string[];
  isAiGraded?: boolean;
  isCorrect?: boolean;
  keyConceptsIdentified?: string[];
  missedMechanisms?: string[];
  modelUsed?: string;
  needsEnhancement?: boolean;
}

export interface SubmissionDataForScoring {
  aiFeedback?: string | null;
  canonicalPreventionNotes?: string | null;
  canonicalRootCause?: string | null;
  challengeTitle?: string | null;
  evaluationDetails?: unknown;
  fixCorrect?: boolean | null;
  hintsUsed?: number | null;
  localizationAnswer?: string | null;
  localizationCorrect?: boolean | null;
  preventionScore?: number | null;
  proposedFix?: unknown;
  rootCauseExplanation?: string | null;
  rootCauseScore?: number | null;
  totalScore?: number | null;
}

export interface ResultsViewModel {
  aiFeedback: string;
  canonicalExplanation: string;
  challengeTitle: string;
  evaluationDetails: unknown;
  maxScore: number;
  preventionNotes: string[];
  scoreParts: ScorePart[];
  totalScore: number;
  userExplanation: string;
  userSolution: string;
}
