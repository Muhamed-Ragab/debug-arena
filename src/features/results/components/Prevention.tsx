export function Prevention({ items }: { items: string[] }) {
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
        How to prevent this
      </p>
      <div className="space-y-2.5 rounded-lg border border-border bg-card p-4">
        {items.map((t) => (
          <p
            className="flex gap-2 text-[13px] text-muted-foreground leading-relaxed"
            key={t}
          >
            <span className="select-none text-muted-foreground">•</span>
            <span>{t}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
