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
