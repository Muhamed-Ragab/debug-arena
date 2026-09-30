const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "of",
  "to",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "it",
  "its",
  "this",
  "that",
  "with",
  "for",
  "as",
  "by",
  "at",
  "from",
  "what",
  "not",
  "no",
  "i",
  "am",
  "you",
  "we",
  "they",
]);

/**
 * Splits text into meaningful lowercase tokens for deterministic grading.
 * Splits camelCase (setInterval -> set + interval), snake_case, and
 * non-alphanumeric boundaries; drops stopwords and single characters.
 */
export function tokenizeText(text: string): string[] {
  const camelSplit = text.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return camelSplit
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

/**
 * Deterministic token-overlap similarity between a user explanation and the
 * canonical text: |user ∩ canonical| / |canonical|. Returns 0 for empty
 * canonical input.
 */
export function overlapScore(userText: string, canonicalText: string): number {
  const canonicalTokens = new Set(tokenizeText(canonicalText));
  if (canonicalTokens.size === 0) {
    return 0;
  }
  const userTokens = new Set(tokenizeText(userText));
  if (userTokens.size === 0) {
    return 0;
  }
  let matches = 0;
  for (const token of userTokens) {
    if (canonicalTokens.has(token)) {
      matches += 1;
    }
  }
  return matches / canonicalTokens.size;
}
