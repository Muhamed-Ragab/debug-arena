import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileCode2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { CategoryTag } from "@/components/ui/CategoryTag";
import { DiffBadge } from "@/components/ui/DiffBadge";
import { formatSolves } from "@/features/challenge/data/challenges";
import { CATEGORY_CONFIG } from "@/lib/domain/categories";
import type { Challenge } from "@/lib/domain/types";

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const accent =
    CATEGORY_CONFIG[challenge.category]?.dim ?? "rgba(99,102,241,0.15)";

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
      style={{ boxShadow: `inset 4px 0 0 0 ${accent}` }}
    >
      <div className="flex items-center justify-between">
        <DiffBadge difficulty={challenge.difficulty} />
        <CategoryTag category={challenge.category} />
      </div>

      <h3 className="mt-3 font-semibold text-[15px] text-heading leading-snug">
        {challenge.title}
      </h3>

      <div className="mt-2 flex items-center gap-1.5 font-mono text-muted-foreground text-xs">
        <FileCode2 size={13} />
        <span>{challenge.filePath}</span>
      </div>

      <div className="mt-4 flex items-center gap-4 text-muted-foreground text-xs">
        <span className="flex items-center gap-1.5">
          <Users size={13} />
          {formatSolves(challenge.solves ?? 0)} solves
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={13} />
          {challenge.time ?? "~30m"}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-border border-t pt-4">
        {challenge.solved ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-400 text-xs">
            <CheckCircle2 size={13} />
            Solved
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">Not attempted</span>
        )}
        <Link
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-xs transition-opacity hover:opacity-90"
          href={`/challenges/${challenge.id}`}
        >
          {challenge.solved ? "Review" : "Start Debugging"}
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
