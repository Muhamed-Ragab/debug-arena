import crypto from "node:crypto";
import { env } from "@/lib/env/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommended for GCM

function deriveKey(secret?: string): Buffer {
  const secretKey = secret ?? env.AI_ENCRYPTION_SECRET;
  if (!secretKey) {
    throw new Error("AI_ENCRYPTION_SECRET must be configured");
  }
  return crypto.createHash("sha256").update(secretKey).digest();
}

/**
 * Encrypts a plaintext API key using AES-256-GCM.
 * Output format: `ivHex:ciphertextHex:tagHex`
 */
export function encryptApiKey(plaintext: string, secret?: string): string {
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(plaintext, "utf8", "hex");
  ciphertext += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${ciphertext}:${tag.toString("hex")}`;
}

/**
 * Decrypts an AES-256-GCM encrypted payload (`ivHex:ciphertextHex:tagHex`).
 */
export function decryptApiKey(encrypted: string, secret?: string): string {
  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    throw new Error(
      "Invalid encrypted payload format: expected iv:ciphertext:tag"
    );
  }

  const [ivHex, ciphertextHex, tagHex] = parts;
  if (!(ivHex && ciphertextHex && tagHex)) {
    throw new Error(
      "Invalid encrypted payload format: empty component detected"
    );
  }

  const key = deriveKey(secret);
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Masks an API key for safe display in UI/logs.
 * Never exposes the full secret; only shows prefix and suffix.
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey) {
    return "";
  }
  if (apiKey.length <= 8) {
    return "*".repeat(apiKey.length);
  }
  if (apiKey.length < 16) {
    return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
  }
  return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
}
