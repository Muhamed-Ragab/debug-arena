"use client";

import { useLingui } from "@lingui/react";
import { Check, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { dynamicActivate, locales } from "@/i18n";
import { cn } from "@/lib/utils";

const LANGS = Object.entries(locales) as [string, string][];

export function LanguageSwitcher() {
  const { i18n } = useLingui();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<"top" | "bottom">("bottom");
  const ref = useRef<HTMLDivElement>(null);
  const active = i18n.locale;

  useEffect(() => {
    if (!open) {
      return;
    }

    const currentElem = ref.current as HTMLElement | null;
    if (currentElem) {
      const rect = currentElem.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setPosition(spaceBelow < 150 ? "top" : "bottom");
    }

    function onClick(e: MouseEvent) {
      const el = ref.current as HTMLElement | null;
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = locales[active as keyof typeof locales] ?? active;

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Select language"
        className="relative inline-flex h-9 items-center gap-4 rounded-md border border-border bg-inset py-1.5 ps-7 pe-3 text-foreground text-xs transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <Globe
          aria-hidden
          className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={14}
        />
        <span className="truncate">{current}</span>
      </button>

      {Boolean(open) && (
        <div
          className={cn(
            "absolute z-50 w-40 rounded-md border border-border bg-card p-1 shadow-lg ltr:start-0 rtl:end-0",
            position === "top" ? "bottom-full mb-1" : "top-full mt-1"
          )}
          role="menu"
          tabIndex={-1}
        >
          {LANGS.map(([code, label]) => {
            const selected = code === active;
            return (
              <button
                aria-checked={selected}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-foreground text-sm transition-colors hover:bg-inset",
                  selected && "bg-inset"
                )}
                key={code}
                onClick={() => {
                  dynamicActivate(code);
                  setOpen(false);
                }}
                role="menuitemradio"
                type="button"
              >
                <span>{label}</span>
                {selected && (
                  <Check aria-hidden className="text-primary" size={14} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
