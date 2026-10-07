import React from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useGetDashboardMetricsQuery } from "@/store/api/analytics/analyticsApiSlice";
import Loading from "@/components/Loading";
import PermissionGuard from "@/components/PermissionGuard";
import { useNavigate } from "react-router-dom";

const StatCard = ({ icon, iconBg, label, value, onClick }) => {
  return (
    <div onClick={onClick} className={`h-full ${onClick ? "cursor-pointer transition-transform hover:-translate-y-1" : ""}`}>
      <Card className="h-full" bodyClass="p-5 flex flex-col h-full justify-between">
        <div className="flex items-center space-x-4">
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${iconBg}`}>
            <Icon icon={icon} className="text-white text-xl" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide truncate">{label}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 truncate">{typeof value === 'number' ? value.toLocaleString() : value}</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: metricsResponse, isLoading, error } = useGetDashboardMetricsQuery();

  if (isLoading) return <Loading />;
  if (error) return (
    <div className="space-y-5">
      <div className="p-4 rounded-lg bg-red-50 text-red-600 border border-red-200">
        <Icon icon="heroicons:exclamation-circle" className="mr-2 inline" />
        Error loading dashboard metrics. Please check your backend connection.
      </div>
    </div>
  );

  const m = metricsResponse?.data || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="font-bold text-2xl text-slate-900 dark:text-white">Dashboard</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Welcome back! Here's your CRM overview.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="heroicons:users"
          iconBg="bg-blue-500"
          label="Total Leads"
          value={m.totalLeads || 0}
          onClick={() => navigate('/leads')}
        />
        <StatCard
          icon="heroicons:user-plus"
          iconBg="bg-indigo-500"
          label="New Leads"
          value={m.newLeads || 0}
          onClick={() => navigate('/leads')}
        />
        <StatCard
          icon="heroicons:sun"
          iconBg="bg-amber-500"
          label="Today's Leads"
          value={m.todaysLeads || 0}
        />
        <StatCard
          icon="heroicons:chart-bar"
          iconBg="bg-emerald-500"
          label="Conversion Rate"
          value={`${m.conversionRate || 0}%`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon="heroicons:clock"
          iconBg="bg-orange-500"
          label="Overdue Follow-ups"
          value={m.overdueFollowUps || 0}
        />
        <StatCard
          icon="heroicons:calendar-days"
          iconBg="bg-blue-500"
          label="Today's Follow-ups"
          value={m.todaysFollowUps || 0}
        />
        <StatCard
          icon="heroicons:document-magnifying-glass"
          iconBg="bg-cyan-500"
          label="Pending Measurements"
          value={m.pendingMeasurements || 0}
        />
        <StatCard
          icon="heroicons:document-text"
          iconBg="bg-purple-500"
          label="Pending Quotations"
          value={m.pendingQuotations || 0}
        />
        <StatCard
          icon="heroicons:paper-airplane"
          iconBg="bg-indigo-500"
          label="Sent Quotations"
          value={m.sentQuotations || 0}
        />
        <StatCard
          icon="heroicons:check-badge"
          iconBg="bg-emerald-500"
          label="Won Leads"
          value={m.wonLeads || 0}
        />
      </div>
    </div>
  );
};

export default Dashboard;
