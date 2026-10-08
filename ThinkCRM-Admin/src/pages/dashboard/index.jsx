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
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-[5px] ${accentBorderClass} rounded-lg p-5 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer flex flex-col justify-between`}
    >
      {/* Top row: Title (13px) and Trend Tag */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>

        {trend && (
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
        )}
      </div>

      {/* Bottom row: Value and Subtle Arrow */}
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-3xl lg:text-[30px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
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

  // Date range filter state
  const [dateRange, setDateRange] = useState("Date Range");
  const [showDateDropdown, setShowDateDropdown] = useState(false);

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

  // Backend API Queries
  const { data: metricsResponse } = useGetDashboardMetricsQuery();
  const { data: leadsReport } = useGetReportsQuery("leads");
  const { data: leadsResponse } = useGetLeadsQuery({ limit: 6 });
  const { data: followUpsResponse } = useGetAllFollowUpsQuery();

  const m = metricsResponse?.data || {};

  // Extract or Fallback Leads by Source for Pie/Donut Chart
  const rawSources = leadsReport?.data?.leadsBySource || [];
  const defaultSources = [
    { name: "Website", count: 35, color: "#3B82F6" },
    { name: "Facebook", count: 22, color: "#8B5CF6" },
    { name: "Instagram", count: 15, color: "#EC4899" },
    { name: "Referral", count: 12, color: "#F59E0B" },
    { name: "Google Ads", count: 10, color: "#10B981" },
    { name: "Others", count: 6, color: "#64748B" },
  ];

  const sourceData = rawSources.length > 0
    ? rawSources.map((item, idx) => ({
        name: (item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : "Direct"),
        count: item.count,
        color: defaultSources[idx % defaultSources.length].color,
      }))
    : defaultSources;

  const totalSourceCount = sourceData.reduce((acc, curr) => acc + curr.count, 0) || 1;
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

  // Leads by Status for Bar Chart
  const defaultStatusData = [
    { label: "New", count: 52, color: "#38BDF8" },
    { label: "Contacted", count: 38, color: "#06B6D4" },
    { label: "Qualified", count: 62, color: "#10B981" },
    { label: "Measurement", count: 44, color: "#3B82F6" },
    { label: "Quotation", count: 24, color: "#F59E0B" },
    { label: "Negotiation", count: 39, color: "#F97316" },
    { label: "Won", count: 82, color: "#22C55E" },
    { label: "Lost", count: 26, color: "#EF4444" },
  ];

  const rawStatuses = leadsReport?.data?.leadsByStatus || [];
  let statusCategories = defaultStatusData.map((d) => d.label);
  let statusCounts = defaultStatusData.map((d) => d.count);
  let statusColors = defaultStatusData.map((d) => d.color);

  if (rawStatuses.length > 0) {
    statusCategories = rawStatuses.map((s) => (s._id ? s._id.charAt(0).toUpperCase() + s._id.slice(1) : "Other"));
    statusCounts = rawStatuses.map((s) => s.count);
    statusColors = defaultStatusData.slice(0, rawStatuses.length).map((d) => d.color);
  }

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
      max: Math.max(...statusCounts, 100),
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

  // Recent Leads Data
  const dbRecentLeads = leadsResponse?.data?.leads || [];
  const fallbackRecentLeads = [
    {
      _id: "demo-1",
      fullName: "Rahul Sharma",
      phone: "+91 9876543210",
      email: "rahul@example.com",
      status: "new",
      budget: 450000,
      createdAt: new Date().toISOString(),
    },
    {
      _id: "demo-2",
      fullName: "Priya Patel",
      phone: "+91 9811223344",
      email: "priya@example.com",
      status: "follow_up",
      budget: 680000,
      createdAt: new Date().toISOString(),
    },
    {
      _id: "demo-3",
      fullName: "Amit Singh",
      phone: "+91 9755443322",
      email: "amit@example.com",
      status: "quotation",
      budget: 320000,
      createdAt: new Date().toISOString(),
    },
    {
      _id: "demo-4",
      fullName: "Sneha Reddy",
      phone: "+91 9644332211",
      email: "sneha@example.com",
      status: "won",
      budget: 850000,
      createdAt: new Date().toISOString(),
    },
  ];

  const recentLeadsList = dbRecentLeads.length > 0 ? dbRecentLeads.slice(0, 5) : fallbackRecentLeads;

  // Upcoming Follow-ups Data
  const dbFollowUps = followUpsResponse?.data?.followUps || [];
  const fallbackFollowUps = [
    {
      _id: "fu-1",
      title: "Call with Rahul Sharma",
      scheduledFormatted: "Today, 10:00 AM",
      type: "call",
      leadId: { _id: "demo-1", fullName: "Rahul Sharma" },
    },
    {
      _id: "fu-2",
      title: "Site visit - Priya Patel",
      scheduledFormatted: "Today, 02:00 PM",
      type: "site_visit",
      leadId: { _id: "demo-2", fullName: "Priya Patel" },
    },
    {
      _id: "fu-3",
      title: "Follow up with Amit Singh",
      scheduledFormatted: "Tomorrow, 11:00 AM",
      type: "follow_up",
      leadId: { _id: "demo-3", fullName: "Amit Singh" },
    },
    {
      _id: "fu-4",
      title: "Contract review with Sneha Reddy",
      scheduledFormatted: "Tomorrow, 04:30 PM",
      type: "contract",
      leadId: { _id: "demo-4", fullName: "Sneha Reddy" },
    },
  ];

  const upcomingFollowUpsList = dbFollowUps.length > 0
    ? dbFollowUps.slice(0, 5).map((fu) => {
        const date = dayjs(fu.scheduledAt);
        let formattedDate = date.format("MMM D, h:mm A");
        if (date.isToday()) formattedDate = `Today, ${date.format("h:mm A")}`;
        else if (date.isTomorrow()) formattedDate = `Tomorrow, ${date.format("h:mm A")}`;
        return {
          _id: fu._id,
          title: `${fu.type ? fu.type.charAt(0).toUpperCase() + fu.type.slice(1) : "Follow up"} with ${fu.leadId?.fullName || "Lead"}`,
          scheduledFormatted: formattedDate,
          type: fu.type || "call",
          leadId: fu.leadId,
        };
      })
    : fallbackFollowUps;

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
                <div className="absolute right-0 mt-2 w-60 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-1.5 z-50 text-sm shadow-xl">
                  {[
                    "Date Range",
                    "Today",
                    "Last 7 Days",
                    "This Month",
                    "This Quarter",
                    "Jan 1, 2024 - Dec 31, 2024",
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

      {/* 2. TOP 8 KPI METRIC CARDS (Enlarged Labels, Large Bold Figures, 5px Accent Border) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Leads */}
        <ExecutiveKpiCard
          title="Total Leads"
          value={m.totalLeads ?? 248}
          trend="+12%"
          isPositive={true}
          accentBorderClass="border-l-blue-500"
          onClick={() => navigate("/leads")}
        />

        {/* Card 2: New Leads */}
        <ExecutiveKpiCard
          title="New Leads"
          value={m.newLeads ?? 54}
          trend="+23%"
          isPositive={true}
          accentBorderClass="border-l-sky-500"
          onClick={() => navigate("/leads?status=new")}
        />

        {/* Card 3: Follow-ups Today */}
        <ExecutiveKpiCard
          title="Follow-ups Today"
          value={m.todaysFollowUps ?? 18}
          trend="-2%"
          isPositive={false}
          accentBorderClass="border-l-amber-500"
          onClick={() => navigate("/leads/follow-ups")}
        />

        {/* Card 4: Pending Quotations */}
        <ExecutiveKpiCard
          title="Quotations"
          value={m.pendingQuotations ?? 12}
          trend="+4%"
          isPositive={true}
          accentBorderClass="border-l-purple-500"
          onClick={() => navigate("/leads")}
        />

        {/* Card 5: Won Deals */}
        <ExecutiveKpiCard
          title="Won Deals"
          value={m.wonLeads ?? 86}
          trend="+10%"
          isPositive={true}
          accentBorderClass="border-l-emerald-500"
          onClick={() => navigate("/leads?status=won")}
        />

        {/* Card 6: Lost */}
        <ExecutiveKpiCard
          title="Lost"
          value={m.lostLeads ?? 32}
          trend="-5%"
          isPositive={false}
          accentBorderClass="border-l-rose-500"
          onClick={() => navigate("/leads?status=lost")}
        />

        {/* Card 7: Conversion Rate */}
        <ExecutiveKpiCard
          title="Conversion Rate"
          value={m.conversionRate ? `${m.conversionRate}%` : "34.7%"}
          trend="+2.4%"
          isPositive={true}
          accentBorderClass="border-l-teal-500"
          onClick={() => navigate("/reports")}
        />

        {/* Card 8: Active Customers */}
        <ExecutiveKpiCard
          title="Active Customers"
          value={m.activeCustomers ?? 128}
          trend="+11%"
          isPositive={true}
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
                const percentage = Math.round((item.count / totalSourceCount) * 100);
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

          <div className="h-[250px] w-full">
            <Chart
              options={statusBarOptions}
              series={statusBarSeries}
              type="bar"
              width="100%"
              height="100%"
            />
          </div>
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
