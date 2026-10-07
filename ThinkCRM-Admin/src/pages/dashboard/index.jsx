import React from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Chart from "react-apexcharts";
import { useGetDashboardMetricsQuery } from "@/store/api/analytics/analyticsApiSlice";
import Loading from "@/components/Loading";
import PermissionGuard from "@/components/PermissionGuard";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import Flatpickr from "react-flatpickr";

// ─── Stat Card Component ─────────────────────────────────────────────
const StatCard = ({ icon, iconBg, label, value, percentChange, prefix = "", onClick }) => {
  const isPositive = percentChange > 0;
  const isNeutral = percentChange === 0 || percentChange === undefined || percentChange === null;

  return (
    <div onClick={onClick} className={`h-full ${onClick ? "cursor-pointer transition-transform hover:-translate-y-1" : ""}`}>
      <Card className="h-full" bodyClass="p-5 flex flex-col h-full justify-between">
        <div className="flex items-center space-x-4">
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${iconBg}`}>
            <Icon icon={icon} className="text-white text-xl" />
          </div>
          <div className="flex-1 min-w-0">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide truncate">{label}</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 truncate">{prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</div>
        </div>
      </div>
      {!isNeutral && (
        <div className={`mt-3 flex items-center text-xs font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          <Icon icon={isPositive ? "heroicons:arrow-trending-up" : "heroicons:arrow-trending-down"} className="mr-1" />
          <span>{isPositive ? '+' : ''}{percentChange}% vs previous period</span>
        </div>
      )}
    </Card>
    </div>
  );
};

// ─── Alert Card Component ─────────────────────────────────────────────
const AlertCard = ({ icon, iconColor, bgColor, borderColor, label, count, linkText, onClick }) => (
  <div className="h-full">
    <Card className="h-full" bodyClass="p-4 cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col justify-center" onClick={onClick}>
      <div className={`flex items-center justify-between border-l-4 ${borderColor} pl-4`}>
        <div className="flex items-center space-x-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${bgColor}`}>
            <Icon icon={icon} className={`text-lg ${iconColor}`} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{count}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</div>
          </div>
        </div>
        <div className="text-xs text-primary-500 font-medium hover:underline">{linkText} →</div>
      </div>
    </Card>
  </div>
);

// ─── Section Header ──────────────────────────────────────────────────
const SectionHeader = ({ title, linkText, onLinkClick }) => (
  <div className="flex items-center justify-between mb-0">
    <h6 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h6>
    {linkText && (
      <button onClick={onLinkClick} className="text-xs text-primary-500 hover:text-primary-600 font-medium hover:underline transition-colors">
        {linkText} →
      </button>
    )}
  </div>
);

// ─── Order Status Badge Colors ──────────────────────────────────────
const getStatusBadge = (status) => {
  const map = {
    'PENDING': 'bg-warning-500 text-white',
    'PENDING_PRESCRIPTION': 'bg-amber-500 text-white',
    'CONFIRMED': 'bg-blue-500 text-white',
    'PROCESSING': 'bg-indigo-500 text-white',
    'PACKED': 'bg-cyan-500 text-white',
    'DISPATCHED': 'bg-purple-500 text-white',
    'DELIVERED': 'bg-success-500 text-white',
    'CANCELLED': 'bg-slate-400 text-white',
    'REJECTED': 'bg-danger-500 text-white',
    'RETURN_REQUESTED': 'bg-orange-500 text-white',
    'RETURNED': 'bg-slate-500 text-white',
    'REFUND_PENDING': 'bg-pink-500 text-white',
    'REFUNDED': 'bg-teal-500 text-white',
  };
  return map[status] || 'bg-slate-400 text-white';
};

// ─── Donut Chart Colors ─────────────────────────────────────────────
const STATUS_COLORS = {
  'PENDING': '#F59E0B',
  'PENDING_PRESCRIPTION': '#D97706',
  'CONFIRMED': '#3B82F6',
  'PROCESSING': '#6366F1',
  'PACKED': '#06B6D4',
  'DISPATCHED': '#8B5CF6',
  'DELIVERED': '#10B981',
  'CANCELLED': '#94A3B8',
  'REJECTED': '#EF4444',
  'RETURN_REQUESTED': '#F97316',
  'RETURNED': '#64748B',
  'REFUND_PENDING': '#EC4899',
  'REFUNDED': '#14B8A6',
};

// ═══════════════════════════════════════════════════════════════════════
// ═ DASHBOARD MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const navigate = useNavigate();

  const [dateRange, setDateRange] = React.useState([]);
  const [dateFrom, dateTo] = dateRange;
  
  // Trend Chart Toggle State
  const [trendRange, setTrendRange] = React.useState(7);

  const { data: metricsResponse, isLoading, error, isFetching, refetch } = useGetDashboardMetricsQuery({
    dateFrom: dateFrom?.toISOString(),
    dateTo: dateTo?.toISOString()
  });

  const handleDateChange = (dates) => {
    if (dates.length === 2) setDateRange(dates);
  };

  if (isLoading) return <Loading />;
  if (error) return (
    <div className="space-y-5">
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
        <Icon icon="heroicons:exclamation-circle" className="mr-2 inline" />
        Error loading dashboard metrics. Please check your backend connection.
      </div>
    </div>
  );

  const m = metricsResponse?.data || {};

  // ─── Chart: Revenue Trend ─────────────────────────────────────────
  const trendLabels = m.dailyTrends?.map(d => dayjs(d._id).format("MMM DD")) || [];
  const revenueData = m.dailyTrends?.map(d => d.netSales) || [];
  const ordersData = m.dailyTrends?.map(d => d.totalOrders) || [];

  const revenueTrendOptions = {
    chart: { type: "area", toolbar: { show: false }, sparkline: { enabled: false } },
    colors: ["#4669FA", "#50C793"],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1, stops: [0, 90, 100] } },
    xaxis: { categories: trendLabels, labels: { style: { fontSize: '11px' } } },
    yaxis: [
      { title: { text: "Revenue (₹)", style: { fontSize: '11px' } }, labels: { formatter: (val) => `₹${val?.toFixed(0) || 0}` } },
      { opposite: true, title: { text: "Orders", style: { fontSize: '11px' } }, labels: { formatter: (val) => val?.toFixed(0) || 0 } }
    ],
    tooltip: { shared: true, intersect: false, y: { formatter: (val, { seriesIndex }) => seriesIndex === 0 ? `₹${val?.toFixed(2)}` : val } },
    grid: { borderColor: '#E2E8F0', strokeDashArray: 4 },
    noData: { text: "No trend data for selected range" }
  };

  const revenueTrendSeries = [
    { name: "Revenue", type: "area", data: revenueData },
    { name: "Orders", type: "line", data: ordersData }
  ];

  // ─── Chart: Order Status Donut ────────────────────────────────────
  const donutLabels = m.orderStatusBreakdown?.map(d => d._id?.replace(/_/g, ' ')) || [];
  const donutData = m.orderStatusBreakdown?.map(d => d.count) || [];
  const donutColors = m.orderStatusBreakdown?.map(d => STATUS_COLORS[d._id] || '#94A3B8') || [];

  const donutOptions = {
    labels: donutLabels,
    colors: donutColors,
    chart: { type: "donut" },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: '70%', labels: { show: true, total: { show: true, label: 'Total', formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0) } } } } },
    legend: { position: "bottom", fontSize: '11px' },
    noData: { text: "No orders in range" }
  };

  // ─── Attention Required Items ─────────────────────────────────────
  const attention = m.attentionRequired || {};
  const attentionItems = [
    { label: "Low Stock Items", count: attention.lowStock || 0, icon: "heroicons:exclamation-triangle", color: "text-amber-500", route: "/inventory/low-stock" },
    { label: "Expiring Soon", count: attention.expiringSoon || 0, icon: "heroicons:clock", color: "text-orange-500", route: "/inventory/expiry" },
    { label: "Pending Prescriptions", count: attention.pendingPrescriptions || 0, icon: "heroicons:document-text", color: "text-blue-500", route: "/prescriptions?status=PENDING" },
    { label: "Payment Issues", count: attention.paymentIssues || 0, icon: "heroicons:credit-card", color: "text-red-500", route: "/orders?status=PAYMENT_FAILED" },
    { label: "Medicine Requests", count: attention.medicineRequests || 0, icon: "heroicons:beaker", color: "text-purple-500", route: "/medicine-requests?status=PENDING" },
  ].filter(item => item.count > 0);

  // ─── Inventory Health ─────────────────────────────────────────────
  const inv = m.inventoryHealth || {};

  return (
    <div className="space-y-6">
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="font-bold text-2xl text-slate-900 dark:text-white">Dashboard</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Welcome back! Here's your business overview.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center h-10 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
            <div className="h-full flex items-center px-3 bg-slate-50 dark:bg-slate-700/50 border-r border-slate-200 dark:border-slate-700">
              <Icon icon="heroicons-outline:calendar" className="text-slate-500 dark:text-slate-400" />
            </div>
            <Flatpickr
              value={dateRange}
              options={{
                mode: "range",
                dateFormat: "d M, Y",
                maxDate: "today"
              }}
              onChange={handleDateChange}
              className="h-full bg-transparent border-none focus:ring-0 text-sm font-medium w-[220px] px-3 text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              placeholder="Select Date Range"
            />
            {dateRange && dateRange.length > 0 && (
              <button 
                onClick={() => {
                  setDateRange([]);
                  setTrendRange(null);
                }} 
                className="text-slate-400 hover:text-red-500 px-3 h-full flex items-center justify-center transition-colors border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50"
                title="Clear Filter (Show All Data)"
              >
                <Icon icon="heroicons-outline:x-mark" />
              </button>
            )}
          </div>
          <Button
            icon="heroicons-outline:arrow-path"
            text={isFetching ? "Refreshing..." : "Refresh"}
            className="btn-outline-primary h-10 px-4"
            onClick={refetch}
            disabled={isFetching}
          />
        </div>
      </div>

      {/* ── Quick Actions ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <PermissionGuard permission="inventory:manage">
          <button
            onClick={() => navigate('/catalog/products/new')}
            className="relative flex flex-col items-center justify-center p-5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(16,185,129,0.2)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-500/0 dark:from-emerald-500/10 dark:to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-900/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ring-1 ring-emerald-500/10 dark:ring-emerald-500/20">
              <Icon icon="heroicons:plus-circle" className="text-emerald-600 dark:text-emerald-400 text-2xl" />
            </div>
            <span className="relative text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Add Product</span>
          </button>
        </PermissionGuard>

        <PermissionGuard permission="purchases:manage">
          <button
            onClick={() => navigate('/purchases/new')}
            className="relative flex flex-col items-center justify-center p-5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(59,130,246,0.2)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-500/0 dark:from-blue-500/10 dark:to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative h-12 w-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ring-1 ring-blue-500/10 dark:ring-blue-500/20">
              <Icon icon="heroicons:clipboard-document-list" className="text-blue-600 dark:text-blue-400 text-2xl" />
            </div>
            <span className="relative text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Create Purchase</span>
          </button>
        </PermissionGuard>

        <PermissionGuard permission="inventory:manage">
          <button
            onClick={() => navigate('/purchases/receive')}
            className="relative flex flex-col items-center justify-center p-5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(99,102,241,0.2)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-indigo-500/0 dark:from-indigo-500/10 dark:to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-900/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 ring-1 ring-indigo-500/10 dark:ring-indigo-500/20">
              <Icon icon="heroicons:truck" className="text-indigo-600 dark:text-indigo-400 text-2xl" />
            </div>
            <span className="relative text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Receive Stock</span>
          </button>
        </PermissionGuard>

        <PermissionGuard permission="prescriptions:approve">
          <button
            onClick={() => navigate('/prescriptions?status=PENDING')}
            className="relative flex flex-col items-center justify-center p-5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(245,158,11,0.2)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-amber-500/0 dark:from-amber-500/10 dark:to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative h-12 w-12 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ring-1 ring-amber-500/10 dark:ring-amber-500/20">
              <Icon icon="heroicons:document-magnifying-glass" className="text-amber-600 dark:text-amber-400 text-2xl" />
            </div>
            <span className="relative text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Review Rx</span>
          </button>
        </PermissionGuard>

        <PermissionGuard permission="inventory:read">
          <button
            onClick={() => navigate('/inventory/low-stock')}
            className="relative flex flex-col items-center justify-center p-5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-600 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(239,68,68,0.2)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-500/0 dark:from-red-500/10 dark:to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative h-12 w-12 rounded-lg bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-900/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 ring-1 ring-red-500/10 dark:ring-red-500/20">
              <Icon icon="heroicons:exclamation-triangle" className="text-red-600 dark:text-red-400 text-2xl" />
            </div>
            <span className="relative text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Low Stock</span>
          </button>
        </PermissionGuard>

        <PermissionGuard permission="reports:read">
          <button
            onClick={() => navigate('/reports')}
            className="relative flex flex-col items-center justify-center p-5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(20,184,166,0.2)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-teal-500/0 dark:from-teal-500/10 dark:to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative h-12 w-12 rounded-lg bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/40 dark:to-teal-900/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ring-1 ring-teal-500/10 dark:ring-teal-500/20">
              <Icon icon="heroicons:document-chart-bar" className="text-teal-600 dark:text-teal-400 text-2xl" />
            </div>
            <span className="relative text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Reports</span>
          </button>
        </PermissionGuard>
      </div>

      {/* ── Row 1: Primary KPI Cards ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="heroicons:banknotes"
          iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600"
          label="Net Revenue"
          value={m.netSales?.toFixed(2) || "0.00"}
          prefix="₹"
          percentChange={m.revenueSummary?.percentChange}
          onClick={() => navigate('/analytics')}
        />
        <StatCard
          icon="heroicons:shopping-bag"
          iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
          label="Total Orders"
          value={m.totalOrders || 0}
          percentChange={m.ordersSummary?.percentChange}
          onClick={() => navigate('/orders')}
        />
        <StatCard
          icon="heroicons:users"
          iconBg="bg-gradient-to-br from-indigo-500 to-indigo-600"
          label="Total Customers"
          value={m.totalCustomers || 0}
          percentChange={m.customersSummary?.percentChange}
          onClick={() => navigate('/customers')}
        />
        <StatCard
          icon="heroicons:shopping-cart"
          iconBg="bg-gradient-to-br from-purple-500 to-purple-600"
          label="Open Orders"
          value={m.openOrders || 0}
          onClick={() => navigate('/orders?status=PENDING,CONFIRMED,PROCESSING,PACKED,DISPATCHED')}
        />
      </div>

      {/* ── Row 2: Alert Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AlertCard
          icon="heroicons:exclamation-triangle"
          iconColor="text-amber-600"
          bgColor="bg-amber-50 dark:bg-amber-900/20"
          borderColor="border-amber-500"
          label="Low Stock Items"
          count={inv.lowStockCount || 0}
          linkText="View Stock"
          onClick={() => navigate('/inventory')}
        />
        <AlertCard
          icon="heroicons:clock"
          iconColor="text-orange-600"
          bgColor="bg-orange-50 dark:bg-orange-900/20"
          borderColor="border-orange-500"
          label="Expiring Soon"
          count={m.expiringSoonCount || 0}
          linkText="View Expiry"
          onClick={() => navigate('/inventory')}
        />
        <AlertCard
          icon="heroicons:document-text"
          iconColor="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
          borderColor="border-blue-500"
          label="Pending Prescriptions"
          count={m.pendingPrescriptions || 0}
          linkText="Review"
          onClick={() => navigate('/prescriptions')}
        />
      </div>

      {/* ── Row 3: Charts ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-0">
                <h6 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Revenue Trend</h6>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded p-0.5">
                    {[7, 30, 90].map(days => (
                      <button
                        key={days}
                        onClick={() => {
                          setTrendRange(days);
                          setDateRange([dayjs().subtract(days, "day").toDate(), dayjs().toDate()]);
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded ${trendRange === days ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        {days}D
                      </button>
                    ))}
                  </div>
                  <button onClick={() => navigate('/analytics')} className="text-xs text-primary-500 hover:text-primary-600 font-medium hover:underline transition-colors ml-2">
                    View All →
                  </button>
                </div>
              </div>
              <div className="mt-4">
                {revenueData.length > 0 ? (
                  <Chart options={revenueTrendOptions} series={revenueTrendSeries} type="area" height={320} />
                ) : (
                  <div className="h-[320px] flex items-center justify-center text-slate-400 dark:text-slate-500">
                    <div className="text-center">
                      <Icon icon="heroicons:chart-bar" className="text-4xl mb-2 mx-auto block" />
                      <p>No revenue data available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <div className="p-4">
              <SectionHeader title="Order Status" linkText="View Orders" onLinkClick={() => navigate('/orders')} />
              <div className="mt-4 flex justify-center">
                {donutData.length > 0 ? (
                  <Chart options={donutOptions} series={donutData} type="donut" height={320} />
                ) : (
                  <div className="h-[320px] flex items-center justify-center text-slate-400 dark:text-slate-500">
                    <div className="text-center">
                      <Icon icon="heroicons:chart-pie" className="text-4xl mb-2 mx-auto block" />
                      <p>No orders in selected range</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Row 4: Recent Orders + Top Products ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <div className="p-4">
            <SectionHeader title="Recent Orders" linkText="View All" onLinkClick={() => navigate('/orders')} />
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="table-th text-left py-2.5 px-3 text-xs">Order #</th>
                    <th className="table-th text-left py-2.5 px-3 text-xs">Customer</th>
                    <th className="table-th text-right py-2.5 px-3 text-xs">Amount</th>
                    <th className="table-th text-left py-2.5 px-3 text-xs">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {m.recentOrders?.length > 0 ? m.recentOrders.map(order => (
                    <tr key={order._id} onClick={() => navigate(`/orders/${order._id}`)} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 text-sm font-medium text-primary-500">{order.orderNumber}</td>
                      <td className="py-2.5 px-3 text-sm text-slate-600 dark:text-slate-300">{order.customer?.firstName || 'N/A'}</td>
                      <td className="py-2.5 px-3 text-sm text-right font-medium text-slate-900 dark:text-white">₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3"><Badge label={order.orderStatus?.replace(/_/g, ' ')} className={getStatusBadge(order.orderStatus)} /></td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" className="text-center py-8 text-slate-400">No recent orders</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Top Products */}
        <Card>
          <div className="p-4">
            <SectionHeader title="Top Products" linkText="View Analytics" onLinkClick={() => navigate('/analytics')} />
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="table-th text-left py-2.5 px-3 text-xs">#</th>
                    <th className="table-th text-left py-2.5 px-3 text-xs">Product</th>
                    <th className="table-th text-right py-2.5 px-3 text-xs">Sold</th>
                    <th className="table-th text-right py-2.5 px-3 text-xs">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {m.topProducts?.length > 0 ? m.topProducts.map((product, idx) => {
                    const maxQty = m.topProducts[0]?.totalQuantitySold || 1;
                    const barWidth = (product.totalQuantitySold / maxQty) * 100;
                    return (
                      <tr key={product._id} onClick={() => navigate(`/catalog/products/${product._id}`)} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-xs font-bold">{idx + 1}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{product.name}</div>
                          <div className="text-xs text-slate-400">{product.sku}</div>
                          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1 mt-1.5">
                            <div className="bg-primary-500 h-1 rounded-full transition-all" style={{ width: `${barWidth}%` }}></div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-sm text-right font-medium text-slate-900 dark:text-white">{product.totalQuantitySold}</td>
                        <td className="py-2.5 px-3 text-sm text-right text-slate-600 dark:text-slate-300">₹{product.grossRevenue?.toFixed(2)}</td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="4" className="text-center py-8 text-slate-400">No product sales data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Row 5: Recent Customers + Medicine Demand ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Customers */}
        <Card>
          <div className="p-4">
            <SectionHeader title="Recent Customers" linkText="View All" onLinkClick={() => navigate('/customers')} />
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="table-th text-left py-2.5 px-3 text-xs">Name</th>
                    <th className="table-th text-left py-2.5 px-3 text-xs">Mobile</th>
                    <th className="table-th text-left py-2.5 px-3 text-xs">Joined</th>
                    <th className="table-th text-left py-2.5 px-3 text-xs">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {m.recentCustomers?.length > 0 ? m.recentCustomers.map(cust => (
                    <tr key={cust._id} onClick={() => navigate(`/customers/${cust._id}`)} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 text-sm font-medium text-slate-900 dark:text-white">{cust.firstName} {cust.lastName}</td>
                      <td className="py-2.5 px-3 text-sm text-slate-500">{cust.mobileNumber}</td>
                      <td className="py-2.5 px-3 text-sm text-slate-500">{dayjs(cust.createdAt).format('MMM DD, YYYY')}</td>
                      <td className="py-2.5 px-3">
                        <Badge label={cust.status === 'active' ? 'Active' : 'Suspended'} className={cust.status === 'active' ? 'bg-success-500 text-white' : 'bg-danger-500 text-white'} />
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" className="text-center py-8 text-slate-400">No customers registered yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Medicine Demand */}
        <Card>
          <div className="p-4">
            <SectionHeader title="Medicine Demand" linkText="View All" onLinkClick={() => navigate('/medicine-requests')} />
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="table-th text-left py-2.5 px-3 text-xs">Medicine</th>
                    <th className="table-th text-center py-2.5 px-3 text-xs">Requests</th>
                    <th className="table-th text-left py-2.5 px-3 text-xs">Last Requested</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {m.topMedicineRequests?.length > 0 ? m.topMedicineRequests.map(req => (
                    <tr key={req._id} onClick={() => navigate(`/medicine-requests/${req._id}`)} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 text-sm font-medium text-slate-900 dark:text-white capitalize">{req.normalizedRequest}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold px-2">
                          {req.requestCount}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-sm text-slate-500">{dayjs(req.lastRequestedAt).format('MMM DD, YYYY')}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" className="text-center py-8 text-slate-400">No pending medicine requests</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Row 6: Inventory Health + Attention Required ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Health */}
        <Card>
          <div className="p-4">
            <SectionHeader title="Inventory Health" linkText="View Inventory" onLinkClick={() => navigate('/inventory')} />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{inv.totalProducts || 0}</div>
                <div className="text-xs text-slate-500 mt-1">Published Products</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{inv.outOfStockCount || 0}</div>
                <div className="text-xs text-slate-500 mt-1">Out of Stock</div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Inventory Cost Value</div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{(inv.inventoryCostValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Based on purchase cost per batch</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Potential Retail Value</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">₹{(inv.potentialRetailValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Based on product selling price</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Attention Required */}
        <Card>
          <div className="p-4">
            <SectionHeader title="🔴 Attention Required" />
            {attentionItems.length > 0 ? (
              <div className="mt-4 space-y-3">
                {attentionItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    onClick={() => navigate(item.route)}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon icon={item.icon} className={`text-lg ${item.color}`} />
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2">
                        {item.count}
                      </span>
                      <Icon icon="heroicons:chevron-right" className="text-slate-400 text-sm" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center py-8 text-slate-400">
                <Icon icon="heroicons:check-badge" className="text-4xl text-emerald-400 mb-2" />
                <p className="text-sm font-medium text-emerald-500">All clear! No issues require attention.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
};

export default Dashboard;
