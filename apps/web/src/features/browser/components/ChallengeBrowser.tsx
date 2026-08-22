import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import type { Category, Difficulty } from "../../../lib/types";
import { CHALLENGES } from "../../../features/challenge/data/challenges";
import ChallengeFilters from "./ChallengeFilters";
import ChallengeCard from "./ChallengeCard";
import NotificationBell from "../../../components/ui/NotificationBell";
import type { AppShellContext } from "../../../components/layout/AppShell";

const PAGE_SIZE = 6;

const STATS = [
  { label: "Solved", value: "37 / 104" },
  { label: "Current Streak", value: "12 days" },
  { label: "Rank", value: "#128" },
];

export default function ChallengeBrowser() {
  const { onMenuClick } = useOutletContext<AppShellContext>();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CHALLENGES.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (difficulty !== "all" && c.difficulty !== difficulty) return false;
      if (q && !c.title.toLowerCase().includes(q) && !c.filePath.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [search, category, difficulty]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <Menu size={18} />
          </button>
          <nav className="flex min-w-0 items-center gap-2 text-sm">
            <span className="hidden text-muted-foreground sm:inline">Arena</span>
            <span className="hidden text-muted-foreground sm:inline">/</span>
            <span className="truncate font-medium text-heading md:opacity-100">Challenges</span>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <NotificationBell />
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
              MR
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-medium text-heading">Marcus Reyes</p>
              <p className="text-xs text-muted-foreground">Senior Engineer</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-heading">Challenges</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a bug, read the scenario, and ship a root-cause diagnosis.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 text-xl font-semibold text-heading">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <ChallengeFilters
            search={search}
            onSearch={setSearch}
            category={category}
            onCategory={(c) => {
              setCategory(c);
              setPage(1);
            }}
            difficulty={difficulty}
            onDifficulty={(d) => {
              setDifficulty(d);
              setPage(1);
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((c) => (
            <ChallengeCard key={c.id} challenge={c} />
          ))}
        </div>

        {pageItems.length === 0 && (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No challenges match the current filters.
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground disabled:opacity-40 hover:text-foreground"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-9 min-w-9 rounded-md border px-3 text-sm font-medium transition-colors ${
                p === safePage
                  ? "border-primary bg-primary/10 text-heading"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground disabled:opacity-40 hover:text-foreground"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
