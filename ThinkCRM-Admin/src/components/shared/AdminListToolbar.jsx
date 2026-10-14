import React from "react";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";

/**
 * A shared toolbar for admin list pages.
 * Supports a search input, optional filter selects, and an "Add" action.
 */
const AdminListToolbar = ({
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [], // Array of { name, value, onChange, options, placeholder }
  onAdd,
  addButtonText = "Add New",
  addButtonPermission, // If permission checking is needed, can be passed
  hasAddPermission = true,
  onReset
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-3.5">
        <div className="flex flex-wrap items-center gap-3.5 flex-grow">
          {/* Search Input with Clear Button */}
          <div className="relative w-full md:w-80">
            <Icon
              icon="heroicons-outline:magnifying-glass"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none"
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="w-full h-11 pl-10 pr-9 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-[14.5px] font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-primary-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange && onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
                title="Clear search"
              >
                <Icon icon="heroicons-outline:x-mark" className="text-sm" />
              </button>
            )}
          </div>
          
          {filters.map((filter, idx) => (
            <div key={idx} className="w-full sm:w-48">
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-[14.5px] font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary-500 transition"
              >
                {filter.placeholder && <option value="">{filter.placeholder}</option>}
                {(filter.options || []).map((opt, oIdx) => (
                  <option
                    key={oIdx}
                    value={typeof opt === "object" ? opt.value : opt}
                  >
                    {typeof opt === "object" ? opt.label : opt}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {onReset && (searchQuery || filters.some((f) => f.value)) && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 h-11 px-3.5 text-xs text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
              title="Reset Search & Filters"
            >
              <Icon icon="heroicons-outline:arrow-path" className="text-sm" />
              Reset
            </button>
          )}
        </div>

        <div className="flex items-center flex-shrink-0">
          {hasAddPermission && onAdd && (
            <Button
              icon="heroicons-outline:plus"
              text={addButtonText}
              className="btn-primary h-11 px-4"
              onClick={onAdd}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminListToolbar;
