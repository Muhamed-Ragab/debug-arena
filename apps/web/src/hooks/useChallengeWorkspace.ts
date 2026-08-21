import { useState } from "react";
import type { RightTab } from "../lib/types";

export interface ChallengeWorkspace {
  selectedLine: number | null;
  rightTab: RightTab;
  explanation: string;
  hintsOpen: number[];
  isSubmitting: boolean;
  treeOpen: boolean;
  setRightTab: (t: RightTab) => void;
  setExplanation: (v: string) => void;
  setTreeOpen: (v: boolean) => void;
  toggleLine: (n: number) => void;
  toggleHint: (i: number) => void;
  submit: () => void;
}

const SUBMIT_DELAY_MS = 2800;

export function useChallengeWorkspace(onSubmitted: () => void): ChallengeWorkspace {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("explain");
  const [explanation, setExplanation] = useState("");
  const [hintsOpen, setHintsOpen] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [treeOpen, setTreeOpen] = useState(true);

  const toggleLine = (n: number) =>
    setSelectedLine((prev) => (prev === n ? null : n));

  const toggleHint = (i: number) =>
    setHintsOpen((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const submit = () => {
    if (!selectedLine || isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSubmitted();
    }, SUBMIT_DELAY_MS);
  };

  return {
    selectedLine,
    rightTab,
    explanation,
    hintsOpen,
    isSubmitting,
    treeOpen,
    setRightTab,
    setExplanation,
    setTreeOpen,
    toggleLine,
    toggleHint,
    submit,
  };
}
