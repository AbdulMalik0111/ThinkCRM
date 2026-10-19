import React, { Fragment, useState, useEffect, useRef, useMemo } from "react";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import Icon from "@/components/ui/Icon";
import { useGetGlobalSearchQuery } from "@/store/api/management/managementApiSlice";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const RECENT_SEARCHES_KEY = "thinkcrm_recent_searches";

const ENTITY_CONFIG = {
  leads: {
    label: "Leads",
    icon: "heroicons-outline:identification",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    iconBgClass: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-100 dark:border-blue-900/40",
  },
  customers: {
    label: "Customers",
    icon: "heroicons-outline:user-group",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    iconBgClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40",
  },
  projects: {
    label: "Projects",
    icon: "heroicons-outline:briefcase",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    iconBgClass: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-100 dark:border-purple-900/40",
  },
  quotations: {
    label: "Quotations",
    icon: "heroicons-outline:document-text",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    iconBgClass: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900/40",
  },
  followups: {
    label: "Follow-ups",
    icon: "heroicons-outline:calendar-days",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
    iconBgClass: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border-sky-100 dark:border-sky-900/40",
  },
  measurements: {
    label: "Measurements",
    icon: "heroicons-outline:wrench-screwdriver",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    iconBgClass: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40",
  },
  documents: {
    label: "Documents",
    icon: "heroicons-outline:paper-clip",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
    iconBgClass: "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 border-teal-100 dark:border-teal-900/40",
  },
  staff: {
    label: "Staff",
    icon: "heroicons-outline:user",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    iconBgClass: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-100 dark:border-rose-900/40",
  },
};

const getStatusBadgeClass = (status = "") => {
  const s = String(status).toLowerCase();
  if (["active", "won", "approved", "completed", "accepted"].includes(s)) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
  }
  if (["in_progress", "contacted", "qualified", "scheduled", "sent", "negotiation"].includes(s)) {
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
  }
  if (["pending", "follow_up", "measurement_pending", "quotation_pending", "draft", "new"].includes(s)) {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
  }
  if (["lost", "cancelled", "rejected", "junk", "deleted"].includes(s)) {
    return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
  }
  return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
};

const SearchModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const resultsContainerRef = useRef(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 6));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const saveRecentSearch = (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) return;
    const term = searchTerm.trim();
    try {
      const updated = [term, ...recentSearches.filter((s) => s.toLowerCase() !== term.toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const removeRecentSearch = (e, termToRemove) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter((s) => s !== termToRemove);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setSelectedIndex(0);
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching, isError, refetch } = useGetGlobalSearchQuery(
    { q: debouncedQuery, entity: activeFilter !== "all" ? activeFilter : undefined, limit: 10 },
    { skip: debouncedQuery.length === 0 }
  );

  const searchData = data?.data || {};
  const results = searchData.results || {};
  const suggestion = searchData.suggestion;
  const counts = searchData.counts || {};
  const totalCount = searchData.totalCount || 0;

  // Available categories that have matching results (strictly from ENTITY_CONFIG)
  const availableCategories = useMemo(() => {
    let activeTotal = 0;
    const catList = [];

    Object.keys(ENTITY_CONFIG).forEach((key) => {
      const c = (results[key] || []).length;
      if (c > 0) {
        activeTotal += c;
        catList.push({
          id: key,
          label: ENTITY_CONFIG[key].label,
          icon: ENTITY_CONFIG[key].icon,
          count: c,
        });
      }
    });

    const list = [
      { id: "all", label: "All", icon: "heroicons-outline:squares-2x2", count: activeTotal },
      ...catList,
    ];
    return { list, activeTotal };
  }, [results]);

  // Flatten active visible results for keyboard arrow navigation (strictly only valid entities from ENTITY_CONFIG)
  const flatItems = useMemo(() => {
    if (!results) return [];
    const validEntityKeys = Object.keys(ENTITY_CONFIG);
    const visibleKeys = activeFilter === "all"
      ? validEntityKeys.filter((k) => (results[k] || []).length > 0)
      : [activeFilter];
    const items = [];
    visibleKeys.forEach((key) => {
      const groupItems = results[key] || [];
      groupItems.forEach((item) => {
        items.push({ ...item, _entityType: key });
      });
    });
    return items;
  }, [results, activeFilter]);

  // Handle keyboard navigation inside the modal
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (flatItems.length > 0 ? (prev + 1) % flatItems.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (flatItems.length > 0 ? (prev - 1 + flatItems.length) % flatItems.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems.length > 0 && flatItems[selectedIndex]) {
        handleItemClick(flatItems[selectedIndex]);
      } else if (debouncedQuery) {
        handleViewAll();
      }
    } else if (e.key === "Escape") {
      closeModal();
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setQuery("");
    setDebouncedQuery("");
    setActiveFilter("all");
    setSelectedIndex(0);
  };

  const openModal = () => {
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleItemClick = (item) => {
    if (!item) return;
    saveRecentSearch(debouncedQuery || item.fullName || item.projectName || item.quotationNumber);

    const type = item._entityType;
    if (type === "leads") {
      navigate(`/leads/${item._id}`);
    } else if (type === "customers") {
      navigate(`/customers/${item._id}`);
    } else if (type === "projects") {
      navigate(`/customers/${item.customerId}?tab=projects`);
    } else if (type === "quotations") {
      const leadId = item.leadId?._id || item.leadId;
      navigate(leadId ? `/leads/${leadId}?tab=quotations` : "/leads");
    } else if (type === "followups") {
      if (item.leadId) {
        navigate(`/leads/${item.leadId?._id || item.leadId}?tab=follow_ups`);
      } else if (item.customerId) {
        navigate(`/customers/${item.customerId?._id || item.customerId}?tab=followups`);
      } else {
        navigate("/leads/follow-ups");
      }
    } else if (type === "measurements") {
      const leadId = item.leadId?._id || item.leadId;
      navigate(leadId ? `/leads/${leadId}?tab=measurements` : "/leads");
    } else if (type === "documents") {
      if (item.sourceType === "customer") {
        navigate(`/customers/${item.sourceId}?tab=documents`);
      } else {
        navigate(`/leads/${item.sourceId}?tab=files`);
      }
    } else if (type === "staff") {
      navigate("/staff", { state: { openModal: item } });
    }

    closeModal();
  };

  const handleViewAll = () => {
    if (!debouncedQuery) return;
    saveRecentSearch(debouncedQuery);
    navigate(`/search?q=${encodeURIComponent(debouncedQuery)}${activeFilter !== "all" ? `&entity=${activeFilter}` : ""}`);
    closeModal();
  };

  const handleApplySuggestion = (sugText) => {
    setQuery(sugText);
    setDebouncedQuery(sugText);
    inputRef.current?.focus();
  };

  let currentGlobalIndex = 0;

  return (
    <>
      {/* Header Search Trigger Button */}
      <button
        type="button"
        onClick={openModal}
        className="flex items-center justify-between xl:w-[460px] md:w-[320px] w-auto h-10 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition duration-150 cursor-pointer font-inter group"
        title="Search across entire CRM (Ctrl + K)"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon icon="heroicons-outline:magnifying-glass" className="text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 text-lg flex-shrink-0 transition-colors" />
          <span className="hidden xl:inline text-xs font-medium text-slate-400 dark:text-slate-500 truncate">
            Search leads, customers, projects, quotations...
          </span>
          <span className="inline xl:hidden text-xs font-medium text-slate-400 dark:text-slate-500">
            Search CRM...
          </span>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-none select-none">
          Ctrl K
        </kbd>
      </button>

      {/* Global Search Dialog Modal */}
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-[99999] overflow-y-auto p-4 sm:p-6 md:p-10 font-inter" onClose={closeModal}>
          {/* Backdrop with subtle blur */}
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" />
          </TransitionChild>

          <div className="fixed inset-0 z-10 overflow-y-auto flex items-start justify-center pt-10 sm:pt-16 p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left shadow-none transition-all flex flex-col max-h-[82vh]">
                {/* Search Input Bar */}
                <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/80 bg-white dark:bg-slate-800">
                  <Icon icon="heroicons-outline:magnifying-glass" className="text-xl text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search by name, phone (+91), email, quotation #, project, lead..."
                    className="flex-1 bg-transparent border-0 outline-none focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base font-medium"
                    autoComplete="off"
                    spellCheck="false"
                  />

                  {/* Loading Spinner */}
                  {isFetching && (
                    <div className="flex items-center text-primary-600 dark:text-primary-400 text-sm flex-shrink-0">
                      <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-lg" />
                    </div>
                  )}

                  {/* Clear Button */}
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setDebouncedQuery("");
                        inputRef.current?.focus();
                      }}
                      className="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      title="Clear search"
                    >
                      <Icon icon="heroicons-outline:x-mark" className="text-base" />
                    </button>
                  )}

                  {/* ESC Key Badge */}
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-2 py-0.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 transition cursor-pointer"
                  >
                    ESC
                  </button>
                </div>

                {/* Filter Tabs Bar (Shown when multiple categories exist) */}
                {availableCategories.activeTotal > 0 && availableCategories.list.length > 2 && (
                  <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-900/50 overflow-x-auto no-scrollbar">
                    {availableCategories.list.map((cat) => {
                      const isActive = activeFilter === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setActiveFilter(cat.id);
                            setSelectedIndex(0);
                          }}
                          className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                            isActive
                              ? "bg-primary-600 text-white shadow-sm shadow-primary-500/25 ring-1 ring-primary-600"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700 hover:bg-slate-100/90 dark:hover:bg-slate-750 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          {cat.icon && (
                            <Icon
                              icon={cat.icon}
                              className={`text-[13px] ${
                                isActive
                                  ? "text-white"
                                  : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                              }`}
                            />
                          )}
                          <span>{cat.label}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-slate-100 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                            }`}
                          >
                            {cat.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* "Did you mean?" Suggestion Banner */}
                {suggestion && (
                  <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 bg-indigo-50/80 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/40 text-xs">
                    <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                      <Icon icon="heroicons-outline:sparkles" className="text-sm text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                      <span>
                        Did you mean:{" "}
                        <button
                          type="button"
                          onClick={() => handleApplySuggestion(suggestion)}
                          className="font-bold underline hover:text-indigo-600 dark:hover:text-indigo-300 cursor-pointer"
                        >
                          {suggestion}
                        </button>
                        ?
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplySuggestion(suggestion)}
                      className="px-2.5 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition"
                    >
                      Search this
                    </button>
                  </div>
                )}

                {/* Modal Body / Results Container */}
                <div ref={resultsContainerRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-4 font-inter">
                  {/* 1. INITIAL STATE: Recent Searches & Quick Tips */}
                  {!debouncedQuery && (
                    <div className="py-2 space-y-4">
                      {recentSearches.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-100 dark:border-slate-700/60">
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              Recent Searches
                            </span>
                            <button
                              type="button"
                              onClick={clearAllRecentSearches}
                              className="text-xs text-slate-400 hover:text-rose-600 transition font-medium"
                            >
                              Clear all
                            </button>
                          </div>
                          <div className="space-y-1 pt-1">
                            {recentSearches.map((term, i) => (
                              <div
                                key={i}
                                onClick={() => {
                                  setQuery(term);
                                  setDebouncedQuery(term);
                                }}
                                className="group flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                              >
                                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                  <Icon icon="heroicons-outline:clock" className="text-slate-400 group-hover:text-primary-600 text-sm" />
                                  <span>{term}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => removeRecentSearch(e, term)}
                                  className="text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 p-1"
                                  title="Remove"
                                >
                                  <Icon icon="heroicons-outline:x-mark" className="text-xs" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Search Hints */}
                      <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-2">
                        <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Icon icon="heroicons-outline:light-bulb" className="text-amber-500 text-sm" />
                          <span>Quick Search Tips</span>
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px] text-slate-500 dark:text-slate-400 pt-1">
                          <li className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            <span><strong>Name:</strong> Rahul Sharma, Client 1</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span><strong>Phone:</strong> +91 98765 43210 or 9876543210</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            <span><strong>Quotation:</strong> QT-477417 or QT-797156</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                            <span><strong>Project:</strong> Modular Kitchen, Wardrobe</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* 2. ERROR STATE */}
                  {isError && (
                    <div className="py-12 px-4 text-center">
                      <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center text-2xl mb-3 border border-rose-100">
                        <Icon icon="heroicons-outline:exclamation-triangle" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Failed to load search results</p>
                      <p className="text-xs text-slate-400 mt-1 mb-4">Please check your network connection and try again.</p>
                      <button
                        type="button"
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold transition"
                      >
                        <Icon icon="heroicons-outline:arrow-path" />
                        <span>Retry Search</span>
                      </button>
                    </div>
                  )}

                  {/* 3. EMPTY STATE: No Results */}
                  {debouncedQuery && !isFetching && !isError && availableCategories.activeTotal === 0 && (
                    <div className="py-12 px-4 text-center">
                      <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 mx-auto flex items-center justify-center text-3xl mb-3 border border-slate-200 dark:border-slate-700">
                        <Icon icon="heroicons-outline:magnifying-glass" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                        No results found for "{debouncedQuery}"
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Check your spelling or try searching with a phone number, customer name, quotation number, or project name.
                      </p>
                      {suggestion && (
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => handleApplySuggestion(suggestion)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold transition hover:bg-indigo-100"
                          >
                            <Icon icon="heroicons-outline:sparkles" />
                            <span>Did you mean "{suggestion}"?</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. RESULTS DISPLAY GROUPED BY ENTITY */}
                  {availableCategories.activeTotal > 0 && (
                    <div className="space-y-5">
                      {Object.keys(ENTITY_CONFIG).map((entityKey) => {
                        const items = results[entityKey] || [];
                        if (items.length === 0) return null;
                        if (activeFilter !== "all" && activeFilter !== entityKey) return null;

                        const config = ENTITY_CONFIG[entityKey];

                        return (
                          <div key={entityKey} className="space-y-2">
                            {/* Section Category Header */}
                            <div className="flex items-center justify-between px-1.5 pt-1">
                              <div className="flex items-center gap-2">
                                <div className={`h-5 w-5 rounded-md flex items-center justify-center text-xs ${config.iconBgClass}`}>
                                  <Icon icon={config.icon} />
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  {config.label}
                                </span>
                              </div>
                              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-full">
                                {items.length} {items.length === 1 ? "result" : "results"}
                              </span>
                            </div>

                            {/* Entity Item Cards */}
                            <div className="space-y-1.5">
                              {items.map((item) => {
                                const itemIndex = currentGlobalIndex++;
                                const isSelected = selectedIndex === itemIndex;

                                const displayCode = item.quotationNumber
                                  ? (item.quotationNumber.startsWith("QT") ? item.quotationNumber : `QT-${item.quotationNumber}`)
                                  : item.customerId
                                  ? item.customerId
                                  : typeof item.leadId === "string"
                                  ? item.leadId
                                  : item.leadId?.leadId || null;

                                return (
                                  <div
                                    key={item._id || itemIndex}
                                    onClick={() => handleItemClick({ ...item, _entityType: entityKey })}
                                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                                    className={`group border rounded-xl p-3.5 flex items-start gap-3.5 transition-all duration-150 cursor-pointer ${
                                      isSelected
                                        ? "border-primary-500/80 bg-primary-50/30 dark:bg-primary-950/25 ring-1 ring-primary-500/40 shadow-sm"
                                        : "border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-750"
                                    }`}
                                  >
                                    {/* Icon Box */}
                                    <div
                                      className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border ${config.iconBgClass}`}
                                    >
                                      <Icon icon={config.icon} />
                                    </div>

                                    {/* Info Block */}
                                    <div className="flex-1 min-w-0">
                                      {/* Row 1: Title + Status/ID badges */}
                                      <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <h5 className="text-[13.5px] font-bold text-slate-900 dark:text-white truncate">
                                            {item.fullName || item.projectName || (item.quotationNumber ? `Quotation #${item.quotationNumber}` : item.name || item.type || "Record")}
                                          </h5>
                                          {displayCode && (
                                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-600">
                                              {displayCode}
                                            </span>
                                          )}
                                        </div>

                                        {/* Status Badge */}
                                        {item.status && (
                                          <span className={`text-[10.5px] font-bold capitalize px-2 py-0.5 rounded-md border ${getStatusBadgeClass(item.status)}`}>
                                            {item.status.replace(/_/g, " ")}
                                          </span>
                                        )}
                                      </div>

                                      {/* Row 2: Secondary Metadata (Phone, Email, Amount, Date) */}
                                      <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap font-inter">
                                        {item.phone && (
                                          <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                                            <Icon icon="heroicons-outline:phone" className="text-xs text-slate-400" />
                                            <span>{item.phone}</span>
                                          </span>
                                        )}
                                        {item.phone && item.email && <span className="text-slate-300 dark:text-slate-600">•</span>}
                                        {item.email && (
                                          <span className="inline-flex items-center gap-1 truncate max-w-[220px]">
                                            <Icon icon="heroicons-outline:envelope" className="text-xs text-slate-400" />
                                            <span className="truncate">{item.email}</span>
                                          </span>
                                        )}
                                        {(item.phone || item.email) && (item.city || item.location) && (
                                          <span className="text-slate-300 dark:text-slate-600">•</span>
                                        )}
                                        {(item.city || item.location) && (
                                          <span className="inline-flex items-center gap-1">
                                            <Icon icon="heroicons-outline:map-pin" className="text-xs text-slate-400" />
                                            <span>{item.city || item.location}</span>
                                          </span>
                                        )}
                                        {item.amount !== undefined && item.amount > 0 && (
                                          <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/70 dark:border-emerald-800">
                                            ₹{Number(item.amount).toLocaleString("en-IN")}
                                          </span>
                                        )}
                                        {item.budget !== undefined && item.budget > 0 && (
                                          <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                                            Budget: ₹{Number(item.budget).toLocaleString("en-IN")}
                                          </span>
                                        )}
                                        {item.customerName && (
                                          <span>Customer: <strong className="font-semibold text-slate-700 dark:text-slate-200">{item.customerName}</strong></span>
                                        )}
                                        {item.leadId?.fullName && (
                                          <span>Lead: <strong className="font-semibold text-slate-700 dark:text-slate-200">{item.leadId.fullName}</strong></span>
                                        )}
                                        {item.scheduledAt && (
                                          <span className="inline-flex items-center gap-1">
                                            <Icon icon="heroicons-outline:calendar" className="text-xs text-slate-400" />
                                            <span>{dayjs(item.scheduledAt).format("DD MMM YYYY, hh:mm A")}</span>
                                          </span>
                                        )}
                                      </div>

                                      {/* Row 3: Notes / Description snippet */}
                                      {(item.notes || item.description || item.message) && (
                                        <p className="text-[11.5px] text-slate-500 dark:text-slate-400 line-clamp-1 italic mt-1 font-inter">
                                          "{item.notes || item.description || item.message}"
                                        </p>
                                      )}
                                    </div>

                                    {/* Action Arrow Icon */}
                                    <div className="flex items-center self-center justify-center text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all">
                                      <Icon icon="heroicons-outline:chevron-right" className="text-base" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer Bar */}
                <div className="border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-800/90 px-4 sm:px-5 py-3 flex items-center justify-between text-xs font-inter flex-wrap gap-2">
                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span className="inline-flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[10px] text-slate-500 dark:text-slate-300 shadow-none">↑↓</kbd>
                      <span>Navigate</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[10px] text-slate-500 dark:text-slate-300 shadow-none">↵</kbd>
                      <span>Open</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[10px] text-slate-500 dark:text-slate-300 shadow-none">Esc</kbd>
                      <span>Close</span>
                    </span>
                  </div>

                  {availableCategories.activeTotal > 0 && (
                    <button
                      type="button"
                      onClick={handleViewAll}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors cursor-pointer flex items-center gap-1.5 group"
                    >
                      <span>View all {availableCategories.activeTotal} results in full page</span>
                      <Icon icon="heroicons-outline:arrow-long-right" className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default SearchModal;
