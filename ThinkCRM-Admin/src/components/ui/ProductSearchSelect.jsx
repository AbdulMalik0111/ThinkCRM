import React, { useState } from "react";
import Select from "react-select";
import { useGetProductsQuery } from "@/store/api/catalog/catalogApiSlice";
import useDebounce from "@/hooks/useDebounce";

const ProductSearchSelect = ({ 
  value, 
  onChange, 
  error, 
  label = "Select Product", 
  placeholder = "Search product by name or SKU..." 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Use RTK query to fetch products based on search term
  const { data, isLoading } = useGetProductsQuery({ search: debouncedSearchTerm, limit: 50 });
  
  const options = data?.data?.items?.map(product => ({
    value: product._id,
    label: `${product.name} (SKU: ${product.sku})`,
    product
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
      <Select
        className="react-select"
        classNamePrefix="select"
        value={options.find(opt => opt.value === value) || null}
        options={options}
        onChange={handleChange}
        onInputChange={handleInputChange}
        isLoading={isLoading}
        placeholder={placeholder}
        isClearable
        menuPortalTarget={document.body}
        menuPosition="fixed"
        styles={{
          control: (base) => ({
            ...base,
            borderColor: error ? '#f1595c' : 'inherit',
            boxShadow: 'none',
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

export default ProductSearchSelect;
