"use client";

import { useDebounce } from "ahooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { listAdminChallengesAction } from "../actions";
import type { AdminChallengeItem } from "../types";
import type { ListAdminChallengesQuery } from "../validation";

const DEBOUNCE_WAIT = 400;
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

interface UseAdminChallengesOptions {
  initialItems?: AdminChallengeItem[];
  initialPage?: number;
  initialPageSize?: number;
  initialTotal?: number;
}

function buildNextSearchString(args: {
  debouncedSearch: string;
  difficultyFilter: string;
  page: number;
  pageSize: number;
  sourceFilter: string;
  statusFilter: string;
}): string {
  const next = new URLSearchParams();
  if (args.debouncedSearch) {
    next.set("search", args.debouncedSearch);
  }
  if (args.statusFilter !== "all") {
    next.set("status", args.statusFilter);
  }
  if (args.sourceFilter !== "all") {
    next.set("source", args.sourceFilter);
  }
  if (args.difficultyFilter !== "all") {
    next.set("difficulty", args.difficultyFilter);
  }
  if (args.page !== 1) {
    next.set("page", String(args.page));
  }
  if (args.pageSize !== 10) {
    next.set("pageSize", String(args.pageSize));
  }
  return next.toString();
}

function shouldUsePushState(prevSearch: string, nextString: string): boolean {
  if (prevSearch === "") {
    return false;
  }
  const prev = new URLSearchParams(prevSearch.replace(/^\?/, ""));
  const nextWithoutPage = new URLSearchParams(nextString);
  const prevWithoutPage = new URLSearchParams(prev.toString());
  nextWithoutPage.delete("page");
  nextWithoutPage.delete("pageSize");
  prevWithoutPage.delete("page");
  prevWithoutPage.delete("pageSize");
  return prevWithoutPage.toString() === nextWithoutPage.toString();
}

function getCurrentSearchString(): string {
  return new URLSearchParams(window.location.search).toString();
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
    pageSize: (PAGE_SIZE_OPTIONS as readonly number[]).includes(rawPageSize)
      ? rawPageSize
      : 10,
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
    if (typeof window === "undefined") {
      return getUrlParams().search;
    }
    return getUrlParams().search;
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
  const isFirstRenderRef = useRef<boolean>(true);
  const prevUrlRef = useRef(
    typeof window === "undefined" ? "" : window.location.search
  );

  const applySuccessResponse = useCallback(
    (data: {
      items: AdminChallengeItem[];
      total: number;
      totalPages: number;
    }) => {
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    },
    []
  );

  const applyErrorResponse = useCallback(
    (res: { serverError?: string; validationErrors?: unknown }) => {
      if (res.serverError) {
        setError(res.serverError);
        return;
      }
      if (res.validationErrors) {
        setError("Validation failed");
      }
    },
    []
  );

  const handleCaughtError = useCallback((err: unknown, signal: AbortSignal) => {
    if (signal.aborted) {
      return;
    }
    if ((err as Error).name === "AbortError") {
      return;
    }
    setError(err instanceof Error ? err.message : "Failed to load");
  }, []);

  const finalizeLoading = useCallback((signal: AbortSignal) => {
    if (!signal.aborted) {
      setLoading(false);
    }
  }, []);

  // Sync URL when debounced search / filters / pagination change
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const current = getCurrentSearchString();
    const nextString = buildNextSearchString({
      debouncedSearch,
      difficultyFilter,
      page,
      pageSize,
      sourceFilter,
      statusFilter,
    });

    if (current === nextString) {
      return;
    }

    const base = window.location.pathname;
    const url = nextString ? `${base}?${nextString}` : base;
    const usePush = shouldUsePushState(prevUrlRef.current, nextString);
    if (usePush) {
      window.history.pushState(null, "", url);
    } else {
      window.history.replaceState(null, "", url);
    }
    prevUrlRef.current = `?${nextString}`;
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
      setSearch((prev) => (prev === url.search ? prev : url.search));
      setStatusFilter((prev) => (prev === url.status ? prev : url.status));
      setSourceFilter((prev) => (prev === url.source ? prev : url.source));
      setDifficultyFilter((prev) =>
        prev === url.difficulty ? prev : url.difficulty
      );
      setPage((prev) => (prev === url.page ? prev : url.page));
      setPageSize((prev) => (prev === url.pageSize ? prev : url.pageSize));
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
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        // Server actions are not abortable via signal; we use logical gating (ignore stale response when signal.aborted)
        const res = await listAdminChallengesAction({
          difficulty:
            difficultyFilter as ListAdminChallengesQuery["difficulty"],
          page,
          pageSize,
          search: debouncedSearch,
          source: sourceFilter as ListAdminChallengesQuery["source"],
          status: statusFilter as ListAdminChallengesQuery["status"],
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
          applySuccessResponse(data);
          return;
        }

        applyErrorResponse(
          res as { serverError?: string; validationErrors?: unknown }
        );
      } catch (err) {
        handleCaughtError(err, signal);
      } finally {
        finalizeLoading(signal);
      }
    },
    [
      applyErrorResponse,
      applySuccessResponse,
      debouncedSearch,
      difficultyFilter,
      finalizeLoading,
      handleCaughtError,
      page,
      pageSize,
      sourceFilter,
      statusFilter,
    ]
  );

  useEffect(() => {
    // Skip initial fetch if SSR hydrated data already matches current URL/props state
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

    // Logical cancellation: server action cannot be aborted, we ignore stale responses via signal.aborted checks in fetchData
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
