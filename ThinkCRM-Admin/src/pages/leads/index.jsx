import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Select from "@/components/ui/Select";
import Tooltip from "@/components/ui/Tooltip";
import { useGetLeadsQuery, useDeleteLeadMutation } from "@/store/api/leads/leadsApiSlice";
import Loading from "@/components/Loading";
import PermissionGuard from "@/components/PermissionGuard";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import Flatpickr from "react-flatpickr";

// Shared Grid & Action Components
import DataGrid from "@/components/ui/DataGrid";
import RowActions from "@/components/ui/RowActions";
import QuickViewDrawer from "@/components/ui/QuickViewDrawer";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { getAvatarColor, renderStatusPill, formatDate } from "@/components/common/tableUtils";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "attempted", label: "Attempted" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "junk", label: "Junk" },
];

const SOURCE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "social_media", label: "Social Media" },
  { value: "direct", label: "Direct" },
  { value: "other", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const getStatusColor = (status) => {
  const map = {
    new: "bg-blue-500",
    attempted: "bg-amber-500",
    contacted: "bg-indigo-500",
    qualified: "bg-purple-500",
    won: "bg-success-500",
    lost: "bg-danger-500",
    junk: "bg-slate-500",
  };
  return map[status] || "bg-slate-400";
};

const getPriorityColor = (priority) => {
  if (priority === "high") return "text-danger-500 bg-danger-50 border border-danger-200";
  if (priority === "medium") return "text-amber-500 bg-amber-50 border border-amber-200";
  return "text-success-500 bg-success-50 border border-success-200";
};

const Leads = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [priority, setPriority] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [sortBy, setSortBy] = useState("-createdAt");

  // Quick View & Delete state
  const [quickViewLead, setQuickViewLead] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    lead: null,
    isLoading: false,
  });

  const queryParams = {
    page: currentPage,
    limit,
    ...(search && { search }),
    ...(status && { status }),
    ...(source && { source }),
    ...(priority && { priority }),
    ...(dateRange[0] && { startDate: dateRange[0].toISOString() }),
    ...(dateRange[1] && { endDate: dateRange[1].toISOString() }),
    sort: sortBy,
  };

  const { data: response, isLoading, isFetching, refetch } = useGetLeadsQuery(queryParams);
  const [deleteLead] = useDeleteLeadMutation();

  const leads = response?.data?.leads || [];
  const totalPages = response?.data?.totalPages || 1;
  const totalLeads = response?.data?.total || 0;

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.lead) return;
    try {
      setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
      await deleteLead(deleteConfirm.lead._id).unwrap();
      toast.success("Lead deleted successfully");
      setDeleteConfirm({ isOpen: false, lead: null, isLoading: false });
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete lead");
      setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: "#",
        valueGetter: (params) => (currentPage - 1) * limit + params.node.rowIndex + 1,
        width: 60,
        minWidth: 60,
        maxWidth: 65,
        pinned: "left",
        sortable: false,
        resizable: false,
        cellClass: "flex items-center justify-center font-medium text-slate-400 font-inter",
        headerClass: "text-center",
      },
      {
        headerName: "Lead Name",
        field: "fullName",
        minWidth: 240,
        flex: 1.5,
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
                <span className="text-xs text-slate-400 font-medium block truncate">
                  {lead.company || lead.leadId ? `#${lead.leadId}` : "Direct Inquiry"}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        headerName: "Phone",
        field: "phone",
        minWidth: 150,
        flex: 1,
        cellRenderer: (params) => (
          <span className="font-inter font-medium text-slate-700 dark:text-slate-300 text-[14px]">
            {params.value || "—"}
          </span>
        ),
      },
      {
        headerName: "Email",
        field: "email",
        minWidth: 200,
        flex: 1.2,
        cellRenderer: (params) => (
          <span className="text-slate-600 dark:text-slate-400 font-inter truncate text-[14px]">
            {params.value || "—"}
          </span>
        ),
      },
      {
        headerName: "Source",
        field: "leadSource",
        minWidth: 140,
        flex: 1,
        cellRenderer: (params) => (
          <span className="font-inter font-semibold capitalize text-slate-700 dark:text-slate-300 text-[14px]">
            {params.value || "—"}
          </span>
        ),
      },
      {
        headerName: "Status",
        field: "status",
        minWidth: 130,
        flex: 0.9,
        cellRenderer: (params) => {
          return renderStatusPill(params.value || "new");
        },
      },
      {
        headerName: "Priority",
        field: "priority",
        minWidth: 120,
        flex: 0.8,
        cellRenderer: (params) => {
          const val = params.value || "medium";
          return (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize font-inter ${getPriorityColor(
                val
              )}`}
            >
              {val}
            </span>
          );
        },
      },
      {
        headerName: "Assigned To",
        minWidth: 160,
        flex: 1,
        valueGetter: (params) => {
          const u = params.data?.assignedTo;
          return u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "Unassigned";
        },
        cellRenderer: (params) => (
          <span className="font-inter font-medium text-slate-700 dark:text-slate-300 text-[14px]">
            {params.value}
          </span>
        ),
      },
      {
        headerName: "Created",
        field: "createdAt",
        minWidth: 130,
        flex: 0.9,
        cellRenderer: (params) => (
          <span className="font-inter text-slate-500 text-[13.5px] font-medium">
            {params.value ? dayjs(params.value).format("MMM D, YYYY") : "—"}
          </span>
        ),
      },
      {
        headerName: "Actions",
        pinned: "right",
        width: 76,
        minWidth: 76,
        maxWidth: 80,
        sortable: false,
        filter: false,
        resizable: false,
        cellClass: "flex items-center justify-center overflow-visible",
        cellRenderer: (params) => {
          const lead = params.data;
          if (!lead) return null;

          const actions = [
            {
              label: "Quick View",
              icon: "heroicons-outline:eye",
              onClick: () => setQuickViewLead(lead),
            },
            {
              label: "View Full Profile",
              icon: "heroicons-outline:user",
              onClick: () => navigate(`/leads/${lead._id}`),
            },
            {
              label: "Edit Lead",
              icon: "heroicons-outline:pencil-square",
              onClick: () => navigate(`/leads/${lead._id}/edit`),
            },
            lead.phone && {
              label: "Call Lead",
              icon: "heroicons-outline:phone",
              onClick: () => {
                window.location.href = `tel:${lead.phone}`;
              },
            },
            lead.phone && {
              label: "Chat on WhatsApp",
              icon: "whatsapp",
              onClick: () => {
                window.open(
                  `https://wa.me/${lead.phone.replace(/\D/g, "")}`,
                  "_blank"
                );
              },
            },
            { divider: true },
            {
              label: "Delete Lead",
              icon: "heroicons-outline:trash",
              variant: "danger",
              onClick: () => {
                setDeleteConfirm({
                  isOpen: true,
                  lead: lead,
                  isLoading: false,
                });
              },
            },
          ];

          return <RowActions actions={actions} label="Lead actions" align="right" />;
        },
      },
    ],
    [currentPage, limit, navigate]
  );

  const handleFilterReset = () => {
    setSearch("");
    setStatus("");
    setSource("");
    setPriority("");
    setDateRange([]);
    setCurrentPage(1);
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="font-bold text-2xl text-slate-900 dark:text-white">Leads Management</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Total {totalLeads} lead{totalLeads !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon="heroicons-outline:arrow-path"
            className="btn-outline-dark h-10 w-10 p-0 flex items-center justify-center"
            onClick={refetch}
            disabled={isFetching}
          />
          <PermissionGuard permission="leads.create">
            <Button
              icon="heroicons-outline:plus"
              text="Add New Lead"
              className="btn-primary h-10"
              onClick={() => navigate("/leads/new")}
            />
          </PermissionGuard>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-center">
          {/* Search Input with Clear Button */}
          <div className="relative">
            <Icon
              icon="heroicons-outline:magnifying-glass"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search leads, phone, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-11 pl-10 pr-9 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-[14.5px] font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-primary-500 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
                title="Clear search"
              >
                <Icon icon="heroicons-outline:x-mark" className="text-sm" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-[14.5px] font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary-500 transition"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-[14.5px] font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary-500 transition"
          >
            <option value="">All Sources</option>
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-[14.5px] font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary-500 transition"
          >
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Date Range Picker */}
          <div className="relative flex items-center h-11 px-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg">
            <Icon icon="heroicons-outline:calendar" className="text-slate-400 mr-2 flex-shrink-0 text-base" />
            <Flatpickr
              className="w-full bg-transparent border-none p-0 text-[14px] font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-0 placeholder:text-slate-400 placeholder:font-normal cursor-pointer"
              value={dateRange}
              placeholder="Filter by date range"
              options={{ mode: "range", dateFormat: "M d, Y" }}
              onChange={(dates) => {
                setDateRange(dates);
                if (dates.length === 2) setCurrentPage(1);
              }}
            />
            {dateRange.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDateRange([]);
                  setCurrentPage(1);
                }}
                className="text-slate-400 hover:text-slate-700 ml-1 p-0.5"
              >
                <Icon icon="heroicons-outline:x-mark" className="text-sm" />
              </button>
            )}
          </div>
        </div>

        {(search || status || source || priority || dateRange.length > 0) && (
          <div className="flex justify-end mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <button
              onClick={handleFilterReset}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline"
            >
              <Icon icon="heroicons-outline:arrow-path" className="text-sm" />
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Leads AG Grid Table */}
      <DataGrid
        rowData={leads}
        columnDefs={columnDefs}
        enableSelection={true}
        entityName="leads"
        pagination={true}
        paginationData={{
          page: currentPage,
          limit,
          total: totalLeads,
          totalPages,
        }}
        onPageChange={(newPage) => setCurrentPage(newPage)}
        onPageSizeChange={(newLimit) => {
          setLimit(newLimit);
          setCurrentPage(1);
        }}
        isLoading={isFetching}
        emptyMessage="No leads found"
      />

      {/* Reusable Quick View Drawer for Leads */}
      <QuickViewDrawer
        isOpen={Boolean(quickViewLead)}
        onClose={() => setQuickViewLead(null)}
        title={quickViewLead?.fullName}
        subtitle={`Source: ${quickViewLead?.leadSource || "Direct"}`}
        badge={
          quickViewLead?.status && (
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize text-white ${getStatusColor(
                quickViewLead.status
              )}`}
            >
              {quickViewLead.status}
            </span>
          )
        }
        onViewDetails={() => navigate(`/leads/${quickViewLead?._id}`)}
        onEdit={() => navigate(`/leads/${quickViewLead?._id}/edit`)}
        groups={[
          {
            title: "Contact Information",
            items: [
              { label: "Phone", value: quickViewLead?.phone },
              { label: "Email", value: quickViewLead?.email || "No email" },
              {
                label: "Assigned To",
                value: quickViewLead?.assignedTo
                  ? `${quickViewLead.assignedTo.firstName || ""} ${quickViewLead.assignedTo.lastName || ""}`.trim()
                  : "Unassigned",
              },
              { label: "Priority", value: quickViewLead?.priority || "Medium" },
            ],
          },
          {
            title: "Project & Requirement",
            items: [
              {
                label: "Project Type",
                value:
                  quickViewLead?.projectType ||
                  quickViewLead?.requirement ||
                  "General Inquiry",
              },
              {
                label: "Budget",
                value: quickViewLead?.budget
                  ? `₹${Number(quickViewLead.budget).toLocaleString("en-IN")}`
                  : "Not specified",
              },
              {
                label: "City / Location",
                value: quickViewLead?.city || quickViewLead?.location || "—",
              },
              {
                label: "Created Date",
                value: quickViewLead?.createdAt
                  ? dayjs(quickViewLead.createdAt).format("MMM D, YYYY")
                  : "—",
              },
              {
                label: "Notes / Description",
                value:
                  quickViewLead?.notes ||
                  quickViewLead?.description ||
                  "No notes available",
                fullWidth: true,
              },
            ],
          },
        ]}
      />

      {/* Reusable Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() =>
          setDeleteConfirm({ isOpen: false, lead: null, isLoading: false })
        }
        onConfirm={handleConfirmDelete}
        title="Delete Lead"
        entityName={deleteConfirm.lead?.fullName || "this lead"}
        isLoading={deleteConfirm.isLoading}
        confirmText="Delete Lead"
      />
    </div>
  );
};

export default Leads;
