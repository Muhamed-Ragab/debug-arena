"use client";

import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  fieldErrors?: {
    localizationLines?: string[];
  } | null;
  fileName?: string;
  isSubmitting: boolean;
  onSubmit: () => void;
  selectedLine?: number | null;
  selectedLines?: number[];
}

export function SubmitBar({
  fieldErrors,
  fileName = "main.ts",
  isSubmitting,
  onSubmit,
  selectedLine,
  selectedLines,
}: Props) {
  const t = useTranslations();
  let activeLines: number[] = [];
  if (Array.isArray(selectedLines)) {
    activeLines = selectedLines;
  } else if (selectedLine !== null && selectedLine !== undefined) {
    activeLines = [selectedLine];
  }

  const localizationError = fieldErrors?.localizationLines?.[0];
  const disabled = isSubmitting;

  const getLineSummary = () => {
    if (activeLines.length === 0) {
      return t("challenge.submitBar.selectLines");
    }
    if (activeLines.length === 1) {
      return t("challenge.submitBar.singleLine", {
        file: fileName,
        line: activeLines[0],
      });
    }
    if (activeLines.length <= 3) {
      return t("challenge.submitBar.multiLines", {
        file: fileName,
        lines: activeLines.join(", "),
      });
    }
    return t("challenge.submitBar.countLines", {
      count: activeLines.length,
      file: fileName,
    });
  };

  return (
    <div className="border-border border-t bg-card/60 p-4">
      <p
        className={cn(
          "mb-2 truncate font-mono text-[11px]",
          localizationError
            ? "font-medium text-destructive"
            : "text-muted-foreground"
        )}
      >
        {localizationError ? t(localizationError as string) : getLineSummary()}
      </p>
      <Button
        className="flex w-full items-center justify-center gap-2 rounded py-2.5 font-medium text-[13px] transition-all"
        disabled={disabled}
        onClick={onSubmit}
      >
        {isSubmitting ? (
          <>
            <span className="h-3 w-3 flex-shrink-0 animate-spin rounded-full border border-primary-foreground border-t-transparent" />
            {t("challenge.submitBar.running")}
          </>
        ) : (
          <>
            <Send size={13} />
            {t("challenge.submitBar.submit")}
          </>
        )}
      </Button>
    </div>
  );
}
