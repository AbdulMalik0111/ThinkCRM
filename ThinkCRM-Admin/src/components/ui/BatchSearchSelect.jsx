import React, { useState } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { useGetBatchesQuery } from "@/store/api/inventory/inventoryApiSlice";
import useDebounce from "@/hooks/useDebounce";

const BatchSearchSelect = ({ 
  value, 
  onChange, 
  error, 
  productId,
  isDisabled = false,
  label, 
  placeholder = "Search existing batch..." 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Use RTK query to fetch batches based on search term and productId
  const { data, isLoading } = useGetBatchesQuery({ 
    search: debouncedSearchTerm, 
    productId: productId, 
    limit: 50 
  }, { skip: !productId });
  
  const options = data?.data?.items?.map(batch => ({
    value: batch.batchNumber, // or batch._id if we want to store _id
    label: `${batch.batchNumber} (Expires: ${new Date(batch.expiryDate).toLocaleDateString()})`,
    batch
  })) || [];

  const handleChange = (selectedOption) => {
    onChange(selectedOption);
  };

  const handleInputChange = (inputValue, { action }) => {
    if (action === "input-change") {
      setSearchTerm(inputValue);
    }
  };

  return (
    <div className={`fromGroup ${error ? "has-error" : ""}`}>
      {label && (
        <label className="block capitalize form-label mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <CreatableSelect
        className="react-select"
        classNamePrefix="select"
        value={value ? (options.find(opt => opt.value === value) || { value: value, label: value, isNew: true }) : null}
        options={options}
        onChange={handleChange}
        onInputChange={handleInputChange}
        isLoading={isLoading}
        isDisabled={isDisabled || !productId}
        placeholder={placeholder}
        isClearable
        formatCreateLabel={(inputValue) => `Create new batch "${inputValue}"`}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        styles={{
          control: (base) => ({
            ...base,
            borderColor: error ? '#f1595c' : 'inherit',
            boxShadow: 'none',
            minHeight: '38px',
          }),
          menuPortal: base => ({ ...base, zIndex: 9999 })
        }}
      />
      {error && (
        <div className="text-danger-500 block text-sm mt-2">
          {error.message || error}
        </div>
      )}
    </div>
  );
};

export default BatchSearchSelect;
