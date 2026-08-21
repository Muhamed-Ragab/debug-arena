import type { ScorePart } from "../types";

export const RESULT_META = {
  title: "Dashboard freezes after third click",
  category: "react" as const,
  difficulty: "Medium" as const,
  totalScore: 82,
  maxScore: 100,
  passed: true,
  submitted: "Submitted 2 minutes ago · attempt 1 of 3",
  hiddenTests: "Passed 8/8 hidden tests",
  footer: "Case closed · +82 pts added to your total",
};

export const SCORE_PARTS: ScorePart[] = [
  { label: "Localization", score: 25, max: 25, desc: "Correct file and line identified" },
  { label: "Root Cause", score: 18, max: 25, desc: "Mechanism not fully named" },
  { label: "Fix Quality", score: 24, max: 25, desc: "Correct approach, clean diff" },
  { label: "Prevention", score: 15, max: 25, desc: "Minimal; CI guard not mentioned" },
];

export const USER_EXPLANATION =
  "The useFilteredRows hook re-runs every render because it's not memoized, and setRows keeps growing the dataset on each click, so the sort inside it gets slower and slower until the thread blocks.";

export const CANONICAL =
  "useFilteredRows(rows, filter) is called unmemoized on every render and internally performs an O(n log n) sort. handleRefresh multiplies the row count on each click, so the sort cost compounds quadratically until the main thread is blocked.";

export const AI_FEEDBACK =
  "Correctly identified the missing memoization and the compounding data growth. You didn't name the O(n log n) sort as the specific cost driver — that's why root cause is 18/25, not full marks.";

export const FIX_FILE = "Dashboard.jsx";

export interface FixDiffLine {
  type: "ctx" | "add" | "del";
  line: number;
  text: string;
}

export const FIX_DIFF: FixDiffLine[] = [
  { type: "del", line: 11, text: "const filteredRows = useFilteredRows(rows, filter);" },
  {
    type: "add",
    line: 11,
    text: "const filteredRows = useMemo(() => filterRows(rows, filter), [rows, filter]);",
  },
  { type: "del", line: 15, text: "setRows(generateRows(500 * (clickCount + 1)));" },
  { type: "add", line: 15, text: "refreshRows();" },
];

export const PREVENTION: string[] = [
  "Memoize any derived value that runs expensive work (sorting, filtering, grouping) with useMemo, especially inside components that re-render on user interaction.",
  "Keep dataset size decoupled from unrelated event handlers — \"refresh\" should re-fetch or re-render, never silently multiply the working set.",
  "Add a React Profiler check or a long-task budget test in CI for interactive views that handle 100+ rows client-side.",
];
