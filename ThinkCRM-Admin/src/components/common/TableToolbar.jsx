import React, { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import Flatpickr from "react-flatpickr";
import dayjs from "dayjs";

/**
 * Sleek Toolbar Filter Dropdown with Search, Loading, and Clean Styling
 */
const ToolbarFilterDropdown = ({ filter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const rawOptions = filter.options || [];
  const normalizedOptions = rawOptions.map((opt) =>
    typeof opt === "object" ? opt : { value: opt, label: opt }
  );

  const filteredOptions =
    filter.isSearchable && searchTerm
      ? normalizedOptions.filter((opt) =>
          String(opt.label).toLowerCase().includes(searchTerm.toLowerCase())
        )
      : normalizedOptions;

  const currentOption = normalizedOptions.find((opt) => opt.value === filter.value);
  const isSelected = filter.value && filter.value !== "all" && filter.value !== "";
  const displayLabel = isSelected
    ? currentOption?.label || filter.value
    : filter.placeholder || "Select";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm("");
        }}
        className={`h-[38px] px-3 bg-white dark:bg-slate-800 border rounded-lg text-[13px] font-semibold flex items-center justify-between gap-2 transition cursor-pointer select-none ${
          isSelected
            ? "border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/20"
            : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
        }`}
        style={{ minWidth: filter.minWidth || "135px" }}
      >
        <span className="truncate max-w-[150px]">{displayLabel}</span>
        <Icon
          icon="heroicons-outline:chevron-down"
          className={`text-xs text-slate-400 transition-transform flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-60 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl z-50 p-1.5 animate-fadeIn font-inter">
          {filter.isSearchable && (
            <div className="p-1 pb-1.5 border-b border-slate-100 dark:border-slate-700">
              <div className="relative">
                <Icon
                  icon="heroicons-outline:magnifying-glass"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
                />
                <input
                  type="text"
                  placeholder={`Search ${filter.placeholder || "options"}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full h-8 pl-7 pr-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto space-y-0.5 py-1">
            {/* All / Reset Option */}
            <button
              type="button"
              onClick={() => {
                filter.onChange && filter.onChange("all");
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition ${
                !isSelected
                  ? "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
              }`}
            >
              <span>{filter.placeholder || "All"}</span>
              {!isSelected && (
                <Icon icon="heroicons-outline:check" className="text-sm text-primary-600" />
              )}
            </button>

            {/* Options list */}
            {filter.isLoading ? (
              <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-sm" />
                <span>Loading options...</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-400">
                No options available
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isItemActive = filter.value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      filter.onChange && filter.onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition ${
                      isItemActive
                        ? "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isItemActive && (
                      <Icon icon="heroicons-outline:check" className="text-sm text-primary-600" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Reusable ThinkCRM Table Toolbar:
 * - Search input with debounce and instant clear
 * - Sleek, styled filter dropdowns (with search support for staff)
 * - Date range picker with Flatpickr
 * - Accurate active filter badge (no fake count)
 * - Visually clear Outlined Clear button with reset icon
 * - Robust Refresh button with loading animation
 */
const TableToolbar = ({
  search = "",
  onSearchChange,
  searchPlaceholder = "Search by name, phone, email, project...",
  filters = [], // Array of { id, value, onChange, options, placeholder, minWidth, isSearchable, isLoading }
  dateRange = null,
  onDateRangeChange,
  onClearFilters,
  onRefresh,
  isRefreshing = false,
  customActions = null,
  activeFiltersCount = 0,
}) => {
  const isDateActive = Boolean(
    (dateRange && (dateRange.startDate || dateRange[0])) ||
    (Array.isArray(dateRange) && dateRange.length > 0)
  );

  const flatpickrValue = Array.isArray(dateRange)
    ? dateRange
    : dateRange?.startDate && dateRange?.endDate
    ? [new Date(dateRange.startDate), new Date(dateRange.endDate)]
    : [];

  const hasActiveFilters = Boolean(
    search ||
      filters.some((f) => f.value && f.value !== "all" && f.value !== "") ||
      isDateActive ||
      activeFiltersCount > 0
  );

  // Strictly accurate calculated count
  const calculatedCount =
    activeFiltersCount > 0
      ? activeFiltersCount
      : filters.filter((f) => f.value && f.value !== "all" && f.value !== "").length +
        (isDateActive ? 1 : 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 font-inter">
      {/* Primary Toolbar Row */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-[280px]">
          <Icon
            icon="heroicons-outline:magnifying-glass"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full h-[38px] pl-8 pr-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange && onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
              title="Clear search"
            >
              <Icon icon="heroicons-outline:x-mark" className="text-xs" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns using ToolbarFilterDropdown */}
        {filters.map((filter) => (
          <ToolbarFilterDropdown key={filter.id || filter.placeholder} filter={filter} />
        ))}

        {/* Directly Interactive Date Range Picker */}
        {onDateRangeChange && (
          <div
            className={`relative flex items-center h-[38px] px-3 bg-white dark:bg-slate-800 border rounded-lg transition ${
              isDateActive
                ? "border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/20"
                : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
          >
            <Icon icon="heroicons-outline:calendar" className="text-slate-400 mr-2 flex-shrink-0 text-sm" />
            <Flatpickr
              value={flatpickrValue}
              placeholder="Filter by date range"
              options={{
                mode: "range",
                dateFormat: "M d, Y",
                allowInput: false,
              }}
              onChange={(dates) => {
                if (dates && dates.length === 2) {
                  onDateRangeChange(dates);
                }
              }}
              className="bg-transparent border-none p-0 text-[13px] font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-0 cursor-pointer w-[180px]"
            />
            {isDateActive && (
              <button
                type="button"
                onClick={() => onDateRangeChange([])}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-1 p-0.5"
                title="Clear date range"
              >
                <Icon icon="heroicons-outline:x-mark" className="text-xs" />
              </button>
            )}
          </div>
        )}

        {/* Filters Button with Badge */}
        <button
          type="button"
          className="inline-flex items-center gap-1.5 h-[38px] px-3.5 rounded-lg border border-primary-200 dark:border-primary-800/80 bg-primary-50/60 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 text-[13px] font-semibold transition"
        >
          <Icon icon="heroicons-outline:funnel" className="text-sm text-primary-500" />
          <span>Filters</span>
          {calculatedCount > 0 && (
            <span className="h-4.5 min-w-[18px] px-1 rounded-full bg-primary-600 text-white text-[10.5px] font-bold flex items-center justify-center">
              {calculatedCount}
            </span>
          )}
        </button>

        {/* Clear Filters Button - distinct neutral outlined style */}
        {onClearFilters && hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 h-[38px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white text-[13px] font-semibold transition"
            title="Clear all filters"
          >
            <Icon icon="heroicons-outline:arrow-path" className="text-sm text-slate-400" />
            <span>Clear</span>
          </button>
        )}

        {/* Refresh Action with spinning animation and prevention of repeated calls */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`h-[38px] w-[38px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 transition ${
              isRefreshing ? "opacity-60 cursor-not-allowed" : ""
            }`}
            title="Refresh Customers"
          >
            <Icon
              icon="heroicons-outline:arrow-path"
              className={`text-sm ${isRefreshing ? "animate-spin text-primary-600" : ""}`}
            />
          </button>
        )}

        {/* Custom Actions */}
        {customActions}
      </div>
    </div>
  );
};

export default TableToolbar;
