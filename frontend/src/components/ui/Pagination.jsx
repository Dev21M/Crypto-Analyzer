import React from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './Button';

/**
 * Pagination component for paginated data
 * Supports page numbers, prev/next, first/last, page size selection
 */
export function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  showPageSize = true,
  showTotal = true,
  showFirstLast = true,
  showPrevNext = true,
  maxPageButtons = 5,
  className = '',
  compact = false,
  disabled = false,
  'aria-label': ariaLabel = 'Pagination',
  ...props
}) {
  // Calculate page range to display
  const getPageRange = () => {
    if (totalPages <= maxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxPageButtons / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxPageButtons - 1);

    // Adjust if we're near the end
    if (end - start + 1 < maxPageButtons) {
      start = Math.max(1, end - maxPageButtons + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageRange = getPageRange();
  const showFirstPage = pageRange[0] > 1;
  const showLastPage = pageRange[pageRange.length - 1] < totalPages;
  const showFirstEllipsis = pageRange[0] > 2;
  const showLastEllipsis = pageRange[pageRange.length - 1] < totalPages - 1;

  const handlePageClick = (page) => {
    if (!disabled && page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange?.(page);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    onPageSizeChange?.(newSize);
    // Reset to first page when changing page size
    onPageChange?.(1);
  };

  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalPages <= 1 && !showPageSize) {
    return null;
  }

  const btnSize = compact ? 'sm' : 'md';

  return (
    <nav
      className={clsx('pagination flex flex-col sm:flex-row items-center justify-between gap-3', className)}
      aria-label={ariaLabel}
      {...props}
    >
      {/* Page Size Selector */}
      {showPageSize && totalPages > 1 && (
        <div className="flex items-center gap-2">
          <label htmlFor="pagination-page-size" className="text-sm text-muted">
            Show
          </label>
          <select
            id="pagination-page-size"
            value={pageSize}
            onChange={handlePageSizeChange}
            disabled={disabled}
            className="form-select form-select-sm w-auto"
            aria-label="Items per page"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {/* First Page */}
        {showFirstLast && showFirstPage && (
          <Button
            variant="ghost"
            size={btnSize}
            onClick={() => handlePageClick(1)}
            disabled={disabled || currentPage === 1}
            aria-label="First page"
            aria-disabled={disabled || currentPage === 1}
          >
            <ChevronsLeft size={compact ? 14 : 16} strokeWidth={2} />
          </Button>
        )}

        {/* Previous Page */}
        {showPrevNext && (
          <Button
            variant="ghost"
            size={btnSize}
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={disabled || currentPage === 1}
            aria-label="Previous page"
            aria-disabled={disabled || currentPage === 1}
          >
            <ChevronLeft size={compact ? 14 : 16} strokeWidth={2} />
          </Button>
        )}

        {/* Page Numbers */}
        {showFirstPage && showFirstEllipsis && (
          <>
            <Button
              variant="ghost"
              size={btnSize}
              onClick={() => handlePageClick(1)}
              disabled={disabled}
              aria-label="Page 1"
            >
              1
            </Button>
            <span className="pagination-ellipsis flex items-center px-1 text-muted" aria-hidden="true">
              …
            </span>
          </>
        )}

        {pageRange.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? 'primary' : 'ghost'}
            size={btnSize}
            onClick={() => handlePageClick(page)}
            disabled={disabled}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            className="min-w-[36px]"
          >
            {page}
          </Button>
        ))}

        {showLastPage && showLastEllipsis && (
          <>
            <span className="pagination-ellipsis flex items-center px-1 text-muted" aria-hidden="true">
              …
            </span>
            <Button
              variant="ghost"
              size={btnSize}
              onClick={() => handlePageClick(totalPages)}
              disabled={disabled}
              aria-label={`Page ${totalPages}`}
            >
              {totalPages}
            </Button>
          </>
        )}

        {/* Next Page */}
        {showPrevNext && (
          <Button
            variant="ghost"
            size={btnSize}
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={disabled || currentPage === totalPages}
            aria-label="Next page"
            aria-disabled={disabled || currentPage === totalPages}
          >
            <ChevronRight size={compact ? 14 : 16} strokeWidth={2} />
          </Button>
        )}

        {/* Last Page */}
        {showFirstLast && showLastPage && (
          <Button
            variant="ghost"
            size={btnSize}
            onClick={() => handlePageClick(totalPages)}
            disabled={disabled || currentPage === totalPages}
            aria-label="Last page"
            aria-disabled={disabled || currentPage === totalPages}
          >
            <ChevronsRight size={compact ? 14 : 16} strokeWidth={2} />
          </Button>
        )}
      </div>

      {/* Total Items Info */}
      {showTotal && totalItems > 0 && (
        <div className="pagination-info text-sm text-muted">
          Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalItems}</strong> results
        </div>
      )}

      {/* Page Input for large datasets */}
      {totalPages > maxPageButtons * 2 && !compact && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Go to page:</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value, 10);
              if (!isNaN(page) && page >= 1 && page <= totalPages) {
                handlePageClick(page);
              }
            }}
            onBlur={(e) => {
              const page = parseInt(e.target.value, 10);
              if (isNaN(page) || page < 1 || page > totalPages) {
                e.target.value = currentPage;
              }
            }}
            className="form-input form-input-sm w-20 text-center"
            aria-label="Go to page"
            disabled={disabled}
          />
          <span className="text-sm text-muted">of {totalPages}</span>
        </div>
      )}
    </nav>
  );
}

/**
 * Simple pagination for basic use cases
 */
export function SimplePagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = '',
  maxButtons = 5,
  ...props
}) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [1];
    const half = Math.floor((maxButtons - 2) / 2);
    let start = Math.max(2, currentPage - half);
    let end = Math.min(totalPages - 1, start + maxButtons - 3);

    if (end - start < maxButtons - 3) {
      start = Math.max(2, end - maxButtons + 3);
    }

    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);

    return pages;
  };

  return (
    <nav className={clsx('simple-pagination flex items-center gap-1', className)} aria-label="Pagination" {...props}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange?.(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous"
      >
        <ChevronLeft size={14} strokeWidth={2} />
      </Button>

      {getPages().map((page, index) => (
        <Button
          key={index}
          variant={page === currentPage ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => page !== '...' && onPageChange?.(page)}
          disabled={page === '...' || page === currentPage}
          className="min-w-[32px]"
          aria-label={page === '...' ? undefined : `Page ${page}`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </Button>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange?.(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next"
      >
        <ChevronRight size={14} strokeWidth={2} />
      </Button>
    </nav>
  );
}

/**
 * Pagination hook for managing pagination state
 */
export function usePagination({
  initialPage = 1,
  initialPageSize = 10,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
}) {
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const handlePageChange = React.useCallback((page) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    if (validPage !== currentPage) {
      setCurrentPage(validPage);
      onPageChange?.(validPage);
    }
  }, [currentPage, totalPages, onPageChange]);

  const handlePageSizeChange = React.useCallback((size) => {
    if (size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1);
      onPageSizeChange?.(size);
    }
  }, [pageSize, onPageSizeChange]);

  const goToFirst = React.useCallback(() => handlePageChange(1), [handlePageChange]);
  const goToLast = React.useCallback(() => handlePageChange(totalPages), [handlePageChange, totalPages]);
  const goToPrev = React.useCallback(() => handlePageChange(currentPage - 1), [handlePageChange, currentPage]);
  const goToNext = React.useCallback(() => handlePageChange(currentPage + 1), [handlePageChange, currentPage]);

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    startItem: totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0,
    endItem: Math.min(currentPage * pageSize, totalItems),
    handlePageChange,
    handlePageSizeChange,
    goToFirst,
    goToLast,
    goToPrev,
    goToNext,
    setCurrentPage,
    setPageSize,
  };
}

export default Pagination;