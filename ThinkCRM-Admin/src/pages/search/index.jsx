import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useGetGlobalSearchQuery } from "@/store/api/management/managementApiSlice";
import Button from "@/components/ui/Button";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const q = searchParams.get("q") || "";
  const entity = searchParams.get("entity") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  
  const [queryInput, setQueryInput] = useState(q);

  const { data, isFetching } = useGetGlobalSearchQuery({ q, entity, page, limit: 50 }, {
    skip: !q
  });

  const searchData = data?.data || {};
  const results = searchData.results || {};

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ q: queryInput, page: 1, entity: "" });
  };

  const handleTabClick = (newEntity) => {
    setSearchParams({ q, entity: newEntity, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ q, entity, page: newPage });
  };

  const renderContent = () => {
    if (!q) return <div className="text-center py-20 text-slate-500">Please enter a search query above.</div>;
    if (isFetching) return <div className="text-center py-20"><Icon icon="eos-icons:loading" className="text-4xl text-primary-500 animate-spin mx-auto" /></div>;

    const currentResults = entity ? results[entity] : Object.values(results).flat().filter(Boolean);
    
    if (!currentResults || currentResults.length === 0) {
      return (
        <div className="text-center py-20">
          <Icon icon="heroicons-outline:emoji-sad" className="text-6xl text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">No results found</h3>
          <p className="text-slate-500 mt-2">Try adjusting your search query or filters.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {results.products && (!entity || entity === 'products') && results.products.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 mt-6">Products</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.products.map(p => (
                <Card key={p._id} className="cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all" onClick={() => navigate(`/catalog/products/${p._id}`)}>
                  <div className="font-medium text-slate-900 dark:text-white">{p.name}</div>
                  <div className="text-sm text-slate-500">{p.sku} | {p.brand}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {results.orders && (!entity || entity === 'orders') && results.orders.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 mt-6">Orders</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.orders.map(o => (
                <Card key={o._id} className="cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all" onClick={() => navigate(`/orders/${o._id}`)}>
                  <div className="font-medium text-slate-900 dark:text-white">{o.orderNumber}</div>
                  <div className="text-sm text-slate-500">{o.customer?.name} - {o.status}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {results.customers && (!entity || entity === 'customers') && results.customers.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 mt-6">Customers</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.customers.map(c => (
                <Card key={c._id} className="cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all" onClick={() => navigate(`/customers/${c._id}`)}>
                  <div className="font-medium text-slate-900 dark:text-white">{c.firstName} {c.lastName}</div>
                  <div className="text-sm text-slate-500">{c.mobileNumber}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {results.staff && (!entity || entity === 'staff') && results.staff.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 mt-6">Staff</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.staff.map(s => (
                <Card key={s._id} className="cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all" onClick={() => navigate(`/staff`, { state: { openModal: s } })}>
                  <div className="font-medium text-slate-900 dark:text-white">{s.firstName} {s.lastName}</div>
                  <div className="text-sm text-slate-500">{s.role} | {s.email}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {results.suppliers && (!entity || entity === 'suppliers') && results.suppliers.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 mt-6">Suppliers</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.suppliers.map(s => (
                <Card key={s._id} className="cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all" onClick={() => navigate(`/purchases/suppliers/${s._id}`)}>
                  <div className="font-medium text-slate-900 dark:text-white">{s.name}</div>
                  <div className="text-sm text-slate-500">{s.phone} | {s.email}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {results.purchases && (!entity || entity === 'purchases') && results.purchases.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 mt-6">Purchases</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.purchases.map(p => (
                <Card key={p._id} className="cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all" onClick={() => navigate(`/purchases/${p._id}`)}>
                  <div className="font-medium text-slate-900 dark:text-white">{p.invoiceNumber}</div>
                  <div className="text-sm text-slate-500">Total: {p.grandTotal} | {p.status}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {results.medicineRequests && (!entity || entity === 'medicine_requests') && results.medicineRequests.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 mt-6">Medicine Requests</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.medicineRequests.map(m => (
                <Card key={m._id} className="cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all" onClick={() => navigate(`/medicine-requests/${m._id}`)}>
                  <div className="font-medium text-slate-900 dark:text-white">{m.normalizedRequest}</div>
                  <div className="text-sm text-slate-500">Status: {m.status}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {results.coupons && (!entity || entity === 'coupons') && results.coupons.length > 0 && (
          <div>
            <h4 className="font-semibold text-lg mb-3 mt-6">Coupons</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.coupons.map(c => (
                <Card key={c._id} className="cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all" onClick={() => navigate(`/coupons`, { state: { openModal: c } })}>
                  <div className="font-medium text-slate-900 dark:text-white">{c.code}</div>
                  <div className="text-sm text-slate-500">Type: {c.discountType}</div>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Basic Pagination (Only shows Next/Prev if filtered by entity) */}
        {entity && (
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button 
              text="Previous" 
              className="btn-outline-dark" 
              disabled={page <= 1} 
              onClick={() => handlePageChange(page - 1)} 
            />
            <span className="text-slate-600 dark:text-slate-300">Page {page}</span>
            <Button 
              text="Next" 
              className="btn-outline-dark" 
              disabled={currentResults.length < 10} 
              onClick={() => handlePageChange(page + 1)} 
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 inline-block ltr:pr-4 rtl:pl-4">
          Search Results
        </h4>
      </div>
      
      <Card>
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            className="form-control flex-1"
            placeholder="Search anything..."
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
          />
          <Button text="Search" type="submit" className="btn-dark" />
        </form>

        {q && (
          <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-4">
            <button 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!entity ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}
              onClick={() => handleTabClick("")}
            >
              All Results
            </button>
            <button 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${entity === 'products' ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}
              onClick={() => handleTabClick("products")}
            >
              Products
            </button>
            <button 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${entity === 'orders' ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}
              onClick={() => handleTabClick("orders")}
            >
              Orders
            </button>
            <button 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${entity === 'customers' ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}
              onClick={() => handleTabClick("customers")}
            >
              Customers
            </button>
            <button 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${entity === 'staff' ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}
              onClick={() => handleTabClick("staff")}
            >
              Staff
            </button>
            <button 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${entity === 'suppliers' ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}
              onClick={() => handleTabClick("suppliers")}
            >
              Suppliers
            </button>
            <button 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${entity === 'purchases' ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}
              onClick={() => handleTabClick("purchases")}
            >
              Purchases
            </button>
          </div>
        )}

        <div className="mt-6">
          {renderContent()}
        </div>
      </Card>
    </div>
  );
};

export default SearchPage;
