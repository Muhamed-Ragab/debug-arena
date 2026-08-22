import { useState, useRef, useEffect } from "react";
import { Monitor, Sun, Moon, Check } from "lucide-react";
import { cn } from "../lib/utils";
import { useTheme, Theme } from "../contexts/ThemeContext";

const THEMES = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<"top" | "bottom">("bottom");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setPosition(spaceBelow < 150 ? "top" : "bottom");
    }

    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
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
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Select theme"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center rounded-md border border-border bg-inset py-1.5 ps-7 pe-3 text-xs text-foreground transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary relative gap-4"
      >
        <CurrentIcon size={14} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <span className="truncate">{currentTheme.label}</span>
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 w-32 rounded-md border border-border bg-card p-1 shadow-lg ltr:start-0 rtl:end-0",
            position === "top" ? "bottom-full mb-1" : "mt-1 top-full"
          )}
        >
          {THEMES.map(({ value, label, Icon }) => {
            const selected = value === theme;
            return (
              <button
                key={value}
                type="button"
                role="menuitem"
                aria-selected={selected}
                onClick={() => {
                  setTheme(value as Theme);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-inset",
                  selected && "bg-inset"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-muted-foreground" aria-hidden />
                  <span>{label}</span>
                </div>
                {selected && <Check size={14} className="text-primary" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}