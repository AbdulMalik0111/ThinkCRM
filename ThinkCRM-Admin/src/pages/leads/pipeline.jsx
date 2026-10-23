import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  useGetLeadsQuery,
  useUpdateLeadMutation,
} from "@/store/api/leads/leadsApiSlice";
import { useGetStaffQuery } from "@/store/api/management/managementApiSlice";
import { getAvatarColor } from "@/components/common/tableUtils";
import AddLeadModal from "./components/AddLeadModal";

// 7 Logical Pipeline Stages matching the backend Lead status schema
const PIPELINE_STAGES = [
  {
    id: "new",
    targetStatus: "new",
    matchingStatuses: ["new"],
    title: "New Leads",
    icon: "heroicons-outline:sparkles",
    headerBg: "bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
    badgeBg: "bg-blue-600 text-white",
  },
  {
    id: "contacted",
    targetStatus: "contacted",
    matchingStatuses: ["contacted", "attempted"],
    title: "Contacted",
    icon: "heroicons-outline:phone",
    headerBg: "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300",
    badgeBg: "bg-indigo-600 text-white",
  },
  {
    id: "qualified",
    targetStatus: "qualified",
    matchingStatuses: ["qualified", "in_progress", "follow_up"],
    title: "Qualified",
    icon: "heroicons-outline:shield-check",
    headerBg: "bg-purple-50/80 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300",
    badgeBg: "bg-purple-600 text-white",
  },
  {
    id: "measurement",
    targetStatus: "measurement_pending",
    matchingStatuses: ["measurement_pending", "measurement_scheduled", "measurement_completed"],
    title: "Measurement",
    icon: "heroicons-outline:scale",
    headerBg: "bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300",
    badgeBg: "bg-amber-600 text-white",
  },
  {
    id: "quotation",
    targetStatus: "quotation_pending",
    matchingStatuses: ["quotation_pending", "quotation_sent", "negotiation"],
    title: "Quotation & Proposal",
    icon: "heroicons-outline:document-text",
    headerBg: "bg-sky-50/80 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300",
    badgeBg: "bg-sky-600 text-white",
  },
  {
    id: "won",
    targetStatus: "converted",
    matchingStatuses: ["won", "converted"],
    title: "Won / Converted",
    icon: "heroicons-outline:trophy",
    headerBg: "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
    badgeBg: "bg-emerald-600 text-white",
  },
  {
    id: "lost",
    targetStatus: "lost",
    matchingStatuses: ["lost", "junk"],
    title: "Lost / Closed",
    icon: "heroicons-outline:x-circle",
    headerBg: "bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300",
    badgeBg: "bg-rose-600 text-white",
  },
];

const priorityStyles = {
  urgent: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200",
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200",
};

const Pipeline = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isOwnerOrAdmin = user && (user.role === "Owner" || user.role === "Admin");

  // Queries & Mutations
  const { data: response, isLoading, isFetching, refetch } = useGetLeadsQuery({ limit: 1000, sort: "createdAt:desc" });
  const { data: staffData } = useGetStaffQuery({ page: 1, limit: 100 }, { skip: !isOwnerOrAdmin });
  const [updateLead] = useUpdateLeadMutation();

  const [leads, setLeads] = useState([]);
  const [draggedLeadId, setDraggedLeadId] = useState(null);
  const [dragOverStageId, setDragOverStageId] = useState(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [staffFilter, setStaffFilter] = useState("all");
  const [projectTypeFilter, setProjectTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Add Lead Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const staffList = staffData?.data?.users || staffData?.data?.staff || [];

  useEffect(() => {
    if (response?.data?.leads) {
      setLeads(response.data.leads);
    }
  }, [response]);

  // Drag & Drop Handlers
  const handleDragStart = (e, leadId) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData("leadId", leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStageId(null);
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  const handleDragLeave = (e, stageId) => {
    if (dragOverStageId === stageId) {
      setDragOverStageId(null);
    }
  };

  const handleDrop = async (e, stage) => {
    e.preventDefault();
    setDragOverStageId(null);
    const leadId = e.dataTransfer.getData("leadId") || draggedLeadId;
    if (!leadId) return;

    const lead = leads.find((l) => l._id === leadId);
    if (!lead || stage.matchingStatuses.includes(lead.status)) return;

    const newStatus = stage.targetStatus;

    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l._id === leadId ? { ...l, status: newStatus } : l))
    );

    try {
      await updateLead({ id: leadId, data: { status: newStatus } }).unwrap();
      toast.success(`Lead moved to "${stage.title}"`);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update lead status");
      refetch();
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const nameMatch = l.fullName?.toLowerCase().includes(q);
        const phoneMatch = l.phone?.toLowerCase().includes(q);
        const emailMatch = l.email?.toLowerCase().includes(q);
        const projectMatch = l.projectType?.toLowerCase().includes(q);
        if (!nameMatch && !phoneMatch && !emailMatch && !projectMatch) return false;
      }

      // Staff filter
      if (staffFilter !== "all") {
        const assignedId = l.assignedTo?._id || l.assignedTo;
        if (assignedId !== staffFilter) return false;
      }

      // Project type filter
      if (projectTypeFilter !== "all" && l.projectType !== projectTypeFilter) {
        return false;
      }

      // Source filter
      if (sourceFilter !== "all" && l.leadSource !== sourceFilter) {
        return false;
      }

      return true;
    });
  }, [leads, searchTerm, staffFilter, projectTypeFilter, sourceFilter]);

  // Overall Pipeline Summary Stats
  const pipelineMetrics = useMemo(() => {
    let totalValue = 0;
    let wonValue = 0;
    let activeCount = 0;
    let wonCount = 0;

    filteredLeads.forEach((l) => {
      const budget = Number(l.budget) || 0;
      if (l.status === "won" || l.status === "converted") {
        wonCount++;
        wonValue += budget;
      } else if (l.status !== "lost" && l.status !== "junk") {
        activeCount++;
        totalValue += budget;
      }
    });

    const avgDeal = activeCount > 0 ? Math.round(totalValue / activeCount) : 0;

    return {
      activeCount,
      totalValue,
      wonCount,
      wonValue,
      avgDeal,
    };
  }, [filteredLeads]);

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-5 font-inter">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <button
          onClick={() => navigate("/leads")}
          className="hover:text-primary-600 transition flex items-center gap-1 font-semibold"
        >
          <Icon icon="heroicons-outline:identification" />
          <span>Leads</span>
        </button>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 font-bold">Pipeline Kanban</span>
      </div>

      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Leads Pipeline (Kanban Board)
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Visual deal flow — drag and drop cards to update status and advance stages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Switcher Toggle */}
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 text-xs font-bold transition inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <Icon icon="heroicons-outline:view-columns" className="text-sm" />
              <span>Board View</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/leads")}
              className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Icon icon="heroicons-outline:bars-3-bottom-left" className="text-sm" />
              <span>Table View</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            title="Refresh Pipeline"
          >
            <Icon icon="heroicons-outline:arrow-path" className={`text-lg ${isFetching ? "animate-spin text-blue-600" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold text-xs sm:text-sm transition inline-flex items-center gap-2 cursor-pointer"
          >
            <Icon icon="heroicons-outline:plus" className="text-lg" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Active Deals
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 block">
              {pipelineMetrics.activeCount} leads
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-xl">
            <Icon icon="heroicons-outline:identification" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Pipeline Value
            </span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              ₹{pipelineMetrics.totalValue.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-xl">
            <Icon icon="heroicons-outline:banknotes" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Average Deal
            </span>
            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
              ₹{pipelineMetrics.avgDeal.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center text-xl">
            <Icon icon="heroicons-outline:chart-bar" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Won & Converted
            </span>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
              {pipelineMetrics.wonCount} deals (₹{pipelineMetrics.wonValue.toLocaleString("en-IN")})
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center text-xl">
            <Icon icon="heroicons-outline:trophy" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Icon
            icon="heroicons-outline:magnifying-glass"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leads by name, phone, project..."
            className="w-full pl-10 pr-4 py-2 text-[13.5px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <Icon icon="heroicons-outline:x-mark" />
            </button>
          )}
        </div>

        {/* Staff Filter - only for Owner/Admin */}
        {isOwnerOrAdmin && (
          <div className="w-44">
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full px-3 py-2 text-[13px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Staff</option>
              {staffList.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.firstName} {st.lastName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Project Type Filter */}
        <div className="w-48">
          <select
            value={projectTypeFilter}
            onChange={(e) => setProjectTypeFilter(e.target.value)}
            className="w-full px-3 py-2 text-[13px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Project Types</option>
            <option value="Modular Kitchen">Modular Kitchen</option>
            <option value="Wardrobe Design">Wardrobe Design</option>
            <option value="Full Home Interior">Full Home Interior</option>
            <option value="Office Interior">Office Interior</option>
            <option value="Living Room">Living Room</option>
            <option value="Commercial">Commercial</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Source Filter */}
        <div className="w-40">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full px-3 py-2 text-[13px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Sources</option>
            <option value="Website">Website</option>
            <option value="Meta Ads">Meta Ads</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Referral">Referral</option>
            <option value="Direct">Direct</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Clear Filters */}
        {(searchTerm || staffFilter !== "all" || projectTypeFilter !== "all" || sourceFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setStaffFilter("all");
              setProjectTypeFilter("all");
              setSourceFilter("all");
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white px-2 py-1 transition cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Kanban Board Container */}
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-4 min-w-max items-start">
          {PIPELINE_STAGES.map((stage) => {
            const columnLeads = filteredLeads.filter((l) =>
              stage.matchingStatuses.includes(l.status)
            );

            const stageTotalValue = columnLeads.reduce(
              (acc, l) => acc + (Number(l.budget) || 0),
              0
            );

            const isDropTarget = dragOverStageId === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={(e) => handleDragLeave(e, stage.id)}
                onDrop={(e) => handleDrop(e, stage)}
                className={`w-[320px] rounded-xl border flex flex-col transition-all duration-150 ${
                  isDropTarget
                    ? "border-primary-500 bg-primary-50/20 ring-2 ring-primary-500/20"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40"
                }`}
              >
                {/* Column Header */}
                <div
                  className={`px-4 py-3 border-b rounded-t-xl flex items-center justify-between ${stage.headerBg}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon icon={stage.icon} className="text-base" />
                    <span className="font-bold text-sm tracking-wide">
                      {stage.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`h-5 min-w-[20px] px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${stage.badgeBg}`}
                    >
                      {columnLeads.length}
                    </span>
                  </div>
                </div>

                {/* Sub-header: Stage total value */}
                <div className="px-4 py-1.5 bg-white/70 dark:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Stage Value:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ₹{stageTotalValue.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Column Body: Leads Cards */}
                <div className="p-3 space-y-3 min-h-[460px] max-h-[calc(100vh-360px)] overflow-y-auto custom-scrollbar">
                  {columnLeads.length === 0 ? (
                    <div
                      className={`h-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center p-4 transition ${
                        isDropTarget
                          ? "border-primary-400 bg-primary-50/30 text-primary-600"
                          : "border-slate-200 dark:border-slate-700 text-slate-400"
                      }`}
                    >
                      <Icon
                        icon="heroicons-outline:arrow-down-tray"
                        className="text-2xl mb-1 opacity-60"
                      />
                      <span className="text-xs font-semibold">Drop leads here</span>
                    </div>
                  ) : (
                    columnLeads.map((lead) => {
                      const avatarColor = getAvatarColor(lead.fullName || "Lead");
                      const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, "") : "";

                      return (
                        <div
                          key={lead._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead._id)}
                          onDragEnd={handleDragEnd}
                          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-blue-400 dark:hover:border-blue-500 transition cursor-grab active:cursor-grabbing group shadow-none"
                        >
                          {/* Card Header: Avatar + Lead Name + Direct Communication */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold uppercase flex-shrink-0 border border-slate-200 dark:border-slate-700 ${avatarColor}`}
                              >
                                {lead.fullName?.charAt(0) || "L"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <Link
                                  to={`/leads/${lead._id}`}
                                  className="font-bold text-[13.5px] text-slate-900 dark:text-white hover:text-primary-600 truncate block transition"
                                  title={lead.fullName}
                                >
                                  {lead.fullName}
                                </Link>
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                                  {lead.projectType || "General Lead"}
                                </span>
                              </div>
                            </div>

                            {/* Direct Communication on Card */}
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                              {lead.phone && (
                                <a
                                  href={`tel:${lead.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  title="Call Lead"
                                  className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                                >
                                  <Icon icon="heroicons-outline:phone" className="text-xs" />
                                </a>
                              )}
                              {cleanPhone && (
                                <a
                                  href={`https://wa.me/${cleanPhone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  title="WhatsApp"
                                  className="h-7 w-7 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition"
                                >
                                  <Icon icon="whatsapp" className="text-xs" />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Middle: Badges (Priority & Source) */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                            {lead.priority && (
                              <span
                                className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                  priorityStyles[lead.priority] || priorityStyles.medium
                                }`}
                              >
                                {lead.priority}
                              </span>
                            )}
                            <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {lead.leadSource || "Website"}
                            </span>
                          </div>

                          {/* Budget */}
                          <div className="bg-slate-50/70 dark:bg-slate-900/50 rounded-lg p-2 mb-2.5 flex items-center justify-between border border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] text-slate-400 font-medium">Budget</span>
                            <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
                              {lead.budget ? `₹${Number(lead.budget).toLocaleString("en-IN")}` : "Flexible"}
                            </span>
                          </div>

                          {/* Card Footer: Assigned To & Date */}
                          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                                {lead.assignedTo?.firstName?.charAt(0) || "U"}
                              </div>
                              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[110px]">
                                {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName || ""}` : "Unassigned"}
                              </span>
                            </div>

                            <span className="text-[10.5px] font-medium text-slate-400 flex items-center gap-1">
                              <Icon icon="heroicons-outline:calendar" className="text-xs" />
                              <span>{dayjs(lead.createdAt).format("DD MMM")}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          refetch();
          toast.success("Lead created and added to pipeline");
        }}
      />
    </div>
  );
};

export default Pipeline;
