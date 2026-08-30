"use client";

import { Check, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useExtracted, useLocale } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const LANGS: Array<{ code: "en" | "ar"; label: string }> = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
];

export function LanguageSwitcher() {
  const t = useExtracted();
  const locale = useLocale();
  const router = useRouter();

  const current = LANGS.find((l) => l.code === locale)?.label ?? locale;

  const switchTo = (code: "en" | "ar") => {
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("Select language")}
        className="relative inline-flex h-9 items-center gap-4 rounded-md border border-border bg-inset py-1.5 ps-7 pe-3 text-foreground text-xs transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Globe
          aria-hidden
          className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={14}
        />
        <span className="truncate">{current}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-40">
        {LANGS.map(({ code, label }) => {
          const selected = code === locale;
          return (
            <DropdownMenuItem
              className={cn(
                "justify-between",
                selected && "bg-muted font-medium"
              )}
              key={code}
              onClick={() => switchTo(code)}
            >
              <span>{label}</span>
              {selected && (
                <Check aria-hidden className="text-primary" size={14} />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
