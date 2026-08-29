/**
 * Shared helper to flatten next-safe-action validationErrors into
 * Record<string,string|undefined> for inline field rendering.
 * Handles both shapes observed:
 *  - flattened: { fieldErrors: Record<string,string[]>, formErrors: string[] }
 *  - default: { field: { _errors: string[] }, _errors?: string[] }
 * Returns curated Zod messages only — no raw error objects leaked.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: handles two validationErrors shapes intentionally
export function flattenValidationErrors(
  validationErrors: unknown
): Record<string, string | undefined> {
  if (!validationErrors || typeof validationErrors !== "object") {
    return {};
  }
  const ve = validationErrors as Record<string, unknown>;

  // Shape A: flattened via z.flatten() style { fieldErrors, formErrors }
  if (ve.fieldErrors && typeof ve.fieldErrors === "object") {
    const out: Record<string, string | undefined> = {};
    const fe = ve.fieldErrors as Record<string, unknown>;
    for (const [k, v] of Object.entries(fe)) {
      if (Array.isArray(v) && typeof v[0] === "string" && v[0]) {
        out[k] = v[0] as string;
      }
    }
    if (Array.isArray(ve.formErrors) && ve.formErrors.length > 0) {
      const first = (ve.formErrors as unknown[]).find(
        (x) => typeof x === "string" && x
      );
      if (typeof first === "string") {
        out._errors = first;
      }
    }
    // also handle top-level _errors if present alongside flattened
    if (
      !out._errors &&
      Array.isArray(ve._errors) &&
      ve._errors.length > 0 &&
      typeof ve._errors[0] === "string"
    ) {
      out._errors = ve._errors[0] as string;
    }
    return out;
  }

  // Shape B: default next-safe-action { field: { _errors: string[] } }
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(ve)) {
    if (k === "_errors" && Array.isArray(v) && typeof v[0] === "string") {
      out._errors = v[0] as string;
      continue;
    }
    if (
      v &&
      typeof v === "object" &&
      "_errors" in (v as Record<string, unknown>)
    ) {
      const errs = (v as Record<string, unknown>)._errors;
      if (Array.isArray(errs) && typeof errs[0] === "string" && errs[0]) {
        out[k] = errs[0] as string;
      }
    } else if (Array.isArray(v) && typeof v[0] === "string" && v[0]) {
      // fallback: direct string[] value
      out[k] = v[0] as string;
    }
  }
  return out;
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
