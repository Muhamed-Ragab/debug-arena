import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PaginationItemType = number | "ellipsis";

export function getPaginationItems(
  currentPage: number,
  totalPages: number,
  siblingCount = 1
): PaginationItemType[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftBoundary = 3 + siblingCount;
  const rightBoundary = totalPages - (2 + siblingCount);

  if (currentPage <= leftBoundary) {
    const leftCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftCount }, (_, i) => i + 1);
    return [...leftRange, "ellipsis", totalPages];
  }

  if (currentPage >= rightBoundary) {
    const rightCount = 3 + 2 * siblingCount;
    const startPage = totalPages - rightCount + 1;
    const rightRange = Array.from(
      { length: rightCount },
      (_, i) => startPage + i
    );
    return [1, "ellipsis", ...rightRange];
  }

  const middleRange = Array.from(
    { length: 2 * siblingCount + 1 },
    (_, i) => currentPage - siblingCount + i
  );
  return [1, "ellipsis", ...middleRange, "ellipsis", totalPages];
}

export interface ResponsivePaginationProps extends ComponentProps<"nav"> {
  currentPage: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalItems?: number;
  totalPages: number;
}

export function ResponsivePagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  disabled = false,
  className,
  ...props
}: ResponsivePaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginationItems = getPaginationItems(safePage, totalPages);

  const from = pageSize ? (safePage - 1) * pageSize + 1 : undefined;
  let to: number | undefined;
  if (pageSize && totalItems) {
    to = Math.min(safePage * pageSize, totalItems);
  } else if (pageSize) {
    to = safePage * pageSize;
  }

  return (
    <nav
      aria-label="Pagination Navigation"
      className={cn("flex flex-col items-center gap-3", className)}
      {...props}
    >
      {/* Mobile compact view: Previous, Page X of Y, Next */}
      <div className="flex w-full items-center justify-between gap-2 sm:hidden">
        <Button
          aria-label="Go to previous page"
          className="h-8 gap-1 px-2.5 text-xs"
          disabled={safePage === 1 || disabled}
          onClick={() => onPageChange(safePage - 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          <ChevronLeft className="size-3.5" />
          <span>{"Previous"}</span>
        </Button>

        <span className="font-medium text-muted-foreground text-xs tabular-nums">
          {`Page ${String(safePage)} of ${String(totalPages)}`}
        </span>

        <Button
          aria-label="Go to next page"
          className="h-8 gap-1 px-2.5 text-xs"
          disabled={safePage === totalPages || disabled}
          onClick={() => onPageChange(safePage + 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          <span>{"Next"}</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>

      {/* Desktop view: Page numbers with ellipsis */}
      <div className="hidden sm:flex sm:items-center sm:justify-center sm:gap-1">
        <Button
          aria-label="Go to previous page"
          className="h-9 w-9 p-0"
          disabled={safePage === 1 || disabled}
          onClick={() => onPageChange(safePage - 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {paginationItems.map((item, index) => {
          if (item === "ellipsis") {
            return (
              <span
                className="flex h-9 w-9 items-center justify-center text-muted-foreground"
                key={`ellipsis-${String(index)}`}
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">{"More pages"}</span>
              </span>
            );
          }

          const isCurrent = item === safePage;
          return (
            <Button
              aria-current={isCurrent ? "page" : undefined}
              aria-label={`Page ${String(item)}`}
              className="h-9 min-w-9 px-3 text-sm"
              disabled={disabled}
              key={item}
              onClick={() => onPageChange(item)}
              size="sm"
              type="button"
              variant={isCurrent ? "default" : "outline"}
            >
              {item}
            </Button>
          );
        })}

        <Button
          aria-label="Go to next page"
          className="h-9 w-9 p-0"
          disabled={safePage === totalPages || disabled}
          onClick={() => onPageChange(safePage + 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Optional count summary */}
      {totalItems !== undefined && from !== undefined && to !== undefined && (
        <p className="text-muted-foreground text-xs tabular-nums">
          {`Showing ${String(from)}–${String(to)} of ${String(totalItems)} challenges`}
        </p>
      )}
    </nav>
  );
}
