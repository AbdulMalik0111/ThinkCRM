import React, { useState, useMemo } from "react";
import Icon from "@/components/ui/Icon";

/**
 * Professional ThinkCRM DataGrid component:
 * - Pure native React/HTML table matching reference screenshot 100%
 * - Zero AG Grid inner scrollbar artifacts or checkbox glitches
 * - Supports columnDefs with cellRenderer, valueGetter, field, headerName
 * - Native selection checkboxes (header select-all + row checkboxes)
 * - Header filter funnel icons matching target reference
 * - Row hover states, smooth transitions, and comfortable row heights
 * - Built-in pagination with accurate counts, page jumps, and page size selector
 */
const DataGrid = ({
  rowData = [],
  columnDefs = [],
  pagination = true,
  paginationData = null, // { page, limit, total, totalPages }
  onPageChange = null,
  onPageSizeChange = null,
  isLoading = false,
  emptyMessage = "No records found",
  enableSelection = false,
  entityName = "customers",
  onRowClicked = null,
  selectedIds: controlledSelectedIds = null,
  onSelectionChange = null,
  className = "",
}) => {
  const [internalSelectedIds, setInternalSelectedIds] = useState(new Set());
  const selectedIds = controlledSelectedIds || internalSelectedIds;

  const updateSelectedIds = (newSet) => {
    if (onSelectionChange) {
      onSelectionChange(newSet);
    }
    setInternalSelectedIds(newSet);
  };

  // Pagination stats calculation
  const isBackendPagination = Boolean(paginationData && onPageChange);
  const total = isBackendPagination ? (paginationData.total || 0) : rowData.length;
  const page = isBackendPagination ? (paginationData.page || 1) : 1;
  const limit = isBackendPagination ? (paginationData.limit || 10) : 10;
  const totalPages = isBackendPagination
    ? (paginationData.totalPages || Math.ceil(total / limit) || 1)
    : (Math.ceil(total / limit) || 1);

  const startIndex = total > 0 ? (page - 1) * limit + 1 : 0;
  const endIndex = Math.min(page * limit, total);

  // Selection handlers
  const allCurrentIds = useMemo(() => {
    return rowData.map((r, i) => r._id || r.id || i);
  }, [rowData]);

  const isAllSelected =
    allCurrentIds.length > 0 && allCurrentIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      updateSelectedIds(new Set());
    } else {
      updateSelectedIds(new Set(allCurrentIds));
    }
  };

  const toggleSelectRow = (id, e) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    updateSelectedIds(next);
  };

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200/90 dark:border-slate-700 overflow-hidden flex flex-col font-inter ${className}`}
    >
      {/* Table Scrollable Wrapper */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Header */}
          <thead className="bg-[#F8FAFC] dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
            <tr>
              {/* Checkbox Column */}
              {enableSelection && (
                <th className="py-3.5 px-3 w-12 text-center select-none">
                  <label className="inline-flex items-center justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="sr-only"
                    />
                    <span
                      className={`rounded-[5px] border flex items-center justify-center transition-all ${
                        isAllSelected
                          ? "bg-primary-600 border-primary-600 text-white"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400"
                      }`}
                      style={{
                        width: "18px",
                        height: "18px",
                        minWidth: "18px",
                        minHeight: "18px",
                        backgroundColor: isAllSelected ? "#2563eb" : undefined,
                        borderColor: isAllSelected ? "#2563eb" : undefined,
                      }}
                    >
                      {isAllSelected && (
                        <svg
                          className="h-2.5 w-2.5 fill-current text-white"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </span>
                  </label>
                </th>
              )}

              {/* Dynamic Columns */}
              {columnDefs.map((col, idx) => {
                const isIndex = col.headerName === "#";
                const isCenter = col.headerClass?.includes("text-center") || col.headerName === "#";
                const isRight = col.headerClass?.includes("text-right");

                return (
                  <th
                    key={col.headerName || col.field || idx}
                    style={{
                      width: col.width ? `${col.width}px` : undefined,
                      minWidth: col.minWidth ? `${col.minWidth}px` : undefined,
                      maxWidth: col.maxWidth ? `${col.maxWidth}px` : undefined,
                    }}
                    className={`py-3.5 px-4 text-[13px] font-semibold text-slate-700 dark:text-slate-300 tracking-tight whitespace-nowrap select-none ${
                      isCenter ? "text-center" : isRight ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        isCenter ? "justify-center" : isRight ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span>{col.headerName || ""}</span>
                      {/* Funnel Icon matching reference design on all columns except # */}
                      {!isIndex && col.headerName && (
                        <svg
                          className="w-3.5 h-3.5 text-slate-400 opacity-60 flex-shrink-0 cursor-pointer hover:opacity-100"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                        </svg>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
            {/* Loading State */}
            {isLoading && (
              <tr>
                <td
                  colSpan={columnDefs.length + (enableSelection ? 1 : 0)}
                  className="py-12 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-primary-500">
                    <svg
                      className="animate-spin h-8 w-8 text-primary-600 mb-2.5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Loading {entityName}...
                    </span>
                  </div>
                </td>
              </tr>
            )}

            {/* Empty State */}
            {!isLoading && rowData.length === 0 && (
              <tr>
                <td
                  colSpan={columnDefs.length + (enableSelection ? 1 : 0)}
                  className="py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Icon
                      icon="heroicons-outline:inbox"
                      className="text-4xl mb-2 text-slate-300 dark:text-slate-600"
                    />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {emptyMessage}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your filters or search terms.
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {/* Data Rows */}
            {!isLoading &&
              rowData.map((row, rowIdx) => {
                const rowId = row._id || row.id || rowIdx;
                const isSelected = selectedIds.has(rowId);

                return (
                  <tr
                    key={rowId}
                    onClick={() => onRowClicked && onRowClicked({ data: row })}
                    className={`transition-colors duration-150 ${
                      isSelected
                        ? "bg-blue-50/60 dark:bg-blue-950/20"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-700/30"
                    }`}
                  >
                    {/* Row Checkbox */}
                    {enableSelection && (
                      <td className="py-3 px-3 w-12 text-center select-none">
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleSelectRow(rowId, e)}
                            className="sr-only"
                          />
                          <span
                            className={`rounded-[5px] border flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-primary-600 border-primary-600 text-white"
                                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400"
                            }`}
                            style={{
                              width: "18px",
                              height: "18px",
                              minWidth: "18px",
                              minHeight: "18px",
                              backgroundColor: isSelected ? "#2563eb" : undefined,
                              borderColor: isSelected ? "#2563eb" : undefined,
                            }}
                          >
                            {isSelected && (
                              <svg
                                className="h-2.5 w-2.5 fill-current text-white"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </span>
                        </label>
                      </td>
                    )}

                    {/* Columns */}
                    {columnDefs.map((col, colIdx) => {
                      const isCenter =
                        col.cellClass?.includes("text-center") ||
                        col.cellClass?.includes("justify-center") ||
                        col.headerName === "#";
                      const isRight =
                        col.cellClass?.includes("text-right") ||
                        col.headerClass?.includes("text-right");

                      let cellValue = undefined;
                      if (col.valueGetter) {
                        cellValue = col.valueGetter({
                          data: row,
                          node: { rowIndex: rowIdx },
                        });
                      } else if (col.field) {
                        cellValue = col.field.includes(".")
                          ? col.field.split(".").reduce((obj, key) => obj?.[key], row)
                          : row[col.field];
                      }

                      let cellContent = null;
                      if (col.cellRenderer) {
                        cellContent = col.cellRenderer({
                          value: cellValue,
                          data: row,
                          node: { rowIndex: rowIdx },
                        });
                      } else {
                        cellContent = cellValue;
                      }

                      return (
                        <td
                          key={col.headerName || col.field || colIdx}
                          style={{
                            width: col.width ? `${col.width}px` : undefined,
                            minWidth: col.minWidth ? `${col.minWidth}px` : undefined,
                            maxWidth: col.maxWidth ? `${col.maxWidth}px` : undefined,
                          }}
                          className={`py-3 px-4 text-[14px] text-slate-700 dark:text-slate-200 align-middle ${
                            isCenter ? "text-center" : isRight ? "text-right" : "text-left"
                          }`}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Standardized Bottom Pagination Toolbar matching reference screenshot */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 gap-3 text-xs font-inter font-medium text-slate-500">
          {/* Summary info: "Showing 1 to 10 of 128 customers" */}
          <div className="text-[13.5px] text-slate-500 dark:text-slate-400">
            Showing <span className="font-bold text-slate-900 dark:text-white">{startIndex}</span> to{" "}
            <span className="font-bold text-slate-900 dark:text-white">{endIndex}</span> of{" "}
            <span className="font-bold text-slate-900 dark:text-white">{total}</span> {entityName}
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-3">
            {/* Page numbers navigation matching screenshot: < 1 2 3 4 5 ... 13 > */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onPageChange && onPageChange(Math.max(page - 1, 1))}
                disabled={page <= 1}
                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 transition"
                title="Previous Page"
              >
                <Icon icon="heroicons-outline:chevron-left" className="text-base" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    (p >= page - 2 && p <= page + 2)
                )
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="text-xs text-slate-400 px-1 select-none">...</span>}
                      <button
                        type="button"
                        onClick={() => onPageChange && onPageChange(p)}
                        className={`h-8 min-w-[32px] px-2.5 rounded-lg text-xs font-semibold transition ${
                          page === p
                            ? "bg-primary-600 text-white font-bold"
                            : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                        }`}
                        style={{
                          backgroundColor: page === p ? "#2563eb" : undefined,
                          borderColor: page === p ? "#2563eb" : undefined,
                        }}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                type="button"
                onClick={() => onPageChange && onPageChange(Math.min(page + 1, totalPages))}
                disabled={page >= totalPages}
                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 transition"
                title="Next Page"
              >
                <Icon icon="heroicons-outline:chevron-right" className="text-base" />
              </button>
            </div>

            {/* Rows per page selector: "10 / page" with single clearly visible chevron */}
            {onPageSizeChange && (
              <div className="relative inline-flex items-center">
                <select
                  value={limit}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="datagrid-page-select h-8 pl-3 pr-7 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 appearance-none focus:outline-none focus:border-primary-500 cursor-pointer shadow-none"
                  style={{ backgroundImage: "none" }}
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
                <Icon
                  icon="heroicons-outline:chevron-down"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-xs pointer-events-none stroke-2"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataGrid;
