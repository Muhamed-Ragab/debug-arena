import { DIFF_LINES } from "../../data/challenges";

export default function FixPanel() {
  return (
    <div>
      <p className="text-[11.5px] text-zinc-600 mb-3 leading-relaxed">
        Canonical fix. Your score reflects how closely your explanation matches this approach.
      </p>
      <div
        className="rounded overflow-hidden text-[11.5px] border"
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          backgroundColor: "#0b0b10",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        {DIFF_LINES.map((line, i) => (
          <div
            key={i}
            className="flex items-start"
            style={{
              backgroundColor:
                line.type === "add"
                  ? "rgba(34,197,94,0.07)"
                  : line.type === "del"
                    ? "rgba(239,68,68,0.07)"
                    : "transparent",
            }}
          >
            <span
              className="w-6 shrink-0 pl-3 py-[3px] select-none"
              style={{
                color:
                  line.type === "add" ? "#22C55E" : line.type === "del" ? "#EF4444" : "transparent",
              }}
            >
              {line.type === "add" ? "+" : line.type === "del" ? "−" : " "}
            </span>
            <span
              className="px-2 py-[3px] whitespace-pre"
              style={{
                color:
                  line.type === "add" ? "#86EFAC" : line.type === "del" ? "#FCA5A5" : "#3d3d56",
              }}
            >
              {line.text || " "}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
