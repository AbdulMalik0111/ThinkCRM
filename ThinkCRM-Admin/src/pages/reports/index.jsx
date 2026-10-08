import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Chart from "react-apexcharts";
import Loading from "@/components/Loading";
import { useGetReportsQuery } from "@/store/api/management/managementApiSlice";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("leads");

  // Fetch report data based on active tab
  const { data: reportResponse, isLoading, error } = useGetReportsQuery(activeTab);

  if (isLoading) return <Loading />;
  if (error) return <div className="text-danger-500 p-4 border border-danger-200 bg-danger-50 rounded">Failed to load reports data.</div>;

  const reportData = reportResponse?.data || {};

  // Render Charts based on active tab
  const renderTabContent = () => {
    if (activeTab === "leads") {
      const sourceLabels = reportData.leadsBySource?.map((item) => item._id || "Unknown") || [];
      const sourceSeries = reportData.leadsBySource?.map((item) => item.count) || [];

      const statusLabels = reportData.leadsByStatus?.map((item) => item._id || "Unknown") || [];
      const statusSeries = reportData.leadsByStatus?.map((item) => item.count) || [];

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Leads by Source">
            <Chart
              options={{ labels: sourceLabels, dataLabels: { enabled: true } }}
              series={sourceSeries}
              type="pie"
              height="350"
            />
          </Card>
          <Card title="Leads by Status">
            <Chart
              options={{
                labels: statusLabels,
                xaxis: { categories: statusLabels },
                plotOptions: { bar: { borderRadius: 4, horizontal: true } }
              }}
              series={[{ name: "Leads", data: statusSeries }]}
              type="bar"
              height="350"
            />
          </Card>
        </div>
      );
    }

    if (activeTab === "sales") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card bodyClass="p-4 text-center">
            <h5 className="text-slate-500 text-sm">Won Deals</h5>
            <h3 className="text-3xl font-bold text-success-500 mt-2">{reportData.wonLeads || 0}</h3>
          </Card>
          <Card bodyClass="p-4 text-center">
            <h5 className="text-slate-500 text-sm">Lost Deals</h5>
            <h3 className="text-3xl font-bold text-danger-500 mt-2">{reportData.lostLeads || 0}</h3>
          </Card>
          <Card bodyClass="p-4 text-center">
            <h5 className="text-slate-500 text-sm">Quotations Sent</h5>
            <h3 className="text-3xl font-bold text-primary-500 mt-2">{reportData.quotationCount || 0}</h3>
          </Card>
          <Card bodyClass="p-4 text-center">
            <h5 className="text-slate-500 text-sm">Total Quotation Value</h5>
            <h3 className="text-3xl font-bold text-indigo-500 mt-2">
              ₹{(reportData.totalQuotationValue || 0).toLocaleString()}
            </h3>
          </Card>
        </div>
      );
    }

    if (activeTab === "staff") {
      const staffLabels = reportData.staffPerformance?.map((s) => s.name) || [];
      const assignedSeries = reportData.staffPerformance?.map((s) => s.totalAssigned) || [];
      const wonSeries = reportData.staffPerformance?.map((s) => s.won) || [];

      return (
        <Card title="Staff Performance">
          <Chart
            options={{
              xaxis: { categories: staffLabels },
              chart: { stacked: false },
              stroke: { width: [0, 4] },
              dataLabels: { enabled: true, enabledOnSeries: [1] }
            }}
            series={[
              { name: "Total Assigned", type: "column", data: assignedSeries },
              { name: "Won Deals", type: "line", data: wonSeries }
            ]}
            type="line"
            height="400"
          />
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Business Reports</h4>
          <p className="text-sm text-slate-500 mt-1">Analytics and insights across leads, sales, and team performance.</p>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("leads")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === "leads" ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-slate-800" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Icon icon="heroicons:users" className="inline mr-2" /> Lead Reports
        </button>
        <button
          onClick={() => setActiveTab("sales")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === "sales" ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-slate-800" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Icon icon="heroicons:currency-rupee" className="inline mr-2" /> Sales Reports
        </button>
        <button
          onClick={() => setActiveTab("staff")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === "staff" ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-slate-800" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Icon icon="heroicons:briefcase" className="inline mr-2" /> Staff Performance
        </button>
      </div>

      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Reports;
