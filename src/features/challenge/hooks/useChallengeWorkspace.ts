"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitChallengeAction } from "../actions";
import type { RightTab } from "../types";

export interface ChallengeWorkspace {
  clearLines: () => void;
  error: string | null;
  explanation: string;
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
  };

  const clearLines = () => {
    setSelectedLines([]);
    setLastClickedLine(null);
  };

  const toggleHint = (i: number) =>
    setHintsOpen((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );

  const submit = async () => {
    if (selectedLines.length === 0 || isSubmitting) {
      return;
    }

    if (!explanation.trim()) {
      setRightTab("explain");
      setError(
        "Please write an explanation of the root cause before submitting."
      );
      return;
    }

    if (!challengeId) {
      // Mock navigation if no real ID
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        if (onSubmitted) {
          onSubmitted("mock-id");
        } else {
          router.push("/challenges");
        }
      }, 1500);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await submitChallengeAction({
        challengeId,
        hintsRevealedCount: hintsOpen.length,
        localizationLines: selectedLines,
        rootCauseExplanation: explanation,
        solutionExplanation: solution,
      });

      if (response?.data?.submissionId) {
        const subId = response.data.submissionId;
        if (onSubmitted) {
          onSubmitted(subId);
        } else {
          router.push(
            `/submissions/${subId}/results` as unknown as Parameters<
              typeof router.push
            >[0]
          );
        }
      } else if (response?.serverError) {
        setError(response.serverError);
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
    hintsOpen,
    isSubmitting,
    rightTab,
    selectedLine,
    selectedLines,
    setExplanation,
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
