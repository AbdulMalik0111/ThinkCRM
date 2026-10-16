import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Loading from "@/components/Loading";
import Flatpickr from "react-flatpickr";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import {
  useGetAllFollowUpsQuery,
  useCreateFollowUpMutation,
  useUpdateFollowUpMutation,
  useDeleteFollowUpMutation,
} from "@/store/api/leads/followupApiSlice";
import { useGetLeadsQuery } from "@/store/api/leads/leadsApiSlice";
import { useGetStaffQuery } from "@/store/api/management/managementApiSlice";
import { getAvatarColor } from "@/components/common/tableUtils";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { ToolbarFilterDropdown } from "@/components/common/TableToolbar";

dayjs.extend(isToday);
dayjs.extend(isYesterday);

const TYPE_CONFIG = {
  call: {
    label: "Phone Call",
    icon: "heroicons-outline:phone",
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
  },
  whatsapp: {
    label: "WhatsApp Chat",
    icon: "whatsapp",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
  },
  email: {
    label: "Email",
    icon: "heroicons-outline:envelope",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    iconBg: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
  },
  meeting: {
    label: "Meeting",
    icon: "heroicons-outline:user-group",
    badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
  },
  site_visit: {
    label: "Site Visit",
    icon: "heroicons-outline:map-pin",
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
  },
  other: {
    label: "Other",
    icon: "heroicons-outline:calendar",
    badge: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    iconBg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
};

const FollowUpsCalendar = () => {
  const navigate = useNavigate();

  // Queries & Mutations
  const { data, isLoading, isFetching, refetch } = useGetAllFollowUpsQuery();
  const { data: leadsData } = useGetLeadsQuery({ limit: 500 });
  const { data: staffData } = useGetStaffQuery({ page: 1, limit: 100 });
  const [createFollowUp, { isLoading: isCreating }] = useCreateFollowUpMutation();
  const [updateFollowUp, { isLoading: isUpdating }] = useUpdateFollowUpMutation();
  const [deleteFollowUp] = useDeleteFollowUpMutation();

  const allLeads = leadsData?.data?.leads || [];
  const staffList = staffData?.data?.users || staffData?.data?.staff || [];
  const followUps = data?.data?.followUps || [];

  // Filter & Search State
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'overdue', 'today', 'upcoming', 'completed'
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    leadId: "",
    type: "call",
    date: dayjs().format("YYYY-MM-DD"),
    time: dayjs().add(1, "hour").format("HH:mm"),
    notes: "",
    reminders: {
      tenMin: true,
      fiveMin: true,
      exact: true,
    },
  });
  const [formErrors, setFormErrors] = useState({});

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Categorize follow-ups into KPI Stats & Groups
  const { stats, categorizedFollowUps } = useMemo(() => {
    const now = dayjs();
    const statsObj = {
      total: followUps.length,
      overdue: 0,
      today: 0,
      upcoming: 0,
      completed: 0,
    };

    const categorized = {
      overdue: [],
      today: [],
      upcoming: [],
      completed: [],
    };

    followUps.forEach((fu) => {
      const scheduled = dayjs(fu.scheduledAt);
      const isPast = scheduled.isBefore(now);
      const isDueToday = scheduled.isToday();

      if (fu.status === "completed") {
        statsObj.completed++;
        categorized.completed.push(fu);
      } else if (fu.status === "cancelled") {
        categorized.completed.push(fu);
      } else if (isPast) {
        statsObj.overdue++;
        categorized.overdue.push(fu);
      } else if (isDueToday) {
        statsObj.today++;
        categorized.today.push(fu);
      } else {
        statsObj.upcoming++;
        categorized.upcoming.push(fu);
      }
    });

    return { stats: statsObj, categorizedFollowUps: categorized };
  }, [followUps]);

  // Filtered List based on Active Tab, Search, and Dropdown Filters
  const filteredFollowUps = useMemo(() => {
    let list = followUps;

    // Filter by Tab
    if (activeTab === "overdue") {
      list = categorizedFollowUps.overdue;
    } else if (activeTab === "today") {
      list = categorizedFollowUps.today;
    } else if (activeTab === "upcoming") {
      list = categorizedFollowUps.upcoming;
    } else if (activeTab === "completed") {
      list = categorizedFollowUps.completed;
    }

    // Filter by Type
    if (typeFilter !== "all") {
      list = list.filter((fu) => fu.type === typeFilter);
    }

    // Filter by Staff
    if (staffFilter !== "all") {
      list = list.filter((fu) => fu.assignedTo?._id === staffFilter || fu.assignedTo === staffFilter);
    }

    // Filter by Search Query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((fu) => {
        const leadName = fu.leadId?.fullName?.toLowerCase() || "";
        const leadPhone = fu.leadId?.phone?.toLowerCase() || "";
        const notes = fu.notes?.toLowerCase() || "";
        const type = fu.type?.toLowerCase() || "";
        return (
          leadName.includes(q) ||
          leadPhone.includes(q) ||
          notes.includes(q) ||
          type.includes(q)
        );
      });
    }

    return list;
  }, [followUps, activeTab, typeFilter, staffFilter, searchTerm, categorizedFollowUps]);

  // Status Handlers
  const handleStatusChange = async (id, status) => {
    try {
      await updateFollowUp({ id, data: { status } }).unwrap();
      toast.success(`Follow-up marked as ${status}`);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update follow-up");
    }
  };

  const confirmDelete = (fu) => {
    setItemToDelete(fu);
    setDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      await deleteFollowUp(itemToDelete._id || itemToDelete).unwrap();
      toast.success("Follow-up deleted successfully");
      setDeleteModalOpen(false);
      setItemToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete follow-up");
    } finally {
      setIsDeleting(false);
    }
  };

  // Create Follow-up submission
  const handleOpenSchedule = (leadId = "") => {
    setFormData({
      leadId: leadId || (allLeads[0]?._id || ""),
      type: "call",
      date: dayjs().format("YYYY-MM-DD"),
      time: dayjs().add(1, "hour").format("HH:mm"),
      notes: "",
      reminders: { tenMin: true, fiveMin: true, exact: true },
    });
    setFormErrors({});
    setIsScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.leadId) errors.leadId = "Please select a lead";
    if (!formData.date) errors.date = "Date is required";
    if (!formData.time) errors.time = "Time is required";
    if (!formData.notes.trim()) errors.notes = "Please provide notes/purpose";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const scheduledAt = dayjs(`${formData.date} ${formData.time}`).toISOString();
      await createFollowUp({
        leadId: formData.leadId,
        data: {
          type: formData.type,
          scheduledAt,
          notes: formData.notes.trim(),
          reminder10mSent: !formData.reminders.tenMin,
          reminder5mSent: !formData.reminders.fiveMin,
          reminder0mSent: !formData.reminders.exact,
        },
      }).unwrap();

      toast.success("Follow-up scheduled successfully");
      setIsScheduleModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to schedule follow-up");
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6 font-inter">
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
        <span className="text-slate-800 dark:text-slate-200 font-bold">Follow-Ups Calendar</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Follow-Ups Schedule
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Track and complete all scheduled calls, client meetings, site visits, and reminders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            title="Refresh Follow-ups"
          >
            <Icon icon="heroicons-outline:arrow-path" className={`text-lg ${isFetching ? "animate-spin text-blue-600" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => handleOpenSchedule()}
            className="h-10 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold text-xs sm:text-sm transition inline-flex items-center gap-2 cursor-pointer"
          >
            <Icon icon="heroicons-outline:plus" className="text-lg" />
            <span>Schedule Follow-up</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Follow-ups */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Follow-ups
            </span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
              {stats.total}
            </span>
            <span className="text-xs font-medium text-slate-400 mt-1 block">
              Across all leads
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl border border-blue-200/50 dark:border-blue-800/50">
            <Icon icon="heroicons-outline:calendar" />
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider block">
              Overdue Tasks
            </span>
            <span className="text-2xl font-bold text-rose-600 mt-1 block">
              {stats.overdue}
            </span>
            <span className="text-xs font-medium text-rose-500 mt-1 block">
              Action required
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center text-2xl border border-rose-200/50 dark:border-rose-800/50">
            <Icon icon="heroicons-outline:exclamation-triangle" />
          </div>
        </div>

        {/* Today's Follow-ups */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block">
              Due Today
            </span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">
              {stats.today}
            </span>
            <span className="text-xs font-medium text-slate-400 mt-1 block">
              Scheduled for today
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl border border-amber-200/50 dark:border-amber-800/50">
            <Icon icon="heroicons-outline:clock" />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">
              Completed
            </span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">
              {stats.completed}
            </span>
            <span className="text-xs font-medium text-emerald-500 mt-1 block">
              Successfully done
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl border border-emerald-200/50 dark:border-emerald-800/50">
            <Icon icon="heroicons-outline:check-badge" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
        {/* Top: View Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-700">
          {[
            { id: "all", label: "All Tasks", count: stats.total },
            { id: "overdue", label: "Overdue", count: stats.overdue, isAlert: stats.overdue > 0 },
            { id: "today", label: "Due Today", count: stats.today },
            { id: "upcoming", label: "Upcoming", count: stats.upcoming },
            { id: "completed", label: "Completed", count: stats.completed },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-[13px] font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`h-5 min-w-[20px] px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                    tab.isAlert
                      ? "bg-rose-500 text-white"
                      : isActive
                      ? "bg-primary-600 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom: Search & Filters Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Search Input - Clean & Responsive */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Icon
              icon="heroicons-outline:magnifying-glass"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by lead name, phone, or notes..."
              className="w-full h-[38px] pl-10 pr-9 text-[13px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="Clear search"
              >
                <Icon icon="heroicons-outline:x-mark" className="text-sm" />
              </button>
            )}
          </div>

          {/* Filters Group - Right-aligned, Cohesive Layout */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <ToolbarFilterDropdown
              filter={{
                id: "typeFilter",
                value: typeFilter,
                onChange: setTypeFilter,
                placeholder: "All Follow-up Types",
                minWidth: "180px",
                options: [
                  { value: "all", label: "All Follow-up Types" },
                  { value: "call", label: "Phone Call" },
                  { value: "whatsapp", label: "WhatsApp Chat" },
                  { value: "email", label: "Email" },
                  { value: "meeting", label: "Meeting" },
                  { value: "site_visit", label: "Site Visit" },
                  { value: "measurement", label: "Measurement" },
                  { value: "quotation", label: "Quotation" },
                  { value: "other", label: "Other" },
                ],
              }}
            />

            <ToolbarFilterDropdown
              filter={{
                id: "staffFilter",
                value: staffFilter,
                onChange: setStaffFilter,
                placeholder: "All Assigned Staff",
                minWidth: "180px",
                isSearchable: true,
                options: [
                  { value: "all", label: "All Assigned Staff" },
                  ...staffList.map((st) => ({
                    value: st._id,
                    label: `${st.firstName || ""} ${st.lastName || ""}`.trim() || st.name || "Staff",
                  })),
                ],
              }}
            />

            {/* Clear Filter Button */}
            {(searchTerm || typeFilter !== "all" || staffFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                  setStaffFilter("all");
                }}
                className="h-[38px] px-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 transition cursor-pointer"
                title="Reset all filters"
              >
                <Icon icon="heroicons-outline:arrow-path" className="text-xs" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Follow-Ups Cards List */}
      {filteredFollowUps.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="h-16 w-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Icon icon="heroicons-outline:calendar-days" className="text-3xl" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">
            No Follow-Ups Found
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            {searchTerm || typeFilter !== "all" || staffFilter !== "all"
              ? "No tasks match your selected filter criteria. Try adjusting or clearing your filters."
              : "No follow-up tasks scheduled in this category yet."}
          </p>
          <button
            type="button"
            onClick={() => handleOpenSchedule()}
            className="h-9 px-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Icon icon="heroicons-outline:plus" />
            <span>Schedule Follow-Up Now</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredFollowUps.map((fu) => {
            const scheduled = dayjs(fu.scheduledAt);
            const now = dayjs();
            const isPast = scheduled.isBefore(now) && fu.status === "pending";
            const lead = fu.leadId || {};
            const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, "") : "";
            const avatarColor = getAvatarColor(lead.fullName || "Lead");
            const typeInfo = TYPE_CONFIG[fu.type] || TYPE_CONFIG.call;

            return (
              <div
                key={fu._id}
                className={`bg-white dark:bg-slate-800 rounded-xl border transition p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isPast
                    ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10"
                    : "border-slate-200 dark:border-slate-700 hover:border-blue-400"
                }`}
              >
                {/* Left: Type Icon + Lead Details */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Type Icon Badge */}
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${typeInfo.iconBg}`}
                  >
                    <Icon icon={typeInfo.icon} />
                  </div>

                  {/* Lead & Scheduled Info */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/leads/${lead._id}`}
                        className="font-bold text-base text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline truncate"
                      >
                        {lead.fullName || "Unknown Lead"}
                      </Link>

                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border capitalize ${typeInfo.badge}`}>
                        {typeInfo.label}
                      </span>

                      {lead.projectType && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {lead.projectType}
                        </span>
                      )}

                      {isPast && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                          Overdue
                        </span>
                      )}
                    </div>

                    {/* Scheduled Time + Assigned Staff */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span className={`flex items-center gap-1.5 ${isPast ? "text-rose-600 font-bold" : ""}`}>
                        <Icon icon="heroicons-outline:clock" className="text-sm" />
                        <span>{scheduled.format("DD MMM YYYY [at] hh:mm A")}</span>
                      </span>

                      {fu.assignedTo && (
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Icon icon="heroicons-outline:user" className="text-sm" />
                          <span>
                            Assigned to: <strong className="text-slate-800 dark:text-slate-200">{fu.assignedTo.firstName} {fu.assignedTo.lastName}</strong>
                          </span>
                        </span>
                      )}

                      {lead.phone && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Icon icon="heroicons-outline:phone" className="text-xs" />
                          <span>{lead.phone}</span>
                        </span>
                      )}
                    </div>

                    {/* Notes preview */}
                    {fu.notes && (
                      <div className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 max-w-2xl">
                        "{fu.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Quick Communication & Status Action Buttons */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-700 flex-shrink-0">
                  {/* Quick Direct Communication */}
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      title="Call Lead"
                      className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 transition"
                    >
                      <Icon icon="heroicons-outline:phone" className="text-base" />
                    </a>
                  )}

                  {cleanPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      title="WhatsApp Chat"
                      className="h-9 w-9 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition"
                    >
                      <Icon icon="whatsapp" className="text-base text-[#25D366]" />
                    </a>
                  )}

                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      title="Email Lead"
                      className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 transition"
                    >
                      <Icon icon="heroicons-outline:envelope" className="text-base" />
                    </a>
                  )}

                  {/* Task Status Buttons */}
                  {fu.status === "pending" ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(fu._id, "completed")}
                        disabled={isUpdating}
                        className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Icon icon="heroicons-outline:check" className="text-sm" />
                        <span>Complete</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(fu._id, "cancelled")}
                        disabled={isUpdating}
                        className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600 dark:text-slate-300 font-semibold text-xs rounded-lg transition cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => confirmDelete(fu)}
                        className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete follow-up"
                      >
                        <Icon icon="heroicons-outline:trash" className="text-sm" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border capitalize inline-flex items-center gap-1.5 ${
                          fu.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <Icon icon={fu.status === "completed" ? "heroicons-outline:check-circle" : "heroicons-outline:x-circle"} />
                        <span>{fu.status}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => confirmDelete(fu)}
                        className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete record"
                      >
                        <Icon icon="heroicons-outline:trash" className="text-sm" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Follow-up Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden shadow-none">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold">
                  <Icon icon="heroicons-outline:calendar" className="text-lg" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    Schedule Follow-Up Task
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Plan your next call, meeting, or visit with a lead
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <Icon icon="heroicons-outline:x-mark" className="text-xl" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              {/* Select Lead */}
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Lead <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.leadId}
                  onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                  className={`w-full px-3 py-2 text-[13.5px] font-medium rounded-lg border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none ${
                    formErrors.leadId ? "border-rose-400" : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <option value="">-- Choose Lead --</option>
                  {allLeads.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.fullName} {l.phone ? `(${l.phone})` : ""} - {l.projectType || "Lead"}
                    </option>
                  ))}
                </select>
                {formErrors.leadId && <p className="text-xs text-rose-500 mt-1">{formErrors.leadId}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Type */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-[13.5px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="call">Phone Call</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="site_visit">Site Visit</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <Flatpickr
                    value={formData.date ? dayjs(formData.date).toDate() : ""}
                    onChange={([d]) => {
                      if (d) {
                        setFormData((prev) => ({
                          ...prev,
                          date: dayjs(d).format("YYYY-MM-DD"),
                        }));
                      } else {
                        setFormData((prev) => ({ ...prev, date: "" }));
                      }
                    }}
                    options={{
                      dateFormat: "d M Y",
                      minDate: dayjs().startOf("day").toDate(),
                    }}
                    className={`w-full px-3 py-2 text-[13.5px] rounded-lg border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none ${
                      formErrors.date ? "border-rose-400" : "border-slate-200 dark:border-slate-700"
                    }`}
                  />
                  {formErrors.date && <p className="text-xs text-rose-500 mt-1">{formErrors.date}</p>}
                </div>

                {/* Time */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className={`w-full px-3 py-2 text-[13.5px] rounded-lg border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none ${
                      formErrors.time ? "border-rose-400" : "border-slate-200 dark:border-slate-700"
                    }`}
                  />
                  {formErrors.time && <p className="text-xs text-rose-500 mt-1">{formErrors.time}</p>}
                </div>
              </div>

              {/* Notes / Purpose */}
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Follow-Up Purpose / Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Call client regarding quotation feedback and wardrobe design options..."
                  className={`w-full px-3 py-2 text-[13.5px] rounded-lg border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none ${
                    formErrors.notes ? "border-rose-400" : "border-slate-200 dark:border-slate-700"
                  }`}
                />
                {formErrors.notes && <p className="text-xs text-rose-500 mt-1">{formErrors.notes}</p>}
              </div>

              {/* Reminders Checkbox */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-2">
                  Notification Reminders
                </label>
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.reminders.tenMin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reminders: { ...formData.reminders, tenMin: e.target.checked },
                        })
                      }
                      className="rounded border-slate-300"
                    />
                    <span>10m before</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.reminders.fiveMin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reminders: { ...formData.reminders, fiveMin: e.target.checked },
                        })
                      }
                      className="rounded border-slate-300"
                    />
                    <span>5m before</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.reminders.exact}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reminders: { ...formData.reminders, exact: e.target.checked },
                        })
                      }
                      className="rounded border-slate-300"
                    />
                    <span>Exact time</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isCreating && <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-sm" />}
                  <span>Schedule Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Professional Popup, No Browser Alert */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }
        }}
        onConfirm={handleExecuteDelete}
        isLoading={isDeleting}
        title="Delete Follow-up Task"
        entityType="follow-up task"
        entityName={itemToDelete?.leadId?.fullName ? `for ${itemToDelete.leadId.fullName}` : "this scheduled follow-up"}
        message="This follow-up task will be permanently removed from the schedule. This action cannot be undone."
        confirmText="Delete Follow-up"
      />
    </div>
  );
};

export default FollowUpsCalendar;
