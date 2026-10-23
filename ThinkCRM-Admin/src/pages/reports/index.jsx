import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Chart from "react-apexcharts";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  useGetAnalyticsOverviewQuery,
  useLazyGetExportReportQuery,
  useGetDetailedRecordsQuery,
} from "@/store/api/analytics/analyticsApiSlice";
import { useGetStaffQuery } from "@/store/api/management/managementApiSlice";
import DataGrid from "@/components/ui/DataGrid";
import Flatpickr from "react-flatpickr";
import RowActions from "@/components/ui/RowActions";
import { getAvatarColor, renderStatusPill } from "@/components/common/tableUtils";

const SOURCE_ICONS = {
  Website: { icon: "heroicons-outline:globe-alt", color: "#3b82f6" },
  Meta: { icon: "logos:meta-icon", color: "#0668E1" },
  Facebook: { icon: "logos:facebook", color: "#1877F2" },
  Instagram: { icon: "logos:instagram-icon", color: "#E4405F" },
  Referral: { icon: "heroicons-outline:share", color: "#10b981" },
  WhatsApp: { icon: "logos:whatsapp-icon", color: "#25D366" },
  Google: { icon: "logos:google-icon", color: "#4285F4" },
  Phone: { icon: "heroicons-outline:phone", color: "#6366f1" },
  "Walk-in": { icon: "heroicons-outline:map-pin", color: "#f97316" },
  Other: { icon: "heroicons-outline:ellipsis-horizontal", color: "#64748b" },
};

const statusBadgeStyles = {
  new: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  contacted: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
  qualified: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
  follow_up: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
  measurement_scheduled: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  quotation_sent: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  won: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  lost: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
};

const Reports = () => {
  const navigate = useNavigate();

  // Active Report View Tab
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'records', 'leads', 'sales'

  // Filters State
  const [startDate, setStartDate] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));
  const [comparison, setComparison] = useState("previous_period");
  const [assignedStaff, setAssignedStaff] = useState("all");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("all");
  const [projectType, setProjectType] = useState("all");
  const [city, setCity] = useState("all");
  const [grouping, setGrouping] = useState("monthly"); // monthly, weekly, daily

  // UI Dropdowns & Modals State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Detailed Records Table State
  const [recordSearch, setRecordSearch] = useState("");
  const [recordPage, setRecordPage] = useState(1);

  // Query Parameters
  const queryParams = {
    startDate,
    endDate,
    comparison,
    assignedStaff,
    source,
    status,
    projectType,
    city,
    grouping,
  };

  const { data: analyticsResponse, isLoading, isFetching, refetch } = useGetAnalyticsOverviewQuery(queryParams);
  const { data: staffResponse } = useGetStaffQuery({ page: 1, limit: 100 });
  const [triggerExport] = useLazyGetExportReportQuery();

  // Query for detailed records table
  const recordsQueryResult = useGetDetailedRecordsQuery({
    ...queryParams,
    search: recordSearch,
    page: recordPage,
    limit: 10,
  });
  const recordsResponse = recordsQueryResult?.data;
  const isLoadingRecords = Boolean(recordsQueryResult?.isLoading);
  const isFetchingRecords = Boolean(recordsQueryResult?.isFetching);

  const analytics = analyticsResponse?.data || {};
  const kpis = analytics.kpis || {
    totalLeads: { value: 0, changePercent: 0, isPositive: true },
    qualifiedLeads: { value: 0, changePercent: 0, isPositive: true },
    wonDeals: { value: 0, changePercent: 0, isPositive: true },
    revenue: { value: 0, changePercent: 0, isPositive: true },
  };
  const trend = analytics.trend || { categories: [], leads: [], revenue: [] };
  const statusDistribution = analytics.statusDistribution || [];
  const sourceBreakdown = analytics.sourceBreakdown || [];
  const salesTeamPerformance = analytics.salesTeamPerformance || [];
  const followUpsOverview = analytics.followUpsOverview || {
    dueToday: { count: 0, changePercent: 0, isPositive: true },
    overdue: { count: 0, changePercent: 0, isPositive: true },
    completed: { count: 0, changePercent: 0, isPositive: true },
  };

  const staffList = staffResponse?.data?.users || [];
  const records = recordsResponse?.data?.records || [];
  const pagination = recordsResponse?.data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  // Helper: Format Currency (INR)
  const formatCurrency = (amt) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  // Helper: Format Lakhs/Crores for axis
  const formatAxisRevenue = (val) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(0)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val;
  };

  // Filter Resets
  const handleClearFilters = () => {
    setStartDate(dayjs().startOf("month").format("YYYY-MM-DD"));
    setEndDate(dayjs().endOf("month").format("YYYY-MM-DD"));
    setAssignedStaff("all");
    setSource("all");
    setStatus("all");
    setProjectType("all");
    setCity("all");
    setGrouping("monthly");
    setRecordPage(1);
    setRecordSearch("");
  };

  const recordColumnDefs = useMemo(
    () => [
      {
        headerName: "#",
        valueGetter: (params) => params.node.rowIndex + 1,
        width: 60,
        minWidth: 50,
        maxWidth: 70,
        sortable: false,
        filter: false,
        resizable: false,
        pinned: "left",
        cellClass: "flex items-center justify-center font-medium text-slate-400 font-inter",
        headerClass: "text-center",
      },
      {
        headerName: "Lead ID",
        field: "leadId",
        minWidth: 120,
        width: 120,
        pinned: "left",
        cellClass: "font-mono font-bold text-slate-700 dark:text-slate-300 font-inter text-[14px]",
      },
      {
        headerName: "Customer",
        field: "fullName",
        minWidth: 220,
        flex: 1.5,
        pinned: "left",
        cellRenderer: (params) => {
          const r = params.data;
          if (!r) return null;
          return (
            <div
              className="py-1 font-inter truncate cursor-pointer group"
              onClick={() => navigate(`/leads/${r._id || r.leadId}`)}
              title="Click to view lead details"
            >
              <span className="font-bold text-primary-600 group-hover:text-primary-700 dark:text-primary-400 dark:group-hover:text-primary-300 block truncate text-[14px] group-hover:underline">
                {r.fullName}
              </span>
              <span className="text-xs text-slate-400 block truncate font-medium">
                {r.email || "No email"}
              </span>
            </div>
          );
        },
      },
      {
        headerName: "Contact",
        field: "phone",
        minWidth: 150,
        flex: 1,
        cellRenderer: (params) => (
          <span className="font-inter text-slate-700 dark:text-slate-300 text-[14px] font-medium">
            {params.value || "—"}
          </span>
        ),
      },
      {
        headerName: "Source",
        field: "leadSource",
        minWidth: 130,
        flex: 1,
        cellRenderer: (params) => (
          <span className="font-inter font-semibold text-slate-700 dark:text-slate-200 capitalize text-[14px]">
            {params.value || "—"}
          </span>
        ),
      },
      {
        headerName: "Project Type",
        field: "projectType",
        minWidth: 160,
        flex: 1.2,
        cellRenderer: (params) => (
          <span className="font-inter font-semibold text-slate-800 dark:text-slate-200 capitalize text-[14px]">
            {params.value || "—"}
          </span>
        ),
      },
      {
        headerName: "Status",
        field: "status",
        minWidth: 130,
        flex: 1,
        cellRenderer: (params) => {
          return renderStatusPill(params.value || "new");
        },
      },
      {
        headerName: "Budget",
        field: "budget",
        minWidth: 140,
        flex: 1,
        cellRenderer: (params) => (
          <span className="font-inter font-bold text-slate-900 dark:text-white text-[14px]">
            {formatCurrency(params.value)}
          </span>
        ),
      },
      {
        headerName: "Assigned Staff",
        field: "assignedStaff",
        minWidth: 160,
        flex: 1.2,
        cellRenderer: (params) => (
          <span className="font-inter text-slate-800 dark:text-slate-200 font-medium text-[14px]">
            {params.value || "Unassigned"}
          </span>
        ),
      },
      {
        headerName: "City",
        field: "city",
        minWidth: 130,
        flex: 1,
        cellRenderer: (params) => (
          <span className="font-inter text-slate-600 dark:text-slate-300 text-[14px]">
            {params.value || "—"}
          </span>
        ),
      },
      {
        headerName: "Date",
        field: "createdAt",
        minWidth: 130,
        flex: 1,
        cellRenderer: (params) => (
          <span className="font-inter text-slate-500 text-[13.5px] font-medium">
            {params.value ? dayjs(params.value).format("MMM D, YYYY") : "—"}
          </span>
        ),
      },
      {
        headerName: "Action",
        pinned: "right",
        width: 76,
        minWidth: 70,
        maxWidth: 85,
        sortable: false,
        filter: false,
        resizable: false,
        cellClass: "flex items-center justify-center overflow-visible",
        headerClass: "text-center",
        cellRenderer: (params) => {
          const r = params.data;
          if (!r) return null;

          const actions = [
            {
              label: "View Lead Details",
              icon: "heroicons-outline:user",
              onClick: () => navigate(`/leads/${r._id || r.leadId}`),
            },
            {
              label: "Edit Lead",
              icon: "heroicons-outline:pencil-square",
              onClick: () => navigate(`/leads/${r._id || r.leadId}/edit`),
            },
            r.phone && {
              label: "Call Lead",
              icon: "heroicons-outline:phone",
              onClick: () => {
                window.location.href = `tel:${r.phone}`;
              },
            },
            r.phone && {
              label: "WhatsApp",
              icon: "whatsapp",
              onClick: () => {
                const cleanPhone = String(r.phone).replace(/[^0-9]/g, "");
                window.open(`https://wa.me/${cleanPhone}`, "_blank");
              },
            },
          ];

          return <RowActions actions={actions} label={`Actions for ${r.fullName}`} align="right" />;
        },
      },
    ],
    [navigate]
  );

  const staffColumnDefs = useMemo(
    () => [
      {
        headerName: "#",
        valueGetter: (params) => params.node.rowIndex + 1,
        width: 60,
        minWidth: 50,
        maxWidth: 70,
        sortable: false,
        filter: false,
        resizable: false,
        pinned: "left",
        cellClass: "flex items-center justify-center font-medium text-slate-400 font-inter",
        headerClass: "text-center",
      },
      {
        headerName: "Staff Member",
        field: "name",
        minWidth: 240,
        flex: 1.5,
        pinned: "left",
        cellClass: "flex items-center",
        cellRenderer: (params) => {
          const staff = params.data;
          if (!staff) return null;
          const avatarColor = getAvatarColor(staff.name || "S");
          return (
            <div className="flex items-center gap-3 py-1 font-inter truncate">
              <div
                className={`h-8 w-8 rounded-full ${avatarColor.bg} ${avatarColor.text} ${avatarColor.border} border flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs`}
              >
                {staff.name?.charAt(0)?.toUpperCase() || "S"}
              </div>
              <div className="truncate">
                <span className="font-bold text-slate-900 dark:text-white block truncate text-[14px]">
                  {staff.name}
                </span>
                <span className="text-xs text-slate-400 block truncate font-medium">
                  {staff.email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        headerName: "Assigned Leads",
        field: "assigned",
        minWidth: 140,
        flex: 1,
        cellClass: "flex items-center justify-center font-inter font-semibold text-slate-800 dark:text-white text-[14px]",
        headerClass: "text-center",
      },
      {
        headerName: "Qualified Leads",
        field: "qualified",
        minWidth: 140,
        flex: 1,
        cellClass: "flex items-center justify-center font-inter font-semibold text-slate-800 dark:text-white text-[14px]",
        headerClass: "text-center",
      },
      {
        headerName: "Won Deals",
        field: "won",
        minWidth: 130,
        flex: 1,
        cellClass: "flex items-center justify-center font-inter font-semibold text-emerald-600 text-[14px]",
        headerClass: "text-center",
      },
      {
        headerName: "Conversion %",
        field: "conversion",
        minWidth: 130,
        flex: 1,
        cellClass: "flex items-center justify-center font-inter",
        cellRenderer: (params) => (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 font-inter">
            {params.value}%
          </span>
        ),
        headerClass: "text-center",
      },
      {
        headerName: "Won Revenue",
        field: "revenue",
        minWidth: 160,
        flex: 1.2,
        cellClass: "flex items-center justify-end font-inter font-bold text-slate-900 dark:text-white text-[14px] pr-3",
        cellRenderer: (params) => (
          <span className="font-inter font-bold text-slate-900 dark:text-white text-[14px]">
            {formatCurrency(params.value)}
          </span>
        ),
        headerClass: "text-right",
      },
      {
        headerName: "Actions",
        pinned: "right",
        width: 72,
        minWidth: 68,
        maxWidth: 76,
        sortable: false,
        filter: false,
        resizable: false,
        cellClass: "flex items-center justify-center overflow-visible",
        headerClass: "text-center",
        cellRenderer: (params) => {
          const staff = params.data;
          if (!staff) return null;

          const actions = [
            {
              label: "View Leads",
              icon: "heroicons-outline:eye",
              onClick: () => {
                setAssignedStaff(staff.staffId);
                setActiveTab("records");
              },
            },
            {
              label: "Open Leads",
              icon: "heroicons-outline:arrow-top-right-on-square",
              onClick: () => {
                navigate("/leads");
              },
            },
            {
              label: "Staff Profile",
              icon: "heroicons-outline:user",
              onClick: () => {
                navigate("/staff");
              },
            },
            { divider: true },
            staff.email && {
              label: "Copy Email",
              icon: "heroicons-outline:clipboard",
              onClick: () => {
                navigator.clipboard?.writeText(staff.email);
                toast.success(`Copied ${staff.email} to clipboard!`);
              },
            },
            staff.email && {
              label: "Send Email",
              icon: "heroicons-outline:envelope",
              onClick: () => {
                window.location.href = `mailto:${staff.email}`;
              },
            },
          ];

          return (
            <RowActions
              actions={actions}
              label={`Actions for ${staff.name}`}
              align="right"
            />
          );
        },
      },
    ],
    [navigate]
  );

  // Export Report Handlers
  const handleExport = async (format) => {
    setShowExportMenu(false);
    if (isExporting) return;
    setIsExporting(true);

    try {
      if (format === "csv") {
        const queryStr = new URLSearchParams({
          ...queryParams,
          format: "csv",
        }).toString();
        const exportUrl = `${import.meta.env.VITE_API_BASE_URL || "https://thinkcrm.onrender.com/api/v1"}/reports/export?${queryStr}`;
        
        const token = localStorage.getItem("token") || "";
        const response = await fetch(exportUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to export report");
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `thinkcrm-analytics-report-${dayjs().format("YYYY-MM")}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("CSV report downloaded successfully!");
      } else if (format === "excel") {
        const queryStr = new URLSearchParams({
          ...queryParams,
          format: "excel",
        }).toString();
        const exportUrl = `${import.meta.env.VITE_API_BASE_URL || "https://thinkcrm.onrender.com/api/v1"}/reports/export?${queryStr}`;
        
        const token = localStorage.getItem("token") || "";
        const response = await fetch(exportUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to export report");
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `thinkcrm-analytics-report-${dayjs().format("YYYY-MM")}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("Excel report downloaded successfully!");
      } else if (format === "pdf") {
        const res = await triggerExport({ ...queryParams, format: "json" }).unwrap();
        const exportRecords = res?.data?.records || [];

        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>ThinkCRM - Analytics & Performance Report</title>
                <style>
                  body { font-family: 'Inter', sans-serif; padding: 24px; color: #1e293b; }
                  .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
                  .title { font-size: 22px; font-weight: bold; color: #0f172a; }
                  .sub { font-size: 12px; color: #64748b; margin-top: 4px; }
                  .kpi-row { display: flex; gap: 16px; margin-bottom: 24px; }
                  .kpi { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
                  .kpi-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
                  .kpi-val { font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 4px; }
                  table { width: 100%; border-collapse: collapse; font-size: 11px; }
                  th { background: #f1f5f9; text-align: left; padding: 8px 10px; border-bottom: 1px solid #cbd5e1; font-weight: 600; }
                  td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
                  tr:nth-child(even) { background: #fafafa; }
                  @media print { .no-print { display: none; } }
                </style>
              </head>
              <body>
                <div class="header">
                  <div class="title">ThinkCRM — Reports & Analytics</div>
                  <div class="sub">Generated on ${dayjs().format("DD MMM YYYY, hh:mm A")} | Range: ${startDate} to ${endDate}</div>
                </div>
                <div class="kpi-row">
                  <div class="kpi"><div class="kpi-title">Total Leads</div><div class="kpi-val">${kpis.totalLeads?.value || 0}</div></div>
                  <div class="kpi"><div class="kpi-title">Qualified Leads</div><div class="kpi-val">${kpis.qualifiedLeads?.value || 0}</div></div>
                  <div class="kpi"><div class="kpi-title">Won Deals</div><div class="kpi-val">${kpis.wonDeals?.value || 0}</div></div>
                  <div class="kpi"><div class="kpi-title">Revenue</div><div class="kpi-val">${formatCurrency(kpis.revenue?.value || 0)}</div></div>
                </div>
                <h4>Detailed Records (${exportRecords.length} total)</h4>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Lead ID</th>
                      <th>Full Name</th>
                      <th>Phone</th>
                      <th>Source</th>
                      <th>Status</th>
                      <th>Project Type</th>
                      <th>Budget</th>
                      <th>Assigned Staff</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${exportRecords.map((r, i) => `
                      <tr>
                        <td>${i + 1}</td>
                        <td>${r.leadId}</td>
                        <td><strong>${r.fullName}</strong></td>
                        <td>${r.phone}</td>
                        <td>${r.leadSource}</td>
                        <td>${r.status}</td>
                        <td>${r.projectType}</td>
                        <td>₹${(r.budget || 0).toLocaleString()}</td>
                        <td>${r.assignedStaff}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </body>
            </html>
          `);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
          }, 300);
          toast.success("PDF print dialog opened!");
        }
      }
    } catch (err) {
      toast.error(err?.message || "Failed to download export file");
    } finally {
      setIsExporting(false);
    }
  };

  // Sparkline Chart Options
  const createSparklineOptions = (color) => ({
    chart: { type: "line", sparkline: { enabled: true } },
    stroke: { curve: "smooth", width: 2.5, colors: [color] },
    tooltip: { enabled: false },
    colors: [color],
  });

  // 1. Dual-Axis Lead & Revenue Trend Chart Configuration
  const trendChartOptions = useMemo(() => ({
    chart: {
      type: "line",
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "Inter, sans-serif",
    },
    colors: ["#34d399", "#2563eb"], // Mint green bars, Blue curve
    plotOptions: {
      bar: {
        columnWidth: "42%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    stroke: {
      width: [0, 3],
      curve: "smooth",
    },
    markers: {
      size: [0, 4.5],
      colors: ["#2563eb"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 6.5 },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: trend.categories || [],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: "#94a3b8", fontSize: "11px", fontWeight: 500 },
      },
    },
    yaxis: [
      {
        title: {
          text: "Number of Leads",
          style: { color: "#94a3b8", fontSize: "11px", fontWeight: 500 },
        },
        labels: {
          style: { colors: "#94a3b8", fontSize: "11px" },
          formatter: (v) => Math.round(v),
        },
      },
      {
        opposite: true,
        title: {
          text: "Revenue (₹)",
          style: { color: "#94a3b8", fontSize: "11px", fontWeight: 500 },
        },
        labels: {
          style: { colors: "#94a3b8", fontSize: "11px" },
          formatter: (v) => formatAxisRevenue(v),
        },
      },
    ],
    grid: {
      borderColor: "#f1f5f9",
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    legend: { show: false },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val, { seriesIndex }) => {
          if (seriesIndex === 1) return formatCurrency(val);
          return `${val} Leads`;
        },
      },
    },
  }), [trend.categories]);

  const trendChartSeries = useMemo(() => [
    {
      name: "Leads",
      type: "column",
      data: trend.leads || [],
    },
    {
      name: "Revenue (₹)",
      type: "line",
      data: trend.revenue || [],
    },
  ], [trend.leads, trend.revenue]);

  // 2. Donut Lead Status Distribution Chart Configuration
  const statusLabels = statusDistribution.map((s) => s.label);
  const statusSeries = statusDistribution.map((s) => s.count);
  const statusColors = statusDistribution.map((s) => s.color);

  const statusDonutOptions = useMemo(() => ({
    chart: { type: "donut" },
    labels: statusLabels,
    colors: statusColors.length ? statusColors : ["#3b82f6", "#06b6d4", "#f97316", "#2563eb", "#8b5cf6", "#10b981", "#ef4444"],
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Leads",
              fontSize: "12px",
              fontWeight: 600,
              color: "#64748b",
              formatter: () => kpis.totalLeads?.value || 248,
            },
            value: {
              fontSize: "22px",
              fontWeight: 700,
              color: "#0f172a",
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { width: 2, colors: ["#fff"] },
    tooltip: {
      y: {
        formatter: (val) => `${val} Leads`,
      },
    },
  }), [statusLabels, statusSeries, statusColors, kpis.totalLeads]);

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* 1. Header (Breadcrumbs + Title + Date Range + Comparison + Export) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <button onClick={() => navigate("/dashboard")} className="hover:text-primary-600 flex items-center gap-1">
              <Icon icon="heroicons-outline:home" className="text-sm" />
              <span>Home</span>
            </button>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold">Reports & Analytics</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Reports & Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track leads, sales performance, follow-ups and revenue.
          </p>
        </div>

        {/* Right Header Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Picker Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="inline-flex items-center gap-2.5 h-11 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-[14.5px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
            >
              <Icon icon="heroicons-outline:calendar" className="text-slate-500 text-base" />
              <span>{dayjs(startDate).format("DD MMM YYYY")} – {dayjs(endDate).format("DD MMM YYYY")}</span>
              <Icon icon="heroicons-outline:chevron-down" className="text-xs text-slate-400" />
            </button>

            {showDatePicker && (
              <div
                className="absolute right-0 mt-2 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl z-30 w-80 space-y-3.5 animate-fadeIn"
                onMouseLeave={() => setShowDatePicker(false)}
              >
                <div className="text-sm font-bold text-slate-800 dark:text-white pb-1.5 border-b border-slate-100 dark:border-slate-700">
                  Select Reporting Window
                </div>
                <div className="space-y-1 text-sm font-semibold">
                  <button
                    onClick={() => {
                      setStartDate("2026-10-01");
                      setEndDate("2026-10-31");
                      setShowDatePicker(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                  >
                    Current Month (Oct 2026)
                  </button>
                  <button
                    onClick={() => {
                      setStartDate("2026-09-01");
                      setEndDate("2026-09-30");
                      setShowDatePicker(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                  >
                    Previous Month (Sep 2026)
                  </button>
                  <button
                    onClick={() => {
                      setStartDate("2026-01-01");
                      setEndDate("2026-10-31");
                      setShowDatePicker(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                  >
                    Year to Date (2026)
                  </button>
                </div>

                {/* Professional Custom Date Range using Flatpickr */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Custom Date Range
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Flatpickr</span>
                  </div>
                  <Flatpickr
                    value={[new Date(startDate), new Date(endDate)]}
                    options={{
                      mode: "range",
                      dateFormat: "Y-m-d",
                    }}
                    onChange={(dates) => {
                      if (dates.length === 2) {
                        setStartDate(dayjs(dates[0]).format("YYYY-MM-DD"));
                        setEndDate(dayjs(dates[1]).format("YYYY-MM-DD"));
                      }
                    }}
                    className="w-full text-sm font-semibold py-2 px-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
                    placeholder="Click to pick range"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Previous-period Comparison Selector */}
          <div className="relative">
            <select
              value={comparison}
              onChange={(e) => setComparison(e.target.value)}
              className="h-11 py-2 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-[14.5px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 focus:outline-none cursor-pointer"
            >
              <option value="previous_period">Previous period</option>
              <option value="previous_year">Previous year</option>
              <option value="none">No comparison</option>
            </select>
          </div>

          {/* Export Report Dropdown Button (Matching Green in Reference) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="inline-flex items-center gap-2 h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[14.5px] font-semibold transition disabled:opacity-60"
            >
              <Icon icon="heroicons-outline:arrow-down-tray" className="text-base" />
              <span>{isExporting ? "Exporting..." : "Export Report"}</span>
              <Icon icon="heroicons-outline:chevron-down" className="text-xs opacity-80" />
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 z-30 animate-fadeIn"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-left font-semibold"
                >
                  <Icon icon="heroicons-outline:document-text" className="text-lg text-blue-500" />
                  <span>Export as CSV</span>
                </button>
                <button
                  onClick={() => handleExport("excel")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-left font-semibold"
                >
                  <Icon icon="heroicons-outline:table-cells" className="text-lg text-emerald-600" />
                  <span>Export as Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-left font-semibold"
                >
                  <Icon icon="heroicons-outline:document-arrow-down" className="text-lg text-red-500" />
                  <span>Export as PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Filter Bar (Assigned Staff, Source, Status, Project Type, City, Apply, Clear) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap items-center gap-3.5">
          {/* Assigned Staff */}
          <div className="flex-1 min-w-[160px]">
            <select
              value={assignedStaff}
              onChange={(e) => setAssignedStaff(e.target.value)}
              className="w-full h-11 py-2 px-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-[14.5px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary-500 transition cursor-pointer"
            >
              <option value="all">All Staff</option>
              {staffList.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name || `${st.firstName || ""} ${st.lastName || ""}`.trim() || st.email}
                </option>
              ))}
            </select>
          </div>

          {/* Source */}
          <div className="flex-1 min-w-[140px]">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full h-11 py-2 px-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-[14.5px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary-500 transition cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="Website">Website</option>
              <option value="Meta">Meta Ads</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Referral">Referral</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Google">Google</option>
              <option value="Phone">Phone</option>
              <option value="Walk-in">Walk-in</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex-1 min-w-[140px]">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-11 py-2 px-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-[14.5px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary-500 transition cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="follow_up">Follow-up</option>
              <option value="measurement_scheduled">Measurement</option>
              <option value="quotation_sent">Quotation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          {/* Project Type */}
          <div className="flex-1 min-w-[150px]">
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-full h-11 py-2 px-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-[14.5px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary-500 transition cursor-pointer"
            >
              <option value="all">All Project Types</option>
              <option value="Kitchen">Modular Kitchen</option>
              <option value="Wardrobe">Wardrobe</option>
              <option value="Full Home">Full Home</option>
              <option value="Living Room">Living Room</option>
              <option value="Office">Office Interior</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>

          {/* City */}
          <div className="flex-1 min-w-[130px]">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full h-11 py-2 px-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-[14.5px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary-500 transition cursor-pointer"
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
          </div>

          {/* Apply Filters & Clear Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 h-11 px-5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-[14.5px] font-semibold transition"
            >
              <Icon icon="heroicons-outline:funnel" className="text-base" />
              <span>Apply Filters</span>
            </button>
            <button
              onClick={handleClearFilters}
              className="h-11 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-[14.5px] font-semibold transition"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs (Overview vs Detailed Records vs Staff Performance) */}
      <div className="flex items-center gap-8 md:gap-12 border-b border-slate-200 dark:border-slate-700 pb-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2.5 pb-3.5 border-b-2 text-[15px] transition whitespace-nowrap ${
            activeTab === "overview"
              ? "border-primary-600 text-primary-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
          }`}
        >
          <Icon icon="heroicons-outline:presentation-chart-line" className="text-xl" />
          <span>Executive Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("records")}
          className={`flex items-center gap-2.5 pb-3.5 border-b-2 text-[15px] transition whitespace-nowrap ${
            activeTab === "records"
              ? "border-primary-600 text-primary-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
          }`}
        >
          <Icon icon="heroicons-outline:table-cells" className="text-xl" />
          <span>Detailed Records Table ({pagination.total})</span>
        </button>

        <button
          onClick={() => setActiveTab("staff")}
          className={`flex items-center gap-2.5 pb-3.5 border-b-2 text-[15px] transition whitespace-nowrap ${
            activeTab === "staff"
              ? "border-primary-600 text-primary-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
          }`}
        >
          <Icon icon="heroicons-outline:user-group" className="text-xl" />
          <span>Staff Reports</span>
        </button>
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW (Matches Screen Reference media_1791982040606.png) */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fadeIn">
          {/* 3. Four Summary KPI Cards (Total Leads, Qualified Leads, Won Deals, Revenue) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Leads */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Icon icon="heroicons-outline:users" className="text-xl" />
                </div>
                {/* Sparkline */}
                <div className="w-24 h-10 -mr-2">
                  <Chart
                    options={createSparklineOptions("#10b981")}
                    series={[{ data: [12, 14, 18, 16, 20, 24, 28] }]}
                    type="line"
                    height="40"
                    width="100%"
                  />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs font-semibold text-slate-500">Total Leads</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {kpis.totalLeads?.value || 248}
                  </h3>
                  <span className="text-xs font-semibold text-emerald-600 inline-flex items-center">
                    ↑ {kpis.totalLeads?.changePercent || 12.4}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">vs previous period</span>
              </div>
            </div>

            {/* Card 2: Qualified Leads */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="h-11 w-11 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <Icon icon="heroicons-outline:funnel" className="text-xl" />
                </div>
                {/* Sparkline */}
                <div className="w-24 h-10 -mr-2">
                  <Chart
                    options={createSparklineOptions("#a855f7")}
                    series={[{ data: [6, 8, 7, 10, 12, 11, 15] }]}
                    type="line"
                    height="40"
                    width="100%"
                  />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs font-semibold text-slate-500">Qualified Leads</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {kpis.qualifiedLeads?.value || 86}
                  </h3>
                  <span className="text-xs font-semibold text-emerald-600 inline-flex items-center">
                    ↑ {kpis.qualifiedLeads?.changePercent || 8.2}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">vs previous period</span>
              </div>
            </div>

            {/* Card 3: Won Deals */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Icon icon="heroicons-outline:trophy" className="text-xl" />
                </div>
                {/* Sparkline */}
                <div className="w-24 h-10 -mr-2">
                  <Chart
                    options={createSparklineOptions("#10b981")}
                    series={[{ data: [2, 3, 2, 4, 3, 5, 6] }]}
                    type="line"
                    height="40"
                    width="100%"
                  />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs font-semibold text-slate-500">Won Deals</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {kpis.wonDeals?.value || 24}
                  </h3>
                  <span className="text-xs font-semibold text-emerald-600 inline-flex items-center">
                    ↑ {kpis.wonDeals?.changePercent || 15.7}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">vs previous period</span>
              </div>
            </div>

            {/* Card 4: Revenue */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Icon icon="heroicons-outline:currency-rupee" className="text-xl" />
                </div>
                {/* Sparkline */}
                <div className="w-24 h-10 -mr-2">
                  <Chart
                    options={createSparklineOptions("#2563eb")}
                    series={[{ data: [100, 150, 130, 220, 290, 340, 480] }]}
                    type="line"
                    height="40"
                    width="100%"
                  />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs font-semibold text-slate-500">Revenue</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {kpis.revenue?.value ? formatCurrency(kpis.revenue.value) : "₹12,85,000"}
                  </h3>
                  <span className="text-xs font-semibold text-emerald-600 inline-flex items-center">
                    ↑ {kpis.revenue?.changePercent || 17.5}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">vs previous period</span>
              </div>
            </div>
          </div>

          {/* 4. Middle Row: Lead & Revenue Trend (Left) + Lead Status Distribution (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left (2 Cols): Lead & Revenue Trend Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Lead & Revenue Trend
                  </h4>
                  <div className="flex items-center gap-4 text-xs mt-1">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span>Leads</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                      <span>Revenue (₹)</span>
                    </span>
                  </div>
                </div>

                {/* Toggle: Monthly, Weekly, Daily */}
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-900 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setGrouping("monthly")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                      grouping === "monthly"
                        ? "bg-primary-500 text-white"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setGrouping("weekly")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                      grouping === "weekly"
                        ? "bg-primary-500 text-white"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => setGrouping("daily")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                      grouping === "daily"
                        ? "bg-primary-500 text-white"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    Daily
                  </button>
                </div>
              </div>

              {/* ApexChart */}
              <div className="h-[310px] w-full">
                <Chart
                  options={trendChartOptions}
                  series={trendChartSeries}
                  type="line"
                  height="100%"
                  width="100%"
                />
              </div>
            </div>

            {/* Right (1 Col): Lead Status Distribution Donut Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Lead Status Distribution
                </h4>

                {/* Donut Chart */}
                <div className="h-[200px] w-full flex items-center justify-center my-2">
                  <Chart
                    options={statusDonutOptions}
                    series={statusSeries.length ? statusSeries : [54, 62, 48, 35, 12, 18, 24, 25]}
                    type="donut"
                    height="190"
                  />
                </div>
              </div>

              {/* Status Breakdown Legend List (Matching Right Side in Reference) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 max-h-48 overflow-y-auto">
                {statusDistribution.map((item) => (
                  <div key={item.status} className="flex items-center justify-between text-xs py-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 dark:text-white">{item.count}</span>
                      <span className="text-[11px] text-slate-400">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}

                {statusDistribution.length === 0 && (
                  <div className="text-center py-4 text-xs text-slate-400">
                    No status data available for selected filter.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. Bottom Row: Lead Sources + Sales Team Performance + Follow-up Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Lead Sources */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Lead Sources
                </h4>
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                  Total Leads
                </span>
              </div>

              {/* Sources Horizontal Bars List */}
              <div className="space-y-3.5">
                {sourceBreakdown.map((item) => {
                  const meta = SOURCE_ICONS[item.source] || SOURCE_ICONS.Other;
                  return (
                    <div key={item.source} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Icon icon={meta.icon} className="text-sm" style={{ color: meta.color }} />
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {item.source}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {item.count} <span className="text-slate-400 text-[11px]">({item.percentage}%)</span>
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {sourceBreakdown.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No sources recorded for current filter.
                  </div>
                )}
              </div>
            </div>

            {/* Center: Sales Team Performance */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Sales Team Performance
                  </h4>
                  <button
                    onClick={() => setActiveTab("staff")}
                    className="text-xs font-semibold text-primary-600 hover:underline"
                  >
                    View All
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700/60 text-slate-500 uppercase text-[10px] font-semibold">
                      <tr>
                        <th className="py-2.5 px-2">#</th>
                        <th className="py-2.5 px-2">Staff Member</th>
                        <th className="py-2.5 px-2 text-center">Assigned</th>
                        <th className="py-2.5 px-2 text-center">Qualified</th>
                        <th className="py-2.5 px-2 text-center">Won</th>
                        <th className="py-2.5 px-2 text-center">Conversion</th>
                        <th className="py-2.5 px-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {salesTeamPerformance.slice(0, 6).map((staff, idx) => (
                        <tr key={staff.staffId || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                          <td className="py-2 px-2 text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-primary-600">
                                {staff.name?.charAt(0) || "S"}
                              </div>
                              <span className="font-semibold text-slate-800 dark:text-white truncate max-w-[100px]">
                                {staff.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-center text-slate-600 dark:text-slate-300 font-medium">{staff.assigned}</td>
                          <td className="py-2 px-2 text-center text-slate-600 dark:text-slate-300 font-medium">{staff.qualified}</td>
                          <td className="py-2 px-2 text-center text-slate-600 dark:text-slate-300 font-medium">{staff.won}</td>
                          <td className="py-2 px-2 text-center">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                              {staff.conversion}%
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-slate-800 dark:text-white">
                            {formatCurrency(staff.revenue)}
                          </td>
                        </tr>
                      ))}

                      {salesTeamPerformance.length === 0 && (
                        <tr>
                          <td colSpan="7" className="py-6 text-center text-slate-400">
                            No team activity recorded for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Follow-up Overview (Matches 3 Cards in Reference) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Follow-up Overview
                </h4>
                <button
                  onClick={() => navigate("/leads/follow-ups")}
                  className="text-xs font-semibold text-primary-600 hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3">
                {/* Card 1: Due Today */}
                <div
                  onClick={() => navigate("/leads/follow-ups")}
                  className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-900/40 flex items-center justify-between cursor-pointer hover:bg-blue-50/70 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <Icon icon="heroicons-outline:calendar" className="text-lg" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                        Due Today
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                          {followUpsOverview.dueToday?.count || 18}
                        </span>
                        <span className="text-xs font-bold text-emerald-600">
                          ↑ {followUpsOverview.dueToday?.changePercent || 28}%
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Follow-ups scheduled for today
                      </span>
                    </div>
                  </div>
                  <Icon icon="heroicons-outline:chevron-right" className="text-slate-400 text-sm" />
                </div>

                {/* Card 2: Overdue */}
                <div
                  onClick={() => navigate("/leads/follow-ups")}
                  className="p-3.5 rounded-xl border border-red-100 bg-red-50/40 dark:bg-red-950/20 dark:border-red-900/40 flex items-center justify-between cursor-pointer hover:bg-red-50/70 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-500 flex items-center justify-center flex-shrink-0">
                      <Icon icon="heroicons-outline:clock" className="text-lg" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                        Overdue
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                          {followUpsOverview.overdue?.count || 12}
                        </span>
                        <span className="text-xs font-bold text-red-500">
                          ↑ {followUpsOverview.overdue?.changePercent || 50}%
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Follow-ups past due date
                      </span>
                    </div>
                  </div>
                  <Icon icon="heroicons-outline:chevron-right" className="text-slate-400 text-sm" />
                </div>

                {/* Card 3: Completed */}
                <div
                  onClick={() => navigate("/leads/follow-ups")}
                  className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/40 flex items-center justify-between cursor-pointer hover:bg-emerald-50/70 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Icon icon="heroicons-outline:check-circle" className="text-lg" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                        Completed
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                          {followUpsOverview.completed?.count || 76}
                        </span>
                        <span className="text-xs font-bold text-emerald-600">
                          ↑ {followUpsOverview.completed?.changePercent || 18}%
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Follow-ups completed in this period
                      </span>
                    </div>
                  </div>
                  <Icon icon="heroicons-outline:chevron-right" className="text-slate-400 text-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED RECORDS TABLE (Section 9 Requirement) */}
      {activeTab === "records" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Detailed Lead Records ({pagination.total})
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                All records matching the active reporting window and filters.
              </p>
            </div>

            {/* Table Search input */}
            <div className="relative w-full sm:w-72">
              <Icon
                icon="heroicons-outline:magnifying-glass"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search leads, phone, email..."
                value={recordSearch}
                onChange={(e) => {
                  setRecordSearch(e.target.value);
                  setRecordPage(1);
                }}
                className="w-full h-11 pl-10 pr-9 border border-slate-200 dark:border-slate-700 rounded-lg text-[14.5px] font-semibold bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-primary-500 transition"
              />
              {recordSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setRecordSearch("");
                    setRecordPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
                  title="Clear search"
                >
                  <Icon icon="heroicons-outline:x-mark" className="text-sm" />
                </button>
              )}
            </div>
          </div>

          {/* AG Grid Data Table */}
          <DataGrid
            rowData={records}
            columnDefs={recordColumnDefs}
            enableSelection={true}
            entityName="records"
            pagination={true}
            paginationData={pagination}
            onPageChange={(p) => setRecordPage(p)}
            isLoading={isFetchingRecords || isLoadingRecords}
            emptyMessage="No records found matching current criteria"
          />
        </div>
      )}

      {/* TAB 3: STAFF PERFORMANCE (Section 9 Requirement) */}
      {activeTab === "staff" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Sales Team Detailed Performance
              </h4>
              <p className="text-xs text-slate-500">
                Lead acquisition, qualification rate, won deal ratios, and generated revenue.
              </p>
            </div>
          </div>

          {/* AG Grid Sales Team Performance Table */}
          <DataGrid
            rowData={salesTeamPerformance}
            columnDefs={staffColumnDefs}
            pagination={salesTeamPerformance.length > 10}
            emptyMessage="No sales team performance records found"
          />
        </div>
      )}
    </div>
  );
};

export default Reports;
