"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitChallengeAction } from "../actions";
import type { RightTab } from "../types";

export interface FieldErrors {
  _errors?: string[];
  challengeId?: string[];
  localizationLines?: string[];
  rootCauseExplanation?: string[];
}

export interface ChallengeWorkspace {
  clearLines: () => void;
  error: string | null;
  explanation: string;
  fieldErrors: FieldErrors | null;
  hintsOpen: number[];
  isSubmitting: boolean;
  rightTab: RightTab;
  selectedLine: number | null;
  selectedLines: number[];
  setExplanation: (v: string) => void;
  setRightTab: (t: RightTab) => void;
  setSolution: (v: string) => void;
  setTreeOpen: (v: boolean) => void;
  solution: string;
  submit: () => Promise<void>;
  toggleHint: (i: number) => void;
  toggleLine: (n: number, isShift?: boolean) => void;
  treeOpen: boolean;
}

function parseFlattenedErrors(ve: Record<string, unknown>): FieldErrors | null {
  const fe = ve.fieldErrors as Record<string, unknown>;
  const out: FieldErrors = {};
  for (const [k, v] of Object.entries(fe)) {
    if (Array.isArray(v)) {
      (out as Record<string, string[]>)[k] = v as string[];
    }
  }
  if (Array.isArray(ve.formErrors) && (ve.formErrors as string[]).length > 0) {
    out._errors = ve.formErrors as string[];
  }
  return Object.keys(out).length > 0 ? out : null;
}

function parseDefaultErrors(ve: Record<string, unknown>): FieldErrors | null {
  const out: FieldErrors = {};
  for (const [k, v] of Object.entries(ve)) {
    if (k === "_errors" && Array.isArray(v)) {
      out._errors = v as string[];
      continue;
    }
    const maybe = v as Record<string, unknown> | null;
    if (maybe && typeof maybe === "object" && "_errors" in maybe) {
      const errs = maybe._errors;
      if (Array.isArray(errs) && errs.length > 0) {
        (out as Record<string, string[]>)[k] = errs as string[];
      }
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

function extractFieldErrors(validationErrors: unknown): FieldErrors | null {
  if (!validationErrors || typeof validationErrors !== "object") {
    return null;
  }
  const ve = validationErrors as Record<string, unknown>;
  if (ve.fieldErrors && typeof ve.fieldErrors === "object") {
    return parseFlattenedErrors(ve);
  }
  return parseDefaultErrors(ve);
}

function getFirstValidationMessage(fe: FieldErrors): string {
  if (fe.rootCauseExplanation && fe.rootCauseExplanation.length > 0) {
    return fe.rootCauseExplanation[0];
  }
  if (fe.localizationLines && fe.localizationLines.length > 0) {
    return fe.localizationLines[0];
  }
  if (fe.challengeId && fe.challengeId.length > 0) {
    return fe.challengeId[0];
  }
  if (fe._errors && fe._errors.length > 0) {
    return fe._errors[0];
  }
  return "Validation failed. Please check your inputs.";
}

export function useChallengeWorkspace(
  challengeId?: string,
  onSubmitted?: (submissionId: string) => void
): ChallengeWorkspace {
  const router = useRouter();
  const [selectedLines, setSelectedLines] = useState<number[]>([]);
  const [lastClickedLine, setLastClickedLine] = useState<number | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("explain");
  const [explanation, setExplanation] = useState("");
  const [solution, setSolution] = useState("");
  const [hintsOpen, setHintsOpen] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);
  const [treeOpen, setTreeOpen] = useState(true);

  const selectedLine = selectedLines.length > 0 ? selectedLines[0] : null;

  const toggleLine = (n: number, isShift?: boolean) => {
    setSelectedLines((prev) => {
      if (isShift && lastClickedLine !== null) {
        const start = Math.min(lastClickedLine, n);
        const end = Math.max(lastClickedLine, n);
        const range: number[] = [];
        for (let i = start; i <= end; i += 1) {
          range.push(i);
        }
        const set = new Set([...prev, ...range]);
        return Array.from(set).sort((a, b) => a - b);
      }

      if (prev.includes(n)) {
        return prev.filter((x) => x !== n);
      }
      return [...prev, n].sort((a, b) => a - b);
    });

    setLastClickedLine(n);
    if (fieldErrors?.localizationLines) {
      setFieldErrors((prev) => {
        if (!prev) {
          return prev;
        }
        const { localizationLines: _omit, ...rest } = prev;
        return Object.keys(rest).length > 0 ? (rest as FieldErrors) : null;
      });
    }
  };

  const clearLines = () => {
    setSelectedLines([]);
    setLastClickedLine(null);
  };

  const toggleHint = (i: number) =>
    setHintsOpen((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );

  const handleExplanationChange = (v: string) => {
    setExplanation(v);
    if (fieldErrors?.rootCauseExplanation) {
      setFieldErrors((prev) => {
        if (!prev) {
          return prev;
        }
        const { rootCauseExplanation: _omit, ...rest } = prev;
        return Object.keys(rest).length > 0 ? (rest as FieldErrors) : null;
      });
    }
  };

  const buildClientFieldErrors = (): FieldErrors | null => {
    const next: FieldErrors = {};
    let hasError = false;
    if (selectedLines.length === 0) {
      next.localizationLines = [
        "Select at least one buggy line in the code viewer",
      ];
      hasError = true;
    }
    const trimmed = explanation.trim();
    if (!trimmed) {
      next.rootCauseExplanation = [
        "Please write an explanation of the root cause before submitting.",
      ];
      hasError = true;
    } else if (trimmed.length < 5) {
      next.rootCauseExplanation = [
        "Root cause explanation must be at least 5 characters",
      ];
      hasError = true;
    }
    return hasError ? next : null;
  };

  const getFirstClientMessage = (fe: FieldErrors): string => {
    if (fe.localizationLines && fe.localizationLines.length > 0) {
      return fe.localizationLines[0];
    }
    if (fe.rootCauseExplanation && fe.rootCauseExplanation.length > 0) {
      return fe.rootCauseExplanation[0];
    }
    return "Please fix validation errors";
  };

  const handleMockSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (onSubmitted) {
        onSubmitted("mock-id");
      } else {
        router.push("/challenges");
      }
    }, 1500);
  };

  const handleServerResponse = (response: unknown): boolean => {
    const typed = response as {
      data?: { submissionId?: string };
      serverError?: string;
      validationErrors?: unknown;
    };
    if (typed.data?.submissionId) {
      const subId = typed.data.submissionId;
      if (onSubmitted) {
        onSubmitted(subId);
      } else {
        router.push(
          `/submissions/${subId}/results` as unknown as Parameters<
            typeof router.push
          >[0]
        );
      }
      return true;
    }
    const ve = typed.validationErrors;
    if (ve) {
      const parsed = extractFieldErrors(ve);
      if (parsed) {
        setFieldErrors(parsed);
        setError(getFirstValidationMessage(parsed));
        setRightTab("explain");
        return true;
      }
    }
    if (typed.serverError) {
      setError(typed.serverError);
      return true;
    }
    return false;
  };

  const submit = async () => {
    if (isSubmitting) {
      return;
    }
    const clientErrors = buildClientFieldErrors();
    if (clientErrors) {
      setFieldErrors(clientErrors);
      setRightTab("explain");
      setError(getFirstClientMessage(clientErrors));
      return;
    }
    if (!challengeId) {
      handleMockSubmit();
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setFieldErrors(null);
    try {
      const response = await submitChallengeAction({
        challengeId,
        hintsRevealedCount: hintsOpen.length,
        localizationLines: selectedLines,
        rootCauseExplanation: explanation,
        solutionExplanation: solution,
      });
      const handled = handleServerResponse(response);
      if (!handled) {
        setError("Failed to submit challenge. Please try again.");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to submit challenge";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    clearLines,
    error,
    explanation,
    fieldErrors,
    hintsOpen,
    isSubmitting,
    rightTab,
    selectedLine,
    selectedLines,
    setExplanation: handleExplanationChange,
    setRightTab,
    setSolution,
    setTreeOpen,
    solution,
    submit,
    toggleHint,
    toggleLine,
    treeOpen,
  };
}
