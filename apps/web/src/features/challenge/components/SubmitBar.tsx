import { Send } from "lucide-react";

interface Props {
  selectedLine: number | null;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export default function SubmitBar({ selectedLine, isSubmitting, onSubmit }: Props) {
  const disabled = !selectedLine || isSubmitting;

  return (
    <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      {selectedLine && (
        <p className="text-[11px] text-zinc-700 mb-2 font-mono">
          Bug at line {selectedLine} · Dashboard.tsx
        </p>
      )}
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="w-full py-2.5 rounded text-[13px] font-medium transition-all flex items-center justify-center gap-2"
        style={{
          backgroundColor: !selectedLine
            ? "rgba(255,255,255,0.04)"
            : isSubmitting
              ? "#4338CA"
              : "#4F46E5",
          color: !selectedLine ? "#44445A" : "#FFFFFF",
          cursor: !selectedLine ? "not-allowed" : isSubmitting ? "wait" : "pointer",
        }}
      >
        {isSubmitting ? (
          <>
            <span className="w-3 h-3 rounded-full border border-indigo-300 border-t-transparent animate-spin flex-shrink-0" />
            Running against hidden tests...
          </>
        ) : (
          <>
            <Send size={13} />
            Submit fix
          </>
        )}
      </button>
    </div>
  );
}
