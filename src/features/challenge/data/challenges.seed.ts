export interface SeedChallenge {
  buggyArtifact: {
    buggyLines: [number, number];
    entryFile: string;
    files: Array<{
      code: string;
      isEntry?: boolean;
      name: string;
    }>;
    language: string;
    points: number;
    timeLimit: string;
  };
  categorySlug: "react-rendering" | "backend-concurrency";
  difficulty: "easy" | "medium" | "hard";
  format: "code_snippet";
  hiddenTests: Array<{
    description: string;
    name: string;
    testCode: string;
  }>;
  hints: Array<{
    order: number;
    penaltyPoints: number;
    socraticPrompt: string;
  }>;
  preventionNotes: string;
  prompt: string;
  referenceFix: {
    diff: Array<{
      line?: number;
      text: string;
      type: "ctx" | "add" | "del";
    }>;
    files: Array<{
      code: string;
      name: string;
    }>;
  };
  rootCauseSummary: string;
  slug: string;
  source: "manual";
  status: "published";
  title: string;
}

export const SEED_CATEGORIES = [
  {
    description:
      "Component lifecycle, hook dependencies, memoization, and rendering bugs.",
    name: "React Rendering",
    slug: "react-rendering",
  },
  {
    description:
      "Race conditions, deadlocks, connection leaks, N+1 queries, and concurrency hazards.",
    name: "Backend Concurrency",
    slug: "backend-concurrency",
  },
] as const;

export const SEED_CHALLENGES: SeedChallenge[] = [
  // 1. Stale Closure
  {
    buggyArtifact: {
      buggyLines: [8, 8],
      entryFile: "Counter.tsx",
      files: [
        {
          code: `import { useState, useEffect } from "react";

export function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <div>Count: {count}</div>;
}`,
          isEntry: true,
          name: "Counter.tsx",
        },
      ],
      language: "typescript",
      points: 100,
      timeLimit: "15 min",
    },
    categorySlug: "react-rendering",
    difficulty: "easy",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Verify functional updater produces incremental values",
        name: "Timer increments on sequential state updates",
        testCode: `
          let state = 0;
          const updater = (fn) => { state = typeof fn === 'function' ? fn(state) : fn; };
          const tick = () => { updater((c) => c + 1); };
          tick(); tick(); tick();
          if (state !== 3) throw new Error('Expected count 3, got ' + state);
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "Look closely at the closure captured by the setInterval callback. What value of 'count' does it see across ticks?",
      },
      {
        order: 2,
        penaltyPoints: 10,
        socraticPrompt:
          "How can you tell React to update state based on the latest current state without adding count to the effect dependency array?",
      },
    ],
    preventionNotes:
      "Always use functional state updates (setCount(c => c + 1)) when computing the next state based on prior state inside asynchronous callbacks, intervals, or event listeners.",
    prompt:
      "A counter component with a Start Interval button increments only once from 0 to 1 and then gets stuck, despite the interval firing every second.",
    referenceFix: {
      diff: [
        { line: 7, text: "    const timer = setInterval(() => {", type: "ctx" },
        { line: 8, text: "      setCount(count + 1);", type: "del" },
        { line: 8, text: "      setCount((c) => c + 1);", type: "add" },
        { line: 9, text: "    }, 1000);", type: "ctx" },
      ],
      files: [
        {
          code: `import { useState, useEffect } from "react";

export function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => c + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <div>Count: {count}</div>;
}`,
          name: "Counter.tsx",
        },
      ],
    },
    rootCauseSummary:
      "The setInterval callback closes over the initial count variable (0) in the mount closure because useEffect has an empty dependency array. Without a functional state updater, setCount(count + 1) continuously evaluates to setCount(0 + 1) = 1.",
    slug: "stale-closure-timer",
    source: "manual",
    status: "published",
    title: "Interval timer captures initial count",
  },

  // 2. Missing Effect Dependency
  {
    buggyArtifact: {
      buggyLines: [9, 9],
      entryFile: "UserProfile.tsx",
      files: [
        {
          code: `import { useState, useEffect } from "react";

export function UserProfile({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile(userId).then((data) => setProfile(data));
  }, []);

  return <div>{profile?.name}</div>;
}`,
          isEntry: true,
          name: "UserProfile.tsx",
        },
      ],
      language: "typescript",
      points: 100,
      timeLimit: "15 min",
    },
    categorySlug: "react-rendering",
    difficulty: "easy",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Verify userId dependency is included in array",
        name: "Effect triggers on prop change",
        testCode: `
          const deps = ['userId'];
          if (!deps.includes('userId')) throw new Error('Missing userId in deps');
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "When should the profile fetch re-trigger? What controls effect execution?",
      },
      {
        order: 2,
        penaltyPoints: 10,
        socraticPrompt:
          "Check the dependency array at the end of the useEffect call.",
      },
    ],
    preventionNotes:
      "Always declare all reactive values referenced inside useEffect in its dependency array, or leverage React Query / SWR for automated cache key refetching.",
    prompt:
      "Navigating between user profiles (/users/1 and /users/2) displays the first user's data forever. The component fails to fetch the updated profile.",
    referenceFix: {
      diff: [
        {
          line: 8,
          text: "    fetchProfile(userId).then((data) => setProfile(data));",
          type: "ctx",
        },
        { line: 9, text: "  }, []);", type: "del" },
        { line: 9, text: "  }, [userId]);", type: "add" },
      ],
      files: [
        {
          code: `import { useState, useEffect } from "react";

export function UserProfile({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile(userId).then((data) => setProfile(data));
  }, [userId]);

  return <div>{profile?.name}</div>;
}`,
          name: "UserProfile.tsx",
        },
      ],
    },
    rootCauseSummary:
      "The useEffect hook specifies an empty dependency array [], preventing React from re-running the fetch effect when the userId prop changes.",
    slug: "missing-effect-dependency",
    source: "manual",
    status: "published",
    title: "User profile does not update when userId changes",
  },

  // 3. Array Index Key Mutation
  {
    buggyArtifact: {
      buggyLines: [11, 11],
      entryFile: "TodoList.tsx",
      files: [
        {
          code: `import { useState } from "react";
import { TodoItem } from "./TodoItem";

export function TodoList() {
  const [items, setItems] = useState([
    { id: "a1", text: "Buy milk" },
    { id: "b2", text: "Walk dog" },
  ]);

  return (
    <ul>
      {items.map((item, index) => (
        <TodoItem key={index} item={item} />
      ))}
    </ul>
  );
}`,
          isEntry: true,
          name: "TodoList.tsx",
        },
      ],
      language: "typescript",
      points: 200,
      timeLimit: "25 min",
    },
    categorySlug: "react-rendering",
    difficulty: "medium",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Ensure item.id is used as key",
        name: "List item key matches stable ID",
        testCode: `
          const item = { id: 'unique_123', text: 'Item' };
          const key = item.id;
          if (key !== 'unique_123') throw new Error('Key must be item.id');
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "How does React determine which list item moved, was deleted, or changed state during reconciliation?",
      },
      {
        order: 2,
        penaltyPoints: 10,
        socraticPrompt:
          "What happens to key={index} when the first element of an array is removed?",
      },
    ],
    preventionNotes:
      "Always use stable, unique entity identifiers (such as item.id) for keys when rendering dynamic collections.",
    prompt:
      "When deleting an item from a list of todo input rows, the input text of the deleted row remains in the DOM attached to the next item.",
    referenceFix: {
      diff: [
        { line: 11, text: "      {items.map((item, index) => (", type: "del" },
        {
          line: 12,
          text: "        <TodoItem key={index} item={item} />",
          type: "del",
        },
        { line: 11, text: "      {items.map((item) => (", type: "add" },
        {
          line: 12,
          text: "        <TodoItem key={item.id} item={item} />",
          type: "add",
        },
      ],
      files: [
        {
          code: `import { useState } from "react";
import { TodoItem } from "./TodoItem";

export function TodoList() {
  const [items, setItems] = useState([
    { id: "a1", text: "Buy milk" },
    { id: "b2", text: "Walk dog" },
  ]);

  return (
    <ul>
      {items.map((item) => (
        <TodoItem key={item.id} item={item} />
      ))}
    </ul>
  );
}`,
          name: "TodoList.tsx",
        },
      ],
    },
    rootCauseSummary:
      "Using the array index as the React key (key={index}) causes React reconciliation to match DOM nodes by positional index instead of item identity. When an item is deleted, the remaining items inherit the unmanaged local state of previous indices.",
    slug: "array-index-key-mutation",
    source: "manual",
    status: "published",
    title: "Deleting todo item preserves wrong input text",
  },

  // 4. Unmemoized Quadratic Filter
  {
    buggyArtifact: {
      buggyLines: [11, 11],
      entryFile: "Dashboard.tsx",
      files: [
        {
          code: `import { useState } from "react";
import { filterRows, generateRows } from "./utils";
import RowTable from "./RowTable";

export default function Dashboard() {
  const [rows, setRows] = useState(() => generateRows(500));
  const [filter, setFilter] = useState("");
  const [clickCount, setClickCount] = useState(0);

  // re-derives the full filtered list unmemoized on every render
  const filteredRows = filterRows(rows, filter);

  function handleRefresh() {
    setClickCount((c) => c + 1);
    setRows(generateRows(500 * (clickCount + 1)));
  }

  return (
    <div className="dashboard">
      <button onClick={handleRefresh}>Refresh</button>
      <RowTable rows={filteredRows} />
    </div>
  );
}`,
          isEntry: true,
          name: "Dashboard.tsx",
        },
      ],
      language: "typescript",
      points: 200,
      timeLimit: "25 min",
    },
    categorySlug: "react-rendering",
    difficulty: "medium",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Verify computation is wrapped in useMemo",
        name: "Filter rows memoization check",
        testCode: `
          const memoized = true;
          if (!memoized) throw new Error('Must use useMemo');
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "How often is filterRows being executed, and what happens to the size of rows on each refresh?",
      },
    ],
    preventionNotes:
      "Memoize expensive data transformations with useMemo and avoid multiplying working dataset sizes inside event handlers.",
    prompt:
      "Users report that clicking the refresh filter button three times freezes the analytics dashboard. DevTools reveals a long task blocking the main thread.",
    referenceFix: {
      diff: [
        {
          line: 11,
          text: "  const filteredRows = filterRows(rows, filter);",
          type: "del",
        },
        {
          line: 11,
          text: "  const filteredRows = useMemo(() => filterRows(rows, filter), [rows, filter]);",
          type: "add",
        },
      ],
      files: [
        {
          code: `import { useState, useMemo } from "react";
import { filterRows, generateRows } from "./utils";
import RowTable from "./RowTable";

export default function Dashboard() {
  const [rows, setRows] = useState(() => generateRows(500));
  const [filter, setFilter] = useState("");

  const filteredRows = useMemo(() => filterRows(rows, filter), [rows, filter]);

  function handleRefresh() {
    setRows(generateRows(500));
  }

  return (
    <div className="dashboard">
      <button onClick={handleRefresh}>Refresh</button>
      <RowTable rows={filteredRows} />
    </div>
  );
}`,
          name: "Dashboard.tsx",
        },
      ],
    },
    rootCauseSummary:
      "filterRows performs an expensive O(n log n) sorting and filtering operation synchronously on every render without useMemo, compounding quadratically as handleRefresh multiplies the dataset size on each click.",
    slug: "unmemoized-quadratic-filter",
    source: "manual",
    status: "published",
    title: "Dashboard freezes after third click",
  },

  // 5. Missing Event Listener Cleanup
  {
    buggyArtifact: {
      buggyLines: [9, 9],
      entryFile: "WindowWatcher.tsx",
      files: [
        {
          code: `import { useState, useEffect } from "react";

export function WindowWatcher() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
  }, []);

  return <div>Window width: {width}</div>;
}`,
          isEntry: true,
          name: "WindowWatcher.tsx",
        },
      ],
      language: "typescript",
      points: 200,
      timeLimit: "25 min",
    },
    categorySlug: "react-rendering",
    difficulty: "medium",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Verify removeEventListener is called on unmount",
        name: "Cleanup removes listener",
        testCode: `
          let removed = false;
          const cleanup = () => { removed = true; };
          cleanup();
          if (!removed) throw new Error('Cleanup must remove event listener');
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "What happens to the window event listener when this component unmounts?",
      },
    ],
    preventionNotes:
      "Always return a cleanup function from useEffect subscriptions (removeEventListener, clearInterval, unsubscribe).",
    prompt:
      "Navigating between views multiple times creates duplicate window resize handlers, causing major UI stutter and memory growth on resize.",
    referenceFix: {
      diff: [
        {
          line: 8,
          text: '    window.addEventListener("resize", handleResize);',
          type: "ctx",
        },
        {
          line: 9,
          text: '    return () => window.removeEventListener("resize", handleResize);',
          type: "add",
        },
        { line: 10, text: "  }, []);", type: "ctx" },
      ],
      files: [
        {
          code: `import { useState, useEffect } from "react";

export function WindowWatcher() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return <div>Window width: {width}</div>;
}`,
          name: "WindowWatcher.tsx",
        },
      ],
    },
    rootCauseSummary:
      "The useEffect registers a global window event listener but does not return a cleanup function to remove it when the component unmounts, leaking memory and multiplying listeners.",
    slug: "missing-event-listener-cleanup",
    source: "manual",
    status: "published",
    title: "Window resize listener causes memory leak and CPU spike",
  },

  // 6. Infinite State Loop
  {
    buggyArtifact: {
      buggyLines: [6, 6],
      entryFile: "MetricsWidget.tsx",
      files: [
        {
          code: `import { useState, useEffect } from "react";

export function MetricsWidget({ rawData }: { rawData: number[] }) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setTotal(rawData.reduce((a, b) => a + b, 0));
  });

  return <div>Total: {total}</div>;
}`,
          isEntry: true,
          name: "MetricsWidget.tsx",
        },
      ],
      language: "typescript",
      points: 100,
      timeLimit: "15 min",
    },
    categorySlug: "react-rendering",
    difficulty: "easy",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Verify dependency array is present",
        name: "Dependency array provided",
        testCode: `
          const hasDeps = true;
          if (!hasDeps) throw new Error('Must include dependency array');
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "Why does useEffect fire on every render? What argument is missing?",
      },
    ],
    preventionNotes:
      "Always supply dependency arrays to useEffect, or compute simple derived values synchronously during render instead of state synchronization.",
    prompt:
      "The metrics widget crashes immediately on initial render with 'Maximum update depth exceeded'.",
    referenceFix: {
      diff: [
        { line: 8, text: "  });", type: "del" },
        { line: 8, text: "  }, [rawData]);", type: "add" },
      ],
      files: [
        {
          code: `import { useState, useEffect } from "react";

export function MetricsWidget({ rawData }: { rawData: number[] }) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setTotal(rawData.reduce((a, b) => a + b, 0));
  }, [rawData]);

  return <div>Total: {total}</div>;
}`,
          name: "MetricsWidget.tsx",
        },
      ],
    },
    rootCauseSummary:
      "Calling useEffect without a dependency array executes after every render. Calling setTotal inside triggers another render, causing an infinite render-state update loop.",
    slug: "infinite-state-loop",
    source: "manual",
    status: "published",
    title: "Maximum update depth exceeded in metrics widget",
  },

  // 7. Direct State Mutation
  {
    buggyArtifact: {
      buggyLines: [9, 10],
      entryFile: "CartContext.tsx",
      files: [
        {
          code: `import { useState } from "react";

export function useCart() {
  const [cart, setCart] = useState<{ items: string[] }>({ items: [] });

  function addItem(item: string) {
    cart.items.push(item);
    setCart(cart);
  }

  return { cart, addItem };
}`,
          isEntry: true,
          name: "CartContext.tsx",
        },
      ],
      language: "typescript",
      points: 200,
      timeLimit: "25 min",
    },
    categorySlug: "react-rendering",
    difficulty: "medium",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Assert cart reference changes on add",
        name: "Immutable state update produces new reference",
        testCode: `
          const prev = { items: ['a'] };
          const next = { ...prev, items: [...prev.items, 'b'] };
          if (prev === next || prev.items === next.items) throw new Error('Must return new reference');
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "How does React detect that state has changed to trigger a component re-render?",
      },
    ],
    preventionNotes:
      "Treat React state as immutable. Always return new object and array references using spread operators or immutable helpers.",
    prompt:
      "Clicking 'Add to Cart' updates the cart item count in memory, but the cart badge in the header does not re-render.",
    referenceFix: {
      diff: [
        { line: 8, text: "    cart.items.push(item);", type: "del" },
        { line: 9, text: "    setCart(cart);", type: "del" },
        {
          line: 8,
          text: "    setCart((prev) => ({ ...prev, items: [...prev.items, item] }));",
          type: "add",
        },
      ],
      files: [
        {
          code: `import { useState } from "react";

export function useCart() {
  const [cart, setCart] = useState<{ items: string[] }>({ items: [] });

  function addItem(item: string) {
    setCart((prev) => ({ ...prev, items: [...prev.items, item] }));
  }

  return { cart, addItem };
}`,
          name: "CartContext.tsx",
        },
      ],
    },
    rootCauseSummary:
      "Directly mutating cart.items in place preserves the same object reference (cart === cart). React performs an Object.is identity check and bails out of re-rendering.",
    slug: "direct-state-mutation",
    source: "manual",
    status: "published",
    title: "Shopping cart badge does not increment on add",
  },

  // 8. Derived State Desync
  {
    buggyArtifact: {
      buggyLines: [5, 5],
      entryFile: "PriceCalculator.tsx",
      files: [
        {
          code: `import { useState } from "react";

export function PriceCalculator({ unitPrice, quantity }: { unitPrice: number; quantity: number }) {
  // Anti-pattern: mirroring prop in state without synchronization
  const [total, setTotal] = useState(unitPrice * quantity);

  return <div>Total: {total}</div>;
}`,
          isEntry: true,
          name: "PriceCalculator.tsx",
        },
      ],
      language: "typescript",
      points: 300,
      timeLimit: "35 min",
    },
    categorySlug: "react-rendering",
    difficulty: "hard",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Ensure total is calculated inline",
        name: "Derived value recalculates on prop changes",
        testCode: `
          const calc = (u, q) => u * q;
          if (calc(10, 2) !== 20 || calc(10, 3) !== 30) throw new Error('Must derive dynamically');
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "Why is useState used for a value that can be directly computed from props on each render?",
      },
    ],
    preventionNotes:
      "Calculate derived values synchronously during render instead of storing them in duplicate state.",
    prompt:
      "When a discount coupon is applied from the parent view, the item subtotal resets while the quantity input displays the wrong stale value.",
    referenceFix: {
      diff: [
        {
          line: 5,
          text: "  const [total, setTotal] = useState(unitPrice * quantity);",
          type: "del",
        },
        { line: 5, text: "  const total = unitPrice * quantity;", type: "add" },
      ],
      files: [
        {
          code: `export function PriceCalculator({ unitPrice, quantity }: { unitPrice: number; quantity: number }) {
  const total = unitPrice * quantity;

  return <div>Total: {total}</div>;
}`,
          name: "PriceCalculator.tsx",
        },
      ],
    },
    rootCauseSummary:
      "Mirroring props into useState initializes state only once on mount. Subsequent prop updates fail to update the state, leading to stale derived state desynchronization.",
    slug: "derived-state-desync",
    source: "manual",
    status: "published",
    title: "Quantity input desynchronizes with server total",
  },

  // 9. Context Cascade Re-render
  {
    buggyArtifact: {
      buggyLines: [11, 11],
      entryFile: "AppContext.tsx",
      files: [
        {
          code: `import { createContext, useState, useMemo } from "react";

export const AppContext = createContext<any>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState({ name: "Alice" });

  // Providing a new object on every render
  const value = { searchTerm, setSearchTerm, user, setUser };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}`,
          isEntry: true,
          name: "AppContext.tsx",
        },
      ],
      language: "typescript",
      points: 300,
      timeLimit: "35 min",
    },
    categorySlug: "react-rendering",
    difficulty: "hard",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Verify useMemo wraps context value",
        name: "Context value is memoized",
        testCode: `
          const memoized = true;
          if (!memoized) throw new Error('Context value must be memoized');
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "What happens to the object identity of 'value' when AppProvider re-renders?",
      },
    ],
    preventionNotes:
      "Memoize context provider values with useMemo or split high-frequency state into independent context providers.",
    prompt:
      "Typing in the top search input causes 40+ unrelated navigation buttons to re-render on every keystroke, causing typing latency.",
    referenceFix: {
      diff: [
        {
          line: 11,
          text: "  const value = { searchTerm, setSearchTerm, user, setUser };",
          type: "del",
        },
        {
          line: 11,
          text: "  const value = useMemo(() => ({ searchTerm, setSearchTerm, user, setUser }), [searchTerm, user]);",
          type: "add",
        },
      ],
      files: [
        {
          code: `import { createContext, useState, useMemo } from "react";

export const AppContext = createContext<any>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState({ name: "Alice" });

  const value = useMemo(
    () => ({ searchTerm, setSearchTerm, user, setUser }),
    [searchTerm, user]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}`,
          name: "AppContext.tsx",
        },
      ],
    },
    rootCauseSummary:
      "The context provider value object is recreated on every render as a fresh object literal, forcing all consuming components to re-render on every keystroke even if their consumed subfield is unchanged.",
    slug: "context-cascade-rerender",
    source: "manual",
    status: "published",
    title: "Typing in search bar lags entire navigation bar",
  },

  // 10. Async Update on Unmounted Component
  {
    buggyArtifact: {
      buggyLines: [9, 10],
      entryFile: "DataModal.tsx",
      files: [
        {
          code: `import { useState, useEffect } from "react";

export function DataModal({ id }: { id: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchItem(id).then((res) => {
      setData(res);
    });
  }, [id]);

  return <div>{data ? data.title : "Loading..."}</div>;
}`,
          isEntry: true,
          name: "DataModal.tsx",
        },
      ],
      language: "typescript",
      points: 200,
      timeLimit: "25 min",
    },
    categorySlug: "react-rendering",
    difficulty: "medium",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Assert state update is guarded against unmounted state",
        name: "Mounted flag guard",
        testCode: `
          let mounted = false;
          let updated = false;
          if (mounted) updated = true;
          if (updated) throw new Error('Should not update when unmounted');
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "How can the effect ignore the asynchronous response if the component unmounts before the promise resolves?",
      },
    ],
    preventionNotes:
      "Use an AbortController or a mounted flag inside useEffect cleanup to cancel or ignore pending async resolutions when unmounting.",
    prompt:
      "Dismissing a modal while a slow network request is in flight causes memory leak warnings in the console.",
    referenceFix: {
      diff: [
        { line: 7, text: "    let isMounted = true;", type: "add" },
        { line: 8, text: "    fetchItem(id).then((res) => {", type: "del" },
        { line: 9, text: "      setData(res);", type: "del" },
        { line: 8, text: "    fetchItem(id).then((res) => {", type: "add" },
        { line: 9, text: "      if (isMounted) setData(res);", type: "add" },
        {
          line: 11,
          text: "    return () => { isMounted = false; };",
          type: "add",
        },
      ],
      files: [
        {
          code: `import { useState, useEffect } from "react";

export function DataModal({ id }: { id: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    fetchItem(id).then((res) => {
      if (isMounted) setData(res);
    });
    return () => {
      isMounted = false;
    };
  }, [id]);

  return <div>{data ? data.title : "Loading..."}</div>;
}`,
          name: "DataModal.tsx",
        },
      ],
    },
    rootCauseSummary:
      "The asynchronous fetch callback resolves after the modal unmounts, attempting to call setData on an unmounted component instance.",
    slug: "async-update-unmounted",
    source: "manual",
    status: "published",
    title: "Unmounted component state update warning on modal dismiss",
  },

  // 11. Concurrency: Race Condition on Balance
  {
    buggyArtifact: {
      buggyLines: [6, 8],
      entryFile: "wallet.service.ts",
      files: [
        {
          code: `export async function withdraw(db: any, userId: string, amount: number) {
  const account = await db.query("SELECT balance FROM accounts WHERE id = $1", [userId]);
  if (account.balance < amount) {
    throw new Error("Insufficient funds");
  }
  await db.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [amount, userId]);
}`,
          isEntry: true,
          name: "wallet.service.ts",
        },
      ],
      language: "typescript",
      points: 300,
      timeLimit: "35 min",
    },
    categorySlug: "backend-concurrency",
    difficulty: "hard",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Ensure conditional WHERE clause is applied atomically",
        name: "Atomic balance deduction",
        testCode: `
          const sql = "UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1";
          if (!sql.includes("balance >= $1")) throw new Error("Must verify balance atomically in WHERE clause");
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "What happens if two requests execute the SELECT query at the exact same millisecond before either runs UPDATE?",
      },
    ],
    preventionNotes:
      "Use atomic SQL statements with conditional WHERE clauses (WHERE balance >= amount) or pessimistic row locking (SELECT ... FOR UPDATE).",
    prompt:
      "Simultaneous withdrawal requests from two devices allow withdrawing $100 twice from an account with only $100 balance.",
    referenceFix: {
      diff: [
        {
          line: 2,
          text: '  const account = await db.query("SELECT balance FROM accounts WHERE id = $1", [userId]);',
          type: "del",
        },
        { line: 3, text: "  if (account.balance < amount) {", type: "del" },
        {
          line: 4,
          text: '    throw new Error("Insufficient funds");',
          type: "del",
        },
        { line: 5, text: "  }", type: "del" },
        { line: 2, text: "  const res = await db.query(", type: "add" },
        {
          line: 3,
          text: '    "UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance",',
          type: "add",
        },
        { line: 4, text: "    [amount, userId]", type: "add" },
        { line: 5, text: "  );", type: "add" },
        {
          line: 6,
          text: '  if (res.rowCount === 0) throw new Error("Insufficient funds");',
          type: "add",
        },
      ],
      files: [
        {
          code: `export async function withdraw(db: any, userId: string, amount: number) {
  const res = await db.query(
    "UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance",
    [amount, userId]
  );
  if (res.rowCount === 0) {
    throw new Error("Insufficient funds");
  }
}`,
          name: "wallet.service.ts",
        },
      ],
    },
    rootCauseSummary:
      "Check-then-act race condition: reading balance in one query and updating in another allows concurrent requests to both pass the balance check before either deducts funds.",
    slug: "race-condition-balance",
    source: "manual",
    status: "published",
    title: "Wallet balance goes negative under concurrent withdrawals",
  },

  // 12. N+1 Query in Batch Fetch
  {
    buggyArtifact: {
      buggyLines: [5, 7],
      entryFile: "teams.service.ts",
      files: [
        {
          code: `export async function getTeamMembers(db: any, teamId: string) {
  const members = await db.query("SELECT * FROM members WHERE team_id = $1", [teamId]);
  for (const member of members) {
    member.roles = await db.query("SELECT * FROM roles WHERE member_id = $1", [member.id]);
  }
  return members;
}`,
          isEntry: true,
          name: "teams.service.ts",
        },
      ],
      language: "typescript",
      points: 200,
      timeLimit: "25 min",
    },
    categorySlug: "backend-concurrency",
    difficulty: "medium",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Ensure single batch query is executed",
        name: "Batch query execution",
        testCode: `
          const batchSql = "SELECT * FROM roles WHERE member_id = ANY($1)";
          if (!batchSql.includes("ANY") && !batchSql.includes("IN")) throw new Error("Must batch query roles");
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "How many database roundtrips are made for a team with 100 members?",
      },
    ],
    preventionNotes:
      "Use SQL JOINs, DataLoader, or single batch queries with WHERE id = ANY(...) to fetch related records in constant queries.",
    prompt:
      "Fetching /api/teams/1/members issues 51 sequential database queries instead of a batch fetch, overloading the DB connection pool.",
    referenceFix: {
      diff: [
        { line: 3, text: "  for (const member of members) {", type: "del" },
        {
          line: 4,
          text: '    member.roles = await db.query("SELECT * FROM roles WHERE member_id = $1", [member.id]);',
          type: "del",
        },
        { line: 5, text: "  }", type: "del" },
        {
          line: 3,
          text: "  const memberIds = members.map((m) => m.id);",
          type: "add",
        },
        {
          line: 4,
          text: '  const roles = await db.query("SELECT * FROM roles WHERE member_id = ANY($1)", [memberIds]);',
          type: "add",
        },
      ],
      files: [
        {
          code: `export async function getTeamMembers(db: any, teamId: string) {
  const members = await db.query("SELECT * FROM members WHERE team_id = $1", [teamId]);
  const memberIds = members.map((m: any) => m.id);
  const roles = await db.query("SELECT * FROM roles WHERE member_id = ANY($1)", [memberIds]);
  const roleMap = new Map();
  for (const r of roles) {
    if (!roleMap.has(r.member_id)) roleMap.set(r.member_id, []);
    roleMap.get(r.member_id).push(r);
  }
  for (const m of members) {
    m.roles = roleMap.get(m.id) || [];
  }
  return members;
}`,
          name: "teams.service.ts",
        },
      ],
    },
    rootCauseSummary:
      "Iterating over entities and executing asynchronous queries inside a loop produces the N+1 query antipattern, creating high network roundtrip latency.",
    slug: "n-plus-one-query",
    source: "manual",
    status: "published",
    title: "Team members list takes 8 seconds due to N+1 queries",
  },

  // 13. Unreleased Pool Client
  {
    buggyArtifact: {
      buggyLines: [5, 6],
      entryFile: "query.ts",
      files: [
        {
          code: `export async function runQuery(pool: any, sql: string) {
  const client = await pool.connect();
  const res = await client.query(sql);
  client.release();
  return res.rows;
}`,
          isEntry: true,
          name: "query.ts",
        },
      ],
      language: "typescript",
      points: 300,
      timeLimit: "35 min",
    },
    categorySlug: "backend-concurrency",
    difficulty: "hard",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Assert client.release is inside finally block",
        name: "Guaranteed client release on error",
        testCode: `
          let released = false;
          try {
            throw new Error('boom');
          } catch (e) {
          } finally {
            released = true;
          }
          if (!released) throw new Error('Must release in finally');
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "What happens to the client connection if client.query throws an error?",
      },
    ],
    preventionNotes:
      "Always acquire pooled resources with try...finally to ensure release() executes even when exceptions are thrown.",
    prompt:
      "Following an unhandled database error, all subsequent API requests freeze indefinitely because database connections are never released.",
    referenceFix: {
      diff: [
        { line: 3, text: "  try {", type: "add" },
        {
          line: 4,
          text: "    const res = await client.query(sql);",
          type: "ctx",
        },
        { line: 5, text: "    return res.rows;", type: "ctx" },
        { line: 6, text: "  } finally {", type: "add" },
        { line: 7, text: "    client.release();", type: "ctx" },
        { line: 8, text: "  }", type: "add" },
      ],
      files: [
        {
          code: `export async function runQuery(pool: any, sql: string) {
  const client = await pool.connect();
  try {
    const res = await client.query(sql);
    return res.rows;
  } finally {
    client.release();
  }
}`,
          name: "query.ts",
        },
      ],
    },
    rootCauseSummary:
      "client.release() is invoked without a try...finally block. If client.query throws an exception, client.release is bypassed, permanently exhausting the pool.",
    slug: "unreleased-pool-client",
    source: "manual",
    status: "published",
    title: "Database connection pool exhausts after HTTP 500 error",
  },

  // 14. Non-Atomic Counter Increment
  {
    buggyArtifact: {
      buggyLines: [3, 4],
      entryFile: "stats.ts",
      files: [
        {
          code: `export async function incrementViews(redis: any, pageId: string) {
  const current = await redis.get(\`views:\${pageId}\`);
  const next = (Number(current) || 0) + 1;
  await redis.set(\`views:\${pageId}\`, next);
}`,
          isEntry: true,
          name: "stats.ts",
        },
      ],
      language: "typescript",
      points: 200,
      timeLimit: "25 min",
    },
    categorySlug: "backend-concurrency",
    difficulty: "medium",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Ensure redis.incr is used",
        name: "Atomic increment call",
        testCode: `
          const usesIncr = true;
          if (!usesIncr) throw new Error('Must use atomic incr');
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "Does Redis provide an atomic single-command instruction to increment a key?",
      },
    ],
    preventionNotes:
      "Use atomic operations like Redis INCR / INCRBY or SQL UPDATE ... SET count = count + 1.",
    prompt:
      "1,000 concurrent page view events increment the view count to only 384 due to lost update anomalies.",
    referenceFix: {
      diff: [
        {
          line: 2,
          // biome-ignore lint/suspicious/noTemplateCurlyInString: code snippet diff
          text: "  const current = await redis.get(`views:${pageId}`);",
          type: "del",
        },
        {
          line: 3,
          text: "  const next = (Number(current) || 0) + 1;",
          type: "del",
        },
        {
          line: 4,
          // biome-ignore lint/suspicious/noTemplateCurlyInString: code snippet diff
          text: "  await redis.set(`views:${pageId}`, next);",
          type: "del",
        },
        {
          line: 2,
          // biome-ignore lint/suspicious/noTemplateCurlyInString: code snippet diff
          text: "  await redis.incr(`views:${pageId}`);",
          type: "add",
        },
      ],
      files: [
        {
          code: `export async function incrementViews(redis: any, pageId: string) {
  await redis.incr(\`views:\${pageId}\`);
}`,
          name: "stats.ts",
        },
      ],
    },
    rootCauseSummary:
      "Read-modify-write pattern without atomicity causes concurrent requests to read the same stale value and overwrite each other's increments.",
    slug: "non-atomic-counter",
    source: "manual",
    status: "published",
    title: "Page view counter loses 60% of clicks during traffic surge",
  },

  // 15. Singleton Duplicate Instance
  {
    buggyArtifact: {
      buggyLines: [7, 8],
      entryFile: "worker.ts",
      files: [
        {
          code: `// Module-level in-memory state in multi-instance cluster
let active = false;

export function startWorker(pubsub: any) {
  if (active) return;
  active = true;
  pubsub.on("order.created", async (order: any) => {
    await sendNotification(order);
  });
}`,
          isEntry: true,
          name: "worker.ts",
        },
      ],
      language: "typescript",
      points: 200,
      timeLimit: "25 min",
    },
    categorySlug: "backend-concurrency",
    difficulty: "medium",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Ensure consumer queue model is used",
        name: "Distributed queue processing",
        testCode: `
          const isQueue = true;
          if (!isQueue) throw new Error('Must use message queue');
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "Why does an in-memory boolean variable fail to coordinate state across multiple distinct server processes?",
      },
    ],
    preventionNotes:
      "Use distributed message queues with worker consumer groups (e.g. BullMQ / RabbitMQ) to guarantee single consumer execution.",
    prompt:
      "Scaling the service to 4 cluster instances causes background notification tasks to dispatch 4 duplicate emails per order.",
    referenceFix: {
      diff: [
        {
          line: 6,
          text: '  pubsub.on("order.created", async (order) => {',
          type: "del",
        },
        {
          line: 6,
          text: '  queue.process("order.created", async (job) => {',
          type: "add",
        },
      ],
      files: [
        {
          code: `export function startWorker(queue: any) {
  // Use distributed consumer group queue instead of raw pub/sub fanout
  queue.process("order.created", async (job: any) => {
    await sendNotification(job.data);
  });
}`,
          name: "worker.ts",
        },
      ],
    },
    rootCauseSummary:
      "Pub/sub broadcasts events to every running process instance. In-memory booleans only prevent duplicates within a single Node.js process, not across clustered instances.",
    slug: "singleton-duplicate-instance",
    source: "manual",
    status: "published",
    title: "Notification workers trigger duplicates across cluster",
  },

  // 16. Unbounded Memory Buffer Stream
  {
    buggyArtifact: {
      buggyLines: [4, 6],
      entryFile: "export.ts",
      files: [
        {
          code: `import * as fs from "fs";

export async function exportCsv(db: any, filePath: string) {
  const rows = await db.query("SELECT * FROM audit_logs");
  const content = rows.map((r: any) => \`\${r.id},\${r.action},\${r.timestamp}\`).join("\\n");
  fs.writeFileSync(filePath, content);
}`,
          isEntry: true,
          name: "export.ts",
        },
      ],
      language: "typescript",
      points: 300,
      timeLimit: "35 min",
    },
    categorySlug: "backend-concurrency",
    difficulty: "hard",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Assert pipeline and streams are used",
        name: "Streaming pipeline used",
        testCode: `
          const streaming = true;
          if (!streaming) throw new Error('Must use streams for large datasets');
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "How can you process data record-by-record as it arrives from the database without buffering the whole table in RAM?",
      },
    ],
    preventionNotes:
      "Stream large dataset operations using database cursors and Node.js stream pipelines.",
    prompt:
      "Exporting 500,000 database records allocates 2GB of RAM and crashes the Node.js worker with 'JavaScript heap out of memory'.",
    referenceFix: {
      diff: [
        {
          line: 4,
          text: '  const rows = await db.query("SELECT * FROM audit_logs");',
          type: "del",
        },
        {
          line: 5,
          // biome-ignore lint/suspicious/noTemplateCurlyInString: code snippet diff
          text: '  const content = rows.map((r) => `${r.id},${r.action}`).join("\\n");',
          type: "del",
        },
        {
          line: 6,
          text: "  fs.writeFileSync(filePath, content);",
          type: "del",
        },
        {
          line: 4,
          text: '  const cursorStream = db.queryStream("SELECT * FROM audit_logs");',
          type: "add",
        },
        {
          line: 5,
          text: "  await pipeline(cursorStream, fs.createWriteStream(filePath));",
          type: "add",
        },
      ],
      files: [
        {
          code: `import * as fs from "fs";
import { pipeline } from "stream/promises";

export async function exportCsv(db: any, filePath: string) {
  const cursorStream = db.queryStream("SELECT * FROM audit_logs");
  const writeStream = fs.createWriteStream(filePath);
  await pipeline(cursorStream, writeStream);
}`,
          name: "export.ts",
        },
      ],
    },
    rootCauseSummary:
      "Loading the entire dataset into memory as a monolithic array and single string exceeds V8 heap limits instead of streaming chunks with backpressure.",
    slug: "unbounded-memory-buffer",
    source: "manual",
    status: "published",
    title: "Large CSV export OOM kills the worker process",
  },

  // 17. Deadlock Mutex Order
  {
    buggyArtifact: {
      buggyLines: [3, 4],
      entryFile: "transfer.ts",
      files: [
        {
          code: `export async function transfer(db: any, fromId: string, toId: string, amount: number) {
  // Acquires locks in argument order
  await db.query("SELECT * FROM accounts WHERE id = $1 FOR UPDATE", [fromId]);
  await db.query("SELECT * FROM accounts WHERE id = $1 FOR UPDATE", [toId]);
  await db.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [amount, fromId]);
  await db.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [amount, toId]);
}`,
          isEntry: true,
          name: "transfer.ts",
        },
      ],
      language: "typescript",
      points: 300,
      timeLimit: "35 min",
    },
    categorySlug: "backend-concurrency",
    difficulty: "hard",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Verify locks are acquired in sorted order",
        name: "Lock ordering sorted",
        testCode: `
          const sorted = ['id1', 'id2'].sort();
          if (sorted[0] > sorted[1]) throw new Error('Lock IDs must be sorted');
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "If Thread 1 locks A then wants B, and Thread 2 locks B then wants A, what condition occurs?",
      },
    ],
    preventionNotes:
      "Always acquire locks in a globally deterministic order (e.g. sorted by ID or primary key).",
    prompt:
      "When User A transfers to User B while User B simultaneously transfers to User A, both transactions hang until database query timeout.",
    referenceFix: {
      diff: [
        {
          line: 2,
          text: "  const [firstId, secondId] = [fromId, toId].sort();",
          type: "add",
        },
        {
          line: 3,
          text: '  await db.query("SELECT * FROM accounts WHERE id = $1 FOR UPDATE", [fromId]);',
          type: "del",
        },
        {
          line: 4,
          text: '  await db.query("SELECT * FROM accounts WHERE id = $1 FOR UPDATE", [toId]);',
          type: "del",
        },
        {
          line: 3,
          text: '  await db.query("SELECT * FROM accounts WHERE id = $1 FOR UPDATE", [firstId]);',
          type: "add",
        },
        {
          line: 4,
          text: '  await db.query("SELECT * FROM accounts WHERE id = $1 FOR UPDATE", [secondId]);',
          type: "add",
        },
      ],
      files: [
        {
          code: `export async function transfer(db: any, fromId: string, toId: string, amount: number) {
  // Sort IDs to guarantee consistent global lock ordering
  const [firstId, secondId] = [fromId, toId].sort();
  await db.query("SELECT * FROM accounts WHERE id = $1 FOR UPDATE", [firstId]);
  await db.query("SELECT * FROM accounts WHERE id = $1 FOR UPDATE", [secondId]);
  await db.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [amount, fromId]);
  await db.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [amount, toId]);
}`,
          name: "transfer.ts",
        },
      ],
    },
    rootCauseSummary:
      "Inconsistent lock acquisition ordering (locking from then to) allows concurrent reciprocal transfers (A->B vs B->A) to acquire opposing locks and wait cyclically on each other (deadlock).",
    slug: "deadlock-mutex-order",
    source: "manual",
    status: "published",
    title: "Deadlock on bidirectional user fund transfers",
  },

  // 18. Missing Transaction Rollback
  {
    buggyArtifact: {
      buggyLines: [4, 6],
      entryFile: "checkout.ts",
      files: [
        {
          code: `export async function checkout(db: any, paymentClient: any, orderData: any) {
  await db.query("INSERT INTO orders (id, total) VALUES ($1, $2)", [orderData.id, orderData.total]);
  await db.query("UPDATE inventory SET stock = stock - 1 WHERE item_id = $1", [orderData.itemId]);
  await paymentClient.charge(orderData.total);
}`,
          isEntry: true,
          name: "checkout.ts",
        },
      ],
      language: "typescript",
      points: 200,
      timeLimit: "25 min",
    },
    categorySlug: "backend-concurrency",
    difficulty: "medium",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Ensure transaction wraps mutations",
        name: "Database transaction wrapping",
        testCode: `
          const inTx = true;
          if (!inTx) throw new Error('Must execute in transaction');
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "How can you ensure all database mutations roll back automatically if the payment call throws?",
      },
    ],
    preventionNotes:
      "Wrap multi-step business mutations inside database transactions and execute external integrations with appropriate rollback/compensation logic.",
    prompt:
      "When the payment gateway fails with a timeout, an order row and stock reduction remain committed in the database without payment.",
    referenceFix: {
      diff: [
        {
          line: 2,
          text: "  await db.transaction(async (tx) => {",
          type: "add",
        },
        {
          line: 3,
          text: '  await db.query("INSERT INTO orders...");',
          type: "del",
        },
        { line: 5, text: "  });", type: "add" },
      ],
      files: [
        {
          code: `export async function checkout(db: any, paymentClient: any, orderData: any) {
  await db.transaction(async (tx: any) => {
    await tx.query("UPDATE inventory SET stock = stock - 1 WHERE item_id = $1 AND stock >= 1", [orderData.itemId]);
    await paymentClient.charge(orderData.total);
    await tx.query("INSERT INTO orders (id, total) VALUES ($1, $2)", [orderData.id, orderData.total]);
  });
}`,
          name: "checkout.ts",
        },
      ],
    },
    rootCauseSummary:
      "Mutations are executed outside of a database transaction. If the subsequent payment step throws, previously executed database statements remain permanently committed.",
    slug: "missing-transaction-rollback",
    source: "manual",
    status: "published",
    title: "Order created without billing charge on gateway error",
  },

  // 19. Cache Stampede TTL
  {
    buggyArtifact: {
      buggyLines: [4, 7],
      entryFile: "cache.ts",
      files: [
        {
          code: `export async function getPopularProducts(redis: any, db: any) {
  const cached = await redis.get("popular_products");
  if (cached) return JSON.parse(cached);

  const data = await db.query("SELECT * FROM products ORDER BY views DESC LIMIT 20");
  await redis.set("popular_products", JSON.stringify(data), "EX", 3600);
  return data;
}`,
          isEntry: true,
          name: "cache.ts",
        },
      ],
      language: "typescript",
      points: 200,
      timeLimit: "25 min",
    },
    categorySlug: "backend-concurrency",
    difficulty: "medium",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Assert queries are coalesced",
        name: "Singleflight request coalescing",
        testCode: `
          const deduplicated = true;
          if (!deduplicated) throw new Error('Must deduplicate cache misses');
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "How can multiple concurrent requests for the same expired key be deduplicated so only one query hits the database?",
      },
    ],
    preventionNotes:
      "Use singleflight / mutex locking on cache misses, early probabilistic expiration (XFetch), or background cache warmers.",
    prompt:
      "When the popular products cache key expires on the hour, 5,000 concurrent requests query the database simultaneously, causing connection exhaustion.",
    referenceFix: {
      diff: [
        {
          line: 5,
          text: '  return singleflight("popular_products", async () => {',
          type: "add",
        },
        { line: 11, text: "  });", type: "add" },
      ],
      files: [
        {
          code: `import { singleflight } from "./singleflight";

export async function getPopularProducts(redis: any, db: any) {
  const cached = await redis.get("popular_products");
  if (cached) return JSON.parse(cached);

  return singleflight("popular_products", async () => {
    const fresh = await redis.get("popular_products");
    if (fresh) return JSON.parse(fresh);
    const data = await db.query("SELECT * FROM products ORDER BY views DESC LIMIT 20");
    await redis.set("popular_products", JSON.stringify(data), "EX", 3600);
    return data;
  });
}`,
          name: "cache.ts",
        },
      ],
    },
    rootCauseSummary:
      "Cache stampede (thundering herd): when a high-traffic cache key expires, all concurrent requests simultaneously experience a cache miss and issue duplicate heavy database queries.",
    slug: "cache-stampede-ttl",
    source: "manual",
    status: "published",
    title: "Database crashes with connection spike on cache expiration",
  },

  // 20. Unhandled Background Promise
  {
    buggyArtifact: {
      buggyLines: [4, 4],
      entryFile: "handler.ts",
      files: [
        {
          code: `export async function handleRequest(req: any, res: any, auditService: any) {
  const result = await processAction(req.body);
  // Floating unhandled promise
  auditService.logEvent(req.user, req.body);
  res.json({ success: true, data: result });
}`,
          isEntry: true,
          name: "handler.ts",
        },
      ],
      language: "typescript",
      points: 100,
      timeLimit: "15 min",
    },
    categorySlug: "backend-concurrency",
    difficulty: "easy",
    format: "code_snippet",
    hiddenTests: [
      {
        description: "Ensure floating promise handles rejections",
        name: "Catch handler attached",
        testCode: `
          let caught = false;
          Promise.reject(new Error('test')).catch(() => { caught = true; });
          setTimeout(() => {
            if (!caught) throw new Error('Must catch promise error');
          }, 10);
        `,
      },
    ],
    hints: [
      {
        order: 1,
        penaltyPoints: 10,
        socraticPrompt:
          "What happens if auditService.logEvent rejects its returned promise when no catch handler is attached?",
      },
    ],
    preventionNotes:
      "Always attach .catch() handlers to fire-and-forget background promises, or dispatch background jobs to a resilient queue.",
    prompt:
      "A non-critical background audit log call fails due to a network blip and crashes the entire HTTP server process with an unhandledRejection.",
    referenceFix: {
      diff: [
        {
          line: 4,
          text: "  auditService.logEvent(req.user, req.body);",
          type: "del",
        },
        {
          line: 4,
          text: "  auditService.logEvent(req.user, req.body).catch((err) => console.error(err));",
          type: "add",
        },
      ],
      files: [
        {
          code: `export async function handleRequest(req: any, res: any, auditService: any) {
  const result = await processAction(req.body);
  auditService.logEvent(req.user, req.body).catch((err: any) => {
    console.error("Audit log failed:", err);
  });
  res.json({ success: true, data: result });
}`,
          name: "handler.ts",
        },
      ],
    },
    rootCauseSummary:
      "Invoking an asynchronous function in the background without awaiting it or attaching a .catch() handler triggers an unhandledRejection event, terminating the Node.js process.",
    slug: "unhandled-promise-background",
    source: "manual",
    status: "published",
    title: "Uncaught background task error crashes HTTP server",
  },
];
