import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  isSubmitting: boolean;
  onSubmit: () => void;
  selectedLine: number | null;
}

export function SubmitBar({ selectedLine, isSubmitting, onSubmit }: Props) {
  const disabled = !selectedLine || isSubmitting;

  return (
    <div className="border-border border-t bg-card/60 p-4">
      {Boolean(selectedLine) && (
        <p className="mb-2 font-mono text-[11px] text-muted-foreground">
          Bug at line {selectedLine} · Dashboard.tsx
        </p>
      )}
      <Button
        className="flex w-full items-center justify-center gap-2 rounded py-2.5 font-medium text-[13px] transition-all"
        disabled={disabled}
        onClick={onSubmit}
      >
        {isSubmitting ? (
          <>
            <span className="h-3 w-3 flex-shrink-0 animate-spin rounded-full border border-primary-foreground border-t-transparent" />
            Running against hidden tests...
          </>
        ) : (
          <>
            <Send size={13} />
            Submit fix
          </>
        )}
      </Button>
    </div>
  );
}
