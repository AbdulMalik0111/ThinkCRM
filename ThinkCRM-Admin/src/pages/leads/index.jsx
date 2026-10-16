import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { toast } from "react-toastify";
import dayjs from "dayjs";

// Shared Grid & Action Components
import DataGrid from "@/components/ui/DataGrid";
import RowActions from "@/components/ui/RowActions";
import { getAvatarColor } from "@/components/common/tableUtils";

// Modals
import AddLeadModal from "./components/AddLeadModal";
import AddFollowUpModal from "./components/AddFollowUpModal";
import ConvertLeadModal from "./components/ConvertLeadModal";
import DeleteLeadModal from "./components/DeleteLeadModal";
import { LeadStatusBadge, LeadSourceBadge } from "./components/LeadStatusBadge";

// API Hooks
import {
  useGetLeadsQuery,
  useGetLeadStatsQuery,
  useBulkAssignLeadsMutation,
  useBulkUpdateStatusMutation,
  useBulkDeleteLeadsMutation,
} from "@/store/api/leads/leadsApiSlice";
import { useGetStaffQuery } from "@/store/api/management/managementApiSlice";

const SOURCE_FILTER_OPTIONS = [
  { value: "all", label: "All Sources" },
  { value: "website", label: "Website" },
  { value: "meta_ads", label: "Meta Ads" },
  { value: "referral", label: "Referral" },
  { value: "google_ads", label: "Google Ads" },
  { value: "social_media", label: "Social Media" },
  { value: "direct", label: "Direct" },
  { value: "other", label: "Other" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in_progress", label: "In Progress" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
  { value: "junk", label: "Junk" },
];

const Leads = () => {
  const navigate = useNavigate();

  // Filters & Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [dateRange, setDateRange] = useState([]);

  // Selection state
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [followUpLead, setFollowUpLead] = useState(null);
  const [convertingLead, setConvertingLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);

  // Bulk Action State
  const [bulkAssignStaffId, setBulkAssignStaffId] = useState("");
  const [bulkStatusValue, setBulkStatusValue] = useState("");
  const [bulkAssignLeads, { isLoading: isBulkAssigning }] = useBulkAssignLeadsMutation();
  const [bulkUpdateStatus, { isLoading: isBulkUpdatingStatus }] = useBulkUpdateStatusMutation();
  const [bulkDeleteLeads, { isLoading: isBulkDeleting }] = useBulkDeleteLeadsMutation();

  // Queries
  const { data: statsData, refetch: refetchStats } = useGetLeadStatsQuery();
  const { data: staffData } = useGetStaffQuery({ page: 1, limit: 100 });
  const staffList = staffData?.data?.users || staffData?.data?.staff || [];

  const queryParams = useMemo(() => {
    return {
      page: currentPage,
      limit,
      ...(searchTerm && { search: searchTerm }),
      ...(sourceFilter !== "all" && { source: sourceFilter }),
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(staffFilter !== "all" && { assignedTo: staffFilter }),
      ...(dateRange[0] && { startDate: dateRange[0].toISOString() }),
      ...(dateRange[1] && { endDate: dateRange[1].toISOString() }),
    };
  }, [currentPage, limit, searchTerm, sourceFilter, statusFilter, staffFilter, dateRange]);

  const {
    data: leadsData,
    isLoading: isLeadsLoading,
    isFetching: isLeadsFetching,
    refetch: refetchLeads,
  } = useGetLeadsQuery(queryParams);

  const leads = leadsData?.data?.leads || [];
  const totalLeads = leadsData?.data?.total || 0;
  const totalPages = leadsData?.data?.totalPages || 1;

  // Selected leads list
  const selectedLeads = useMemo(() => {
    return leads.filter((l) => selectedLeadIds.has(l._id));
  }, [leads, selectedLeadIds]);

  // Active filters count for the "Filters" badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (sourceFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (staffFilter !== "all") count++;
    if (dateRange.length > 0) count++;
    return count;
  }, [searchTerm, sourceFilter, statusFilter, staffFilter, dateRange]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSourceFilter("all");
    setStatusFilter("all");
    setStaffFilter("all");
    setDateRange([]);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    refetchLeads();
    refetchStats();
    toast.info("Refreshed leads data");
  };

  // Bulk Operations Handlers
  const handleBulkAssign = async () => {
    if (!bulkAssignStaffId || selectedLeadIds.size === 0) return;
    try {
      await bulkAssignLeads({
        leadIds: Array.from(selectedLeadIds),
        assignedTo: bulkAssignStaffId,
      }).unwrap();
      toast.success(`Assigned ${selectedLeadIds.size} leads successfully`);
      setBulkAssignStaffId("");
      setSelectedLeadIds(new Set());
      refetchLeads();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to bulk assign leads");
    }
  };

  const handleBulkStatus = async () => {
    if (!bulkStatusValue || selectedLeadIds.size === 0) return;
    try {
      await bulkUpdateStatus({
        leadIds: Array.from(selectedLeadIds),
        status: bulkStatusValue,
      }).unwrap();
      toast.success(`Updated status for ${selectedLeadIds.size} leads`);
      setBulkStatusValue("");
      setSelectedLeadIds(new Set());
      refetchLeads();
      refetchStats();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update leads status");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.size === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedLeadIds.size} selected leads? This cannot be undone.`
      )
    )
      return;

    try {
      await bulkDeleteLeads({
        leadIds: Array.from(selectedLeadIds),
      }).unwrap();
      toast.success(`Deleted ${selectedLeadIds.size} leads`);
      setSelectedLeadIds(new Set());
      refetchLeads();
      refetchStats();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete selected leads");
    }
  };

  const handleExportSelected = () => {
    if (selectedLeads.length === 0) return;
    const headers = [
      "ID",
      "Full Name",
      "Phone",
      "Email",
      "Source",
      "Status",
      "Project Type",
      "Assigned To",
      "Created At",
    ];
    const rows = selectedLeads.map((l) => [
      l.leadId || l._id,
      `"${l.fullName || ""}"`,
      `"${l.phone || ""}"`,
      `"${l.email || ""}"`,
      l.leadSource || "",
      l.status || "",
      `"${l.projectType || ""}"`,
      `"${l.assignedTo?.firstName || ""} ${l.assignedTo?.lastName || ""}"`,
      dayjs(l.createdAt).format("YYYY-MM-DD HH:mm"),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ThinkCRM_Leads_Export_${dayjs().format("YYYYMMDD_HHmmss")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Leads exported to CSV");
  };

  // DataGrid Column Definitions matching the rest of ThinkCRM
  const columnDefs = useMemo(
    () => [
      {
        headerName: "#",
        valueGetter: (params) => (currentPage - 1) * limit + params.node.rowIndex + 1,
        width: 50,
        minWidth: 50,
        maxWidth: 55,
        pinned: "left",
        sortable: false,
        filter: false,
        resizable: false,
        cellClass: "flex items-center justify-center font-semibold text-slate-400 font-inter text-[13.5px]",
        headerClass: "text-center",
      },
      {
        headerName: "Lead",
        field: "fullName",
        minWidth: 220,
        flex: 1.4,
        pinned: "left",
        cellRenderer: (params) => {
          const lead = params.data;
          if (!lead) return null;
          const avatarColor = getAvatarColor(lead.fullName || "Lead");
          return (
            <div className="flex items-center gap-3 py-1 font-inter">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center font-bold uppercase text-xs flex-shrink-0 border border-slate-200 dark:border-slate-700 ${avatarColor}`}
              >
                {lead.fullName?.charAt(0) || "L"}
              </div>
              <div className="truncate">
                <button
                  type="button"
                  onClick={() => navigate(`/leads/${lead._id}`)}
                  className="font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition text-left truncate block text-[14px] hover:underline"
                >
                  {lead.fullName}
                </button>
                <span className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold block truncate">
                  {lead.projectType || "Modular Kitchen"}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        headerName: "Phone",
        field: "phone",
        minWidth: 155,
        flex: 1,
        cellRenderer: (params) => (
          <span className="font-inter font-semibold text-slate-800 dark:text-slate-100 text-[13.5px] whitespace-nowrap">
            {params.value || "—"}
          </span>
        ),
      },
      {
        headerName: "Email",
        field: "email",
        minWidth: 190,
        flex: 1.2,
        cellRenderer: (params) => (
          <span className="text-slate-700 dark:text-slate-300 font-inter font-medium truncate text-[13.5px]">
            {params.value || "—"}
          </span>
        ),
      },
      {
        headerName: "Source",
        field: "leadSource",
        minWidth: 125,
        flex: 0.9,
        cellRenderer: (params) => <LeadSourceBadge source={params.value} />,
      },
      {
        headerName: "Status",
        field: "status",
        minWidth: 125,
        flex: 0.9,
        cellRenderer: (params) => <LeadStatusBadge status={params.value} />,
      },
      {
        headerName: "Last Follow-up",
        minWidth: 145,
        flex: 1,
        cellRenderer: (params) => {
          const fu = params.data?.lastFollowUp;
          if (!fu || !fu.scheduledAt) {
            return <span className="text-slate-400 font-inter font-medium text-[13.5px]">—</span>;
          }
          return (
            <div className="py-1 font-inter">
              <div className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100">
                {dayjs(fu.scheduledAt).format("DD MMM YYYY")}
              </div>
              <div className="text-[12px] text-slate-500 font-medium capitalize">
                {fu.notes ? fu.notes.slice(0, 20) : `${fu.type || "Call"} made`}
              </div>
            </div>
          );
        },
      },
      {
        headerName: "Next Follow-up",
        minWidth: 155,
        flex: 1.1,
        cellRenderer: (params) => {
          const fu = params.data?.nextFollowUp;
          if (!fu || !fu.scheduledAt) {
            return <span className="text-slate-400 font-inter font-medium text-[13.5px]">—</span>;
          }
          return (
            <div className="py-1 font-inter">
              <div className="text-[13.5px] font-bold text-[#ef4444]">
                {dayjs(fu.scheduledAt).format("DD MMM YYYY")}
              </div>
              <div className="text-[12px] text-[#ef4444] font-semibold">
                {dayjs(fu.scheduledAt).format("hh:mm A")}
              </div>
            </div>
          );
        },
      },
      {
        headerName: "Assigned To",
        minWidth: 155,
        flex: 1,
        cellRenderer: (params) => {
          const u = params.data?.assignedTo;
          if (!u) {
            return <span className="text-slate-400 font-inter font-medium text-[13.5px]">Unassigned</span>;
          }
          const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();
          return (
            <div className="flex items-center gap-2 py-1 font-inter">
              <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">
                {u.firstName?.charAt(0) || "U"}
              </div>
              <span className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                {name}
              </span>
            </div>
          );
        },
      },
      {
        headerName: "Created On",
        field: "createdAt",
        minWidth: 135,
        flex: 0.9,
        cellRenderer: (params) => {
          if (!params.value) return "—";
          return (
            <div className="py-1 font-inter">
              <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                {dayjs(params.value).format("DD MMM YYYY")}
              </div>
              <div className="text-[11.5px] text-slate-400 font-medium">
                {dayjs(params.value).format("hh:mm A")}
              </div>
            </div>
          );
        },
      },
      {
        headerName: "Actions",
        pinned: "right",
        width: 72,
        minWidth: 70,
        maxWidth: 80,
        sortable: false,
        filter: false,
        resizable: false,
        cellClass: "flex items-center justify-center overflow-visible",
        headerClass: "text-center",
        cellRenderer: (params) => {
          const lead = params.data;
          if (!lead) return null;

          const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, "") : "";

          // View and Edit navigate to full pages as requested
          // All actions (View, Edit, Add Follow-up, Convert, Call, WhatsApp, Email, Delete) go inside the 3-dot dropdown menu
          const dropdownActions = [
            {
              label: "View Lead",
              icon: "heroicons-outline:eye",
              onClick: () => navigate(`/leads/${lead._id}`),
            },
            {
              label: "Edit Lead",
              icon: "heroicons-outline:pencil-square",
              onClick: () => navigate(`/leads/${lead._id}/edit`),
            },
            {
              label: "Add Follow-up",
              icon: "heroicons-outline:calendar",
              onClick: () => setFollowUpLead(lead),
            },
            {
              label: "Convert to Customer",
              icon: "heroicons-outline:user-plus",
              onClick: () => setConvertingLead(lead),
            },
            { divider: true },
            ...(lead.phone
              ? [
                  {
                    label: `Call (${lead.phone})`,
                    icon: "heroicons-outline:phone",
                    onClick: () => {
                      window.location.href = `tel:${lead.phone}`;
                    },
                  },
                ]
              : []),
            ...(cleanPhone
              ? [
                  {
                    label: "WhatsApp Chat",
                    icon: "whatsapp",
                    onClick: () => {
                      window.open(`https://wa.me/${cleanPhone}`, "_blank", "noreferrer");
                    },
                  },
                ]
              : []),
            ...(lead.email
              ? [
                  {
                    label: "Send Email",
                    icon: "heroicons-outline:envelope",
                    onClick: () => {
                      window.location.href = `mailto:${lead.email}`;
                    },
                  },
                ]
              : []),
            { divider: true },
            {
              label: "Delete Lead",
              icon: "heroicons-outline:trash",
              danger: true,
              onClick: () => setDeletingLead(lead),
            },
          ];

          return (
            <div className="flex items-center justify-center w-full">
              <RowActions actions={dropdownActions} label="Lead actions" align="right" />
            </div>
          );
        },
      },
    ],
    [currentPage, limit, navigate]
  );

  // Real stats from backend (or zeros when loading)
  const stats = statsData?.data || {
    total: { value: 0, changePercent: 0, isPositive: true },
    newLeads: { value: 0, changePercent: 0, isPositive: true },
    contacted: { value: 0, changePercent: 0, isPositive: true },
    qualified: { value: 0, changePercent: 0, isPositive: true },
    converted: { value: 0, changePercent: 0, isPositive: true },
  };

  const kpiCards = [
    {
      title: "Total Leads",
      value: stats.total.value,
      change: stats.total.changePercent,
      isPositive: stats.total.isPositive,
      icon: "heroicons-outline:identification",
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      title: "New Leads",
      value: stats.newLeads.value,
      change: stats.newLeads.changePercent,
      isPositive: stats.newLeads.isPositive,
      icon: "heroicons-outline:user-plus",
      iconBg: "bg-rose-50 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400",
    },
    {
      title: "Contacted",
      value: stats.contacted.value,
      change: stats.contacted.changePercent,
      isPositive: stats.contacted.isPositive,
      icon: "heroicons-outline:phone",
      iconBg: "bg-sky-50 text-sky-500 dark:bg-sky-900/30 dark:text-sky-400",
    },
    {
      title: "Qualified",
      value: stats.qualified.value,
      change: stats.qualified.changePercent,
      isPositive: stats.qualified.isPositive,
      icon: "heroicons-outline:shield-check",
      iconBg: "bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      title: "Converted",
      value: stats.converted.value,
      change: stats.converted.changePercent,
      isPositive: stats.converted.isPositive,
      icon: "heroicons-outline:briefcase",
      iconBg: "bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400",
    },
  ];

  return (
    <div className="space-y-5 font-inter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Leads
          </h1>
          <p className="text-[13.5px] text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your leads, track follow-ups and convert them into customers.
          </p>
        </div>

        {/* Top Right Action Button */}
        <div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13.5px] font-semibold transition shadow-none cursor-pointer"
          >
            <Icon icon="heroicons-outline:plus" className="text-lg" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* 5 Real-Time KPI Cards matching reference image */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-4 flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400 block">
                {card.title}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {card.value}
                </span>
                <span
                  className={`inline-flex items-center text-[12px] font-semibold ${
                    card.isPositive ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {card.isPositive ? "↑" : "↓"} {Math.abs(card.change)}%
                </span>
              </div>
            </div>
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${card.iconBg}`}
            >
              <Icon icon={card.icon} className="text-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-3.5 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 min-w-[240px] relative">
            <Icon
              icon="heroicons-outline:search"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, phone, email or source..."
              className="w-full pl-10 pr-3.5 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-inter"
            />
          </div>

          {/* Source Dropdown */}
          <div className="min-w-[140px]">
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-[13.5px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {SOURCE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="min-w-[140px]">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-[13.5px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Staff Dropdown */}
          <div className="min-w-[140px]">
            <select
              value={staffFilter}
              onChange={(e) => {
                setStaffFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-[13.5px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Staff</option>
              {staffList.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.firstName} {st.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Picker with Flatpickr */}
          <div className="min-w-[210px] relative">
            <Flatpickr
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates);
                setCurrentPage(1);
              }}
              options={{
                mode: "range",
                dateFormat: "d M Y",
                allowInput: true,
              }}
              placeholder="01 Oct 2026 - 31 Oct 2026"
              className="w-full pl-9 pr-3 py-2 text-[13.5px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            />
            <Icon
              icon="heroicons-outline:calendar"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none"
            />
          </div>

          {/* Filters badge button */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[13px] font-semibold">
            <Icon icon="heroicons-outline:funnel" className="text-base text-blue-600" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center ml-1">
                {activeFiltersCount}
              </span>
            )}
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-[13px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white px-2 py-1 transition cursor-pointer"
            >
              Clear
            </button>
          )}

          {/* Refresh button */}
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh"
            className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition ml-auto cursor-pointer"
          >
            <Icon
              icon="heroicons-outline:refresh"
              className={`text-base ${isLeadsFetching ? "animate-spin text-blue-600" : ""}`}
            />
          </button>
        </div>

        {/* Bulk Actions Bar (Appears when leads are checked) */}
        {selectedLeadIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl animate-fadeIn text-[13px]">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold pl-1">
              <span className="h-6 min-w-[24px] px-2 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                {selectedLeadIds.size}
              </span>
              <span className="text-[13.5px]">leads selected</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Assign To Segmented Control */}
              <div className="inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
                <select
                  value={bulkAssignStaffId}
                  onChange={(e) => setBulkAssignStaffId(e.target.value)}
                  className="bulk-action-select h-9 pl-3 pr-7 text-[13px] font-medium bg-transparent text-slate-700 dark:text-slate-200 border-none outline-none cursor-pointer"
                >
                  <option value="">Assign to staff...</option>
                  {staffList.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.firstName} {st.lastName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleBulkAssign}
                  disabled={!bulkAssignStaffId || isBulkAssigning}
                  className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white text-[12.5px] font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed border-l border-slate-200 dark:border-slate-700"
                >
                  {isBulkAssigning ? (
                    <Icon icon="heroicons-outline:refresh" className="animate-spin text-sm" />
                  ) : (
                    <Icon icon="heroicons-outline:user-plus" className="text-sm" />
                  )}
                  <span>Assign</span>
                </button>
              </div>

              {/* Change Status Segmented Control */}
              <div className="inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
                <select
                  value={bulkStatusValue}
                  onChange={(e) => setBulkStatusValue(e.target.value)}
                  className="bulk-action-select h-9 pl-3 pr-7 text-[13px] font-medium bg-transparent text-slate-700 dark:text-slate-200 border-none outline-none cursor-pointer"
                >
                  <option value="">Update status...</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                  <option value="junk">Junk</option>
                </select>
                <button
                  type="button"
                  onClick={handleBulkStatus}
                  disabled={!bulkStatusValue || isBulkUpdatingStatus}
                  className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white text-[12.5px] font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed border-l border-slate-200 dark:border-slate-700"
                >
                  {isBulkUpdatingStatus ? (
                    <Icon icon="heroicons-outline:refresh" className="animate-spin text-sm" />
                  ) : (
                    <Icon icon="heroicons-outline:check" className="text-sm" />
                  )}
                  <span>Apply</span>
                </button>
              </div>

              {/* Export Selected */}
              <button
                type="button"
                onClick={handleExportSelected}
                className="h-9 inline-flex items-center gap-1.5 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[12.5px] font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                <Icon icon="heroicons-outline:arrow-down-tray" className="text-sm text-slate-500" />
                <span>Export</span>
              </button>

              {/* Bulk Delete */}
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="h-9 inline-flex items-center gap-1.5 px-3.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-[12.5px] font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <Icon icon="heroicons-outline:trash" className="text-sm" />
                <span>Delete</span>
              </button>

              {/* Deselect All */}
              <button
                type="button"
                onClick={() => setSelectedLeadIds(new Set())}
                className="h-9 inline-flex items-center px-2.5 text-[12.5px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline transition cursor-pointer"
              >
                Deselect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Leads DataGrid Table - Consistent with Customers module */}
      <DataGrid
        rowData={leads}
        columnDefs={columnDefs}
        enableSelection={true}
        selectedIds={selectedLeadIds}
        onSelectionChange={(newSet) => setSelectedLeadIds(newSet)}
        pagination={true}
        paginationData={{
          page: currentPage,
          limit,
          total: totalLeads,
          totalPages,
        }}
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(sz) => {
          setLimit(sz);
          setCurrentPage(1);
        }}
        isLoading={isLeadsLoading}
        emptyMessage="No leads found matching your criteria."
        entityName="leads"
      />

      {/* 1. Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          refetchLeads();
          refetchStats();
        }}
      />

      {/* 2. Add Follow-up Modal */}
      <AddFollowUpModal
        isOpen={Boolean(followUpLead)}
        lead={followUpLead}
        onClose={() => setFollowUpLead(null)}
        onSuccess={() => {
          refetchLeads();
          refetchStats();
        }}
      />

      {/* 3. Convert Lead to Customer Modal */}
      <ConvertLeadModal
        isOpen={Boolean(convertingLead)}
        lead={convertingLead}
        onClose={() => setConvertingLead(null)}
        onSuccess={() => {
          refetchLeads();
          refetchStats();
        }}
      />

      {/* 4. Delete Lead Modal */}
      <DeleteLeadModal
        isOpen={Boolean(deletingLead)}
        lead={deletingLead}
        onClose={() => setDeletingLead(null)}
        onSuccess={() => {
          refetchLeads();
          refetchStats();
        }}
      />
    </div>
  );
};

export default Leads;
