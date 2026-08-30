"use client";

import { Send } from "lucide-react";
import { useExtracted } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  disabled?: boolean;
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
  disabled = false,
}: Props) {
  const t = useExtracted();
  let activeLines: number[] = [];
  if (Array.isArray(selectedLines)) {
    activeLines = selectedLines;
  } else if (selectedLine !== null && selectedLine !== undefined) {
    activeLines = [selectedLine];
  }

  const localizationError = fieldErrors?.localizationLines?.[0];
  const isDisabled = isSubmitting || disabled;

  const getLineSummary = () => {
    if (activeLines.length === 0) {
      return t("Select bug line(s) to submit");
    }
    if (activeLines.length === 1) {
      return t("Bug localized at Line {line} · {file}", {
        file: fileName,
        line: String(activeLines[0]),
      });
    }
    if (activeLines.length <= 3) {
      return t("Bug localized at Lines {lines} · {file}", {
        file: fileName,
        lines: activeLines.join(", "),
      });
    }
    return t("{count} lines localized · {file}", {
      count: String(activeLines.length),
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
        {localizationError ? localizationError : getLineSummary()}
      </p>
      <Button
        className="flex w-full items-center justify-center gap-2 rounded py-2.5 font-medium text-[13px] transition-all"
        disabled={isDisabled}
        onClick={onSubmit}
      >
        {isSubmitting ? (
          <>
            <span className="h-3 w-3 flex-shrink-0 animate-spin rounded-full border border-primary-foreground border-t-transparent" />
            {t("Running tests & AI analysis...")}
          </>
        ) : (
          <>
            <Send size={13} />
            {t("Submit diagnosis & fix")}
          </>
        )}
      </Button>
    </div>
  );
}
