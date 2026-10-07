import React from "react";
import Textinput from "@/components/ui/Textinput";
import Select from "@/components/ui/Select";
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
    <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-4 mb-6">
      <div className="flex flex-wrap md:flex-nowrap items-center gap-4 flex-grow">
        <div className="w-full md:w-72">
          <Textinput
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            hasicon
            icon="heroicons-outline:search"
          />
        </div>
        
        {filters.map((filter, idx) => (
          <div key={idx} className="w-full md:w-48">
            <Select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              options={filter.options}
              placeholder={filter.placeholder}
            />
          </div>
        ))}
        {onReset && (
          <Button
            text="Reset"
            className="btn-light btn-sm"
            onClick={onReset}
            title="Reset Search & Filters"
          />
        )}
      </div>

      <div className="flex items-center flex-shrink-0">
        {hasAddPermission && onAdd && (
          <Button
            icon="heroicons-outline:plus"
            text={addButtonText}
            className="btn-dark"
            onClick={onAdd}
          />
        )}
      </div>
    </div>
  );
};

export default AdminListToolbar;
