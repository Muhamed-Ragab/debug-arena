import { Link } from "react-router-dom";
import { FileCode2, Users, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import type { Challenge } from "../../../lib/types";
import { CATEGORY_CONFIG } from "../../../lib/categories";
import { formatSolves } from "../../../features/challenge/data/challenges";
import { CategoryTag } from "../../../components/ui/CategoryTag";
import { DiffBadge } from "../../../components/ui/DiffBadge";

export default function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const accent = CATEGORY_CONFIG[challenge.category].dim;

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors hover:border-[var(--border-soft)]"
      style={{ boxShadow: "inset 4px 0 0 0 " + accent }}
    >
      <div className="flex items-center justify-between">
        <DiffBadge difficulty={challenge.difficulty} />
        <CategoryTag category={challenge.category} />
      </div>

      <h3 className="mt-3 text-[15px] font-semibold leading-snug text-heading">
        {challenge.title}
      </h3>

      <div className="mt-2 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
        <FileCode2 size={13} />
        <span>{challenge.filePath}</span>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users size={13} />
          {formatSolves(challenge.solves)} solves
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={13} />
          {challenge.time}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        {challenge.solved ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            <CheckCircle2 size={13} />
            Solved
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Not attempted</span>
        )}
        <Link
          to={`/challenges/${challenge.id}`}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          {challenge.solved ? "Review" : "Start Debugging"}
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
