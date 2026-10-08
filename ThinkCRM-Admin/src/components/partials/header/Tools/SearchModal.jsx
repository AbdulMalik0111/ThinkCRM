import { Dialog, DialogPanel, Transition, TransitionChild, Combobox, ComboboxOption, ComboboxOptions, ComboboxInput } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import { useGetGlobalSearchQuery } from "@/store/api/management/managementApiSlice";
import { useNavigate } from "react-router-dom";

const SearchModal = () => {
  let [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const navigate = useNavigate();

  function closeModal() {
    setIsOpen(false);
    setQuery("");
    setDebouncedQuery("");
  }

  function openModal() {
    setIsOpen(true);
  }

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching } = useGetGlobalSearchQuery({ q: debouncedQuery }, {
    skip: debouncedQuery.length === 0
  });

  const searchData = data?.data || {};
  const results = searchData.results || {};
  const suggestions = searchData.suggestions || [];
  
  const hasResults = Object.values(results).some(arr => arr && arr.length > 0) || suggestions.length > 0;

  const handleSelect = (item) => {
    if (!item) return;
    
    // Suggestion clicked
    if (item.isSuggestion) {
      setQuery(item.text);
      return;
    }

    if (item.url) {
      navigate(item.url, item.state ? { state: item.state } : undefined);
      closeModal();
    }
  };

  const ResultGroup = ({ title, items, renderItem, urlPrefix, getUrl, getState }) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="py-2">
        <div className="px-4 py-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {title}
        </div>
        {items.map((item, i) => {
          const itemUrl = getUrl ? getUrl(item) : (urlPrefix ? `${urlPrefix}/${item._id}` : undefined);
          const itemState = getState ? getState(item) : undefined;
          return (
            <ComboboxOption key={item._id || i} value={{ ...item, url: itemUrl, state: itemState }}>
              {({ isActive }) => (
                <div
                  className={`px-4 text-[14px] py-2 cursor-pointer ${
                    isActive
                      ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {renderItem(item)}
                </div>
              )}
            </ComboboxOption>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div>
        <button
          className="flex items-center xl:text-sm text-lg xl:text-slate-400 text-slate-800 dark:text-slate-300 px-5 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full sm:w-[450px] w-auto space-x-3 rtl:space-x-reverse transition-all duration-200"
          onClick={openModal}
        >
          <Icon icon="heroicons-outline:search" className="text-slate-400 text-lg" />
          <span className="xl:inline-block hidden">Search leads, customers...</span>
        </button>
      </div>

      <Transition show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-[99999] overflow-y-auto p-4 md:pt-[15vh] pt-20"
          onClose={closeModal}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/60 backdrop-filter backdrop-blur-xs backdrop-brightness-10" />
          </TransitionChild>

          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel>
              <Combobox onChange={handleSelect}>
                <div className="relative mx-auto max-w-2xl rounded-xl bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700 flex flex-col">
                  
                  {/* Input Header */}
                  <div className="flex bg-transparent px-4 rounded-t-xl py-4 items-center border-b border-slate-100 dark:border-slate-700">
                    <div className="flex-0 text-slate-500 dark:text-slate-400 ltr:pr-3 rtl:pl-3 text-xl">
                      <Icon icon="heroicons-outline:search" />
                    </div>
                    <ComboboxInput
                      className="bg-transparent outline-none focus:outline-none border-none w-full flex-1 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-lg"
                      placeholder="Search leads, customers..."
                      onChange={(event) => setQuery(event.target.value)}
                      value={query}
                      autoFocus
                      autoComplete="off"
                    />
                    {isFetching && (
                      <div className="flex-0 pl-3">
                        <Icon icon="eos-icons:loading" className="text-xl text-primary-500 animate-spin" />
                      </div>
                    )}
                    <button onClick={closeModal} className="flex-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 pl-3 text-xs font-semibold px-2 border border-slate-200 dark:border-slate-700 rounded ml-2 py-1">
                      ESC
                    </button>
                  </div>

                  {/* Results Body */}
                  <ComboboxOptions className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                    
                    {debouncedQuery.length > 0 && !hasResults && !isFetching && (
                      <div className="py-14 px-6 text-center text-slate-500 dark:text-slate-400">
                        <Icon icon="heroicons-outline:emoji-sad" className="mx-auto text-4xl mb-3 text-slate-300 dark:text-slate-600" />
                        <p>No results found for "{debouncedQuery}"</p>
                      </div>
                    )}

                    {debouncedQuery.length < 3 && !hasResults && !isFetching && (
                      <div className="py-6 px-6 text-center text-slate-400 dark:text-slate-500 text-sm">
                        Type at least 3 characters to search...
                      </div>
                    )}

                    {/* Did You Mean */}
                    {suggestions.length > 0 && (
                      <div className="py-2 bg-blue-50/50 dark:bg-slate-900/50">
                        <div className="px-4 py-1 text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider">
                          Did you mean?
                        </div>
                        {suggestions.map((sug, i) => (
                          <ComboboxOption key={`sug-${i}`} value={{ ...sug, isSuggestion: true }}>
                            {({ isActive }) => (
                              <div
                                className={`px-4 text-[15px] font-medium py-2 cursor-pointer flex items-center ${
                                  isActive
                                    ? "bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-blue-300"
                                    : "text-blue-600 dark:text-blue-400"
                                }`}
                              >
                                <Icon icon="heroicons-outline:sparkles" className="mr-2" />
                                {sug.text}
                              </div>
                            )}
                          </ComboboxOption>
                        ))}
                      </div>
                    )}

                    <ResultGroup 
                      title="Products" 
                      items={results.products} 
                      urlPrefix="/catalog/products"
                      renderItem={(p) => (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-xs text-slate-500">{p.sku || p.brand}</span>
                        </div>
                      )}
                    />

                    <ResultGroup 
                      title="Orders" 
                      items={results.orders} 
                      urlPrefix="/orders"
                      renderItem={(o) => (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{o.orderNumber}</span>
                          <span className="text-xs text-slate-500">{o.customer?.name}</span>
                        </div>
                      )}
                    />

                    <ResultGroup 
                      title="Customers" 
                      items={results.customers} 
                      urlPrefix="/customers"
                      renderItem={(c) => (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{c.firstName} {c.lastName}</span>
                          <span className="text-xs text-slate-500">{c.mobileNumber}</span>
                        </div>
                      )}
                    />

                    <ResultGroup 
                      title="Staff" 
                      items={results.staff} 
                      getUrl={() => "/staff"}
                      getState={(s) => ({ openModal: s })}
                      renderItem={(s) => (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{s.firstName} {s.lastName}</span>
                          <span className="text-xs text-slate-500">{s.role}</span>
                        </div>
                      )}
                    />

                    <ResultGroup 
                      title="Batches" 
                      items={results.batches} 
                      urlPrefix="/inventory/batches"
                      renderItem={(b) => (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{b.batchNumber}</span>
                          <span className="text-xs text-slate-500">{b.productName}</span>
                        </div>
                      )}
                    />

                    <ResultGroup 
                      title="Suppliers" 
                      items={results.suppliers} 
                      urlPrefix="/purchases/suppliers"
                      renderItem={(s) => (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{s.name}</span>
                          <span className="text-xs text-slate-500">{s.phone}</span>
                        </div>
                      )}
                    />

                    <ResultGroup 
                      title="Purchases" 
                      items={results.purchases} 
                      urlPrefix="/purchases"
                      renderItem={(p) => (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{p.invoiceNumber}</span>
                          <span className="text-xs text-slate-500">{p.status}</span>
                        </div>
                      )}
                    />

                    <ResultGroup 
                      title="Medicine Requests" 
                      items={results.medicineRequests} 
                      urlPrefix="/medicine-requests"
                      renderItem={(m) => (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{m.normalizedRequest}</span>
                          <span className="text-xs text-slate-500">{m.status}</span>
                        </div>
                      )}
                    />

                    <ResultGroup 
                      title="Coupons" 
                      items={results.coupons} 
                      getUrl={() => "/coupons"}
                      getState={(c) => ({ openModal: c })}
                      renderItem={(c) => (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{c.code}</span>
                          <span className="text-xs text-slate-500">{c.discountType}</span>
                        </div>
                      )}
                    />

                  </ComboboxOptions>

                  {/* Footer */}
                  {hasResults && (
                    <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 rounded-b-xl px-4 py-3 text-center">
                      <button 
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        onClick={() => {
                          navigate(`/search?q=${encodeURIComponent(debouncedQuery)}`);
                          closeModal();
                        }}
                      >
                        View all results for "{debouncedQuery}" →
                      </button>
                    </div>
                  )}
                  
                </div>
              </Combobox>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </>
  );
};

export default SearchModal;
