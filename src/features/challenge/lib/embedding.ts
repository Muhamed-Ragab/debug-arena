import { createHash } from "node:crypto";
import { EMBEDDING_DIM } from "@/db/schema/roles";

const NORMALIZE_REGEX = /[^a-z0-9_\s]/g;
const SPLIT_WORDS_REGEX = /\s+/;

/**
 * Computes a deterministic pseudo-embedding vector of unit length for offline/development/testing use.
 * Hashes character n-grams and maps tokens to vector dimensions with tf-idf-like weighting.
 */
export function generateDeterministicEmbedding(
  text: string,
  dim: number = EMBEDDING_DIM
): number[] {
  const vector = new Array<number>(dim).fill(0);
  const normalized = text.toLowerCase().replace(NORMALIZE_REGEX, " ");
  const words = normalized.split(SPLIT_WORDS_REGEX).filter(Boolean);

  if (words.length === 0) {
    vector[0] = 1.0;
    return vector;
  }

  // 1. Single word hashing
  for (const word of words) {
    const hash = createHash("sha256").update(word).digest();
    const index = hash.readUInt16BE(0) % dim;
    const sign = hash[2] % 2 === 0 ? 1 : -1;
    vector[index] += sign * (1 + Math.log(word.length));
  }

  // 2. Bigram hashing for word order / context
  for (let i = 0; i < words.length - 1; i += 1) {
    const bigram = `${words[i]}_${words[i + 1]}`;
    const hash = createHash("sha256").update(bigram).digest();
    const index = hash.readUInt16BE(0) % dim;
    const sign = hash[2] % 2 === 0 ? 1 : -1;
    vector[index] += sign * 1.5;
  }

  // 3. Normalize vector to unit length (L2 norm)
  let sumSquares = 0;
  for (let i = 0; i < dim; i += 1) {
    sumSquares += vector[i] * vector[i];
  }

  const magnitude = Math.sqrt(sumSquares);
  if (magnitude === 0) {
    vector[0] = 1.0;
    return vector;
  }

  for (let i = 0; i < dim; i += 1) {
    vector[i] /= magnitude;
  }

  return vector;
}

/**
 * Calculates cosine similarity between two unit-normalized vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }
  let dotProduct = 0;
  for (let i = 0; i < a.length; i += 1) {
    dotProduct += a[i] * b[i];
  }
  return Math.max(0, Math.min(1, dotProduct));
}
