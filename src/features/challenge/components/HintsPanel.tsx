"use client";

import { ChevronDown, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { HintItem } from "@/features/challenge/types";

interface Props {
  hints: HintItem[];
  hintsOpen: number[];
  toggleHint: (i: number) => void;
}

export function HintsPanel({ hintsOpen, toggleHint, hints }: Props) {
  const t = useTranslations();
  if (hints.length === 0) {
    return (
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        {t("challenge.hints.empty")}
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      <p className="mb-4 text-[11.5px] text-muted-foreground leading-relaxed">
        {t("challenge.hints.costHint")}
      </p>
      {hints.map((hint, i) => {
        const open = hintsOpen.includes(i);
        const cost = hint.penaltyPoints;
        return (
          <Card
            className="overflow-hidden"
            key={`${hint.order}-${hint.socraticPrompt.slice(0, 20)}`}
          >
            <Button
              className="flex h-auto w-full items-center gap-2 rounded-none px-3 py-2.5 text-start text-[12px] transition-colors hover:bg-muted/50"
              onClick={() => toggleHint(i)}
              type="button"
              variant="ghost"
            >
              {open ? (
                <ChevronDown
                  className="shrink-0 text-muted-foreground"
                  size={12}
                />
              ) : (
                <Lock className="shrink-0 text-muted-foreground" size={11} />
              )}
              <span
                className={
                  open ? "font-medium text-foreground" : "text-muted-foreground"
                }
              >
                {t("challenge.hints.title", { order: hint.order })}
              </span>
              {!open && (
                <Badge
                  className="ms-auto font-mono text-[11px]"
                  variant="warning"
                >
                  {t("challenge.hints.reveal", { cost })}
                </Badge>
              )}
            </Button>
            {open && (
              <div className="border-border border-t px-3 pt-2 pb-3 text-[12px] text-muted-foreground leading-relaxed">
                {hint.socraticPrompt}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
