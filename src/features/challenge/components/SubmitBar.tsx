"use client";

import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  activeModel?: string;
  activeProvider?: string;
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

function getModelBadgeLabel(model?: string, provider?: string): string {
  if (provider && provider !== "platform") {
    if (model?.includes("claude")) {
      return "Claude";
    }
    if (model?.includes("gpt-4o")) {
      return "GPT-4o";
    }
    if (model?.includes("gemini")) {
      return "Gemini";
    }
    if (model?.includes("llama")) {
      return "Llama";
    }
    return model || "BYOK";
  }
  return "Platform AI";
}

export function SubmitBar({
  fieldErrors,
  fileName = "main.ts",
  isSubmitting,
  onSubmit,
  selectedLine,
  selectedLines,
  disabled = false,
  activeModel,
  activeProvider,
}: Props) {
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
      return "Select bug line(s) to submit";
    }
    if (activeLines.length === 1) {
      return `Bug localized at Line ${String(activeLines[0])} · ${fileName}`;
    }
    if (activeLines.length <= 3) {
      return `Bug localized at Lines ${activeLines.join(", ")} · ${fileName}`;
    }
    return `${String(activeLines.length)} lines localized · ${fileName}`;
  };

  return (
    <div className="border-border border-t bg-card/60 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p
          className={cn(
            "truncate font-mono text-[11px]",
            localizationError
              ? "font-medium text-destructive"
              : "text-muted-foreground"
          )}
        >
          {localizationError ? localizationError : getLineSummary()}
        </p>
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
          title={`Active Evaluator: ${activeModel || "Platform Evaluator"}`}
        >
          <Sparkles className="h-3 w-3 text-primary" />
          {getModelBadgeLabel(activeModel, activeProvider)}
        </span>
      </div>
      <Button
        className="flex w-full items-center justify-center gap-2 rounded py-2.5 font-medium text-[13px] transition-all"
        disabled={isDisabled}
        onClick={onSubmit}
      >
        {isSubmitting ? (
          <>
            <span className="h-3 w-3 flex-shrink-0 animate-spin rounded-full border border-primary-foreground border-t-transparent" />
            {"Running tests & AI analysis..."}
          </>
        ) : (
          <>
            <Send size={13} />
            {"Submit diagnosis & fix"}
          </>
        )}
      </Button>
    </div>
  );
}
