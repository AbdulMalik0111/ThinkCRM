import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import store from "@/store";
import {
  customersApi,
  useGetCustomersQuery,
  useDeleteCustomerMutation,
} from "@/store/api/customers/customersApiSlice";
import { useGetStaffQuery } from "@/store/api/management/managementApiSlice";

import DataGrid from "@/components/ui/DataGrid";
import RowActions from "@/components/ui/RowActions";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import TableToolbar from "@/components/common/TableToolbar";
import {
  getAvatarColor,
  renderStatusPill,
  formatCurrency,
  formatDate,
} from "@/components/common/tableUtils";

// Modals
import CustomerForm from "./CustomerForm";
import SendEmailModal from "./SendEmailModal";
import SendWhatsAppModal from "./SendWhatsAppModal";
import ScheduleFollowUpModal from "./ScheduleFollowUpModal";
import UploadDocumentModal from "./UploadDocumentModal";

const statusBadgeStyles = {
  active: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  in_progress: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  completed: "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
  on_hold: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
};

const statusLabels = {
  active: "Active",
  in_progress: "In Progress",
  completed: "Completed",
  on_hold: "On Hold",
};

const Customers = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isOwnerOrAdmin = user && (user.role === "Owner" || user.role === "Admin");

  // Query & Filter states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [projectType, setProjectType] = useState("all");
  const [status, setStatus] = useState("all");
  const [assignedStaff, setAssignedStaff] = useState("all");

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    customer: null,
    isLoading: false,
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [emailCustomer, setEmailCustomer] = useState(null);
  const [whatsAppCustomer, setWhatsAppCustomer] = useState(null);
  const [followUpCustomer, setFollowUpCustomer] = useState(null);
  const [documentCustomer, setDocumentCustomer] = useState(null);

  // API Queries (Strictly real backend, no city filter in toolbar)
  const queryParams = {
    page,
    limit,
    ...(search && { search }),
    ...(projectType !== "all" && { projectType }),
    ...(status !== "all" && { status }),
    ...(assignedStaff !== "all" && { assignedStaff }),
  };

  const { data: response, isLoading, isFetching, refetch } = useGetCustomersQuery(queryParams);
  const { data: staffData, isLoading: isStaffLoading } = useGetStaffQuery({ page: 1, limit: 100 }, { skip: !isOwnerOrAdmin });
  const [deleteCustomer] = useDeleteCustomerMutation();

  const customers = response?.data?.customers || [];
  const pagination = response?.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };
  const metrics = response?.data?.metrics || {
    totalCustomers: pagination.total || 0,
    newThisMonth: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalRevenue: 0,
  };
  const staffList = staffData?.data?.users || [];

  // Helper format currency
  const formatCurrency = (amt) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  // Debounced search handler
  const handleSearchChange = (val) => {
    setSearchInput(val);
    setPage(1);
    setSearch(val.trim());
  };

  // Clear all filters handler
  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setProjectType("all");
    setStatus("all");
    setAssignedStaff("all");
    setPage(1);
  };

  // Delete customer confirmation
  const handleConfirmDelete = async () => {
    if (!deleteConfirm.customer || deleteConfirm.isLoading) return;
    try {
      setDeleteConfirm((prev) => ({ ...prev, isLoading: true }));
      await deleteCustomer(deleteConfirm.customer._id).unwrap();
      toast.success("Customer deleted successfully");
      setDeleteConfirm({ isOpen: false, customer: null, isLoading: false });
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete customer");
      setDeleteConfirm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  /**
   * Primary AG Grid Table Columns:
   * 1. Checkbox (handled by enableSelection={true})
   * 2. # (row number)
   * 3. Customer
   * 4. Phone (full readable number)
   * 5. Project Type
   * 6. Status
   * 7. Total Value
   * 8. Actions (three-dot menu)
   * Note: Email, Location, and Created are intentionally removed from the main table
   * but remain fully accessible in Customer Details and Quick View.
   */
  const columnDefs = useMemo(
    () => [
      {
        headerName: "#",
        valueGetter: (params) => (page - 1) * limit + params.node.rowIndex + 1,
        width: 44,
        minWidth: 44,
        maxWidth: 50,
        pinned: "left",
        sortable: false,
        filter: false,
        resizable: false,
        cellClass: "flex items-center justify-center font-medium text-slate-400 font-inter text-[13.5px]",
        headerClass: "text-center",
      },
      {
        headerName: "Customer",
        field: "fullName",
        minWidth: 200,
        flex: 1.5,
        pinned: "left",
        cellRenderer: (params) => {
          const c = params.data;
          if (!c) return null;
          const initial = c.fullName?.charAt(0)?.toUpperCase() || "C";
          const avatarColor = getAvatarColor(c.fullName || "Customer");
          const code = c.customerId || (c.projectType ? `${c.projectType}` : "Customer");

          return (
            <div className="flex items-center gap-2.5 py-1 font-inter">
              <div
                className={`h-8.5 w-8.5 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700 ${
                  !c.avatar ? avatarColor : "bg-slate-100 dark:bg-slate-700"
                }`}
              >
                {c.avatar ? (
                  <img src={c.avatar} alt={c.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-bold text-xs uppercase">{initial}</span>
                )}
              </div>
              <div className="truncate">
                <button
                  type="button"
                  onClick={() => navigate(`/customers/${c._id}`)}
                  className="font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition text-left truncate block text-[13.5px] hover:underline"
                >
                  {c.fullName}
                </button>
                <span className="text-[11.5px] text-slate-400 font-medium block truncate">
                  {code}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        headerName: "Phone",
        field: "phone",
        minWidth: 140,
        flex: 1,
        cellRenderer: (params) => (
          <span className="font-inter font-semibold text-slate-800 dark:text-slate-100 text-[13px] whitespace-nowrap">
            {params.value || "—"}
          </span>
        ),
      },
      {
        headerName: "Email",
        field: "email",
        minWidth: 180,
        flex: 1.2,
        cellRenderer: (params) => (
          <span className="font-inter text-slate-600 dark:text-slate-300 text-[13px] truncate block" title={params.value}>
            {params.value || "—"}
          </span>
        ),
      },
      {
        headerName: "Leads",
        field: "leadsCount",
        minWidth: 90,
        flex: 0.8,
        valueGetter: (params) => {
          const c = params.data;
          return c?.leadsCount ?? c?.leads?.length ?? (c?.sourceLeadId ? 1 : 0);
        },
        cellRenderer: (params) => {
          const count = params.value || 0;
          return (
            <div className="flex items-center h-full">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                count > 1
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                  : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              }`}>
                <Icon icon="heroicons-outline:user-group" className="text-xs" />
                <span>{count}</span>
              </span>
            </div>
          );
        },
      },
      {
        headerName: "Projects",
        field: "projectsCount",
        minWidth: 95,
        flex: 0.8,
        valueGetter: (params) => {
          const c = params.data;
          return c?.projectsCount ?? c?.projects?.length ?? 0;
        },
        cellRenderer: (params) => {
          const count = params.value || 0;
          return (
            <div className="flex items-center h-full">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                <Icon icon="heroicons-outline:briefcase" className="text-xs" />
                <span>{count}</span>
              </span>
            </div>
          );
        },
      },
      {
        headerName: "Status",
        field: "status",
        minWidth: 120,
        flex: 0.9,
        cellClass: "flex items-center",
        cellRenderer: (params) => {
          return renderStatusPill(params.value || "active");
        },
      },
      {
        headerName: "Assigned Staff",
        field: "assignedStaff",
        minWidth: 140,
        flex: 1,
        valueGetter: (params) => {
          const c = params.data;
          const staff = c?.assignedStaff || c?.assignedTo;
          if (!staff) return "Unassigned";
          return `${staff.firstName || ""} ${staff.lastName || ""}`.trim() || staff.name || "Staff";
        },
        cellRenderer: (params) => {
          const isUnassigned = params.value === "Unassigned";
          return (
            <span className={`font-inter text-xs font-semibold truncate block ${
              isUnassigned ? "text-slate-400 italic" : "text-slate-700 dark:text-slate-200"
            }`}>
              {params.value}
            </span>
          );
        },
      },
      {
        headerName: "Last Activity",
        field: "lastActivity",
        minWidth: 130,
        flex: 1,
        valueGetter: (params) => {
          const c = params.data;
          return c?.lastActivity || c?.updatedAt;
        },
        cellRenderer: (params) => (
          <span className="font-inter text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {params.value ? dayjs(params.value).format("DD MMM YYYY") : "—"}
          </span>
        ),
      },
      {
        headerName: "Actions",
        pinned: "right",
        width: 68,
        minWidth: 68,
        maxWidth: 72,
        sortable: false,
        filter: false,
        resizable: false,
        cellClass: "flex items-center justify-center overflow-visible",
        cellRenderer: (params) => {
          const c = params.data;
          if (!c) return null;

          const actions = [
            {
              label: "View Profile",
              icon: "heroicons-outline:user",
              onClick: () => navigate(`/customers/${c._id}`),
            },
            {
              label: "Edit Customer",
              icon: "heroicons-outline:pencil-square",
              onClick: () => navigate(`/customers/${c._id}/edit`),
            },
            {
              label: "Send Email",
              icon: "heroicons-outline:envelope",
              onClick: () => setEmailCustomer(c),
            },
            {
              label: "Send WhatsApp",
              icon: "whatsapp",
              onClick: () => setWhatsAppCustomer(c),
            },
            {
              label: "Schedule Follow-up",
              icon: "heroicons-outline:calendar",
              onClick: () => setFollowUpCustomer(c),
            },
            {
              label: "Upload Document",
              icon: "heroicons-outline:arrow-up-tray",
              onClick: () => setDocumentCustomer(c),
            },
            c.sourceLeadId && {
              label: "View Original Lead",
              icon: "heroicons-outline:arrow-top-right-on-square",
              onClick: () => {
                const leadId = c.sourceLeadId._id || c.sourceLeadId;
                navigate(`/leads/${leadId}`);
              },
            },
            { divider: true },
            {
              label: "Delete Customer",
              icon: "heroicons-outline:trash",
              variant: "danger",
              onClick: () => {
                setDeleteConfirm({
                  isOpen: true,
                  customer: c,
                  isLoading: false,
                });
              },
            },
          ];

          return <RowActions actions={actions} label="Customer actions" align="right" />;
        },
      },
    ],
    [page, limit, navigate]
  );

  // Full dataset CSV Export handler (fetches all matching backend records)
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const exportParams = {
        page: 1,
        limit: 10000,
        ...(search && { search }),
        ...(projectType !== "all" && { projectType }),
        ...(status !== "all" && { status }),
        ...(assignedStaff !== "all" && { assignedStaff }),
      };

      const result = await store
        .dispatch(
          customersApi.endpoints.getCustomers.initiate(exportParams, { forceRefetch: true })
        )
        .unwrap();

      const allCustomers = result?.data?.customers || [];

      if (allCustomers.length === 0) {
        toast.info("No customer data available to export with current filters.");
        return;
      }

      const headers = [
        "Customer ID",
        "Full Name",
        "Phone",
        "Email",
        "Project Type",
        "Status",
        "Location",
        "Total Value",
        "Created Date",
      ];

      const rows = allCustomers.map((c) => [
        `"${c.customerId || ""}"`,
        `"${c.fullName || ""}"`,
        `"${c.phone || ""}"`,
        `"${c.email || ""}"`,
        `"${c.projectType || c.projects?.[0]?.projectType || ""}"`,
        `"${c.status || "active"}"`,
        `"${c.location || c.city || ""}"`,
        `"${c.totalValue || 0}"`,
        `"${dayjs(c.createdAt).format("YYYY-MM-DD")}"`,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8,\uFEFF" +
        [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `ThinkCRM_Customers_${dayjs().format("YYYYMMDD_HHmm")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${allCustomers.length} customer records successfully!`);
    } catch (err) {
      toast.error(err?.message || "Failed to export customers");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Clean Breadcrumbs - Zero Shadows */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <span>Home</span>
            <span>›</span>
            <span className="text-slate-600 dark:text-slate-300 font-semibold">Customers</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Customers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your customers, projects, and communications
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Export Button with Loading State */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-60"
          >
            <Icon
              icon={isExporting ? "heroicons-outline:arrow-path" : "heroicons-outline:arrow-down-tray"}
              className={`text-sm text-slate-500 ${isExporting ? "animate-spin" : ""}`}
            />
            <span>{isExporting ? "Exporting..." : "Export"}</span>
          </button>

          {/* Add Customer Button */}
          <button
            type="button"
            onClick={() => navigate("/customers/new")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition"
          >
            <Icon icon="heroicons-outline:plus" className="text-base" />
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      {/* 2. Four KPI Summary Cards - Clean Borders, No Shadows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Customers */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">Total Customers</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.totalCustomers || 0}
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                ↑ Active
              </span>
            </div>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Icon icon="heroicons-outline:users" className="text-xl" />
          </div>
        </div>

        {/* Card 2: New This Month */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">New This Month</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.newThisMonth || 0}
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                ↑ New
              </span>
            </div>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Icon icon="heroicons-outline:calendar" className="text-xl" />
          </div>
        </div>

        {/* Card 3: Active Projects */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">Active Projects</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.activeProjects || 0}
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                In Progress
              </span>
            </div>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Icon icon="heroicons-outline:briefcase" className="text-xl" />
          </div>
        </div>

        {/* Card 4: Total Revenue */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">Total Pipeline Value</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(metrics.totalRevenue || 0)}
              </span>
            </div>
          </div>
          <div className="h-11 w-11 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Icon icon="heroicons-outline:presentation-chart-line" className="text-xl" />
          </div>
        </div>
      </div>

      {/* 3. Reusable TableToolbar - Clean, Flat, No Cities Filter */}
      <TableToolbar
        search={searchInput}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name, phone, email, project..."
        filters={[
          {
            id: "projectType",
            value: projectType,
            onChange: (val) => {
              setProjectType(val);
              setPage(1);
            },
            placeholder: "All Project Types",
            minWidth: "160px",
            options: [
              { value: "Modular Kitchen", label: "Modular Kitchen" },
              { value: "Wardrobe", label: "Wardrobe" },
              { value: "Full Home", label: "Full Home" },
              { value: "Office Interior", label: "Office Interior" },
              { value: "Living Room", label: "Living Room" },
              { value: "Bathroom", label: "Bathroom" },
              { value: "Commercial", label: "Commercial" },
            ],
          },
          {
            id: "status",
            value: status,
            onChange: (val) => {
              setStatus(val);
              setPage(1);
            },
            placeholder: "All Statuses",
            minWidth: "140px",
            options: [
              { value: "active", label: "Active" },
              { value: "in_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
              { value: "on_hold", label: "On Hold" },
              { value: "lost", label: "Lost" },
              { value: "follow_up", label: "Follow-up" },
            ],
          },
          ...(isOwnerOrAdmin
            ? [
                {
                  id: "assignedStaff",
                  value: assignedStaff,
                  onChange: (val) => {
                    setAssignedStaff(val);
                    setPage(1);
                  },
                  placeholder: "All Assigned Staff",
                  minWidth: "175px",
                  isSearchable: true,
                  isLoading: isStaffLoading,
                  options: staffList.map((st) => ({
                    value: st._id,
                    label: `${st.firstName || ""} ${st.lastName || ""}`.trim() || st.name,
                  })),
                },
              ]
            : []),
        ]}
        onClearFilters={handleClearFilters}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {/* 4. Customers AG Grid Data Table */}
      <DataGrid
        rowData={customers}
        columnDefs={columnDefs}
        enableSelection={true}
        entityName="customers"
        pagination={true}
        paginationData={pagination}
        onPageChange={(newPage) => setPage(newPage)}
        onPageSizeChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        isLoading={isFetching}
        emptyMessage={
          !isOwnerOrAdmin && !search && projectType === "all" && status === "all"
            ? "No customers assigned to you yet"
            : "No customers found matching your filters"
        }
        emptySubtitle={
          !isOwnerOrAdmin && !search && projectType === "all" && status === "all"
            ? "When an administrator assigns customers to you or you add one, they will appear here."
            : "Try adjusting your filters or search terms."
        }
      />

      {/* Modals */}
      {/* 1. Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CustomerForm
              isModal={true}
              onClose={() => {
                setIsAddModalOpen(false);
                refetch();
              }}
            />
          </div>
        </div>
      )}


      {/* 3. Send Email Modal */}
      <SendEmailModal
        isOpen={Boolean(emailCustomer)}
        onClose={() => setEmailCustomer(null)}
        customer={emailCustomer}
      />

      {/* 5. Send WhatsApp Modal */}
      <SendWhatsAppModal
        isOpen={Boolean(whatsAppCustomer)}
        onClose={() => setWhatsAppCustomer(null)}
        customer={whatsAppCustomer}
      />

      {/* 6. Schedule Follow-up Modal */}
      <ScheduleFollowUpModal
        isOpen={Boolean(followUpCustomer)}
        onClose={() => setFollowUpCustomer(null)}
        customer={followUpCustomer}
      />

      {/* 7. Upload Document Modal */}
      <UploadDocumentModal
        isOpen={Boolean(documentCustomer)}
        onClose={() => setDocumentCustomer(null)}
        customerId={documentCustomer?._id}
      />

      {/* 8. Reusable Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() =>
          setDeleteConfirm({ isOpen: false, customer: null, isLoading: false })
        }
        onConfirm={handleConfirmDelete}
        title="Delete Customer"
        entityName={deleteConfirm.customer?.fullName || "this customer"}
        isLoading={deleteConfirm.isLoading}
        confirmText="Delete Customer"
      />
    </div>
  );
};

export default Customers;
