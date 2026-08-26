import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitChallengeAction } from "../actions";
import type { RightTab } from "../types";

export interface ChallengeWorkspace {
  error: string | null;
  explanation: string;
  hintsOpen: number[];
  isSubmitting: boolean;
  rightTab: RightTab;
  selectedLine: number | null;
  setExplanation: (v: string) => void;
  setRightTab: (t: RightTab) => void;
  setTreeOpen: (v: boolean) => void;
  submit: () => Promise<void>;
  toggleHint: (i: number) => void;
  toggleLine: (n: number) => void;
  treeOpen: boolean;
}

export function useChallengeWorkspace(
  challengeId?: string,
  onSubmitted?: (submissionId: string) => void
): ChallengeWorkspace {
  const router = useRouter();
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("explain");
  const [explanation, setExplanation] = useState("");
  const [hintsOpen, setHintsOpen] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [treeOpen, setTreeOpen] = useState(true);

  const toggleLine = (n: number) =>
    setSelectedLine((prev) => (prev === n ? null : n));

  const toggleHint = (i: number) =>
    setHintsOpen((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );

  const submit = async () => {
    if (!selectedLine || isSubmitting) {
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
        localizationLine: selectedLine,
        rootCauseExplanation: explanation,
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
    error,
    explanation,
    hintsOpen,
    isSubmitting,
    rightTab,
    selectedLine,
    setExplanation,
    setRightTab,
    setTreeOpen,
    submit,
    toggleHint,
    toggleLine,
    treeOpen,
  };
}
