"use client";

import { useDebounce } from "ahooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { listAdminChallengesAction } from "../actions";
import type { AdminChallengeItem } from "../types";

const DEBOUNCE_WAIT = 400;

interface UseAdminChallengesOptions {
  initialItems?: AdminChallengeItem[];
  initialPage?: number;
  initialPageSize?: number;
  initialTotal?: number;
}

function getUrlParams(): {
  difficulty: string;
  page: number;
  pageSize: number;
  search: string;
  source: string;
  status: string;
} {
  if (typeof window === "undefined") {
    return {
      difficulty: "all",
      page: 1,
      pageSize: 10,
      search: "",
      source: "all",
      status: "all",
    };
  }
  const params = new URLSearchParams(window.location.search);
  const rawPage = Number(params.get("page") ?? "1");
  const rawPageSize = Number(params.get("pageSize") ?? "10");
  return {
    difficulty: params.get("difficulty") ?? "all",
    page: Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1,
    pageSize: [10, 20, 50].includes(rawPageSize) ? rawPageSize : 10,
    search: params.get("search") ?? "",
    source: params.get("source") ?? "all",
    status: params.get("status") ?? "all",
  };
}

export function useAdminChallenges(options: UseAdminChallengesOptions = {}) {
  const {
    initialItems = [],
    initialTotal = 0,
    initialPage = 1,
    initialPageSize = 10,
  } = options;

  // Initialize from URL if present, else from props
  const [search, setSearch] = useState(() => {
    if (typeof window !== "undefined") {
      return getUrlParams().search;
    }
    return "";
  });
  const debouncedSearch = useDebounce(search, { wait: DEBOUNCE_WAIT });
  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window !== "undefined") {
      return getUrlParams().status;
    }
    return "all";
  });
  const [sourceFilter, setSourceFilter] = useState(() => {
    if (typeof window !== "undefined") {
      return getUrlParams().source;
    }
    return "all";
  });
  const [difficultyFilter, setDifficultyFilter] = useState(() => {
    if (typeof window !== "undefined") {
      return getUrlParams().difficulty;
    }
    return "all";
  });
  const [page, setPage] = useState(() => {
    if (typeof window !== "undefined") {
      return getUrlParams().page;
    }
    return initialPage;
  });
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window !== "undefined") {
      return getUrlParams().pageSize;
    }
    return initialPageSize;
  });

  const [items, setItems] = useState<AdminChallengeItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(
    initialTotal > 0 ? Math.ceil(initialTotal / initialPageSize) : 0
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const prevFiltersRef = useRef({
    debouncedSearch,
    difficultyFilter,
    sourceFilter,
    statusFilter,
  });
  const isFirstRenderRef = useRef(true);
  const prevUrlRef = useRef(
    typeof window !== "undefined" ? window.location.search : ""
  );

  // Sync URL when debounced search / filters / pagination change
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const current = params.toString();
    const next = new URLSearchParams();

    if (debouncedSearch) {
      next.set("search", debouncedSearch);
    }
    if (statusFilter !== "all") {
      next.set("status", statusFilter);
    }
    if (sourceFilter !== "all") {
      next.set("source", sourceFilter);
    }
    if (difficultyFilter !== "all") {
      next.set("difficulty", difficultyFilter);
    }
    if (page !== 1) {
      next.set("page", String(page));
    }
    if (pageSize !== 10) {
      next.set("pageSize", String(pageSize));
    }

    const nextString = next.toString();
    if (current !== nextString) {
      const base = window.location.pathname;
      const url = nextString ? `${base}?${nextString}` : base;
      // Use push for pagination-only changes to support back/forward, replace for filter/search
      const prev = new URLSearchParams(prevUrlRef.current.replace(/^\?/, ""));
      const nextWithoutPage = new URLSearchParams(nextString);
      const prevWithoutPage = new URLSearchParams(prev.toString());
      nextWithoutPage.delete("page");
      nextWithoutPage.delete("pageSize");
      prevWithoutPage.delete("page");
      prevWithoutPage.delete("pageSize");
      const isPaginationOnly =
        prevWithoutPage.toString() === nextWithoutPage.toString() &&
        prevUrlRef.current !== "";
      if (isPaginationOnly) {
        window.history.pushState(null, "", url);
      } else {
        window.history.replaceState(null, "", url);
      }
      prevUrlRef.current = `?${nextString}`;
    }
  }, [
    debouncedSearch,
    statusFilter,
    sourceFilter,
    difficultyFilter,
    page,
    pageSize,
  ]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const onPopState = () => {
      const url = getUrlParams();
      prevUrlRef.current = window.location.search;
      setSearch((prev) => (prev !== url.search ? url.search : prev));
      setStatusFilter((prev) => (prev !== url.status ? url.status : prev));
      setSourceFilter((prev) => (prev !== url.source ? url.source : prev));
      setDifficultyFilter((prev) =>
        prev !== url.difficulty ? url.difficulty : prev
      );
      setPage((prev) => (prev !== url.page ? url.page : prev));
      setPageSize((prev) => (prev !== url.pageSize ? url.pageSize : prev));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Reset page to 1 when debounced search or filters change
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const changed =
      prev.debouncedSearch !== debouncedSearch ||
      prev.statusFilter !== statusFilter ||
      prev.sourceFilter !== sourceFilter ||
      prev.difficultyFilter !== difficultyFilter;

    prevFiltersRef.current = {
      debouncedSearch,
      difficultyFilter,
      sourceFilter,
      statusFilter,
    };

    if (changed && page !== 1) {
      setPage(1);
    }
  }, [debouncedSearch, statusFilter, sourceFilter, difficultyFilter, page]);

  // Reset page to 1 when pageSize changes
  const handlePageSizeChange = useCallback((nextSize: number) => {
    setPageSize(nextSize);
    setPage(1);
  }, []);

  const fetchData = useCallback(
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: fetch with error handling branches
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listAdminChallengesAction({
          difficulty: difficultyFilter as never,
          page,
          pageSize,
          search: debouncedSearch,
          source: sourceFilter as never,
          status: statusFilter as never,
        });

        if (signal.aborted) {
          return;
        }

        if (res?.data) {
          const data = res.data as {
            items: AdminChallengeItem[];
            total: number;
            totalPages: number;
          };
          setItems(data.items);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        } else if (res?.serverError) {
          setError(res.serverError);
        } else if (res?.validationErrors) {
          setError("Validation failed");
        }
      } catch (err) {
        if (signal.aborted) {
          return;
        }
        if ((err as Error).name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [
      debouncedSearch,
      difficultyFilter,
      page,
      pageSize,
      sourceFilter,
      statusFilter,
    ]
  );

  useEffect(() => {
    // Skip initial fetch if we have SSR hydrated data and params are still at initial state
    if (isFirstRenderRef.current === true) {
      isFirstRenderRef.current = false;
      const url = getUrlParams();
      const isInitialState =
        debouncedSearch === url.search &&
        statusFilter === url.status &&
        sourceFilter === url.source &&
        difficultyFilter === url.difficulty &&
        page === url.page &&
        pageSize === url.pageSize &&
        initialItems.length > 0;
      if (isInitialState) {
        return;
      }
      // Fallback for default page 1 case where URL is empty but props have data
      const isDefaultState =
        debouncedSearch === "" &&
        statusFilter === "all" &&
        sourceFilter === "all" &&
        difficultyFilter === "all" &&
        page === initialPage &&
        pageSize === initialPageSize &&
        initialItems.length > 0;
      if (isDefaultState) {
        return;
      }
    }

    // Abort previous request (logical cancellation for server action)
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    fetchData(ctrl.signal);

    return () => {
      ctrl.abort();
    };
  }, [
    debouncedSearch,
    difficultyFilter,
    fetchData,
    initialItems.length,
    initialPage,
    initialPageSize,
    page,
    pageSize,
    sourceFilter,
    statusFilter,
  ]);

  const refetch = useCallback(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    fetchData(ctrl.signal);
  }, [fetchData]);

  return {
    debouncedSearch,
    difficultyFilter,
    error,
    items,
    loading,
    page,
    pageSize,
    refetch,
    search,
    setDifficultyFilter,
    setPage,
    setPageSize: handlePageSizeChange,
    setSearch,
    setSourceFilter,
    setStatusFilter,
    sourceFilter,
    statusFilter,
    total,
    totalPages,
  };
}
