import { useState } from "react";
import {
  Zap, Cpu, Network, Code2, Trophy, User, LayoutGrid,
  ChevronRight, ChevronDown, Search, Clock, Lock, Send,
  CheckCircle2, Target, Flame, FileCode, Folder, Settings,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "browser" | "challenge" | "results" | "profile" | "leaderboard";
type Category = "react" | "concurrency" | "distributed";
type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";
type RightTab = "explain" | "fix" | "hints";

// ─── Category Config ──────────────────────────────────────────────────────────

const CAT = {
  react: {
    label: "React Rendering",
    color: "#F97316",
    bg: "rgba(249,115,22,0.11)",
    border: "rgba(249,115,22,0.24)",
    Icon: Zap,
  },
  concurrency: {
    label: "Backend Concurrency",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.11)",
    border: "rgba(34,197,94,0.24)",
    Icon: Cpu,
  },
  distributed: {
    label: "Distributed Systems",
    color: "#A855F7",
    bg: "rgba(168,85,247,0.11)",
    border: "rgba(168,85,247,0.24)",
    Icon: Network,
  },
} as const;

const DIFF_COLOR: Record<Difficulty, string> = {
  Easy: "#22C55E",
  Medium: "#F59E0B",
  Hard: "#F97316",
  Expert: "#EF4444",
};

// ─── Challenge Data ───────────────────────────────────────────────────────────

interface Challenge {
  id: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  teaser: string;
  points: number;
  timeLimit: string;
  solved: boolean;
}

const CHALLENGES: Challenge[] = [
  { id: "ch-001", title: "Dashboard freezes after third click", category: "react", difficulty: "Hard", teaser: "Production dashboard becomes unresponsive exactly on the third navigation event.", points: 300, timeLimit: "45 min", solved: false },
  { id: "ch-002", title: "Cache stampede takes down checkout", category: "concurrency", difficulty: "Expert", teaser: "Checkout service collapses under load when Redis TTL expires simultaneously on high-traffic SKUs.", points: 450, timeLimit: "60 min", solved: false },
  { id: "ch-003", title: "Messages lost on partition rebalance", category: "distributed", difficulty: "Medium", teaser: "Kafka consumer drops events silently during rebalance when leader is reassigned mid-batch.", points: 200, timeLimit: "30 min", solved: true },
  { id: "ch-004", title: "Stale closure captures wrong user ID", category: "react", difficulty: "Medium", teaser: "Notification handler fires with the user ID from the previous session, not the current one.", points: 200, timeLimit: "25 min", solved: true },
  { id: "ch-005", title: "Goroutine leak under sustained load", category: "concurrency", difficulty: "Hard", teaser: "Memory grows unbounded after 48h of traffic — goroutine count climbs with every request.", points: 300, timeLimit: "45 min", solved: false },
  { id: "ch-006", title: "Split-brain during leader election", category: "distributed", difficulty: "Expert", teaser: "Two nodes simultaneously believe they are primary after a network partition heals.", points: 500, timeLimit: "75 min", solved: false },
  { id: "ch-007", title: "useEffect fires twice in Strict Mode", category: "react", difficulty: "Easy", teaser: "Analytics ping doubles in development, inflating event counts in staging dashboards.", points: 100, timeLimit: "15 min", solved: true },
  { id: "ch-008", title: "Deadlock in payment pipeline", category: "concurrency", difficulty: "Hard", teaser: "Payment workers freeze intermittently under concurrent writes to two shared locked resources.", points: 350, timeLimit: "50 min", solved: false },
  { id: "ch-009", title: "Clock skew corrupts event ordering", category: "distributed", difficulty: "Medium", teaser: "Events from two data centers arrive out-of-order despite timestamps appearing correct.", points: 250, timeLimit: "35 min", solved: false },
];

// ─── Code Fixture ─────────────────────────────────────────────────────────────

const CODE_LINES = [
  "import { useState, useEffect } from 'react';",
  "import { MetricsPanel } from './MetricsPanel';",
  "import { fetchDashboard } from '../api/dashboard';",
  "",
  "interface DashboardProps {",
  "  userId: string;",
  "  refreshInterval?: number;",
  "}",
  "",
  "export function Dashboard({",
  "  userId,",
  "  refreshInterval = 5000,",
  "}: DashboardProps) {",
  "  const [clickCount, setClickCount] = useState(0);",
  "  const [metrics, setMetrics] = useState(null);",
  "  const [isLoading, setIsLoading] = useState(false);",
  "",
  "  const loadMetrics = () => {",
  "    setIsLoading(true);",
  "    fetchDashboard(userId, clickCount)",
  "      .then(data => {",
  "        setMetrics(data);",
  "      })",
  "      .catch(console.error)",
  "      .finally(() => setIsLoading(false));",
  "  };",
  "",
  "  useEffect(() => {",
  "    loadMetrics();",
  "    const timer = setInterval(loadMetrics, refreshInterval);",
  "    return () => clearInterval(timer);",
  "  }, []);",
  "",
  "  const handlePanelClick = (panelId: string) => {",
  "    setClickCount(prev => prev + 1);",
  "    loadMetrics();",
  "  };",
  "",
  "  return (",
  "    <MetricsPanel",
  "      data={metrics}",
  "      loading={isLoading}",
  "      onClick={handlePanelClick}",
  "    />",
  "  );",
  "}",
];

const DIFF_LINES = [
  { type: "ctx", text: "  useEffect(() => {" },
  { type: "ctx", text: "    loadMetrics();" },
  { type: "ctx", text: "    const timer = setInterval(loadMetrics, refreshInterval);" },
  { type: "ctx", text: "    return () => clearInterval(timer);" },
  { type: "del", text: "  }, []);" },
  { type: "add", text: "  }, [loadMetrics, refreshInterval]);" },
  { type: "ctx", text: "" },
  { type: "del", text: "  const loadMetrics = () => {" },
  { type: "add", text: "  const loadMetrics = useCallback(() => {" },
  { type: "ctx", text: "    setIsLoading(true);" },
  { type: "ctx", text: "    fetchDashboard(userId, clickCount)" },
  { type: "ctx", text: "      .then(data => setMetrics(data))" },
  { type: "ctx", text: "      .catch(console.error)" },
  { type: "ctx", text: "      .finally(() => setIsLoading(false));" },
  { type: "del", text: "  };" },
  { type: "add", text: "  }, [userId, clickCount]);" },
];

const HINTS = [
  "Which React hook is responsible for setting up the interval — and when does it run?",
  "What does an empty dependency array [] tell React about re-running the effect?",
  "If loadMetrics is re-created on every render, which version does the interval hold?",
];

// ─── Leaderboard Data ─────────────────────────────────────────────────────────

const LEADERBOARD: { rank: number; name: string; score: number; solved: number; streak: number; isUser?: boolean }[] = [
  { rank: 1, name: "Priya Nair", score: 4820, solved: 31, streak: 14 },
  { rank: 2, name: "Marcus Chen", score: 4650, solved: 29, streak: 8 },
  { rank: 3, name: "Sasha Volkov", score: 4480, solved: 28, streak: 22 },
  { rank: 4, name: "Tomás García", score: 4210, solved: 26, streak: 5 },
  { rank: 5, name: "You", score: 3890, solved: 23, streak: 7, isUser: true },
  { rank: 6, name: "Anya Patel", score: 3750, solved: 22, streak: 3 },
  { rank: 7, name: "Wei Zhang", score: 3610, solved: 21, streak: 11 },
  { rank: 8, name: "Kofi Mensah", score: 3480, solved: 20, streak: 6 },
  { rank: 9, name: "Lena Müller", score: 3340, solved: 19, streak: 2 },
  { rank: 10, name: "Ryo Tanaka", score: 3190, solved: 18, streak: 9 },
];

// ─── Profile Data ─────────────────────────────────────────────────────────────

const RADAR_DATA = [
  { subject: "React", score: 72, fullMark: 100 },
  { subject: "Concurrency", score: 45, fullMark: 100 },
  { subject: "Distributed", score: 88, fullMark: 100 },
];

const STRENGTH_DATA = [
  { name: "React", Easy: 5, Medium: 3, Hard: 1, Expert: 0 },
  { name: "Concur.", Easy: 2, Medium: 3, Hard: 1, Expert: 0 },
  { name: "Distrib.", Easy: 3, Medium: 4, Hard: 2, Expert: 1 },
];

// ─── Syntax Tokenizer ─────────────────────────────────────────────────────────

const KW = new Set(["import", "export", "default", "from", "const", "let", "var", "function", "return", "interface", "type", "extends", "class", "new", "this", "async", "await", "if", "else", "null", "true", "false", "void"]);
const HOOKS = new Set(["useState", "useEffect", "useCallback", "useMemo", "useRef", "setInterval", "clearInterval", "setTimeout"]);

type Token = { text: string; color: string };

function tokenizeLine(line: string): Token[] {
  if (!line.trim()) return [{ text: " ", color: "transparent" }];
  if (line.trim().startsWith("//")) return [{ text: line, color: "#4B6940" }];

  const tokens: Token[] = [];
  let s = line;

  while (s.length > 0) {
    const q = s[0];
    if (q === "'" || q === '"' || q === "`") {
      const end = s.indexOf(q, 1);
      if (end !== -1) {
        tokens.push({ text: s.slice(0, end + 1), color: "#CE8E6A" });
        s = s.slice(end + 1);
        continue;
      }
    }
    const word = s.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/)?.[0];
    if (word) {
      const color = KW.has(word) ? "#7CB8F5" : HOOKS.has(word) ? "#4ECDC4" : /^[A-Z]/.test(word) ? "#9ECFD8" : "#C0C0D8";
      tokens.push({ text: word, color });
      s = s.slice(word.length);
      continue;
    }
    const num = s.match(/^[0-9]+/)?.[0];
    if (num) {
      tokens.push({ text: num, color: "#B5D9A5" });
      s = s.slice(num.length);
      continue;
    }
    tokens.push({ text: s[0], color: "#60607A" });
    s = s.slice(1);
  }
  return tokens;
}

// ─── Shared Components ────────────────────────────────────────────────────────

function CategoryTag({ category }: { category: Category }) {
  const cfg = CAT[category];
  const Icon = cfg.Icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium tracking-wide"
      style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      <Icon size={9} />
      {cfg.label}
    </span>
  );
}

function DiffBadge({ difficulty }: { difficulty: Difficulty }) {
  const c = DIFF_COLOR[difficulty];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium"
      style={{ color: c, backgroundColor: `${c}18`, border: `1px solid ${c}28` }}
    >
      {difficulty}
    </span>
  );
}

function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold select-none flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36, backgroundColor: "rgba(99,102,241,0.18)", color: "#818CF8" }}
    >
      {initials}
    </div>
  );
}

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-[#F5C842] font-mono font-semibold text-sm tabular-nums">1</span>;
  if (rank === 2) return <span className="text-[#B0B8C8] font-mono font-semibold text-sm tabular-nums">2</span>;
  if (rank === 3) return <span className="text-[#C8845A] font-mono font-semibold text-sm tabular-nums">3</span>;
  return <span className="text-zinc-600 font-mono text-sm tabular-nums">{rank}</span>;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV = [
  { id: "browser" as Screen, label: "Browse", Icon: LayoutGrid },
  { id: "challenge" as Screen, label: "Challenge", Icon: Code2 },
  { id: "results" as Screen, label: "Results", Icon: CheckCircle2 },
  { id: "profile" as Screen, label: "Profile", Icon: User },
  { id: "leaderboard" as Screen, label: "Leaderboard", Icon: Trophy },
];

function Sidebar({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  return (
    <nav className="flex flex-col w-[210px] shrink-0 border-r h-full" style={{ backgroundColor: "var(--sidebar)", borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2.5 px-5 py-[18px] border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="w-[26px] h-[26px] rounded bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Target size={13} className="text-white" />
        </div>
        <span className="font-semibold text-[13px] text-white tracking-tight">Debug Arena</span>
      </div>

      <div className="flex flex-col gap-0.5 p-2 flex-1 pt-3">
        {NAV.map(({ id, label, Icon }) => {
          const active = screen === id;
          return (
            <button
              key={id}
              onClick={() => setScreen(id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors duration-100 w-full text-left ${
                active ? "text-indigo-300 font-medium" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
              }`}
              style={active ? { backgroundColor: "rgba(99,102,241,0.12)" } : {}}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2.5 px-4 py-[14px] border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <Avatar name="You" size={26} />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-zinc-200 truncate">you</p>
          <p className="text-[11px] text-zinc-600">Rank #5 · 3,890 pts</p>
        </div>
        <Settings size={12} className="text-zinc-700 flex-shrink-0" />
      </div>
    </nav>
  );
}

// ─── Screen: Challenge Browser ────────────────────────────────────────────────

function ChallengeBrowser({ onOpen }: { onOpen: () => void }) {
  const [catFilter, setCatFilter] = useState<Category | null>(null);
  const [diffFilter, setDiffFilter] = useState<Difficulty | null>(null);
  const [query, setQuery] = useState("");

  const filtered = CHALLENGES.filter((c) => {
    if (catFilter && c.category !== catFilter) return false;
    if (diffFilter && c.difficulty !== diffFilter) return false;
    if (query && !c.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-8 pt-7 pb-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-[15px] font-semibold text-zinc-100">Challenges</h1>
          <span className="text-[12px] text-zinc-600 font-mono">{filtered.length} of {CHALLENGES.length}</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="pl-7 pr-3 py-1.5 rounded text-[13px] text-zinc-300 placeholder:text-zinc-700 focus:outline-none w-48 transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCatFilter(null)}
              className={`px-2.5 py-1 rounded text-[12px] font-medium transition-colors ${!catFilter ? "text-zinc-200 bg-white/10" : "text-zinc-600 hover:text-zinc-400"}`}
            >
              All
            </button>
            {(["react", "concurrency", "distributed"] as Category[]).map((cat) => {
              const cfg = CAT[cat];
              const Icon = cfg.Icon;
              const active = catFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCatFilter(active ? null : cat)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-[12px] font-medium transition-all"
                  style={{
                    color: active ? cfg.color : "#52525b",
                    backgroundColor: active ? cfg.bg : "transparent",
                    border: `1px solid ${active ? cfg.border : "transparent"}`,
                  }}
                >
                  <Icon size={10} />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 ml-auto">
            {(["Easy", "Medium", "Hard", "Expert"] as Difficulty[]).map((d) => {
              const c = DIFF_COLOR[d];
              const active = diffFilter === d;
              return (
                <button
                  key={d}
                  onClick={() => setDiffFilter(active ? null : d)}
                  className="px-2 py-1 rounded text-[12px] font-mono transition-all"
                  style={{
                    color: active ? c : "#52525b",
                    backgroundColor: active ? `${c}18` : "transparent",
                    border: `1px solid ${active ? `${c}38` : "transparent"}`,
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid grid-cols-3 gap-3 xl:grid-cols-3 lg:grid-cols-2">
          {filtered.map((c) => {
            const cfg = CAT[c.category];
            return (
              <button
                key={c.id}
                onClick={onOpen}
                className="group flex flex-col text-left p-4 rounded-lg transition-all duration-150"
                style={{ backgroundColor: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
              >
                <div className="flex items-start gap-2 mb-3 flex-wrap">
                  <CategoryTag category={c.category} />
                  <DiffBadge difficulty={c.difficulty} />
                  {c.solved && <CheckCircle2 size={13} className="text-emerald-500 ml-auto mt-0.5 flex-shrink-0" />}
                </div>

                <h3 className="text-[13px] font-medium text-zinc-200 mb-1.5 leading-snug group-hover:text-white transition-colors">
                  {c.title}
                </h3>

                <p className="text-[12px] text-zinc-600 leading-relaxed mb-4 line-clamp-2">{c.teaser}</p>

                <div className="flex items-center gap-3 mt-auto text-[11px] text-zinc-700">
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {c.timeLimit}
                  </span>
                  <span className="font-mono">{c.points} pts</span>
                  <span className="ml-auto flex items-center gap-0.5 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                    Open <ChevronRight size={11} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-40 text-zinc-700 text-sm">
            No challenges match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Screen: Challenge ────────────────────────────────────────────────────────

function ChallengeScreen({ onSubmit }: { onSubmit: () => void }) {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("explain");
  const [explanation, setExplanation] = useState("");
  const [hintsOpen, setHintsOpen] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [treeOpen, setTreeOpen] = useState(true);

  const challenge = CHALLENGES[0];
  const cfg = CAT[challenge.category];

  const handleSubmit = () => {
    if (!selectedLine) return;
    setIsSubmitting(true);
    setTimeout(() => { setIsSubmitting(false); onSubmit(); }, 2800);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: scenario + tree */}
      <div className="w-[272px] shrink-0 flex flex-col border-r overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <CategoryTag category={challenge.category} />
            <DiffBadge difficulty={challenge.difficulty} />
          </div>
          <h2 className="text-[13px] font-semibold text-zinc-100 leading-snug mt-2.5">{challenge.title}</h2>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-700">
            <span className="flex items-center gap-1"><Clock size={10} /> {challenge.timeLimit}</span>
            <span className="font-mono">{challenge.points} pts max</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 text-[12.5px] text-zinc-500 leading-relaxed">
          <p className="mb-3">
            The production dashboard began freezing intermittently after the v2.4 deploy. Support tickets describe the interface becoming unresponsive after approximately three interactions with the metrics panel.
          </p>
          <p className="mb-3">
            No errors appear in the browser console. The network tab shows ongoing fetch activity, but the UI stops reflecting updates. A hard refresh resolves the symptom until the pattern repeats.
          </p>
          <p>
            The <code className="font-mono text-[11.5px] text-zinc-400 bg-white/[0.06] px-1 py-0.5 rounded">Dashboard</code> component was refactored in this release to add a polling mechanism.
          </p>

          <div className="mt-5">
            <button
              onClick={() => setTreeOpen((v) => !v)}
              className="flex items-center gap-1.5 text-[10px] text-zinc-700 hover:text-zinc-400 transition-colors uppercase tracking-widest mb-2"
            >
              {treeOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              Relevant files
            </button>
            {treeOpen && (
              <div className="font-mono text-[11.5px] space-y-0.5">
                <div className="flex items-center gap-1.5 text-zinc-600"><Folder size={11} /> src/</div>
                <div className="flex items-center gap-1.5 text-zinc-600 pl-4"><Folder size={11} /> components/</div>
                <div
                  className="flex items-center gap-1.5 pl-8 py-0.5 rounded-sm cursor-default"
                  style={{ color: cfg.color, backgroundColor: cfg.bg }}
                >
                  <FileCode size={11} /> Dashboard.tsx
                </div>
                <div className="flex items-center gap-1.5 text-zinc-700 pl-8"><FileCode size={11} /> MetricsPanel.tsx</div>
                <div className="flex items-center gap-1.5 text-zinc-600 pl-4"><Folder size={11} /> api/</div>
                <div className="flex items-center gap-1.5 text-zinc-700 pl-8"><FileCode size={11} /> dashboard.ts</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center: code viewer */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "#0b0b10" }}>
        <div className="flex items-center border-b" style={{ backgroundColor: "#0f0f15", borderColor: "rgba(255,255,255,0.06)" }}>
          <div
            className="flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-mono border-b-[1.5px]"
            style={{ color: cfg.color, borderBottomColor: cfg.color }}
          >
            <FileCode size={12} /> Dashboard.tsx
          </div>
          <div className="ml-auto px-4 py-2.5 text-[11px] text-zinc-700 font-mono">
            {selectedLine ? `Line ${selectedLine} marked` : "Click a line to mark bug location"}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <table className="w-full border-collapse" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
            <tbody>
              {CODE_LINES.map((line, i) => {
                const n = i + 1;
                const selected = selectedLine === n;
                const tokens = tokenizeLine(line);
                return (
                  <tr
                    key={n}
                    onClick={() => setSelectedLine(selected ? null : n)}
                    className="cursor-pointer group"
                    style={{ backgroundColor: selected ? `${cfg.color}13` : undefined }}
                  >
                    <td
                      className="select-none text-right pr-4 pl-3 py-[2.5px] w-10 text-[12px] transition-colors"
                      style={{ color: selected ? cfg.color : "#3a3a52" }}
                    >
                      {n}
                    </td>
                    <td
                      className="pl-2 pr-6 py-[2.5px] text-[12.5px] group-hover:bg-white/[0.018] transition-colors"
                    >
                      {tokens.map((t, j) => (
                        <span key={j} style={{ color: selected ? cfg.color : t.color }}>{t.text}</span>
                      ))}
                    </td>
                    <td className="w-5 pr-2 text-[10px]" style={{ color: cfg.color }}>
                      {selected ? "●" : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right: tabs */}
      <div className="w-[308px] shrink-0 flex flex-col border-l" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {(["explain", "fix", "hints"] as RightTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setRightTab(tab)}
              className={`px-4 py-3 text-[12px] font-medium capitalize transition-colors border-b ${
                rightTab === tab ? "text-indigo-300 border-indigo-500" : "text-zinc-600 hover:text-zinc-400 border-transparent"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {rightTab === "explain" && (
            <div className="flex flex-col gap-3 h-full">
              <p className="text-[11.5px] text-zinc-600 leading-relaxed">
                Describe the root cause. What is broken and why does it fail after exactly three interactions?
              </p>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="The bug occurs because..."
                className="flex-1 min-h-[260px] w-full rounded p-3 text-[13px] text-zinc-300 placeholder:text-zinc-700 leading-relaxed resize-none focus:outline-none transition-colors"
                style={{ backgroundColor: "var(--card)", border: "1px solid rgba(255,255,255,0.07)", fontFamily: "'Inter', system-ui, sans-serif" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
              />
            </div>
          )}

          {rightTab === "fix" && (
            <div>
              <p className="text-[11.5px] text-zinc-600 mb-3 leading-relaxed">
                Canonical fix. Your score reflects how closely your explanation matches this approach.
              </p>
              <div className="rounded overflow-hidden text-[11.5px] border" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", backgroundColor: "#0b0b10", borderColor: "rgba(255,255,255,0.06)" }}>
                {DIFF_LINES.map((line, i) => (
                  <div
                    key={i}
                    className="flex items-start"
                    style={{
                      backgroundColor: line.type === "add" ? "rgba(34,197,94,0.07)" : line.type === "del" ? "rgba(239,68,68,0.07)" : "transparent",
                    }}
                  >
                    <span
                      className="w-6 shrink-0 pl-3 py-[3px] select-none"
                      style={{ color: line.type === "add" ? "#22C55E" : line.type === "del" ? "#EF4444" : "transparent" }}
                    >
                      {line.type === "add" ? "+" : line.type === "del" ? "−" : " "}
                    </span>
                    <span
                      className="px-2 py-[3px] whitespace-pre"
                      style={{ color: line.type === "add" ? "#86EFAC" : line.type === "del" ? "#FCA5A5" : "#3d3d56" }}
                    >
                      {line.text || " "}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rightTab === "hints" && (
            <div className="space-y-2.5">
              <p className="text-[11.5px] text-zinc-600 mb-4 leading-relaxed">
                Each revealed hint reduces your maximum score for this challenge.
              </p>
              {HINTS.map((hint, i) => {
                const open = hintsOpen.includes(i);
                const cost = (i + 1) * 10;
                return (
                  <div key={i} className="rounded overflow-hidden border" style={{ backgroundColor: "var(--card)", borderColor: "rgba(255,255,255,0.06)" }}>
                    <button
                      onClick={() => setHintsOpen((h) => open ? h.filter((x) => x !== i) : [...h, i])}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] text-left"
                    >
                      {open ? (
                        <ChevronDown size={12} className="text-zinc-500 flex-shrink-0" />
                      ) : (
                        <Lock size={11} className="text-zinc-700 flex-shrink-0" />
                      )}
                      <span className={open ? "text-zinc-400" : "text-zinc-600"}>Hint {i + 1}</span>
                      {!open && (
                        <span className="ml-auto text-[11px] font-mono" style={{ color: "#F59E0B" }}>
                          Reveal (−{cost} pts)
                        </span>
                      )}
                    </button>
                    {open && (
                      <div
                        className="px-3 pb-3 pt-2 text-[12px] text-zinc-400 leading-relaxed border-t"
                        style={{ borderColor: "rgba(255,255,255,0.05)" }}
                      >
                        {hint}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {selectedLine && (
            <p className="text-[11px] text-zinc-700 mb-2 font-mono">
              Bug at line {selectedLine} · Dashboard.tsx
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!selectedLine || isSubmitting}
            className="w-full py-2.5 rounded text-[13px] font-medium transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: !selectedLine ? "rgba(255,255,255,0.04)" : isSubmitting ? "#4338CA" : "#4F46E5",
              color: !selectedLine ? "#44445A" : "#FFFFFF",
              cursor: !selectedLine ? "not-allowed" : isSubmitting ? "wait" : "pointer",
            }}
          >
            {isSubmitting ? (
              <>
                <span className="w-3 h-3 rounded-full border border-indigo-300 border-t-transparent animate-spin flex-shrink-0" />
                Running against hidden tests...
              </>
            ) : (
              <>
                <Send size={13} />
                Submit fix
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Results ──────────────────────────────────────────────────────────

const SCORE_PARTS = [
  { label: "Localization", score: 85, max: 100, desc: "Correct file and line identified" },
  { label: "Root Cause", score: 62, max: 100, desc: "Partial — mechanism not fully named" },
  { label: "Fix", score: 70, max: 100, desc: "Correct approach; missed useCallback" },
  { label: "Prevention", score: 30, max: 100, desc: "Minimal; ESLint rule not mentioned" },
];

const USER_EXPLANATION = "The useEffect has an empty dependency array, so it doesn't re-run when loadMetrics changes. This means the interval is always calling the old version of loadMetrics that captured an outdated clickCount.";

const CANONICAL = "The root cause is a stale closure. loadMetrics is defined inside the component and captures clickCount from its enclosing scope at render time. Because useEffect has an empty dependency array [], it registers the version of loadMetrics from the initial render and never updates it. All subsequent interval ticks invoke the stale closure, which always fetches with clickCount === 0. State updates from setClickCount trigger re-renders and create new loadMetrics functions, but the running interval continues calling the stale captured version. After three clicks, the oscillation between stale interval data and re-render state produces an inconsistent update cycle that blocks further UI progress.";

const AI_FEEDBACK = "You correctly located the empty dependency array as the failure point. The explanation would score higher if it explicitly named the mechanism — that the interval holds a reference to the render-0 closure specifically, not just 'an old version'. Describing the oscillation between stale and fresh state would complete the picture.";

const PREVENTION = "Memoize loadMetrics with useCallback and list its real dependencies [userId, clickCount]. Pass loadMetrics as a dependency of useEffect rather than calling it by reference inside. Adopt the exhaustive-deps ESLint rule from eslint-plugin-react-hooks — it would have flagged this at the function boundary. For polling specifically, consider a data-fetching library (SWR, TanStack Query) that handles stale closure safety, deduplication, and cleanup lifecycle automatically.";

function ResultsScreen({ onNext }: { onNext: () => void }) {
  const total = SCORE_PARTS.reduce((s, p) => s + p.score, 0);
  const maxTotal = SCORE_PARTS.reduce((s, p) => s + p.max, 0);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-8 pt-7 pb-5 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm" style={{ borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(13,13,18,0.92)" }}>
        <div>
          <p className="text-[11px] text-zinc-600 uppercase tracking-widest mb-0.5 font-mono">Results</p>
          <h1 className="text-[15px] font-semibold text-zinc-100">Dashboard freezes after third click</h1>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-zinc-600 font-mono mb-0.5">Total score</p>
          <p className="text-2xl font-semibold text-white tabular-nums font-mono">
            {total}<span className="text-zinc-600 text-base font-normal"> / {maxTotal}</span>
          </p>
        </div>
      </div>

      <div className="px-8 py-6 space-y-8 max-w-[1100px]">
        {/* Score breakdown */}
        <div>
          <p className="text-[11px] text-zinc-600 uppercase tracking-widest mb-3 font-mono">Score breakdown</p>
          <div className="grid grid-cols-4 gap-3">
            {SCORE_PARTS.map((part) => {
              const pct = (part.score / part.max) * 100;
              const color = pct >= 80 ? "#22C55E" : pct >= 60 ? "#F59E0B" : "#EF4444";
              return (
                <div key={part.label} className="rounded-lg p-4" style={{ backgroundColor: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[11px] text-zinc-600 mb-2 font-mono uppercase tracking-wide">{part.label}</p>
                  <p className="text-2xl font-semibold font-mono tabular-nums" style={{ color }}>
                    {part.score}<span className="text-zinc-700 text-sm font-normal"> / {part.max}</span>
                  </p>
                  <div className="mt-3 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.7 }} />
                  </div>
                  <p className="text-[11px] text-zinc-700 mt-2 leading-snug">{part.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explanation comparison */}
        <div>
          <p className="text-[11px] text-zinc-600 uppercase tracking-widest mb-3 font-mono">Explanation comparison</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg p-4" style={{ backgroundColor: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] text-zinc-600 uppercase tracking-wide font-mono mb-2.5">Your explanation</p>
              <p className="text-[13px] text-zinc-400 leading-relaxed">{USER_EXPLANATION}</p>
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: "var(--card)", border: "1px solid rgba(34,197,94,0.14)" }}>
              <p className="text-[11px] uppercase tracking-wide font-mono mb-2.5" style={{ color: "#22C55E" }}>Canonical root cause</p>
              <p className="text-[13px] text-zinc-300 leading-relaxed">{CANONICAL}</p>
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ backgroundColor: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)" }}>
            <p className="text-[11px] text-indigo-400 uppercase tracking-wide font-mono mb-2">AI feedback</p>
            <p className="text-[13px] text-zinc-400 leading-relaxed">{AI_FEEDBACK}</p>
          </div>
        </div>

        {/* Prevention */}
        <div>
          <p className="text-[11px] text-zinc-600 uppercase tracking-widest mb-3 font-mono">How to prevent this</p>
          <div className="rounded-lg p-4" style={{ backgroundColor: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[13px] text-zinc-400 leading-relaxed">{PREVENTION}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pb-8">
          <p className="text-[12px] text-zinc-700">Challenge complete · +{total} pts added to your profile</p>
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-4 py-2 rounded text-[13px] font-medium text-white transition-colors"
            style={{ backgroundColor: "#4F46E5" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4338CA")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4F46E5")}
          >
            Back to challenges <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Profile ──────────────────────────────────────────────────────────

const RECENT = [
  { title: "Messages lost on partition rebalance", category: "distributed" as Category, score: 188, pts: 200 },
  { title: "Stale closure captures wrong user ID", category: "react" as Category, score: 162, pts: 200 },
  { title: "useEffect fires twice in Strict Mode", category: "react" as Category, score: 94, pts: 100 },
];

function ProfileScreen() {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Left column */}
      <div className="w-[240px] shrink-0 border-r flex flex-col gap-0 overflow-y-auto" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <Avatar name="You" size={52} />
          <h2 className="text-[14px] font-semibold text-zinc-100 mt-3 mb-0.5">you</h2>
          <p className="text-[12px] text-zinc-600">Member since Jan 2024</p>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest mb-2 font-mono">Stats</p>
            <div className="space-y-2.5">
              {[
                { label: "Global rank", value: "#5" },
                { label: "Total score", value: "3,890" },
                { label: "Solved", value: "23 / 47" },
                { label: "Current streak", value: "7 days", Icon: Flame, iconColor: "#F97316" },
                { label: "Best streak", value: "22 days" },
              ].map(({ label, value, Icon, iconColor }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[12px] text-zinc-600">{label}</span>
                  <span className="flex items-center gap-1 text-[12px] font-mono text-zinc-300" style={iconColor ? { color: iconColor } : {}}>
                    {Icon && <Icon size={11} />}
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest mb-2.5 font-mono">Per category</p>
            {(["react", "concurrency", "distributed"] as Category[]).map((cat) => {
              const cfg = CAT[cat];
              const scores: Record<Category, number> = { react: 72, concurrency: 45, distributed: 88 };
              const solved: Record<Category, number> = { react: 8, concurrency: 6, distributed: 9 };
              const pct = scores[cat];
              return (
                <div key={cat} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11.5px] text-zinc-500">{cfg.label}</span>
                    <span className="text-[11px] font-mono" style={{ color: cfg.color }}>{solved[cat]} solved</span>
                  </div>
                  <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cfg.color, opacity: 0.65 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: charts */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
        <div className="grid grid-cols-2 gap-6">
          {/* Radar */}
          <div className="rounded-lg p-5" style={{ backgroundColor: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-mono mb-4">Category strength</p>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#64648a", fontSize: 11, fontFamily: "Inter" }}
                />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={1.5} dot={{ fill: "#6366f1", r: 3 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart */}
          <div className="rounded-lg p-5" style={{ backgroundColor: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-mono mb-4">Solved by difficulty</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={STRENGTH_DATA} barSize={16} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fill: "#64648a", fontSize: 11, fontFamily: "Inter" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64648a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a24", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, fontSize: 12 }}
                  itemStyle={{ color: "#e2e2ee" }}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar dataKey="Easy" stackId="a" fill="#22C55E" fillOpacity={0.7} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Medium" stackId="a" fill="#F59E0B" fillOpacity={0.7} />
                <Bar dataKey="Hard" stackId="a" fill="#F97316" fillOpacity={0.7} />
                <Bar dataKey="Expert" stackId="a" fill="#EF4444" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-mono mb-3">Recent submissions</p>
          <div className="space-y-2">
            {RECENT.map((r, i) => {
              const pct = Math.round((r.score / r.pts) * 100);
              const color = pct >= 80 ? "#22C55E" : pct >= 60 ? "#F59E0B" : "#EF4444";
              return (
                <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-lg" style={{ backgroundColor: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <CategoryTag category={r.category} />
                  <p className="flex-1 text-[13px] text-zinc-300 truncate">{r.title}</p>
                  <div className="text-right flex-shrink-0">
                    <span className="font-mono text-[13px] font-medium" style={{ color }}>
                      {r.score}
                    </span>
                    <span className="text-zinc-700 text-[12px] font-mono"> / {r.pts}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Leaderboard ──────────────────────────────────────────────────────

type LbTab = "week" | "alltime" | "react" | "concurrency" | "distributed";

function LeaderboardScreen() {
  const [tab, setTab] = useState<LbTab>("week");

  const TABS: { id: LbTab; label: string }[] = [
    { id: "week", label: "This week" },
    { id: "alltime", label: "All time" },
    { id: "react", label: "React" },
    { id: "concurrency", label: "Concurrency" },
    { id: "distributed", label: "Distributed" },
  ];

  const catTab = ["react", "concurrency", "distributed"].includes(tab) ? (tab as Category) : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-8 pt-7 pb-0 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <h1 className="text-[15px] font-semibold text-zinc-100 mb-5">Leaderboard</h1>
        <div className="flex items-center gap-1">
          {TABS.map(({ id, label }) => {
            const active = tab === id;
            const isCat = ["react", "concurrency", "distributed"].includes(id);
            const cfg = isCat ? CAT[id as Category] : null;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-3 py-2 text-[12px] font-medium transition-colors border-b-[1.5px] ${
                  active
                    ? cfg
                      ? "border-current"
                      : "text-indigo-300 border-indigo-500"
                    : "text-zinc-600 border-transparent hover:text-zinc-400"
                }`}
                style={active && cfg ? { color: cfg.color, borderBottomColor: cfg.color } : {}}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {catTab && (() => {
          const cfg = CAT[catTab];
          const Icon = cfg.Icon;
          return (
            <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg" style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <Icon size={13} style={{ color: cfg.color }} />
              <span className="text-[12px] font-medium" style={{ color: cfg.color }}>
                {cfg.label} — top solvers ranked by category score
              </span>
            </div>
          );
        })()}

        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Rank", "User", "Score", "Solved", "Streak"].map((col) => (
                <th
                  key={col}
                  className={`text-left text-[11px] text-zinc-700 font-medium uppercase tracking-wider pb-3 font-mono ${col === "Score" || col === "Solved" || col === "Streak" ? "text-right" : ""}`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEADERBOARD.map((row) => (
              <tr
                key={row.rank}
                className="border-t transition-colors"
                style={{
                  borderColor: "rgba(255,255,255,0.05)",
                  backgroundColor: row.isUser ? "rgba(99,102,241,0.06)" : "transparent",
                }}
              >
                <td className="py-3 w-12">
                  <RankMedal rank={row.rank} />
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={row.name} size={26} />
                    <span
                      className={`text-[13px] ${row.isUser ? "text-indigo-300 font-medium" : "text-zinc-300"}`}
                    >
                      {row.name}
                      {row.isUser && <span className="ml-2 text-[10px] text-indigo-500 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded">you</span>}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-right">
                  <span className="font-mono text-[13px] text-zinc-300 tabular-nums">
                    {row.score.toLocaleString()}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <span className="font-mono text-[13px] text-zinc-500 tabular-nums">{row.solved}</span>
                </td>
                <td className="py-3 text-right">
                  <span
                    className="inline-flex items-center gap-1 font-mono text-[12px] tabular-nums"
                    style={{ color: row.streak >= 14 ? "#F97316" : row.streak >= 7 ? "#F59E0B" : "#4B5563" }}
                  >
                    {row.streak >= 7 && <Flame size={11} />}
                    {row.streak}d
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("browser");

  const handleOpenChallenge = () => setScreen("challenge");
  const handleSubmit = () => setScreen("results");
  const handleBackToBrowser = () => setScreen("browser");

  return (
    <div className="dark flex h-screen w-screen overflow-hidden bg-background text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar screen={screen} setScreen={setScreen} />
      <main className="flex-1 overflow-hidden">
        {screen === "browser" && <ChallengeBrowser onOpen={handleOpenChallenge} />}
        {screen === "challenge" && <ChallengeScreen onSubmit={handleSubmit} />}
        {screen === "results" && <ResultsScreen onNext={handleBackToBrowser} />}
        {screen === "profile" && <ProfileScreen />}
        {screen === "leaderboard" && <LeaderboardScreen />}
      </main>
    </div>
  );
}
