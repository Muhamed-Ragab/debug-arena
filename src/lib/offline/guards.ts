export function hasCode(value: unknown): boolean {
  if (typeof value === "object" && value !== null && "code" in value) {
    const { code } = value as { code: unknown };
    return typeof code === "string";
  }
  return false;
}

export function getErrorCode(value: unknown): string | undefined {
  if (typeof value === "object" && value !== null && "code" in value) {
    const { code } = value as { code: unknown };
    if (typeof code === "string") {
      return code;
    }
  }
  return undefined;
}

export function getCause(value: unknown): unknown {
  if (typeof value === "object" && value !== null && "cause" in value) {
    const { cause } = value as { cause: unknown };
    return cause;
  }
  return undefined;
}
