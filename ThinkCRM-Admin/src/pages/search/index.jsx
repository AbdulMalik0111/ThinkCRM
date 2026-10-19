import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useGetGlobalSearchQuery } from "@/store/api/management/managementApiSlice";
import dayjs from "dayjs";

const ENTITY_CONFIG = {
  leads: {
    label: "Leads",
    icon: "heroicons-outline:identification",
    iconBgClass: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-100 dark:border-blue-900/40",
  },
  customers: {
    label: "Customers",
    icon: "heroicons-outline:user-group",
    iconBgClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40",
  },
  projects: {
    label: "Projects",
    icon: "heroicons-outline:briefcase",
    iconBgClass: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-100 dark:border-purple-900/40",
  },
  quotations: {
    label: "Quotations",
    icon: "heroicons-outline:document-text",
    iconBgClass: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900/40",
  },
  followups: {
    label: "Follow-ups",
    icon: "heroicons-outline:calendar-days",
    iconBgClass: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border-sky-100 dark:border-sky-900/40",
  },
  measurements: {
    label: "Measurements",
    icon: "heroicons-outline:wrench-screwdriver",
    iconBgClass: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40",
  },
  documents: {
    label: "Documents",
    icon: "heroicons-outline:paper-clip",
    iconBgClass: "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 border-teal-100 dark:border-teal-900/40",
  },
  staff: {
    label: "Staff",
    icon: "heroicons-outline:user",
    iconBgClass: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-100 dark:border-rose-900/40",
  },
};

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const q = searchParams.get("q") || "";
  const entity = searchParams.get("entity") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [queryInput, setQueryInput] = useState(q);

  useEffect(() => {
    setQueryInput(q);
  }, [q]);

  const { data, isFetching, isError, refetch } = useGetGlobalSearchQuery(
    { q, entity: entity || undefined, page, limit: 50 },
    { skip: !q }
  );

  const searchData = data?.data || {};
  const results = searchData.results || {};
  const counts = searchData.counts || {};
  const totalCount = searchData.totalCount || 0;
  const suggestion = searchData.suggestion;

  const handleSearch = (e) => {
    e.preventDefault();
    if (queryInput.trim()) {
      setSearchParams({ q: queryInput.trim(), entity: "", page: "1" });
    }
  };

  const handleTabClick = (newEntity) => {
    const updated = { q, page: "1" };
    if (newEntity) updated.entity = newEntity;
    setSearchParams(updated);
  };

  const handleApplySuggestion = (sugText) => {
    setQueryInput(sugText);
    setSearchParams({ q: sugText, entity: "", page: "1" });
  };

  const availableTabs = [
    { id: "", label: "All Results", icon: "heroicons-outline:squares-2x2", count: totalCount },
    ...Object.keys(ENTITY_CONFIG).map((key) => ({
      id: key,
      label: ENTITY_CONFIG[key].label,
      icon: ENTITY_CONFIG[key].icon,
      count: counts[key] || 0,
    })),
  ];

  return (
    <div className="space-y-6 font-inter">
      {/* Top Header Card */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Global CRM Search
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Search across leads, customers, projects, quotations, documents, and staff
              </p>
            </div>

            {/* Search Input Bar */}
            <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
              <div className="relative flex-1">
                <Icon
                  icon="heroicons-outline:magnifying-glass"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
                />
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Search name, phone, email, quotation..."
                  className="w-full h-10 pl-10 pr-4 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500 transition"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition cursor-pointer flex-shrink-0"
              >
                Search
              </button>
            </form>
          </div>

          {/* "Did you mean?" Suggestion Banner */}
          {suggestion && (
            <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs">
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
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                Apply Suggestion
              </button>
            </div>
          )}

          {/* Category Tabs */}
          {q && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100 dark:border-slate-700">
              {availableTabs.map((tab) => {
                const isActive = entity === tab.id;
                return (
                  <button
                    key={tab.id || "all"}
                    type="button"
                    onClick={() => handleTabClick(tab.id)}
                    className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-primary-600 text-white shadow-sm shadow-primary-500/25 ring-1 ring-primary-600"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700 hover:bg-slate-100/90 dark:hover:bg-slate-750 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {tab.icon && (
                      <Icon
                        icon={tab.icon}
                        className={`text-[13px] ${
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                        }`}
                      />
                    )}
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Main Results View */}
      {!q ? (
        <Card>
          <div className="py-20 text-center text-slate-500">
            <Icon icon="heroicons-outline:magnifying-glass" className="mx-auto text-5xl mb-3 text-slate-300 dark:text-slate-600" />
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">Enter a query to search ThinkCRM</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Search by customer name, phone number, email address, quotation ID, project name, or lead.
            </p>
          </div>
        </Card>
      ) : isFetching ? (
        <Card>
          <div className="py-20 text-center">
            <Icon icon="heroicons-outline:arrow-path" className="animate-spin mx-auto text-4xl text-primary-500 mb-3" />
            <p className="text-xs font-semibold text-slate-500">Searching records across CRM...</p>
          </div>
        </Card>
      ) : isError ? (
        <Card>
          <div className="py-16 text-center text-rose-500">
            <Icon icon="heroicons-outline:exclamation-triangle" className="mx-auto text-4xl mb-3" />
            <p className="text-sm font-bold">Failed to load search results</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Please try again or check your network.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        </Card>
      ) : totalCount === 0 ? (
        <Card>
          <div className="py-20 text-center">
            <Icon icon="heroicons-outline:emoji-sad" className="text-5xl text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">
              No results found for "{q}"
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your query or check for typos. You can search by customer phone number, name, quotation ID, or project.
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
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.keys(ENTITY_CONFIG).map((entityKey) => {
            const items = results[entityKey] || [];
            if (items.length === 0) return null;
            if (entity && entity !== entityKey) return null;

            const config = ENTITY_CONFIG[entityKey];

            return (
              <Card key={entityKey} title={`${config.label} (${items.length})`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {items.map((item, idx) => (
                    <div
                      key={item._id || idx}
                      onClick={() => {
                        if (entityKey === "leads") navigate(`/leads/${item._id}`);
                        else if (entityKey === "customers") navigate(`/customers/${item._id}`);
                        else if (entityKey === "projects") navigate(`/customers/${item.customerId}?tab=projects`);
                        else if (entityKey === "quotations") navigate(`/leads/${item.leadId?._id || item.leadId}?tab=quotations`);
                        else if (entityKey === "followups") {
                          if (item.leadId) navigate(`/leads/${item.leadId?._id || item.leadId}?tab=follow_ups`);
                          else if (item.customerId) navigate(`/customers/${item.customerId?._id || item.customerId}?tab=followups`);
                          else navigate("/leads/follow-ups");
                        } else if (entityKey === "measurements") navigate(`/leads/${item.leadId?._id || item.leadId}?tab=measurements`);
                        else if (entityKey === "documents") {
                          if (item.sourceType === "customer") navigate(`/customers/${item.sourceId}?tab=documents`);
                          else navigate(`/leads/${item.sourceId}?tab=files`);
                        } else if (entityKey === "notes") {
                          if (item.leadId) navigate(`/leads/${item.leadId?._id || item.leadId}?tab=activities`);
                          else if (item.customerId) navigate(`/customers/${item.customerId?._id || item.customerId}?tab=activities`);
                        } else if (entityKey === "staff") navigate("/staff", { state: { openModal: item } });
                      }}
                      className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 rounded-xl flex items-start gap-3 transition hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer shadow-none group"
                    >
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border ${config.iconBgClass}`}>
                        <Icon icon={config.icon} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-[13.5px] font-bold text-slate-900 dark:text-white truncate group-hover:text-primary-600 transition">
                            {item.fullName || item.projectName || (item.quotationNumber ? `Quotation #${item.quotationNumber}` : item.name || item.type || "Record")}
                          </h5>
                          {item.status && (
                            <span className="text-[10px] font-bold capitalize px-2 py-0.5 rounded-md border bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 flex-shrink-0">
                              {item.status.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                          {item.phone && (
                            <div className="flex items-center gap-1">
                              <Icon icon="heroicons-outline:phone" className="text-xs text-slate-400" />
                              <span>{item.phone}</span>
                            </div>
                          )}
                          {item.email && (
                            <div className="flex items-center gap-1 truncate">
                              <Icon icon="heroicons-outline:envelope" className="text-xs text-slate-400" />
                              <span className="truncate">{item.email}</span>
                            </div>
                          )}
                          {item.amount !== undefined && (
                            <div className="font-bold text-emerald-600 dark:text-emerald-400">
                              Amount: ₹{Number(item.amount).toLocaleString("en-IN")}
                            </div>
                          )}
                          {item.budget !== undefined && item.budget > 0 && (
                            <div className="font-semibold text-slate-700 dark:text-slate-300">
                              Budget: ₹{Number(item.budget).toLocaleString("en-IN")}
                            </div>
                          )}
                          {item.customerName && (
                            <div>Customer: <strong>{item.customerName}</strong></div>
                          )}
                          {item.leadId?.fullName && (
                            <div>Lead: <strong>{item.leadId.fullName}</strong></div>
                          )}
                          {(item.city || item.location) && (
                            <div className="flex items-center gap-1">
                              <Icon icon="heroicons-outline:map-pin" className="text-xs text-slate-400" />
                              <span>{item.city || item.location}</span>
                            </div>
                          )}
                          {item.scheduledAt && (
                            <div>Date: {dayjs(item.scheduledAt).format("DD MMM YYYY, hh:mm A")}</div>
                          )}
                        </div>

                        {(item.notes || item.description || item.message) && (
                          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 line-clamp-1 italic mt-1.5 font-inter">
                            "{item.notes || item.description || item.message}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
