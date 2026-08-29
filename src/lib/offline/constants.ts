export const OFFLINE_CODES = new Set<string>([
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EHOSTUNREACH",
  "ECONNRESET",
  "EAI_AGAIN",
  "57P01",
]);

export const OFFLINE_MESSAGE =
  "Service temporarily unavailable. Please try again.";
