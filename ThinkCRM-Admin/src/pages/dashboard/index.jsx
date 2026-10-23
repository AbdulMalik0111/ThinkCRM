import React, { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import { Link, useNavigate } from "react-router-dom";
import Chart from "react-apexcharts";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import { useSelector } from "react-redux";
import { useGetDashboardMetricsQuery } from "@/store/api/analytics/analyticsApiSlice";
import { useGetReportsQuery } from "@/store/api/management/managementApiSlice";
import { useGetLeadsQuery } from "@/store/api/leads/leadsApiSlice";
import { useGetAllFollowUpsQuery } from "@/store/api/leads/followupApiSlice";

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

// Executive B2B KPI Card with colored left accent border & enlarged legible typography
const ExecutiveKpiCard = ({
  title,
  value,
  trend,
  isPositive,
  accentBorderClass,
  onClick,
  isLoading,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-[5px] ${accentBorderClass} rounded-lg p-5 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer flex flex-col justify-between`}
    >
      {/* Top row: Title (13px) and Trend Tag */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
          {title}
        </span>

        {isLoading ? (
          <span className="h-5 w-12 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ) : trend ? (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
              isPositive
                ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400"
            }`}
          >
            <Icon
              icon={isPositive ? "heroicons:arrow-up-right" : "heroicons:arrow-down-right"}
              className="text-sm"
            />
            <span>{trend}</span>
          </span>
        ) : null}
      </div>

      {/* Bottom row: Value and Subtle Arrow */}
      <div className="mt-4 flex items-baseline justify-between">
        {isLoading ? (
          <div className="h-8 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        ) : (
          <span className="text-3xl lg:text-[30px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
        )}
        <Icon
          icon="heroicons:chevron-right"
          className="text-slate-300 dark:text-slate-600 text-base group-hover:text-slate-500 transition-colors"
        />
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isOwnerOrAdmin = user && (user.role === "Owner" || user.role === "Admin");

  // Date range filter state
  const [dateRange, setDateRange] = useState("Date Range");
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  const getRangeParam = (label) => {
    switch (label) {
      case "Today":
        return "today";
      case "Last 7 Days":
        return "last_7_days";
      case "This Month":
        return "this_month";
      case "This Quarter":
        return "this_quarter";
      case "This Year":
        return "this_year";
      default:
        return undefined;
    }
  };

  const rangeParam = getRangeParam(dateRange);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = dayjs().hour();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : user?.name || "Think Admin";

  // Backend API Queries with immediate refetch on mount or arg change
  const { data: metricsResponse, isLoading: isMetricsLoading } = useGetDashboardMetricsQuery(
    rangeParam ? { range: rangeParam } : undefined,
    {
      refetchOnMountOrArgChange: true,
    }
  );
  const { data: leadsReport, isLoading: isReportLoading } = useGetReportsQuery(
    rangeParam ? { type: "leads", params: { range: rangeParam } } : "leads",
    {
      refetchOnMountOrArgChange: true,
    }
  );
  const { data: leadsResponse, isLoading: isLeadsLoading } = useGetLeadsQuery(
    { limit: 6 },
    { refetchOnMountOrArgChange: true }
  );
  const { data: followUpsResponse, isLoading: isFollowUpsLoading } = useGetAllFollowUpsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const m = metricsResponse?.data || {};
  const trends = m.trends || {};

  // Extract Leads by Source for Pie/Donut Chart (Real database data only)
  const rawSources = leadsReport?.data?.leadsBySource || [];
  const sourcePalette = ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#64748B", "#06B6D4", "#6366F1"];

  const sourceData = rawSources.map((item, idx) => ({
    name: item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1).replace(/_/g, " ") : "Direct",
    count: item.count || 0,
    color: sourcePalette[idx % sourcePalette.length],
  }));

  const totalSourceCount = sourceData.reduce((acc, curr) => acc + curr.count, 0);
  const sourceChartSeries = sourceData.map((s) => s.count);
  const sourceChartLabels = sourceData.map((s) => s.name);
  const sourceChartColors = sourceData.map((s) => s.color);

  const donutOptions = {
    chart: {
      type: "donut",
      fontFamily: "Inter, sans-serif",
      toolbar: { show: false },
      sparkline: { enabled: false },
    },
    colors: sourceChartColors,
    labels: sourceChartLabels,
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: ["#ffffff"] },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "14px",
              fontWeight: 600,
              color: "#475569",
            },
            value: {
              show: true,
              fontSize: "22px",
              fontWeight: 700,
              color: "#0F172A",
              formatter: (val) => `${Math.round((val / totalSourceCount) * 100)}%`,
            },
            total: {
              show: true,
              label: "Total Leads",
              fontSize: "12px",
              fontWeight: 600,
              color: "#64748B",
              formatter: () => `${totalSourceCount}`,
            },
          },
        },
      },
    },
    legend: { show: false },
    tooltip: {
      theme: "light",
      y: {
        formatter: (val) => `${val} leads (${Math.round((val / totalSourceCount) * 100)}%)`,
      },
    },
  };

  // Leads by Status for Bar Chart (Real database data only)
  const rawStatuses = leadsReport?.data?.leadsByStatus || [];
  const statusPalette = ["#38BDF8", "#06B6D4", "#10B981", "#3B82F6", "#F59E0B", "#F97316", "#22C55E", "#EF4444"];
  const statusCategories = rawStatuses.map((s) =>
    s._id ? s._id.charAt(0).toUpperCase() + s._id.slice(1).replace(/_/g, " ") : "Other"
  );
  const statusCounts = rawStatuses.map((s) => s.count || 0);
  const statusColors = statusPalette.slice(0, rawStatuses.length);
  const totalStatusCount = statusCounts.reduce((acc, curr) => acc + curr, 0);

  const statusBarOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "Inter, sans-serif",
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "40%",
        distributed: true,
        dataLabels: { position: "top" },
      },
    },
    colors: statusColors,
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
      categories: statusCategories,
      labels: {
        style: {
          colors: "#475569",
          fontSize: "12px",
          fontWeight: 600,
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      forceNiceScale: true,
      min: 0,
      labels: {
        style: {
          colors: "#64748B",
          fontSize: "13px",
          fontWeight: 500,
        },
      },
    },
    grid: {
      borderColor: "#F1F5F9",
      strokeDashArray: 3,
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    tooltip: {
      theme: "light",
      y: {
        formatter: (val) => `${val} leads`,
      },
    },
  };

  const statusBarSeries = [{ name: "Leads", data: statusCounts }];

  // Recent Leads Data (Pure database records, no demo dummy leads)
  const recentLeadsList = leadsResponse?.data?.leads?.slice(0, 5) || [];

  // Upcoming Follow-ups Data (Pure database records, no demo dummy follow-ups)
  const dbFollowUps = followUpsResponse?.data?.followUps || [];
  const upcomingFollowUpsList = dbFollowUps.slice(0, 5).map((fu) => {
    const date = dayjs(fu.scheduledAt);
    let formattedDate = date.format("MMM D, h:mm A");
    if (date.isToday()) formattedDate = `Today, ${date.format("h:mm A")}`;
    else if (date.isTomorrow()) formattedDate = `Tomorrow, ${date.format("h:mm A")}`;
    return {
      _id: fu._id,
      title: `${fu.type ? fu.type.charAt(0).toUpperCase() + fu.type.slice(1).replace(/_/g, " ") : "Follow up"} with ${fu.leadId?.fullName || "Lead"}`,
      scheduledFormatted: formattedDate,
      type: fu.type || "call",
      leadId: fu.leadId,
    };
  });

  // Status Badge Styling Helper with clean visible colors & dot indicators
  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase().replace("_", " ");
    switch (s) {
      case "new":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            New
          </span>
        );
      case "follow up":
      case "follow_up":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Follow Up
          </span>
        );
      case "contacted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            Contacted
          </span>
        );
      case "attempted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            Attempted
          </span>
        );
      case "quotation":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
            Quotation
          </span>
        );
      case "won":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Won
          </span>
        );
      case "lost":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Lost
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 capitalize">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            {s}
          </span>
        );
    }
  };

  // Helper for lead initials
  const getLeadInitials = (name) => {
    if (!name) return "L";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Helper for follow-up styling and icons (Rich, distinct, clearly visible)
  const getFollowUpTypeConfig = (type, title = "") => {
    const t = (type || "").toLowerCase();
    const titleLower = (title || "").toLowerCase();

    if (t === "contract" || titleLower.includes("contract")) {
      return {
        icon: "heroicons:document-text",
        colorClass: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
      };
    }
    if (t === "follow_up" || t === "followup" || titleLower.includes("follow up") || titleLower.includes("followup")) {
      return {
        icon: "heroicons:arrow-path",
        colorClass: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
      };
    }
    if (t === "site_visit" || titleLower.includes("site visit") || titleLower.includes("visit")) {
      return {
        icon: "heroicons:map-pin",
        colorClass: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      };
    }
    if (t === "meeting" || titleLower.includes("meeting")) {
      return {
        icon: "heroicons:calendar",
        colorClass: "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
      };
    }
    if (t === "call" || titleLower.includes("call")) {
      return {
        icon: "heroicons:phone",
        colorClass: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      };
    }
    return {
      icon: "heroicons:clock",
      colorClass: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    };
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-8">
      {/* 1. TOP HEADER BANNER (Large, Prominent Typography, Exact Button Pair from User Reference) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left Greeting & Subtext */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded text-sm font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Live CRM System Active</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {getGreeting()}, <span className="text-blue-600 dark:text-blue-400">{displayName}</span> 👋
            </h1>

            {/* Shortened subtitle paragraph */}
            <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400">
              Real-time pipeline summary and priority follow-ups.
            </p>
          </div>

          {/* Right: Date Filter & Action Button (Exact Pair from User Reference) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Dropdown Button (Exact Style from Attached Reference) */}
            <div className="relative">
              <button
                onClick={() => setShowDateDropdown(!showDateDropdown)}
                className="inline-flex items-center gap-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Icon icon="heroicons:calendar" className="text-slate-500 text-base" />
                <span>{dateRange}</span>
                <Icon icon="heroicons:chevron-down" className="text-slate-500 text-sm ml-0.5" />
              </button>

              {showDateDropdown && (
                <div className="absolute right-0 mt-2 w-60 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-1.5 z-50 text-sm">
                  {[
                    "Date Range",
                    "Today",
                    "Last 7 Days",
                    "This Month",
                    "This Quarter",
                    "This Year",
                    "All Time",
                  ].map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setDateRange(range);
                        setShowDateDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                        dateRange === range ? "text-blue-600 font-bold bg-blue-50/60 dark:bg-blue-900/20" : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* + Create Lead Dark Button (Exact Style from Attached Reference) */}
            <button
              onClick={() => navigate("/leads/new")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm text-white bg-[#1e293b] hover:bg-[#0f172a] active:bg-black transition-colors"
            >
              <Icon icon="heroicons:plus" className="text-xs" />
              <span>Create Lead</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TOP 8 KPI METRIC CARDS (Real figures with skeleton loading, no fake fallback glitch) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Leads */}
        <ExecutiveKpiCard
          title="Total Leads"
          value={m.totalLeads ?? 0}
          trend={trends.totalLeads?.value}
          isPositive={trends.totalLeads?.isPositive}
          isLoading={isMetricsLoading}
          accentBorderClass="border-l-blue-500"
          onClick={() => navigate("/leads")}
        />

        {/* Card 2: New Leads */}
        <ExecutiveKpiCard
          title="New Leads"
          value={m.newLeads ?? 0}
          trend={trends.newLeads?.value}
          isPositive={trends.newLeads?.isPositive}
          isLoading={isMetricsLoading}
          accentBorderClass="border-l-sky-500"
          onClick={() => navigate("/leads?status=new")}
        />

        {/* Card 3: Follow-ups Today */}
        <ExecutiveKpiCard
          title="Follow-ups Today"
          value={m.todaysFollowUps ?? 0}
          isLoading={isMetricsLoading}
          accentBorderClass="border-l-amber-500"
          onClick={() => navigate("/leads/follow-ups")}
        />

        {/* Card 4: Quotations */}
        <ExecutiveKpiCard
          title="Quotations"
          value={(m.pendingQuotations ?? 0) + (m.sentQuotations ?? 0)}
          isLoading={isMetricsLoading}
          accentBorderClass="border-l-purple-500"
          onClick={() => navigate("/leads")}
        />

        {/* Card 5: Won Deals */}
        <ExecutiveKpiCard
          title="Won Deals"
          value={m.wonLeads ?? 0}
          trend={trends.wonLeads?.value}
          isPositive={trends.wonLeads?.isPositive}
          isLoading={isMetricsLoading}
          accentBorderClass="border-l-emerald-500"
          onClick={() => navigate("/leads?status=won")}
        />

        {/* Card 6: Lost */}
        <ExecutiveKpiCard
          title="Lost"
          value={m.lostLeads ?? 0}
          trend={trends.lostLeads?.value}
          isPositive={trends.lostLeads?.isPositive}
          isLoading={isMetricsLoading}
          accentBorderClass="border-l-rose-500"
          onClick={() => navigate("/leads?status=lost")}
        />

        {/* Card 7: Conversion Rate */}
        <ExecutiveKpiCard
          title="Conversion Rate"
          value={m.conversionRate ? `${m.conversionRate}%` : "0%"}
          trend={trends.conversionRate?.value}
          isPositive={trends.conversionRate?.isPositive}
          isLoading={isMetricsLoading}
          accentBorderClass="border-l-teal-500"
          onClick={() => navigate("/reports")}
        />

        {/* Card 8: Active Customers */}
        <ExecutiveKpiCard
          title="Active Customers"
          value={m.activeCustomers ?? 0}
          isLoading={isMetricsLoading}
          accentBorderClass="border-l-indigo-500"
          onClick={() => navigate("/customers")}
        />
      </div>

      {/* 3. CHARTS SECTION (Noticeable Typography: Subtitles > 14px, Bold Counts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Chart: Lead Acquisition Channels */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                Lead Acquisition Channels
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                Source volume and conversion share
              </p>
            </div>
            <span className="text-sm font-semibold px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {totalSourceCount} Total
            </span>
          </div>

          {isReportLoading ? (
            <div className="flex items-center justify-center h-[240px]">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </div>
          ) : sourceData.length === 0 || totalSourceCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-[240px] text-slate-400">
              <Icon icon="heroicons-outline:chart-pie" className="text-4xl mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No lead source data yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Acquisition sources will appear as leads are added.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-6 my-auto">
              {/* Donut Chart */}
              <div className="sm:col-span-6 flex justify-center items-center h-[240px]">
                <Chart
                  options={donutOptions}
                  series={sourceChartSeries}
                  type="donut"
                  width="100%"
                  height="100%"
                />
              </div>

              {/* Structured Data Rows (14px & 15px Font) */}
              <div className="sm:col-span-6 divide-y divide-slate-100 dark:divide-slate-800">
                {sourceData.map((item, idx) => {
                  const percentage = totalSourceCount > 0 ? Math.round((item.count / totalSourceCount) * 100) : 0;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2.5 text-sm hover:bg-slate-50/80 dark:hover:bg-slate-800/40 px-1 rounded transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-xs shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-500 font-medium font-mono">{item.count}</span>
                        <span className="font-bold text-slate-900 dark:text-white w-12 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Chart: Pipeline Stage Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                Pipeline Stage Distribution
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                Leads progressing across sales pipeline
              </p>
            </div>
            <Link
              to="/leads/pipeline"
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
            >
              <span>Pipeline Board</span>
              <Icon icon="heroicons:arrow-right" className="text-sm" />
            </Link>
          </div>

          {isReportLoading ? (
            <div className="flex items-center justify-center h-[250px]">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </div>
          ) : rawStatuses.length === 0 || totalStatusCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-[250px] text-slate-400">
              <Icon icon="heroicons-outline:chart-bar" className="text-4xl mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No pipeline stages recorded yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Stage distribution will appear as leads advance.</p>
            </div>
          ) : (
            <div className="h-[250px] w-full">
              <Chart
                options={statusBarOptions}
                series={statusBarSeries}
                type="bar"
                width="100%"
                height="100%"
              />
            </div>
          )}
        </div>
      </div>

      {/* 4. BOTTOM OPERATIONAL TABLES (Professional Executive B2B Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Recent Leads */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80 mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Recent Leads
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Latest {recentLeadsList.length}
              </span>
            </div>
            <Link
              to="/leads"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1 transition-colors"
            >
              <span>View All Leads</span>
              <Icon icon="heroicons:arrow-right" className="text-xs" />
            </Link>
          </div>

          {isLeadsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </div>
          ) : recentLeadsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Icon icon="heroicons-outline:inbox" className="text-4xl mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {!isOwnerOrAdmin ? "No leads assigned to you yet" : "No recent leads found"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {!isOwnerOrAdmin
                  ? "When an administrator assigns leads to you or you create one, they will appear here."
                  : "Leads will appear here as they are added."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Budget</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                  {recentLeadsList.map((lead) => (
                    <tr
                      key={lead._id}
                      onClick={() => navigate(`/leads/${lead._id}`)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-slate-200 shrink-0 group-hover:border-blue-400 dark:group-hover:border-blue-600 transition-colors">
                            {getLeadInitials(lead.fullName)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                              {lead.fullName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {lead.phone || lead.email || "No contact"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {getStatusBadge(lead.status)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 text-sm whitespace-nowrap">
                        {lead.budget ? `₹${Number(lead.budget).toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/leads/${lead._id}`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded transition-colors"
                        >
                          <span>View</span>
                          <Icon icon="heroicons:chevron-right" className="text-xs text-slate-400 group-hover:text-blue-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Overdue & Upcoming Follow-ups */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80 mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Overdue / Upcoming Follow-ups
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Active
              </span>
            </div>
            <Link
              to="/leads/follow-ups"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <Icon icon="heroicons:arrow-right" className="text-xs" />
            </Link>
          </div>

          {isFollowUpsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </div>
          ) : upcomingFollowUpsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Icon icon="heroicons-outline:calendar-days" className="text-4xl mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {!isOwnerOrAdmin ? "No tasks assigned to you" : "No upcoming follow-ups"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {!isOwnerOrAdmin
                  ? "When follow-up tasks are assigned to you or scheduled, they will appear here."
                  : "Upcoming tasks and meetings will appear here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {upcomingFollowUpsList.map((fu) => {
                const typeCfg = getFollowUpTypeConfig(fu.type, fu.title);
                return (
                  <div
                    key={fu._id}
                    onClick={() => {
                      if (fu.leadId?._id) navigate(`/leads/${fu.leadId._id}`);
                      else navigate("/leads/follow-ups");
                    }}
                    className="py-3 px-2 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${typeCfg.colorClass}`}>
                        <Icon icon={typeCfg.icon} className="text-lg" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {fu.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <Icon icon="heroicons:clock" className="text-xs text-slate-400 shrink-0" />
                          <span className="truncate">{fu.scheduledFormatted}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (fu.leadId?._id) navigate(`/leads/${fu.leadId._id}`);
                          else navigate("/leads/follow-ups");
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded transition-colors"
                      >
                        <span>Open Lead</span>
                        <Icon icon="heroicons:chevron-right" className="text-xs text-slate-400 group-hover:text-blue-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
