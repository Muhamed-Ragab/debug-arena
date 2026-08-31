"use client";

import { useExtracted } from "next-intl";

export function Prevention({ items }: { items: string[] }) {
  const t = useExtracted();
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
        {t("How to prevent this")}
      </p>
      <div className="space-y-2.5 rounded-lg border border-border bg-card p-4">
        {items.map((item) => (
          <p
            className="flex gap-2 text-[13px] text-muted-foreground leading-relaxed"
            key={item}
          >
            <span className="select-none text-muted-foreground">•</span>
            <span>{item}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
