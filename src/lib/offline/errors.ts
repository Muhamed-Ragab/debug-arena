import { OFFLINE_CODES, OFFLINE_MESSAGE } from "./constants";
import { getCause, getErrorCode } from "./guards";

export class OfflineError extends Error {
  status = 503;
  code?: string;

  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "OfflineError";
  }
}

const MAX_CAUSE_DEPTH = 4;

function isOfflineMessage(message: string): boolean {
  return /fetch failed|getaddrinfo|enotfound|econnrefused|econnreset|etimedout|maxretriesperrequest|maxretries|connection terminated|read econnreset/i.test(
    message,
  );
}

function getMessage(value: unknown): string | undefined {
  if (value instanceof Error) {
    const { message } = value;
    return message;
  }
  if (typeof value === "object" && value !== null && "message" in value) {
    const { message } = value as { message: unknown };
    if (typeof message === "string") {
      return message;
    }
  }
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

function hasOfflineCode(value: unknown): boolean {
  const code = getErrorCode(value);
  return code !== undefined && OFFLINE_CODES.has(code);
}

function hasOfflineMessage(value: unknown): boolean {
  const msg = getMessage(value);
  return msg !== undefined && isOfflineMessage(msg);
}

export function isOfflineCause(err: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = err;
  for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth += 1) {
    if (current === null || current === undefined) {
      break;
    }
    if (seen.has(current)) {
      break;
    }
    seen.add(current);
    if (hasOfflineCode(current) || hasOfflineMessage(current)) {
      return true;
    }
    const next = getCause(current);
    if (next === undefined || next === null) {
      break;
    }
    if (next === current) {
      break;
    }
    current = next;
  }
  return false;
}

export function isOfflineError(err: unknown): boolean {
  if (err instanceof OfflineError) {
    return true;
  }
  return isOfflineCause(err);
}

export function toOfflineError(
  err: unknown,
  fallbackMsg?: string,
): OfflineError {
  const offline = isOfflineCause(err);
  let message: string;
  if (offline) {
    message = OFFLINE_MESSAGE;
  } else if (err instanceof Error) {
    const { message: errMessage } = err;
    if (typeof errMessage === "string" && errMessage.length > 0) {
      message = errMessage;
    } else if (typeof fallbackMsg === "string" && fallbackMsg.length > 0) {
      message = fallbackMsg;
    } else {
      message = OFFLINE_MESSAGE;
    }
  } else if (typeof err === "string" && err.length > 0) {
    message = err;
  } else if (typeof fallbackMsg === "string" && fallbackMsg.length > 0) {
    message = fallbackMsg;
  } else {
    message = OFFLINE_MESSAGE;
  }

  const result = new OfflineError(message, { cause: err as Error });
  const code = getErrorCode(err);
  if (code !== undefined) {
    result.code = code;
  }
  if (result.code === undefined) {
    const cause = getCause(err);
    const causeCode = getErrorCode(cause);
    if (causeCode !== undefined) {
      result.code = causeCode;
    }
  }
  return result;
}
