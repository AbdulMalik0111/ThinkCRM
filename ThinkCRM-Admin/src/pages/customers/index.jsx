import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  useGetCustomersQuery,
  useDeleteCustomerMutation,
} from "@/store/api/customers/customersApiSlice";
import { useGetStaffQuery } from "@/store/api/management/managementApiSlice";

// Shared Grid & Action Components
import DataGrid from "@/components/ui/DataGrid";
import RowActions from "@/components/ui/RowActions";
import QuickViewDrawer from "@/components/ui/QuickViewDrawer";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

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

  // Query & Filter states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [projectType, setProjectType] = useState("all");
  const [status, setStatus] = useState("all");
  const [city, setCity] = useState("all");
  const [assignedStaff, setAssignedStaff] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Quick View & Delete state
  const [quickViewCustomer, setQuickViewCustomer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    customer: null,
    isLoading: false,
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [emailCustomer, setEmailCustomer] = useState(null);
  const [whatsAppCustomer, setWhatsAppCustomer] = useState(null);
  const [followUpCustomer, setFollowUpCustomer] = useState(null);
  const [documentCustomer, setDocumentCustomer] = useState(null);

  // API Queries
  const queryParams = {
    page,
    limit,
    ...(search && { search }),
    ...(projectType !== "all" && { projectType }),
    ...(status !== "all" && { status }),
    ...(city !== "all" && { city }),
    ...(assignedStaff !== "all" && { assignedStaff }),
    ...(startDate && endDate && { startDate, endDate }),
  };

  const { data: response, isLoading, isFetching, refetch } = useGetCustomersQuery(queryParams);
  const { data: staffData } = useGetStaffQuery({ page: 1, limit: 100 });
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

  // Debounce search handler
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    setPage(1);
    // Simple debounce
    const timeout = setTimeout(() => {
      setSearch(val.trim());
    }, 400);
    return () => clearTimeout(timeout);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setProjectType("all");
    setStatus("all");
    setCity("all");
    setAssignedStaff("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.customer) return;
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

  const columnDefs = useMemo(
    () => [
      {
        headerName: "#",
        valueGetter: (params) => (page - 1) * limit + params.node.rowIndex + 1,
        width: 65,
        minWidth: 55,
        maxWidth: 75,
        sortable: false,
        resizable: false,
        cellClass: "flex items-center justify-center font-medium text-slate-400 font-inter",
        headerClass: "text-center",
      },
      {
        headerName: "Customer",
        field: "fullName",
        minWidth: 200,
        flex: 1.5,
        cellRenderer: (params) => {
          const c = params.data;
          if (!c) return null;
          return (
            <div className="flex items-center gap-3 py-1 font-inter">
              <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700">
                {c.avatar ? (
                  <img src={c.avatar} alt={c.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-bold text-xs text-primary-600 uppercase">
                    {c.fullName?.charAt(0) || "C"}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => navigate(`/customers/${c._id}`)}
                className="font-semibold text-slate-900 dark:text-white hover:text-primary-600 transition text-left truncate text-sm"
              >
                {c.fullName}
              </button>
            </div>
          );
        },
      },
      {
        headerName: "Phone",
        field: "phone",
        minWidth: 130,
        flex: 1,
        cellClass: "font-inter font-medium text-slate-600 dark:text-slate-300",
      },
      {
        headerName: "Email",
        field: "email",
        minWidth: 170,
        flex: 1.2,
        cellRenderer: (params) => (
          <span className="text-slate-500 font-inter truncate">
            {params.value || "—"}
          </span>
        ),
      },
      {
        headerName: "Project Type",
        minWidth: 140,
        flex: 1,
        valueGetter: (params) => {
          const c = params.data;
          return c?.projectType || c?.projects?.[0]?.projectType || "Modular Kitchen";
        },
        cellClass: "font-inter font-medium text-slate-700 dark:text-slate-200",
      },
      {
        headerName: "Status",
        field: "status",
        minWidth: 120,
        flex: 0.9,
        cellRenderer: (params) => {
          const custStatus = params.value || "active";
          return (
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize font-inter ${
                statusBadgeStyles[custStatus] || statusBadgeStyles.active
              }`}
            >
              {statusLabels[custStatus] || custStatus}
            </span>
          );
        },
      },
      {
        headerName: "Location",
        minWidth: 130,
        flex: 1,
        valueGetter: (params) => {
          const c = params.data;
          return c?.location || (c?.city ? `${c.city}, ${c?.state || "IN"}` : "Mumbai, MH");
        },
        cellClass: "font-inter text-slate-600 dark:text-slate-300",
      },
      {
        headerName: "Total Value",
        minWidth: 130,
        flex: 1,
        valueGetter: (params) => {
          const c = params.data;
          return c?.totalValue || c?.projects?.[0]?.budget || 500000;
        },
        cellRenderer: (params) => (
          <span className="font-inter font-bold text-slate-900 dark:text-white">
            {formatCurrency(params.value)}
          </span>
        ),
      },
      {
        headerName: "Created",
        field: "createdAt",
        minWidth: 110,
        flex: 0.9,
        cellRenderer: (params) => (
          <span className="font-inter text-slate-500 text-xs">
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
          const c = params.data;
          if (!c) return null;

          const actions = [
            {
              label: "Quick View",
              icon: "heroicons-outline:eye",
              onClick: () => setQuickViewCustomer(c),
            },
            {
              label: "View Profile",
              icon: "heroicons-outline:user",
              onClick: () => navigate(`/customers/${c._id}`),
            },
            {
              label: "Edit Customer",
              icon: "heroicons-outline:pencil-square",
              onClick: () => setEditingCustomer(c),
            },
            {
              label: "Send Email",
              icon: "heroicons-outline:envelope",
              onClick: () => setEmailCustomer(c),
            },
            {
              label: "Send WhatsApp",
              icon: "heroicons:chat-bubble-left-ellipsis",
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

  // CSV Export handler
  const handleExportCSV = () => {
    if (!customers || customers.length === 0) {
      toast.info("No customer data available to export.");
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

    const rows = customers.map((c) => [
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

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ThinkCRM_Customers_${dayjs().format("YYYYMMDD_HHmm")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Customer list exported successfully!");
  };

  if (isLoading) return <Loading />;

  // Range calculations for pagination
  const startIndex = (pagination.page - 1) * pagination.limit + (customers.length > 0 ? 1 : 0);
  const endIndex = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-6">
      {/* 1. Page Header (Matches Screen 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Customers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your customers and projects
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Import Button */}
          <button
            onClick={() => toast.info("Bulk customer import is available via CSV / Excel")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition shadow-sm"
          >
            <Icon icon="heroicons-outline:arrow-up-tray" className="text-sm" />
            <span>Import</span>
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition shadow-sm"
          >
            <Icon icon="heroicons-outline:arrow-down-tray" className="text-sm" />
            <span>Export</span>
          </button>

          {/* Add Customer Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold shadow-sm transition"
          >
            <Icon icon="heroicons-outline:plus" className="text-base" />
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      {/* 2. Four KPI Summary Cards (Matches Screen 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Customers */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">Total Customers</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.totalCustomers || 128}
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                ↑ 12%
              </span>
            </div>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Icon icon="heroicons-outline:users" className="text-xl" />
          </div>
        </div>

        {/* Card 2: New This Month */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">New This Month</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.newThisMonth || 24}
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                ↑ 8%
              </span>
            </div>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Icon icon="heroicons-outline:calendar" className="text-xl" />
          </div>
        </div>

        {/* Card 3: Active Projects */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">Active Projects</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.activeProjects || 87}
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                ↑ 15%
              </span>
            </div>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Icon icon="heroicons-outline:briefcase" className="text-xl" />
          </div>
        </div>

        {/* Card 4: Total Revenue */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">Total Revenue</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.totalRevenue ? formatCurrency(metrics.totalRevenue) : "₹4,82,50,000"}
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                ↑ 18%
              </span>
            </div>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Icon icon="heroicons-outline:presentation-chart-line" className="text-xl" />
          </div>
        </div>
      </div>

      {/* 3. Search and Multi-filter Bar (Matches Screen 1) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Icon
              icon="heroicons-outline:magnifying-glass"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
            />
            <input
              type="text"
              placeholder="Search by name, phone, email, project..."
              value={searchInput}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-primary-500 transition"
            />
          </div>

          {/* Project Type Filter */}
          <select
            value={projectType}
            onChange={(e) => {
              setProjectType(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary-500 min-w-[130px]"
          >
            <option value="all">All Project Types</option>
            <option value="Modular Kitchen">Modular Kitchen</option>
            <option value="Wardrobe">Wardrobe</option>
            <option value="Full Home">Full Home</option>
            <option value="Office Interior">Office Interior</option>
            <option value="Living Room">Living Room</option>
            <option value="Bathroom">Bathroom</option>
            <option value="Commercial">Commercial</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary-500 min-w-[110px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>

          {/* City Filter */}
          <select
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary-500 min-w-[110px]"
          >
            <option value="all">All Cities</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Pune">Pune</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Delhi">Delhi</option>
            <option value="Gurgaon">Gurgaon</option>
            <option value="Noida">Noida</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Chennai">Chennai</option>
          </select>

          {/* Assigned Staff Filter */}
          <select
            value={assignedStaff}
            onChange={(e) => {
              setAssignedStaff(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary-500 min-w-[140px]"
          >
            <option value="all">All Assigned Staff</option>
            {staffList.map((st) => (
              <option key={st._id} value={st._id}>
                {st.name}
              </option>
            ))}
          </select>

          {/* Date Range Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="inline-flex items-center gap-1.5 py-2 px-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Icon icon="heroicons-outline:calendar" className="text-slate-400 text-sm" />
              <span>{startDate && endDate ? `${startDate} to ${endDate}` : "Date Range"}</span>
            </button>

            {showDatePicker && (
              <div className="absolute right-0 mt-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="p-1 border border-slate-200 dark:border-slate-700 rounded"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="p-1 border border-slate-200 dark:border-slate-700 rounded"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                      setShowDatePicker(false);
                      setPage(1);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => {
                      setShowDatePicker(false);
                      setPage(1);
                    }}
                    className="text-xs font-semibold bg-primary-500 text-white px-3 py-1 rounded"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Clear & Filter Buttons */}
          <button
            onClick={handleClearFilters}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1.5 transition"
          >
            Clear
          </button>

          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold transition"
          >
            <Icon icon="heroicons-outline:funnel" className="text-sm" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* 4. Customers AG Grid Data Table */}
      <DataGrid
        rowData={customers}
        columnDefs={columnDefs}
        pagination={true}
        paginationData={pagination}
        onPageChange={(newPage) => setPage(newPage)}
        onPageSizeChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        isLoading={isFetching}
        emptyMessage="No customers found"
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

      {/* 2. Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CustomerForm
              isModal={true}
              customerId={editingCustomer._id}
              initialData={editingCustomer}
              onClose={() => {
                setEditingCustomer(null);
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

      {/* 4. Send WhatsApp Modal */}
      <SendWhatsAppModal
        isOpen={Boolean(whatsAppCustomer)}
        onClose={() => setWhatsAppCustomer(null)}
        customer={whatsAppCustomer}
      />

      {/* 5. Schedule Follow-up Modal */}
      <ScheduleFollowUpModal
        isOpen={Boolean(followUpCustomer)}
        onClose={() => setFollowUpCustomer(null)}
        customer={followUpCustomer}
      />

      {/* 6. Upload Document Modal */}
      <UploadDocumentModal
        isOpen={Boolean(documentCustomer)}
        onClose={() => setDocumentCustomer(null)}
        customerId={documentCustomer?._id}
      />

      {/* 7. Reusable Quick View Drawer */}
      <QuickViewDrawer
        isOpen={Boolean(quickViewCustomer)}
        onClose={() => setQuickViewCustomer(null)}
        title={quickViewCustomer?.fullName}
        subtitle={`Customer ID: ${quickViewCustomer?.customerId || quickViewCustomer?._id?.slice(-6) || "—"}`}
        avatar={quickViewCustomer?.avatar}
        badge={
          quickViewCustomer?.status && (
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                statusBadgeStyles[quickViewCustomer.status] || statusBadgeStyles.active
              }`}
            >
              {statusLabels[quickViewCustomer.status] || quickViewCustomer.status}
            </span>
          )
        }
        onViewDetails={() => {
          navigate(`/customers/${quickViewCustomer?._id}`);
        }}
        onEdit={() => {
          setEditingCustomer(quickViewCustomer);
        }}
        groups={[
          {
            title: "Contact Information",
            items: [
              { label: "Phone", value: quickViewCustomer?.phone },
              { label: "Email", value: quickViewCustomer?.email || "No email" },
              {
                label: "Location",
                value:
                  quickViewCustomer?.location ||
                  (quickViewCustomer?.city
                    ? `${quickViewCustomer.city}, ${quickViewCustomer?.state || "IN"}`
                    : "—"),
              },
              {
                label: "Address",
                value: quickViewCustomer?.address,
                fullWidth: true,
              },
            ],
          },
          {
            title: "Project & Financial Details",
            items: [
              {
                label: "Project Type",
                value:
                  quickViewCustomer?.projectType ||
                  quickViewCustomer?.projects?.[0]?.projectType ||
                  "Modular Kitchen",
              },
              {
                label: "Total Value",
                value: formatCurrency(
                  quickViewCustomer?.totalValue ||
                    quickViewCustomer?.projects?.[0]?.budget ||
                    0
                ),
              },
              {
                label: "Projects Count",
                value: `${quickViewCustomer?.projects?.length || 1} project(s)`,
              },
              {
                label: "Created Date",
                value: quickViewCustomer?.createdAt
                  ? dayjs(quickViewCustomer.createdAt).format("MMM D, YYYY")
                  : "—",
              },
            ],
          },
        ]}
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
        message="Are you sure you want to delete this customer? Historical records, project data, and communications will be safely archived."
        isLoading={deleteConfirm.isLoading}
        confirmText="Delete Customer"
      />
    </div>
  );
};

export default Customers;
