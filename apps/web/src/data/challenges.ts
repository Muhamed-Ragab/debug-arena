import type { Challenge, DiffLine, FileTreeNode } from "../lib/types";

export const CHALLENGES: Challenge[] = [
  {
    id: "ch-001",
    title: "Search results render stale after rapid typing",
    category: "react",
    difficulty: "Medium",
    teaser:
      "Autocomplete shows results from a previous keystroke when the user types faster than the debounce window.",
    points: 200,
    timeLimit: "25 min",
    solved: true,
    solves: 1200,
    time: "~25m",
    filePath: "react-ui/src/Search.tsx",
  },
  {
    id: "ch-002",
    title: "Orders occasionally double-charge under load",
    category: "concurrency",
    difficulty: "Hard",
    teaser:
      "Checkout service emits two charges for the same order when concurrent requests race on the ledger write.",
    points: 300,
    timeLimit: "45 min",
    solved: false,
    solves: 840,
    time: "~45m",
    filePath: "orders/billing.go",
  },
  {
    id: "ch-003",
    title: "Leader election flaps every 30s in prod",
    category: "distributed",
    difficulty: "Expert",
    teaser:
      "Two nodes repeatedly steal leadership on a steady heartbeat, causing constant reconfiguration storms.",
    points: 500,
    timeLimit: "90 min",
    solved: false,
    solves: 320,
    time: "~90m",
    filePath: "consensus/raft.rs",
  },
  {
    id: "ch-004",
    title: "Memory grows unbounded during CSV export",
    category: "memory",
    difficulty: "Hard",
    teaser:
      "Exporting a large CSV keeps every row in memory and never releases it, OOM-killing the worker.",
    points: 300,
    timeLimit: "60 min",
    solved: true,
    solves: 612,
    time: "~60m",
    filePath: "io/export.py",
  },
  {
    id: "ch-005",
    title: "Dashboard freezes after third click",
    category: "react",
    difficulty: "Easy",
    teaser:
      "Analytics dashboard becomes fully unresponsive after clicking the Refresh filter button three times quickly.",
    points: 100,
    timeLimit: "15 min",
    solved: true,
    solves: 3400,
    time: "~15m",
    filePath: "app/Dashboard.jsx",
  },
  {
    id: "ch-006",
    title: "Payment webhook retries cause duplicate rows",
    category: "concurrency",
    difficulty: "Expert",
    teaser:
      "At-least-once webhook delivery inserts a second row when the first attempt times out mid-commit.",
    points: 500,
    timeLimit: "120 min",
    solved: false,
    solves: 190,
    time: "~120m",
    filePath: "payments/hooks.java",
  },
  {
    id: "ch-007",
    title: "Partition recovery causes message storm",
    category: "distributed",
    difficulty: "Medium",
    teaser:
      "After a network partition heals, a flood of replayed messages overwhelms consumers and drops newer events.",
    points: 250,
    timeLimit: "40 min",
    solved: false,
    solves: 510,
    time: "~40m",
    filePath: "mq/recovery.go",
  },
  {
    id: "ch-008",
    title: "GC thrashing spikes latency on payload read",
    category: "memory",
    difficulty: "Medium",
    teaser:
      "Reading a large payload allocates short-lived buffers faster than the GC can reclaim, spiking p99 latency.",
    points: 250,
    timeLimit: "35 min",
    solved: true,
    solves: 920,
    time: "~35m",
    filePath: "core/gc_tuner.c",
  },
  {
    id: "ch-009",
    title: "State initializer crashes on concurrent tab mount",
    category: "react",
    difficulty: "Hard",
    teaser:
      "Opening a second tab while the first is mounting throws a race in the shared store initializer.",
    points: 300,
    timeLimit: "50 min",
    solved: false,
    solves: 430,
    time: "~50m",
    filePath: "store/init.ts",
  },
];

export function formatSolves(n: number): string {
  if (n >= 1000) {
    const v = n / 1000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}k`;
  }
  return `${n}`;
}

export const CODE_LINES: string[] = [
  "import { useState, useEffect } from 'react';",
  "import { useFilteredRows } from '../hooks/useFilteredRows';",
  "import RowTable from './RowTable';",
  "",
  "export default function Dashboard() {",
  "  const [rows, setRows] = useState(generateRows(500));",
  "  const [filter, setFilter] = useState('');",
  "  const [clickCount, setClickCount] = useState(0);",
  "",
  "  // re-derives the full filtered list on every render",
  "  const filteredRows = useFilteredRows(rows, filter);",
  "  function handleRefresh() {",
  "    setClickCount(c => c + 1);",
  "    setRows(generateRows(500 * (clickCount + 1)));",
  "  }",
  "",
  "  return (",
  "    <div className=\"dashboard\">",
  "      <button onClick={handleRefresh}>Refresh</button>",
  "      <RowTable rows={filteredRows} />",
  "    </div>",
  "  );",
  "}",
];

export const DIFF_LINES: DiffLine[] = [
  { type: "ctx", text: "  const filteredRows = useFilteredRows(rows, filter);" },
  { type: "del", text: "  const filteredRows = useFilteredRows(rows, filter);" },
  { type: "add", text: "  const filteredRows = useMemo(() => filterRows(rows, filter), [rows, filter]);" },
  { type: "ctx", text: "  function handleRefresh() {" },
  { type: "del", text: "    setRows(generateRows(500 * (clickCount + 1)));" },
  { type: "add", text: "    refreshRows();" },
];

export const HINTS: string[] = [
  "Which React hook is responsible for setting up the interval — and when does it run?",
  "What does an empty dependency array [] tell React about re-running the effect?",
  "If loadMetrics is re-created on every render, which version does the interval hold?",
];

export const SCENARIO_PARAGRAPHS: string[] = [
  "Users report the analytics dashboard becomes fully unresponsive after clicking the \"Refresh\" filter button roughly three times in quick succession.",
  "Chrome DevTools shows a long task blocking the main thread. The UI stops reflecting new data until a hard refresh.",
  "Reproduces reliably on the /dashboard/overview route with more than 200 rows loaded. Your job: find the exact line causing the runaway behavior, explain the root cause, and ship a fix.",
];

export const FILE_TREE: FileTreeNode[] = [
  { type: "folder", name: "src", depth: 0 },
  { type: "folder", name: "components", depth: 1 },
  { type: "file", name: "Dashboard.jsx", depth: 2, highlight: true },
  { type: "file", name: "FilterBar.jsx", depth: 2 },
  { type: "file", name: "RowTable.jsx", depth: 2 },
  { type: "folder", name: "hooks", depth: 1 },
  { type: "file", name: "useFilteredRows.js", depth: 2 },
];

export function getChallengeById(id: string | undefined): Challenge {
  return CHALLENGES.find((c) => c.id === id) ?? CHALLENGES[0];
}
