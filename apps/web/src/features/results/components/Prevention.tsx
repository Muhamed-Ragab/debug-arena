export default function Prevention({ items }: { items: string[] }) {
  return (
    <div>
      <p className="text-[11px] text-zinc-600 uppercase tracking-widest mb-3 font-mono">How to prevent this</p>
      <div
        className="rounded-lg p-4 space-y-2.5"
        style={{ backgroundColor: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {items.map((t, i) => (
          <p key={i} className="flex gap-2 text-[13px] text-zinc-400 leading-relaxed">
            <span className="select-none text-zinc-600">•</span>
            <span>{t}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
