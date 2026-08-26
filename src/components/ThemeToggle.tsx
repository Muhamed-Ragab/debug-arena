"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type Theme, useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const THEMES = [
  { Icon: Monitor, label: "System", value: "system" },
  { Icon: Sun, label: "Light", value: "light" },
  { Icon: Moon, label: "Dark", value: "dark" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<"top" | "bottom">("bottom");
  const ref = useRef<HTMLDivElement>(null);

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

  const currentTheme = THEMES.find((t) => t.value === theme) || THEMES[0];
  const CurrentIcon = currentTheme.Icon;

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Select theme"
        className="relative inline-flex h-9 items-center gap-4 rounded-md border border-border bg-inset py-1.5 ps-7 pe-3 text-foreground text-xs transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <CurrentIcon
          aria-hidden
          className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={14}
        />
        <span className="truncate">{currentTheme.label}</span>
      </button>

      {Boolean(open) && (
        <div
          className={cn(
            "absolute z-50 w-32 rounded-md border border-border bg-card p-1 shadow-lg ltr:start-0 rtl:end-0",
            position === "top" ? "bottom-full mb-1" : "top-full mt-1"
          )}
          role="menu"
          tabIndex={-1}
        >
          {THEMES.map(({ value, label, Icon }) => {
            const selected = value === theme;
            return (
              <button
                aria-checked={selected}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-foreground text-sm transition-colors hover:bg-inset",
                  selected && "bg-inset"
                )}
                key={value}
                onClick={() => {
                  setTheme(value as Theme);
                  setOpen(false);
                }}
                role="menuitemradio"
                type="button"
              >
                <div className="flex items-center gap-2">
                  <Icon
                    aria-hidden
                    className="text-muted-foreground"
                    size={14}
                  />
                  <span>{label}</span>
                </div>
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
