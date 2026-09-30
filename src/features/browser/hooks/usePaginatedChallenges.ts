"use client";

import { useDebounce } from "ahooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { listChallengesAction } from "@/features/challenge/actions";
import type { ListChallengesQuery } from "@/features/challenge/validation";
import type { Category, Challenge, Difficulty } from "@/lib/domain/types";

const DEBOUNCE_WAIT = 400;

function mapDtoToChallenge(
  dto: {
    buggyArtifact: unknown;
    categoryColor: string | null;
    categoryIcon: string | null;
    categoryName: string;
    categorySlug: string;
    difficulty: string;
    id: string;
    prompt: string;
    submissions: Array<{
      fixCorrect: boolean | null;
      totalScore: number | null;
      userId: string;
    }>;
    title: string;
  },
  userId?: string | null
): Challenge {
  const artifact = dto.buggyArtifact as {
    entryFile?: string;
    points?: number;
    timeLimit?: string;
  };
  const diff = (dto.difficulty.charAt(0).toUpperCase() +
    dto.difficulty.slice(1)) as Difficulty;
  const timeLimit = artifact.timeLimit ?? "25 min";
  const successful = dto.submissions.filter(
    (s) => s.fixCorrect || (s.totalScore ?? 0) >= 60
  );
  const solved = userId ? successful.some((s) => s.userId === userId) : false;
  return {
    category: dto.categoryName as Category,
    categoryColor: dto.categoryColor,
    categoryIcon: dto.categoryIcon,
    categorySlug: dto.categorySlug,
    difficulty: diff,
    filePath: artifact.entryFile ?? "main.ts",
    id: dto.id,
    points: artifact.points ?? 200,
    solved,
    solves: successful.length,
    teaser:
      dto.prompt.length > 120 ? `${dto.prompt.slice(0, 120)}...` : dto.prompt,
    time: `~${timeLimit}`,
    timeLimit,
    title: dto.title,
  };
}

interface UsePaginatedChallengesOptions {
  initialChallenges: Challenge[];
  initialPage?: number;
  initialPageSize?: number;
  initialTotal?: number;
  userId?: string | null;
}

function buildNextSearchString(args: {
  category: string;
  debouncedSearch: string;
  difficulty: string;
  page: number;
  pageSize: number;
}): string {
  const next = new URLSearchParams();
  if (args.debouncedSearch) {
    next.set("search", args.debouncedSearch);
  }
  if (args.category !== "all") {
    next.set("category", args.category);
  }
  if (args.difficulty !== "all") {
    next.set("difficulty", args.difficulty);
  }
  if (args.page !== 1) {
    next.set("page", String(args.page));
  }
  if (args.pageSize !== 6) {
    next.set("pageSize", String(args.pageSize));
  }
  return next.toString();
}

function getUrlParams(): {
  category: string;
  difficulty: string;
  page: number;
  pageSize: number;
  search: string;
} {
  if (typeof window === "undefined") {
    return {
      category: "all",
      difficulty: "all",
      page: 1,
      pageSize: 6,
      search: "",
    };
  }
  const params = new URLSearchParams(window.location.search);
  const rawPage = Number(params.get("page") ?? "1");
  const rawPageSize = Number(params.get("pageSize") ?? "6");
  return {
    category: params.get("category") ?? "all",
    difficulty: params.get("difficulty") ?? "all",
    page: Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1,
    pageSize:
      Number.isFinite(rawPageSize) && rawPageSize >= 1 ? rawPageSize : 6,
    search: params.get("search") ?? "",
  };
}

function getCurrentSearchString(): string {
  return new URLSearchParams(window.location.search).toString();
}

export function usePaginatedChallenges(options: UsePaginatedChallengesOptions) {
  const {
    initialChallenges,
    initialTotal = initialChallenges.length,
    initialPage = 1,
    initialPageSize = 6,
    userId = null,
  } = options;

  const [search, setSearch] = useState(() => getUrlParams().search);
  const debouncedSearch = useDebounce(search, { wait: DEBOUNCE_WAIT });
  const [category, setCategory] = useState(() => getUrlParams().category);
  const [difficulty, setDifficulty] = useState(() => getUrlParams().difficulty);
  const [page, setPage] = useState(() => getUrlParams().page);
  const [pageSize, setPageSize] = useState(() => getUrlParams().pageSize);

  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(
    initialTotal > 0 ? Math.ceil(initialTotal / initialPageSize) : 0
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const isFirstRenderRef = useRef(true);
  const prevUrlRef = useRef(
    typeof window === "undefined" ? "" : window.location.search
  );
  const prevFiltersRef = useRef({
    category,
    debouncedSearch,
    difficulty,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const current = getCurrentSearchString();
    const nextString = buildNextSearchString({
      category,
      debouncedSearch,
      difficulty,
      page,
      pageSize,
    });
    if (current === nextString) {
      return;
    }
    const base = window.location.pathname;
    const url = nextString ? `${base}?${nextString}` : base;
    const prev = new URLSearchParams(prevUrlRef.current.replace(/^\?/, ""));
    const nextWithoutPage = new URLSearchParams(nextString);
    const prevWithoutPage = new URLSearchParams(prev.toString());
    nextWithoutPage.delete("page");
    prevWithoutPage.delete("page");
    const usePush =
      prevWithoutPage.toString() === nextWithoutPage.toString() &&
      prevUrlRef.current !== "";
    if (usePush) {
      window.history.pushState(null, "", url);
    } else {
      window.history.replaceState(null, "", url);
    }
    prevUrlRef.current = `?${nextString}`;
  }, [category, debouncedSearch, difficulty, page, pageSize]);

  useEffect(() => {
    const onPopState = () => {
      const url = getUrlParams();
      prevUrlRef.current = window.location.search;
      setSearch((prev) => (prev === url.search ? prev : url.search));
      setCategory((prev) => (prev === url.category ? prev : url.category));
      setDifficulty((prev) =>
        prev === url.difficulty ? prev : url.difficulty
      );
      setPage((prev) => (prev === url.page ? prev : url.page));
      setPageSize((prev) => (prev === url.pageSize ? prev : url.pageSize));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const changed =
      prev.category !== category ||
      prev.difficulty !== difficulty ||
      prev.debouncedSearch !== debouncedSearch;
    prevFiltersRef.current = { category, debouncedSearch, difficulty };
    if (changed && page !== 1) {
      setPage(1);
    }
  }, [category, difficulty, debouncedSearch, page]);

  const applySuccess = useCallback(
    (data: {
      items: Array<{
        buggyArtifact: unknown;
        categoryColor: string | null;
        categoryIcon: string | null;
        categoryName: string;
        categorySlug: string;
        difficulty: string;
        id: string;
        prompt: string;
        submissions: Array<{
          fixCorrect: boolean | null;
          totalScore: number | null;
          userId: string;
        }>;
        title: string;
      }>;
      total: number;
      totalPages: number;
    }) => {
      const mapped = data.items.map((dto) => mapDtoToChallenge(dto, userId));
      setChallenges(mapped);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    },
    [userId]
  );

  const applyActionError = useCallback(
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

  const handleFetchError = useCallback((err: unknown, signal: AbortSignal) => {
    if (signal.aborted) {
      return;
    }
    if ((err as Error).name === "AbortError") {
      return;
    }
    setError(err instanceof Error ? err.message : "Failed to load");
  }, []);

  const fetchData = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listChallengesAction({
          category: category as ListChallengesQuery["category"],
          difficulty: difficulty as ListChallengesQuery["difficulty"],
          page,
          pageSize,
          search: debouncedSearch,
        });
        if (signal.aborted) {
          return;
        }
        if (res?.data) {
          applySuccess(
            res.data as {
              items: Array<{
                buggyArtifact: unknown;
                categoryColor: string | null;
                categoryIcon: string | null;
                categoryName: string;
                categorySlug: string;
                difficulty: string;
                id: string;
                prompt: string;
                submissions: Array<{
                  fixCorrect: boolean | null;
                  totalScore: number | null;
                  userId: string;
                }>;
                title: string;
              }>;
              total: number;
              totalPages: number;
            }
          );
          return;
        }
        applyActionError(
          res as { serverError?: string; validationErrors?: unknown }
        );
      } catch (err) {
        handleFetchError(err, signal);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [
      applyActionError,
      applySuccess,
      category,
      difficulty,
      debouncedSearch,
      handleFetchError,
      page,
      pageSize,
    ]
  );

  useEffect(() => {
    if (isFirstRenderRef.current === true) {
      isFirstRenderRef.current = false;
      const url = getUrlParams();
      const isInitialState =
        debouncedSearch === url.search &&
        category === url.category &&
        difficulty === url.difficulty &&
        page === url.page &&
        pageSize === url.pageSize &&
        initialChallenges.length > 0;
      if (isInitialState) {
        return;
      }
      const isDefaultState =
        debouncedSearch === "" &&
        category === "all" &&
        difficulty === "all" &&
        page === initialPage &&
        pageSize === initialPageSize &&
        initialChallenges.length > 0;
      if (isDefaultState) {
        return;
      }
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    fetchData(ctrl.signal);
    return () => ctrl.abort();
  }, [
    category,
    debouncedSearch,
    difficulty,
    fetchData,
    initialChallenges.length,
    initialPage,
    initialPageSize,
    page,
    pageSize,
  ]);

  return {
    category,
    challenges,
    difficulty,
    error,
    loading,
    page,
    pageSize,
    search,
    setCategory,
    setDifficulty,
    setPage,
    setPageSize,
    setSearch,
    total,
    totalPages,
  };
}
