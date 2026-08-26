import type { Challenge } from "@/lib/domain/types";
import type { DiffLine, FileTreeNode } from "../types";

export const CHALLENGES: Challenge[] = [
  {
    category: "State Mutations",
    difficulty: "Medium",
    filePath: "react-ui/src/Search.tsx",
    id: "ch-001",
    points: 200,
    solved: true,
    solves: 1200,
    teaser:
      "Autocomplete shows results from a previous keystroke when the user types faster than the debounce window.",
    time: "~25m",
    timeLimit: "25 min",
    title: "Search results render stale after rapid typing",
  },
  {
    category: "Race Conditions",
    difficulty: "Hard",
    filePath: "orders/billing.go",
    id: "ch-002",
    points: 300,
    solved: false,
    solves: 840,
    teaser:
      "Checkout service emits two charges for the same order when concurrent requests race on the ledger write.",
    time: "~45m",
    timeLimit: "45 min",
    title: "Orders occasionally double-charge under load",
  },
  {
    category: "Race Conditions",
    difficulty: "Expert",
    filePath: "consensus/raft.rs",
    id: "ch-003",
    points: 500,
    solved: false,
    solves: 320,
    teaser:
      "Two nodes repeatedly steal leadership on a steady heartbeat, causing constant reconfiguration storms.",
    time: "~90m",
    timeLimit: "90 min",
    title: "Leader election flaps every 30s in prod",
  },
  {
    category: "Memory Leaks",
    difficulty: "Hard",
    filePath: "io/export.py",
    id: "ch-004",
    points: 300,
    solved: true,
    solves: 612,
    teaser:
      "Exporting a large CSV keeps every row in memory and never releases it, OOM-killing the worker.",
    time: "~60m",
    timeLimit: "60 min",
    title: "Memory grows unbounded during CSV export",
  },
  {
    category: "State Mutations",
    difficulty: "Easy",
    filePath: "app/Dashboard.jsx",
    id: "ch-005",
    points: 100,
    solved: true,
    solves: 3400,
    teaser:
      "Analytics dashboard becomes fully unresponsive after clicking the Refresh filter button three times quickly.",
    time: "~15m",
    timeLimit: "15 min",
    title: "Dashboard freezes after third click",
  },
  {
    category: "Race Conditions",
    difficulty: "Expert",
    filePath: "payments/hooks.java",
    id: "ch-006",
    points: 500,
    solved: false,
    solves: 190,
    teaser:
      "At-least-once webhook delivery inserts a second row when the first attempt times out mid-commit.",
    time: "~120m",
    timeLimit: "120 min",
    title: "Payment webhook retries cause duplicate rows",
  },
  {
    category: "Security Flaws",
    difficulty: "Medium",
    filePath: "mq/recovery.go",
    id: "ch-007",
    points: 250,
    solved: false,
    solves: 510,
    teaser:
      "After a network partition heals, a flood of replayed messages overwhelms consumers and drops newer events.",
    time: "~40m",
    timeLimit: "40 min",
    title: "Partition recovery causes message storm",
  },
  {
    category: "Memory Leaks",
    difficulty: "Medium",
    filePath: "core/gc_tuner.c",
    id: "ch-008",
    points: 250,
    solved: true,
    solves: 920,
    teaser:
      "Reading a large payload allocates short-lived buffers faster than the GC can reclaim, spiking p99 latency.",
    time: "~35m",
    timeLimit: "35 min",
    title: "GC thrashing spikes latency on payload read",
  },
  {
    category: "State Mutations",
    difficulty: "Hard",
    filePath: "store/init.ts",
    id: "ch-009",
    points: 300,
    solved: false,
    solves: 430,
    teaser:
      "Opening a second tab while the first is mounting throws a race in the shared store initializer.",
    time: "~50m",
    timeLimit: "50 min",
    title: "State initializer crashes on concurrent tab mount",
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
  '    <div className="dashboard">',
  "      <button onClick={handleRefresh}>Refresh</button>",
  "      <RowTable rows={filteredRows} />",
  "    </div>",
  "  );",
  "}",
];

export const DIFF_LINES: DiffLine[] = [
  {
    text: "  const filteredRows = useFilteredRows(rows, filter);",
    type: "ctx",
  },
  {
    text: "  const filteredRows = useFilteredRows(rows, filter);",
    type: "del",
  },
  {
    text: "  const filteredRows = useMemo(() => filterRows(rows, filter), [rows, filter]);",
    type: "add",
  },
  { text: "  function handleRefresh() {", type: "ctx" },
  {
    text: "    setRows(generateRows(500 * (clickCount + 1)));",
    type: "del",
  },
  { text: "    refreshRows();", type: "add" },
];

export const HINTS: string[] = [
  "Which React hook is responsible for setting up the interval — and when does it run?",
  "What does an empty dependency array [] tell React about re-running the effect?",
  "If loadMetrics is re-created on every render, which version does the interval hold?",
];

export const SCENARIO_PARAGRAPHS: string[] = [
  'Users report the analytics dashboard becomes fully unresponsive after clicking the "Refresh" filter button roughly three times in quick succession.',
  "Chrome DevTools shows a long task blocking the main thread. The UI stops reflecting new data until a hard refresh.",
  "Reproduces reliably on the /dashboard/overview route with more than 200 rows loaded. Your job: find the exact line causing the runaway behavior, explain the root cause, and ship a fix.",
];

export const FILE_TREE: FileTreeNode[] = [
  { depth: 0, name: "src", type: "folder" },
  { depth: 1, name: "components", type: "folder" },
  { depth: 2, highlight: true, name: "Dashboard.jsx", type: "file" },
  { depth: 2, name: "FilterBar.jsx", type: "file" },
  { depth: 2, name: "RowTable.jsx", type: "file" },
  { depth: 1, name: "hooks", type: "folder" },
  { depth: 2, name: "useFilteredRows.js", type: "file" },
];

export function getChallengeById(id: string | undefined): Challenge {
  return CHALLENGES.find((c) => c.id === id) ?? CHALLENGES[0];
}
