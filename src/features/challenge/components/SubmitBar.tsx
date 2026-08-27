import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  fileName?: string;
  isSubmitting: boolean;
  onSubmit: () => void;
  selectedLine?: number | null;
  selectedLines?: number[];
}

export function SubmitBar({
  selectedLine,
  selectedLines,
  isSubmitting,
  onSubmit,
  fileName = "main.ts",
}: Props) {
  let activeLines: number[] = [];
  if (Array.isArray(selectedLines)) {
    activeLines = selectedLines;
  } else if (selectedLine !== null && selectedLine !== undefined) {
    activeLines = [selectedLine];
  }

  const disabled = activeLines.length === 0 || isSubmitting;

  const getLineSummary = () => {
    if (activeLines.length === 0) {
      return "Select bug line(s) to submit";
    }
    if (activeLines.length === 1) {
      return `Bug localized at Line ${activeLines[0]} · ${fileName}`;
    }
    if (activeLines.length <= 3) {
      return `Bug localized at Lines ${activeLines.join(", ")} · ${fileName}`;
    }
    return `${activeLines.length} lines localized · ${fileName}`;
  };

  return (
    <div className="border-border border-t bg-card/60 p-4">
      <p className="mb-2 truncate font-mono text-[11px] text-muted-foreground">
        {getLineSummary()}
      </p>
      <Button
        className="flex w-full items-center justify-center gap-2 rounded py-2.5 font-medium text-[13px] transition-all"
        disabled={disabled}
        onClick={onSubmit}
      >
        {isSubmitting ? (
          <>
            <span className="h-3 w-3 flex-shrink-0 animate-spin rounded-full border border-primary-foreground border-t-transparent" />
            Running tests & AI analysis...
          </>
        ) : (
          <>
            <Send size={13} />
            Submit diagnosis & fix
          </>
        )}
      </Button>
    </div>
  );
}
