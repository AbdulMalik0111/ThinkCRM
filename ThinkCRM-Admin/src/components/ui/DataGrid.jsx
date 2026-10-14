import React, { useMemo, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import Icon from "@/components/ui/Icon";

// Register AG Grid Community modules once
ModuleRegistry.registerModules([AllCommunityModule]);

const DataGrid = ({
  rowData = [],
  columnDefs = [],
  pagination = true,
  paginationData = null, // { page, limit, total, totalPages } for backend pagination
  onPageChange = null,
  onPageSizeChange = null,
  isLoading = false,
  emptyMessage = "No records found",
  rowHeight = 54,
  headerHeight = 46,
  onRowClicked = null,
  className = "",
  suppressCellFocus = true,
  animateRows = true,
  gridRef = null,
}) => {
  const internalRef = useRef(null);
  const activeGridRef = gridRef || internalRef;

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: false,
      resizable: true,
      flex: 1,
      minWidth: 120,
      cellClass: "flex items-center text-sm font-inter text-slate-700 dark:text-slate-200",
      headerClass: "text-xs font-semibold uppercase tracking-wider text-slate-500 font-inter bg-slate-50 dark:bg-slate-900/60",
    }),
    []
  );

  // Custom No Rows Overlay Component
  const noRowsOverlayComponent = useMemo(() => {
    return () => (
      <div className="flex flex-col items-center justify-center p-8 text-slate-400 font-inter">
        <Icon icon="heroicons-outline:inbox" className="text-3xl mb-2 text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{emptyMessage}</p>
        <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or search terms.</p>
      </div>
    );
  }, [emptyMessage]);

  // Custom Loading Overlay Component
  const loadingOverlayComponent = useMemo(() => {
    return () => (
      <div className="flex flex-col items-center justify-center p-8 text-primary-500 font-inter">
        <svg
          className="animate-spin h-8 w-8 text-primary-500 mb-2"
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
        <span className="text-xs font-medium text-slate-500">Loading data...</span>
      </div>
    );
  }, []);

  // Pagination stats calculation
  const isBackendPagination = Boolean(paginationData && onPageChange);
  const total = isBackendPagination ? paginationData.total : rowData.length;
  const page = isBackendPagination ? paginationData.page : 1;
  const limit = isBackendPagination ? paginationData.limit : 10;
  const totalPages = isBackendPagination
    ? paginationData.totalPages
    : Math.ceil(total / limit) || 1;

  const startIndex = total > 0 ? (page - 1) * limit + 1 : 0;
  const endIndex = Math.min(page * limit, total);

  // Resize columns on window resize
  useEffect(() => {
    const handleResize = () => {
      if (activeGridRef.current?.api) {
        activeGridRef.current.api.sizeColumnsToFit();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeGridRef]);

  return (
    <div className={`thinkcrm-datagrid-container bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col ${className}`}>
      {/* AG Grid Body Wrapper */}
      <div
        className="ag-theme-alpine w-full flex-1"
        style={{
          minHeight: rowData.length > 0 ? `${Math.min(rowData.length * rowHeight + headerHeight + 2, 580)}px` : "260px",
          width: "100%",
        }}
      >
        <AgGridReact
          ref={activeGridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowHeight={rowHeight}
          headerHeight={headerHeight}
          suppressCellFocus={suppressCellFocus}
          animateRows={animateRows}
          noRowsOverlayComponent={noRowsOverlayComponent}
          loadingOverlayComponent={loadingOverlayComponent}
          onRowClicked={onRowClicked}
          domLayout="autoHeight"
          suppressHorizontalScroll={false}
        />
      </div>

      {/* Standardized Bottom Pagination Toolbar */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 gap-3 text-xs font-inter font-medium text-slate-500">
          {/* Summary info */}
          <div>
            Showing <span className="font-semibold text-slate-800 dark:text-white">{startIndex}</span> to{" "}
            <span className="font-semibold text-slate-800 dark:text-white">{endIndex}</span> of{" "}
            <span className="font-semibold text-slate-800 dark:text-white">{total}</span> records
          </div>

          {/* Page numbers navigation */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange && onPageChange(Math.max(page - 1, 1))}
              disabled={page <= 1}
              className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  (p >= page - 1 && p <= page + 1)
              )
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="text-xs text-slate-400 px-1">...</span>}
                    <button
                      onClick={() => onPageChange && onPageChange(p)}
                      className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                        page === p
                          ? "bg-primary-500 text-white shadow-sm"
                          : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => onPageChange && onPageChange(Math.min(page + 1, totalPages))}
              disabled={page >= totalPages}
              className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              ›
            </button>
          </div>

          {/* Rows per page selector */}
          {onPageSizeChange && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Rows:</span>
              <select
                value={limit}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="py-1 px-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 focus:outline-none"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataGrid;
