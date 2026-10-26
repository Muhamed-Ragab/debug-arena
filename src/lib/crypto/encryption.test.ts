import { describe, expect, it } from "vitest";
import { decryptApiKey, encryptApiKey, maskApiKey } from "./encryption";

describe("AES-256-GCM Encryption Utility", () => {
  const testSecret = "test-secret-at-least-32-characters-long!";
  const sampleKey = "sk-ant-api03-abcdef1234567890abcdef1234567890";

  it("encrypts and decrypts an API key successfully with default secret", () => {
    const encrypted = encryptApiKey(sampleKey);
    expect(encrypted).not.toBe(sampleKey);
    expect(encrypted.split(":")).toHaveLength(3);

    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(sampleKey);
  });

  it("encrypts and decrypts with an explicit custom secret", () => {
    const encrypted = encryptApiKey(sampleKey, testSecret);
    const decrypted = decryptApiKey(encrypted, testSecret);
    expect(decrypted).toBe(sampleKey);
  });

  it("produces unique ciphertexts for the same plaintext due to random IV", () => {
    const enc1 = encryptApiKey(sampleKey, testSecret);
    const enc2 = encryptApiKey(sampleKey, testSecret);
    expect(enc1).not.toBe(enc2);

    expect(decryptApiKey(enc1, testSecret)).toBe(sampleKey);
    expect(decryptApiKey(enc2, testSecret)).toBe(sampleKey);
  });

  it("fails decryption when an incorrect secret is provided", () => {
    const encrypted = encryptApiKey(sampleKey, testSecret);
    const wrongSecret = "wrong-secret-at-least-32-characters-long!";
    expect(() => decryptApiKey(encrypted, wrongSecret)).toThrow();
  });

  it("fails decryption when payload is malformed", () => {
    expect(() => decryptApiKey("malformed-payload")).toThrow(
      /Invalid encrypted payload format/
    );
    expect(() => decryptApiKey("a:b", testSecret)).toThrow(
      /Invalid encrypted payload format/
    );
  });

  it("fails decryption when ciphertext or tag is tampered with", () => {
    const encrypted = encryptApiKey(sampleKey, testSecret);
    const [iv, ciphertext, tag] = encrypted.split(":");
    // Tamper with ciphertext
    const tamperedCiphertext =
      ciphertext.slice(0, -2) + (ciphertext.slice(-2) === "00" ? "ff" : "00");
    const tampered = `${iv}:${tamperedCiphertext}:${tag}`;
    expect(() => decryptApiKey(tampered, testSecret)).toThrow();
  });

  describe("maskApiKey", () => {
    it("masks typical long API keys showing prefix and suffix", () => {
      const masked = maskApiKey("sk-ant-api03-abcdef1234567890abcdef4a2b");
      expect(masked).toContain("...");
      expect(masked.startsWith("sk-ant")).toBe(true);
      expect(masked.endsWith("4a2b")).toBe(true);
      expect(masked).not.toContain("abcdef1234567890");
    });

    it("handles short API keys gracefully", () => {
      expect(maskApiKey("12345")).toBe("*****");
      expect(maskApiKey("")).toBe("");
    });

    it("masks moderate keys of length 10-12 cleanly", () => {
      const masked = maskApiKey("gsk_12345678");
      expect(masked).toBe("gsk_...5678");
    });
  });
});
