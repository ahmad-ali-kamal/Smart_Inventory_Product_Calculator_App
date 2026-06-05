import { ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 15;

function getVisiblePages(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [];
    pages.push(1);
    if (current > 3) pages.push("...");
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const visible = getVisiblePages(currentPage, totalPages);

    const btn =
        "flex items-center justify-center min-w-[36px] h-9 px-2 rounded-lg text-sm font-semibold transition-colors duration-150 select-none";
    const activeBtn =
        "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm";
    const inactiveBtn =
        "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]";
    const disabledBtn =
        "text-[var(--muted-foreground)]/40 pointer-events-none";

    return (
        <nav
            className="flex items-center justify-center gap-1.5 pt-4 pb-2"
            aria-label="Pagination"
        >
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`${btn} ${currentPage === 1 ? disabledBtn : inactiveBtn}`}
                aria-label="Previous page"
            >
                <ChevronLeft size={18} strokeWidth={2.5} />
            </button>

            {/* Mobile: show compact indicator */}
            <span className="sm:hidden px-3 text-sm font-bold text-[var(--muted-foreground)]">
                {currentPage} / {totalPages}
            </span>

            {/* Desktop: show page numbers */}
            <div className="hidden sm:flex items-center gap-1">
                {visible.map((p, i) =>
                    p === "..." ? (
                        <span
                            key={`ellipsis-${i}`}
                            className="px-1 text-sm text-[var(--muted-foreground)]/50 select-none"
                        >
                            ...
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`${btn} ${p === currentPage ? activeBtn : inactiveBtn}`}
                            aria-current={p === currentPage ? "page" : undefined}
                        >
                            {p}
                        </button>
                    ),
                )}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`${btn} ${currentPage === totalPages ? disabledBtn : inactiveBtn}`}
                aria-label="Next page"
            >
                <ChevronRight size={18} strokeWidth={2.5} />
            </button>
        </nav>
    );
}

export { ITEMS_PER_PAGE };
