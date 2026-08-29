"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  explanation: string;
  fieldErrors?: {
    rootCauseExplanation?: string[];
  } | null;
  setExplanation: (v: string) => void;
  setSolution?: (v: string) => void;
  solution?: string;
}

export function ExplainPanel({
  explanation,
  fieldErrors,
  setExplanation,
  setSolution,
  solution = "",
}: Props) {
  const t = useTranslations();
  const rootCauseError = fieldErrors?.rootCauseExplanation?.[0];

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      <div className="flex flex-col gap-1.5">
        <Label
          className="font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-wider"
          htmlFor="root-cause-input"
        >
          {t("challenge.explainPanel.rootCauseTitle")}
        </Label>
        <p className="text-[11.5px] text-muted-foreground leading-relaxed">
          {t("challenge.explainPanel.rootCauseDescription")}
        </p>
        <Textarea
          aria-invalid={Boolean(rootCauseError)}
          className={cn(
            "min-h-35 bg-card p-3 text-[13px] leading-relaxed",
            rootCauseError &&
              "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30"
          )}
          id="root-cause-input"
          onChange={(e) => setExplanation(e.target.value)}
          placeholder={t("challenge.explainPanel.rootCausePlaceholder")}
          value={explanation}
        />
        {rootCauseError ? (
          <p className="font-medium text-[12px] text-destructive" role="alert">
            {t(rootCauseError as string)}
          </p>
        ) : null}
      </div>

      {/* 2. Proposed Solution / Fix */}
      <div className="flex flex-col gap-1.5">
        <Label
          className="font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-wider"
          htmlFor="solution-input"
        >
          {t("challenge.explainPanel.solutionTitle")}
        </Label>
        <p className="text-[11.5px] text-muted-foreground leading-relaxed">
          {t("challenge.explainPanel.solutionDescription")}
        </p>
        <Textarea
          className="min-h-35 bg-card p-3 text-[13px] leading-relaxed"
          id="solution-input"
          onChange={(e) => setSolution?.(e.target.value)}
          placeholder={t("challenge.explainPanel.solutionPlaceholder")}
          value={solution}
        />
      </div>
    </div>
  );
}
