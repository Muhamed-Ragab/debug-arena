/**
 * Shared helper to flatten next-safe-action validationErrors into
 * Record<string,string|undefined> for inline field rendering.
 * Handles both shapes observed:
 *  - flattened: { fieldErrors: Record<string,string[]>, formErrors: string[] }
 *  - default: { field: { _errors: string[] }, _errors?: string[] }
 * Returns curated Zod messages only — no raw error objects leaked.
 */
function getFirstString(value: unknown): string | undefined {
  if (Array.isArray(value) && typeof value[0] === "string" && value[0]) {
    return value[0] as string;
  }
  return undefined;
}

function extractFlattenedFieldErrors(
  fieldErrors: Record<string, unknown>,
  out: Record<string, string | undefined>
): void {
  for (const [k, v] of Object.entries(fieldErrors)) {
    const first = getFirstString(v);
    if (first) {
      out[k] = first;
    }
  }
}

function extractFlattenedFormErrors(
  ve: Record<string, unknown>,
  out: Record<string, string | undefined>
): void {
  if (out._errors) {
    return;
  }
  const formFirst = Array.isArray(ve.formErrors)
    ? (ve.formErrors as unknown[]).find((x) => typeof x === "string" && x)
    : undefined;
  if (typeof formFirst === "string") {
    out._errors = formFirst;
    return;
  }
  const topFirst = getFirstString(ve._errors);
  if (topFirst) {
    out._errors = topFirst;
  }
}

function handleFlattenedShape(
  ve: Record<string, unknown>
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  const fe = ve.fieldErrors as Record<string, unknown>;
  extractFlattenedFieldErrors(fe, out);
  extractFlattenedFormErrors(ve, out);
  return out;
}

function handleDefaultShape(
  ve: Record<string, unknown>
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(ve)) {
    if (k === "_errors") {
      const first = getFirstString(v);
      if (first) {
        out._errors = first;
      }
      continue;
    }
    if (
      v &&
      typeof v === "object" &&
      "_errors" in (v as Record<string, unknown>)
    ) {
      const errs = (v as Record<string, unknown>)._errors;
      const first = getFirstString(errs);
      if (first) {
        out[k] = first;
      }
      continue;
    }
    const direct = getFirstString(v);
    if (direct) {
      out[k] = direct;
    }
  }
  return out;
}

export function flattenValidationErrors(
  validationErrors: unknown
): Record<string, string | undefined> {
  if (!validationErrors || typeof validationErrors !== "object") {
    return {};
  }
  const ve = validationErrors as Record<string, unknown>;
  if (ve.fieldErrors && typeof ve.fieldErrors === "object") {
    return handleFlattenedShape(ve);
  }
  return handleDefaultShape(ve);
}

export function getFirstValidationMessage(
  flat: Record<string, string | undefined>
): string | null {
  const preferred = [
    "rootCauseExplanation",
    "localizationLines",
    "title",
    "prompt",
    "slug",
    "name",
    "displayName",
    "username",
    "bio",
    "avatarUrl",
    "challengeId",
  ];
  for (const key of preferred) {
    if (flat[key]) {
      return flat[key] as string;
    }
  }
  if (flat._errors) {
    return flat._errors as string;
  }
  const [first] = Object.values(flat);
  return first ?? null;
}
