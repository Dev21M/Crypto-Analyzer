import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Column definition for Table
 */
export function createColumn({
  key,
  header,
  accessor,
  cell,
  width,
  minWidth,
  maxWidth,
  align = 'left',
  sortable = false,
  sticky = false,
  className = '',
  headerClassName = '',
}) {
  return {
    key,
    header,
    accessor,
    cell,
    width,
    minWidth,
    maxWidth,
    align,
    sortable,
    sticky,
    className,
    headerClassName,
  };
}

/**
 * Table component with sorting, pagination, and row selection
 */
export function Table({
  columns = [],
  data = [],
  sortable = true,
  pagination = false,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  selection = false,
  onSelectionChange,
  selectedRows = [],
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  striped = false,
  hoverable = true,
  bordered = true,
  compact = false,
  sortBy,
  sortOrder = 'asc',
  onSort,
  onPageChange,
  currentPage = 1,
  totalRows,
  ...props
}) {
  const [internalSortBy, setInternalSortBy] = useState(sortBy);
  const [internalSortOrder, setInternalSortOrder] = useState(sortOrder);
  const [internalPage, setInternalPage] = useState(currentPage);
  const [internalPageSize, setInternalPageSize] = useState(pageSize);
  const [internalSelection, setInternalSelection] = useState(selectedRows);

  // Use controlled or uncontrolled state
  const activeSortBy = sortBy !== undefined ? sortBy : internalSortBy;
  const activeSortOrder = sortOrder !== undefined ? sortOrder : internalSortOrder;
  const activePage = currentPage !== undefined ? currentPage : internalPage;
  const activePageSize = pageSize;
  const activeSelection = selectedRows.length > 0 ? selectedRows : internalSelection;

  // Sort data
  const sortedData = useMemo(() => {
    if (!activeSortBy || !sortable) return data;
    
    const column = columns.find((c) => c.key === activeSortBy);
    if (!column || !column.accessor) return data;

    // Handle both string and function accessors
    const getValue = (row) => {
      if (typeof column.accessor === 'function') {
        return column.accessor(row);
      }
      return row[column.accessor];
    };

    return [...data].sort((a, b) => {
      const aVal = getValue(a);
      const bVal = getValue(b);
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return activeSortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, activeSortBy, activeSortOrder, columns, sortable]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (activePage - 1) * activePageSize;
    return sortedData.slice(start, start + activePageSize);
  }, [sortedData, pagination, activePage, activePageSize]);

  // Selection handlers
  const isRowSelected = (row) => {
    const rowKey = row.id || row.key || JSON.stringify(row);
    return activeSelection.includes(rowKey);
  };

  const isAllSelected = paginatedData.length > 0 && 
    paginatedData.every((row) => isRowSelected(row));

  const handleSelectAll = () => {
    if (isAllSelected) {
      const newSelection = activeSelection.filter(
        (key) => !paginatedData.some((row) => (row.id || row.key || JSON.stringify(row)) === key)
      );
      setInternalSelection(newSelection);
      onSelectionChange?.(newSelection);
    } else {
      const newKeys = paginatedData.map((row) => row.id || row.key || JSON.stringify(row));
      const newSelection = [...new Set([...activeSelection, ...newKeys])];
      setInternalSelection(newSelection);
      onSelectionChange?.(newSelection);
    }
  };

  const handleSelectRow = (row) => {
    const rowKey = row.id || row.key || JSON.stringify(row);
    const newSelection = isRowSelected(row)
      ? activeSelection.filter((key) => key !== rowKey)
      : [...activeSelection, rowKey];
    setInternalSelection(newSelection);
    onSelectionChange?.(newSelection);
  };

  // Sort handler
  const handleSort = (columnKey) => {
    const column = columns.find((c) => c.key === columnKey);
    if (!column?.sortable) return;

    if (activeSortBy === columnKey) {
      const newOrder = activeSortOrder === 'asc' ? 'desc' : 'asc';
      setInternalSortOrder(newOrder);
      onSort?.(columnKey, newOrder);
    } else {
      setInternalSortBy(columnKey);
      setInternalSortOrder('asc');
      onSort?.(columnKey, 'asc');
    }
  };

  // Page change handler
  const handlePageChange = (page) => {
    setInternalPage(page);
    onPageChange?.(page);
  };

  const totalPages = pagination ? Math.ceil((totalRows || sortedData.length) / activePageSize) : 1;

  if (loading) {
    return (
      <div className={clsx('table-container', className)} {...props}>
        <table className="table" role="grid">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={getHeaderClasses(column)}>
                  <div className="skeleton skeleton-text h-4 w-full" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((column) => (
                  <td key={column.key} className={getCellClasses(column)}>
                    <div className="skeleton skeleton-text h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={clsx('table-container', className)} {...props}>
      <div className="overflow-x-auto">
        <table className={clsx('table', {
          'table-striped': striped,
          'table-hover': hoverable,
          'table-bordered': bordered,
          'table-compact': compact,
        })} role="grid">
          <thead>
            <tr>
              {selection && (
                <th className="w-12 text-center">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={getHeaderClasses(column)}
                  style={getHeaderStyles(column)}
                  scope="col"
                >
                  <div className="flex items-center gap-1">
                    <span>{column.header}</span>
                    {sortable && column.sortable && (
                      <button
                        className="btn btn-ghost btn-icon p-0"
                        onClick={() => handleSort(column.key)}
                        aria-label={`Sort by ${column.header} ${activeSortBy === column.key ? (activeSortOrder === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
                      >
                        {activeSortBy === column.key ? (
                          activeSortOrder === 'asc' ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )
                        ) : (
                          <ChevronsUpDown size={14} className="text-muted" />
                        )}
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selection ? 1 : 0)} className="text-center py-8 text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={row.id || row.key || rowIndex}
                  className={clsx(
                    isRowSelected(row) && 'bg-primary-bg/50',
                    row.className
                  )}
                  onClick={selection ? () => handleSelectRow(row) : undefined}
                  style={{ cursor: selection ? 'pointer' : undefined }}
                >
                  {selection && (
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={isRowSelected(row)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectRow(row);
                        }}
                        aria-label="Select row"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={getCellClasses(column)}
                      style={getCellStyles(column)}
                    >
                      {column.cell
                        ? column.cell(row, rowIndex)
                        : column.accessor
                        ? String((typeof column.accessor === 'function' ? column.accessor(row) : row[column.accessor]) ?? '')
                        : ''}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="table-pagination flex items-center justify-between px-4 py-3 border-t border-primary">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">
              Showing {Math.min((activePage - 1) * activePageSize + 1, sortedData.length)} to{' '}
              {Math.min(activePage * activePageSize, sortedData.length)} of {sortedData.length}
            </span>
            <select
              className="form-select form-select-sm w-auto"
              value={activePageSize}
              onChange={(e) => {
                setInternalPageSize(Number(e.target.value));
                setInternalPage(1);
              }}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="btn btn-secondary btn-icon btn-sm"
              onClick={() => handlePageChange(1)}
              disabled={activePage === 1}
              aria-label="First page"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="17 18 11 12 17 6" />
                <polyline points="7 18 1 12 7 6" />
              </svg>
            </button>
            <button
              className="btn btn-secondary btn-icon btn-sm"
              onClick={() => handlePageChange(activePage - 1)}
              disabled={activePage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <span className="px-2 text-sm text-secondary">
              Page {activePage} of {totalPages}
            </span>
            <button
              className="btn btn-secondary btn-icon btn-sm"
              onClick={() => handlePageChange(activePage + 1)}
              disabled={activePage >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
            <button
              className="btn btn-secondary btn-icon btn-sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={activePage >= totalPages}
              aria-label="Last page"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="7 18 13 12 7 6" />
                <polyline points="17 18 23 12 17 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getHeaderClasses(column) {
  return clsx(
    'font-semibold text-xs uppercase tracking-wider text-muted bg-secondary sticky top-0 z-10',
    column.sortable && 'cursor-pointer select-none',
    column.sticky && 'sticky left-0 bg-secondary',
    column.align === 'center' && 'text-center',
    column.align === 'right' && 'text-right',
    column.headerClassName
  );
}

function getHeaderStyles(column) {
  const styles = {};
  if (column.width) styles.width = column.width;
  if (column.minWidth) styles.minWidth = column.minWidth;
  if (column.maxWidth) styles.maxWidth = column.maxWidth;
  return styles;
}

function getCellClasses(column) {
  return clsx(
    'text-sm',
    column.align === 'center' && 'text-center',
    column.align === 'right' && 'text-right',
    column.className
  );
}

function getCellStyles(column) {
  const styles = {};
  if (column.width) styles.width = column.width;
  if (column.minWidth) styles.minWidth = column.minWidth;
  if (column.maxWidth) styles.maxWidth = column.maxWidth;
  return styles;
}

export default Table;