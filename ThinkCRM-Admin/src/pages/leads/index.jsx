import React, { useState, useMemo, useEffect } from "react";
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
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import SendWhatsAppModal from "./components/SendWhatsAppModal";
import SendEmailModal from "./components/SendEmailModal";
import AddMeasurementModal from "./components/AddMeasurementModal";
import UploadQuotationModal from "./components/UploadQuotationModal";
import UploadLeadDocumentModal from "./components/UploadLeadDocumentModal";
import ImportLeadModal from "./components/ImportLeadModal";
import { LeadStatusBadge, LeadSourceBadge } from "./components/LeadStatusBadge";
import store from "@/store";

// API Hooks
import {
  leadsApi,
  useGetLeadsQuery,
  useGetLeadStatsQuery,
  useUpdateLeadMutation,
  useBulkAssignLeadsMutation,
  useBulkUpdateStatusMutation,
  useBulkDeleteLeadsMutation,
} from "@/store/api/leads/leadsApiSlice";
import { useGetStaffQuery } from "@/store/api/management/managementApiSlice";

const SOURCE_FILTER_OPTIONS = [
  { value: "all", label: "All Sources" },
  { value: "Website", label: "Website" },
  { value: "Meta Ads", label: "Meta Ads" },
  { value: "Google Ads", label: "Google Ads" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Referral", label: "Referral" },
  { value: "Phone", label: "Phone Call" },
  { value: "Walk-in", label: "Walk-in" },
  { value: "Other", label: "Other" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "new", label: "New Lead" },
  { value: "attempted", label: "Attempted" },
  { value: "contacted", label: "Contacted" },
  { value: "follow_up", label: "Follow-up" },
  { value: "in_progress", label: "Call Not Picked Up" },
  { value: "qualified", label: "Qualified" },
  { value: "measurement_pending", label: "Measurement Pending" },
  { value: "measurement_scheduled", label: "Measurement Scheduled" },
  { value: "measurement_completed", label: "Measurement Completed" },
  { value: "quotation_pending", label: "Quotation Pending" },
  { value: "quotation_sent", label: "Quotation Sent" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
  { value: "junk", label: "Junk" },
];

export const LEAD_SOURCE_OPTIONS = [
  { value: "Website", label: "Website", badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800" },
  { value: "Meta Ads", label: "Meta Ads", badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800" },
  { value: "Meta", label: "Meta Ads", badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800" },
  { value: "Google Ads", label: "Google Ads", badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800" },
  { value: "Google", label: "Google Ads", badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800" },
  { value: "Referral", label: "Referral", badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" },
  { value: "Social Media", label: "Social Media", badgeClass: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800" },
  { value: "Direct", label: "Direct", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" },
  { value: "WhatsApp", label: "WhatsApp", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" },
  { value: "Phone", label: "Phone Call", badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800" },
  { value: "Walk-in", label: "Walk-in", badgeClass: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800" },
  { value: "Other", label: "Other", badgeClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" },
];

export const PROJECT_TYPE_OPTIONS = [
  { value: "Modular Kitchen", label: "Modular Kitchen", badgeClass: "bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700" },
  { value: "Full Home Interior", label: "Full Home Interior", badgeClass: "bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700" },
  { value: "Full Home", label: "Full Home Interior", badgeClass: "bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700" },
  { value: "Kitchen", label: "Kitchen", badgeClass: "bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700" },
  { value: "Wardrobe", label: "Wardrobe", badgeClass: "bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700" },
  { value: "Bedroom", label: "Bedroom", badgeClass: "bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700" },
  { value: "Living Room", label: "Living Room", badgeClass: "bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700" },
  { value: "Office Interior", label: "Office Interior", badgeClass: "bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700" },
  { value: "Office", label: "Office Interior", badgeClass: "bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700" },
  { value: "Commercial", label: "Commercial", badgeClass: "bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700" },
  { value: "Other", label: "Other", badgeClass: "bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700" },
];

export const LEAD_STATUS_OPTIONS = [
  {
    value: "new",
    label: "New Lead",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  {
    value: "attempted",
    label: "Attempted",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  {
    value: "contacted",
    label: "Contacted",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  },
  {
    value: "follow_up",
    label: "Follow-up",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  },
  {
    value: "in_progress",
    label: "Call Not Picked Up",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
  },
  {
    value: "qualified",
    label: "Qualified",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
  },
  {
    value: "measurement_pending",
    label: "Measurement Pending",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  {
    value: "measurement_scheduled",
    label: "Measurement Scheduled",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  },
  {
    value: "measurement_completed",
    label: "Measurement Done",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  {
    value: "quotation_pending",
    label: "Quotation Pending",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  {
    value: "quotation_sent",
    label: "Quotation Sent",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
  },
  {
    value: "negotiation",
    label: "Negotiation",
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  },
  {
    value: "won",
    label: "Converted / Won",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  {
    value: "converted",
    label: "Converted / Won",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  {
    value: "lost",
    label: "Lost Lead",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  },
  {
    value: "junk",
    label: "Junk Lead",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
];

export const MEASUREMENT_STATUS_OPTIONS = [
  {
    value: "not_done",
    label: "Not Done",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
  {
    value: "pending",
    label: "Not Done",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
  {
    value: "scheduled",
    label: "Scheduled",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  },
  {
    value: "done",
    label: "Done",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  {
    value: "completed",
    label: "Done",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
];

export const QUOTATION_STATUS_OPTIONS = [
  {
    value: "pending",
    label: "Pending",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  {
    value: "sent",
    label: "Sent",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
  },
  {
    value: "approved",
    label: "Approved",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  {
    value: "draft",
    label: "Draft",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
  {
    value: "not_uploaded",
    label: "Not Uploaded",
    badgeClass: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  },
];

const TableSelectDropdown = ({
  value,
  options,
  onChange,
  badgeClass = "",
  disabled = false,
}) => {
  const valStr = String(value || "").trim().toLowerCase();
  const matched = options.find(
    (o) =>
      o.value.toLowerCase() === valStr ||
      o.value.toLowerCase().replace(/[_\s]+/g, "") === valStr.replace(/[_\s]+/g, "")
  );

  const selectedValue = matched ? matched.value : value || options[0]?.value || "";
  const dynamicBadge = matched?.badgeClass || badgeClass || "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <select
      value={selectedValue}
      disabled={disabled}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        e.stopPropagation();
        onChange(e.target.value);
      }}
      className={`table-select border ${dynamicBadge}`}
    >
      {!matched && value && (
        <option
          value={value}
          className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 py-1.5 font-medium"
        >
          {value}
        </option>
      )}
      {options.map((opt) => (
        <option
          key={opt.value}
          value={opt.value}
          className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 py-1.5 font-medium"
        >
          {opt.label}
        </option>
      ))}
    </select>
  );
};

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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [followUpLead, setFollowUpLead] = useState(null);
  const [convertingLead, setConvertingLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);
  const [whatsAppLead, setWhatsAppLead] = useState(null);
  const [emailLead, setEmailLead] = useState(null);
  const [measurementLead, setMeasurementLead] = useState(null);
  const [quotationLead, setQuotationLead] = useState(null);
  const [uploadDocLead, setUploadDocLead] = useState(null);

  // Bulk Action State
  const [bulkAssignStaffId, setBulkAssignStaffId] = useState("");
  const [bulkStatusValue, setBulkStatusValue] = useState("");
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkAssignLeads, { isLoading: isBulkAssigning }] = useBulkAssignLeadsMutation();
  const [bulkUpdateStatus, { isLoading: isBulkUpdatingStatus }] = useBulkUpdateStatusMutation();
  const [bulkDeleteLeads, { isLoading: isBulkDeleting }] = useBulkDeleteLeadsMutation();
  const [updateLead] = useUpdateLeadMutation();

  const handleUpdateLeadField = async (leadId, fieldData, successMessage) => {
    try {
      await updateLead({ id: leadId, data: fieldData }).unwrap();
      if (successMessage) {
        toast.success(successMessage);
      }
      refetchLeads();
      if (fieldData.status) {
        refetchStats();
      }
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update lead");
    }
  };

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
      ...(dateRange?.length === 2 && dateRange[0] && dateRange[1]
        ? {
            startDate: dateRange[0].toISOString(),
            endDate: dateRange[1].toISOString(),
          }
        : dateRange?.length === 1 && dateRange[0]
        ? {
            startDate: dateRange[0].toISOString(),
          }
        : {}),
    };
  }, [currentPage, limit, searchTerm, sourceFilter, statusFilter, staffFilter, dateRange]);

  const {
    data: leadsData,
    isLoading: isLeadsLoading,
    isFetching: isLeadsFetching,
    refetch: refetchLeads,
  } = useGetLeadsQuery(queryParams);

  const leads = leadsData?.data?.leads || [];
  const pagination = leadsData?.data?.pagination || {
    page: currentPage,
    limit,
    total: leadsData?.data?.total ?? leads.length,
    totalPages: leadsData?.data?.totalPages ?? Math.max(1, Math.ceil(leads.length / limit)),
  };
  const totalLeads = pagination.total ?? leadsData?.data?.total ?? leads.length;
  const totalPages = pagination.totalPages ?? leadsData?.data?.totalPages ?? Math.max(1, Math.ceil(totalLeads / limit));

  // Auto-clamp page if current page exceeds totalPages
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

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

  const handleBulkDelete = () => {
    if (selectedLeadIds.size === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedLeadIds.size === 0) return;
    try {
      await bulkDeleteLeads({
        leadIds: Array.from(selectedLeadIds),
      }).unwrap();
      toast.success(
        `Deleted ${selectedLeadIds.size} selected lead${selectedLeadIds.size > 1 ? "s" : ""}`
      );
      setSelectedLeadIds(new Set());
      setIsBulkDeleteModalOpen(false);
      refetchLeads();
      refetchStats();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete selected leads");
    }
  };

  // Full dataset or selected CSV Export handler
  const handleExportLeads = async () => {
    try {
      setIsExporting(true);
      let leadsToExport = [];

      if (selectedLeadIds.size > 0) {
        // Export selected rows from current leads
        leadsToExport = leads.filter((l) => selectedLeadIds.has(l._id));
      } else {
        // Fetch all matching records from backend respecting current filters
        const exportParams = {
          page: 1,
          limit: 10000,
          ...(searchTerm && { search: searchTerm }),
          ...(sourceFilter !== "all" && { source: sourceFilter }),
          ...(statusFilter !== "all" && { status: statusFilter }),
          ...(staffFilter !== "all" && { assignedTo: staffFilter }),
          ...(dateRange[0] && { startDate: dateRange[0].toISOString() }),
          ...(dateRange[1] && { endDate: dateRange[1].toISOString() }),
        };

        const result = await store
          .dispatch(
            leadsApi.endpoints.getLeads.initiate(exportParams, { forceRefetch: true })
          )
          .unwrap();

        leadsToExport = result?.data?.leads || [];
      }

      if (leadsToExport.length === 0) {
        toast.info("No lead records available to export with current filters.");
        return;
      }

      const headers = [
        "Lead ID",
        "Customer Name",
        "Phone",
        "Email",
        "Project Type",
        "Status",
        "Measurement Status",
        "Quotation Status",
        "Lead Source",
        "Priority",
        "Budget",
        "City",
        "Address",
        "Assigned Staff",
        "Last Follow-up",
        "Next Follow-up",
        "Created Date",
      ];

      const escapeCSV = (val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = leadsToExport.map((l) => [
        escapeCSV(l.leadId || l._id),
        escapeCSV(l.fullName || ""),
        escapeCSV(l.phone || ""),
        escapeCSV(l.email || ""),
        escapeCSV(l.projectType || ""),
        escapeCSV(l.status || "new"),
        escapeCSV(l.measurementStatus || "not_done"),
        escapeCSV(l.quotationStatus || "pending"),
        escapeCSV(l.leadSource || ""),
        escapeCSV(l.priority || "medium"),
        escapeCSV(l.budget ? `₹${Number(l.budget).toLocaleString("en-IN")}` : l.budgetRange || ""),
        escapeCSV(l.city || ""),
        escapeCSV(l.address || ""),
        escapeCSV(
          l.assignedTo
            ? `${l.assignedTo.firstName || ""} ${l.assignedTo.lastName || ""}`.trim() || l.assignedTo.email || ""
            : "Unassigned"
        ),
        escapeCSV(
          l.lastFollowUp?.scheduledAt
            ? dayjs(l.lastFollowUp.scheduledAt).format("YYYY-MM-DD")
            : ""
        ),
        escapeCSV(
          l.nextFollowUp?.scheduledAt
            ? dayjs(l.nextFollowUp.scheduledAt).format("YYYY-MM-DD HH:mm")
            : ""
        ),
        escapeCSV(dayjs(l.createdAt).format("YYYY-MM-DD")),
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8,\uFEFF" +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `thinkcrm-leads-${dayjs().format("YYYY-MM-DD")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${leadsToExport.length} lead${leadsToExport.length > 1 ? "s" : ""} to CSV`);
    } catch (err) {
      toast.error(err?.message || "Failed to export leads");
    } finally {
      setIsExporting(false);
    }
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
        headerName: "Customer Name",
        field: "fullName",
        minWidth: 200,
        flex: 1.3,
        pinned: "left",
        cellRenderer: (params) => {
          const lead = params.data;
          if (!lead) return null;
          const avatarColor = getAvatarColor(lead.fullName || "Customer");
          return (
            <div className="flex items-center gap-3 py-1 font-inter">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center font-bold uppercase text-xs flex-shrink-0 border border-slate-200 dark:border-slate-700 ${avatarColor}`}
              >
                {lead.fullName?.charAt(0) || "C"}
              </div>
              <div className="truncate">
                <button
                  type="button"
                  onClick={() => navigate(`/leads/${lead._id}`)}
                  className="font-bold text-slate-900 hover:text-primary-600 dark:text-slate-100 dark:hover:text-primary-400 transition text-left truncate block text-[14px]"
                >
                  {lead.fullName}
                </button>
              </div>
            </div>
          );
        },
      },
      {
        headerName: "Phone",
        field: "phone",
        minWidth: 180,
        flex: 1.1,
        cellRenderer: (params) => {
          const phone = params.value;
          if (!phone) return <span className="text-slate-400 font-inter">—</span>;
          const cleanPhone = String(phone).replace(/[^0-9+]/g, "");
          return (
            <div className="flex items-center gap-2 font-inter">
              <span className="font-semibold text-slate-800 dark:text-slate-100 text-[14.5px] whitespace-nowrap">
                {phone}
              </span>
              <a
                href={`tel:${cleanPhone}`}
                onClick={(e) => e.stopPropagation()}
                className="h-7 w-7 rounded-md flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/50 transition cursor-pointer flex-shrink-0"
                title={`Call ${phone}`}
              >
                <Icon icon="heroicons-outline:phone" className="text-sm" />
              </a>
            </div>
          );
        },
      },
      {
        headerName: "Email",
        field: "email",
        minWidth: 210,
        flex: 1.2,
        cellRenderer: (params) => {
          const email = params.value;
          if (!email) return <span className="text-slate-400 font-inter">—</span>;
          return (
            <div className="flex items-center gap-2 font-inter truncate">
              <span className="font-bold text-slate-800 dark:text-slate-100 truncate text-[14.5px]">
                {email}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEmailLead(params.data);
                }}
                className="h-7 w-7 rounded-md flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition cursor-pointer flex-shrink-0"
                title="Send Email"
              >
                <Icon icon="heroicons-outline:envelope" className="text-sm" />
              </button>
            </div>
          );
        },
      },
      {
        headerName: "Project Type",
        field: "projectType",
        minWidth: 195,
        flex: 1.2,
        cellRenderer: (params) => {
          const lead = params.data;
          if (!lead) return null;
          const currentProjectType = lead.projectType || "Modular Kitchen";
          return (
            <TableSelectDropdown
              value={currentProjectType}
              options={PROJECT_TYPE_OPTIONS}
              onChange={(newVal) =>
                handleUpdateLeadField(
                  lead._id,
                  { projectType: newVal },
                  `Project type updated to ${newVal}`
                )
              }
              badgeClass="bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            />
          );
        },
      },
      {
        headerName: "Status",
        field: "status",
        minWidth: 235,
        flex: 1.4,
        cellRenderer: (params) => {
          const lead = params.data;
          if (!lead) return null;
          const currentStatus = lead.status || "new";

          return (
            <TableSelectDropdown
              value={currentStatus}
              options={LEAD_STATUS_OPTIONS.filter((o) => o.value !== "converted")}
              onChange={(newVal) => {
                const opt = LEAD_STATUS_OPTIONS.find((o) => o.value === newVal);
                handleUpdateLeadField(
                  lead._id,
                  { status: newVal },
                  `Lead status updated to ${opt?.label || newVal}`
                );
              }}
            />
          );
        },
      },
      {
        headerName: "Measurement",
        field: "measurementStatus",
        minWidth: 155,
        flex: 1,
        cellRenderer: (params) => {
          const lead = params.data;
          if (!lead) return null;
          const currentMeas =
            lead.measurementStatus ||
            (lead.status === "measurement_completed"
              ? "done"
              : lead.status === "measurement_scheduled"
              ? "scheduled"
              : "not_done");

          return (
            <TableSelectDropdown
              value={currentMeas}
              options={[
                { value: "not_done", label: "Not Done", badgeClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" },
                { value: "scheduled", label: "Scheduled", badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800" },
                { value: "done", label: "Done", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" },
              ]}
              onChange={(newVal) => {
                const opt = MEASUREMENT_STATUS_OPTIONS.find((o) => o.value === newVal);
                handleUpdateLeadField(
                  lead._id,
                  { measurementStatus: newVal },
                  `Measurement updated to ${opt?.label || newVal}`
                );
              }}
            />
          );
        },
      },
      {
        headerName: "Quotation",
        field: "quotationStatus",
        minWidth: 160,
        flex: 1,
        cellRenderer: (params) => {
          const lead = params.data;
          if (!lead) return null;
          const currentQuot =
            lead.quotationStatus ||
            (lead.status === "quotation_sent"
              ? "sent"
              : lead.status === "quotation_pending"
              ? "pending"
              : "pending");

          return (
            <TableSelectDropdown
              value={currentQuot}
              options={QUOTATION_STATUS_OPTIONS}
              onChange={(newVal) => {
                const opt = QUOTATION_STATUS_OPTIONS.find((o) => o.value === newVal);
                handleUpdateLeadField(
                  lead._id,
                  { quotationStatus: newVal },
                  `Quotation updated to ${opt?.label || newVal}`
                );
              }}
            />
          );
        },
      },
      {
        headerName: "Last Follow-up",
        minWidth: 145,
        flex: 1,
        cellRenderer: (params) => {
          const fu = params.data?.lastFollowUp;
          const lastDate = fu?.scheduledAt || params.data?.lastContactAt;
          if (!lastDate) {
            return <span className="text-slate-400 font-inter font-medium text-[13.5px]">—</span>;
          }
          return (
            <div className="py-1 font-inter">
              <div className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100">
                {dayjs(lastDate).format("DD MMM YYYY")}
              </div>
              <div className="text-[12px] text-slate-500 font-medium capitalize truncate">
                {fu?.notes ? fu.notes.slice(0, 20) : `${fu?.type || "Call"} made`}
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
          const nextDate = fu?.scheduledAt || params.data?.nextFollowUpAt;
          if (!nextDate) {
            return <span className="text-slate-400 font-inter font-medium text-[13.5px]">—</span>;
          }
          const isOverdue = dayjs(nextDate).isBefore(dayjs());
          return (
            <div className="py-1 font-inter">
              <div
                className={`text-[13.5px] font-bold ${
                  isOverdue ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-slate-100"
                }`}
              >
                {dayjs(nextDate).format("DD MMM YYYY")}
              </div>
              <div
                className={`text-[12px] font-semibold ${
                  isOverdue ? "text-rose-500" : "text-blue-600 dark:text-blue-400"
                }`}
              >
                {dayjs(nextDate).format("hh:mm A")}
              </div>
            </div>
          );
        },
      },
      {
        headerName: "Assigned To",
        minWidth: 150,
        flex: 1,
        cellRenderer: (params) => {
          let u = params.data?.assignedTo;
          if (!u) {
            return <span className="text-slate-400 font-inter font-medium text-[13.5px]">Unassigned</span>;
          }
          if (typeof u === "string") {
            const found = staffList.find((s) => s._id === u);
            if (found) u = found;
          }
          const name =
            typeof u === "object"
              ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "Staff"
              : "Staff";
          const initial =
            typeof u === "object" && u.firstName ? u.firstName.charAt(0) : "S";
          return (
            <div className="flex items-center gap-2 py-1 font-inter">
              <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">
                {initial}
              </div>
              <span className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                {name}
              </span>
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
            { divider: true },
            {
              label: "Schedule Measurement",
              icon: "heroicons-outline:scale",
              onClick: () => setMeasurementLead(lead),
            },
            {
              label: "Upload Quotation",
              icon: "heroicons-outline:document-text",
              onClick: () => setQuotationLead(lead),
            },
            {
              label: "Upload Files / Docs",
              icon: "heroicons-outline:arrow-up-tray",
              onClick: () => setUploadDocLead(lead),
            },
            {
              label: "View Files & Docs",
              icon: "heroicons-outline:folder-open",
              onClick: () => navigate(`/leads/${lead._id}?tab=files`),
            },
            { divider: true },
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
                      setWhatsAppLead(lead);
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
                      setEmailLead(lead);
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
    [currentPage, limit, navigate, staffList]
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

        {/* Top Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Import Leads Button */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13.5px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <Icon icon="heroicons-outline:arrow-up-tray" className="text-base text-slate-500" />
            <span>Import Leads</span>
          </button>

          {/* Export Leads Button */}
          <button
            type="button"
            onClick={handleExportLeads}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13.5px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-60 cursor-pointer"
          >
            <Icon
              icon={isExporting ? "heroicons-outline:arrow-path" : "heroicons-outline:arrow-down-tray"}
              className={`text-base text-slate-500 ${isExporting ? "animate-spin" : ""}`}
            />
            <span>{isExporting ? "Exporting..." : "Export Leads"}</span>
          </button>

          {/* Add Lead Button */}
          <button
            type="button"
            onClick={() => navigate("/leads/new")}
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
              <span className="text-[12.5px] font-bold text-slate-700 dark:text-slate-200 block uppercase tracking-wider">
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

          {/* Active filters indicator & Clear Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[12.5px] font-semibold border border-blue-200 dark:border-blue-800">
                {activeFiltersCount} active filter{activeFiltersCount > 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[13px] font-semibold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 px-2 py-1 transition cursor-pointer"
              >
                Clear
              </button>
            </div>
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
                onClick={handleExportLeads}
                disabled={isExporting}
                className="h-9 inline-flex items-center gap-1.5 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[12.5px] font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer disabled:opacity-60"
              >
                <Icon
                  icon={isExporting ? "heroicons-outline:arrow-path" : "heroicons-outline:arrow-down-tray"}
                  className={`text-sm text-slate-500 ${isExporting ? "animate-spin" : ""}`}
                />
                <span>{isExporting ? "Exporting..." : "Export"}</span>
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
        paginationData={pagination}
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(sz) => {
          setLimit(sz);
          setCurrentPage(1);
        }}
        onRowClicked={(params) => navigate(`/leads/${params.data._id}`)}
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

      {/* 4. Delete Lead Modal (Single) */}
      <DeleteLeadModal
        isOpen={Boolean(deletingLead)}
        lead={deletingLead}
        onClose={() => setDeletingLead(null)}
        onSuccess={() => {
          refetchLeads();
          refetchStats();
        }}
      />

      {/* 4b. Bulk Delete Confirmation Modal (Professional Popup) */}
      <DeleteConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title={selectedLeadIds.size === 1 ? "Delete Lead" : `Delete ${selectedLeadIds.size} Leads`}
        entityName={
          selectedLeadIds.size === 1
            ? leads.find((l) => selectedLeadIds.has(l._id))?.fullName || "this lead"
            : `${selectedLeadIds.size} selected leads`
        }
        entityType={selectedLeadIds.size === 1 ? "lead" : "selected leads"}
        message={
          selectedLeadIds.size === 1
            ? undefined
            : `These ${selectedLeadIds.size} leads will be permanently deleted from the system along with all their associated follow-ups, communications, documents, and records.`
        }
        isLoading={isBulkDeleting}
        confirmText={
          selectedLeadIds.size === 1
            ? "Delete Lead"
            : `Delete ${selectedLeadIds.size} Leads`
        }
      />

      {/* 5. Send WhatsApp Modal */}
      <SendWhatsAppModal
        isOpen={Boolean(whatsAppLead)}
        lead={whatsAppLead}
        onClose={() => setWhatsAppLead(null)}
      />

      {/* 6. Send Email Modal */}
      <SendEmailModal
        isOpen={Boolean(emailLead)}
        lead={emailLead}
        onClose={() => setEmailLead(null)}
      />

      {/* 7. Schedule Measurement Modal */}
      <AddMeasurementModal
        isOpen={Boolean(measurementLead)}
        lead={measurementLead}
        onClose={() => setMeasurementLead(null)}
        onSuccess={() => {
          refetchLeads();
          refetchStats();
        }}
      />

      {/* 8. Upload Quotation Modal */}
      <UploadQuotationModal
        isOpen={Boolean(quotationLead)}
        lead={quotationLead}
        onClose={() => setQuotationLead(null)}
        onSuccess={() => {
          refetchLeads();
          refetchStats();
        }}
      />

      {/* 9. Upload Lead Document / Files Modal */}
      <UploadLeadDocumentModal
        isOpen={Boolean(uploadDocLead)}
        lead={uploadDocLead}
        onClose={() => setUploadDocLead(null)}
        onSuccess={() => {
          refetchLeads();
          refetchStats();
        }}
      />

      {/* 9. Import Leads via CSV Modal */}
      <ImportLeadModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          refetchLeads();
          refetchStats();
        }}
      />
    </div>
  );
};

export default Leads;
