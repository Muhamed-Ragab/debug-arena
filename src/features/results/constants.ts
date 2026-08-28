export const SENTENCE_SPLIT_REGEX = /(?<=[.?!])\s+/;

export const ROOT_CAUSE_LEVEL_MAP: Record<string, string> = {
  high: "Accurately diagnosed failure mechanism",
  low: "Key failure mechanism omitted",
  mid: "Partially identified the failure mechanism",
};

export const FIX_QUALITY_LEVEL_MAP: Record<string, string> = {
  high: "Sound and effective solution approach",
  low: "Fix failed test assertions or details omitted",
  mid: "Partially addresses the bug",
};
