import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { useGetReportsMutation } from "@/store/api/management/managementApiSlice";
import { toast } from "react-toastify";
import Flatpickr from "react-flatpickr";
import dayjs from "dayjs";

const reportTypes = [
  {
    id: "customers",
    title: "Customers Report",
    description: "Full customer directory with contact details, verification status, and activity timestamps.",
    icon: "heroicons:users",
    color: "success",
    fields: ["Customer ID", "Name", "Email", "Mobile", "Verified", "Status", "Joined At", "Last Login", "Last Activity"],
    supportsDateFilter: false,
  }
];

const colorMap = {
  primary: {
    bg: "bg-primary-500/10 dark:bg-primary-500/20",
    text: "text-primary-500",
    border: "border-primary-500/30",
    iconBg: "bg-primary-500",
    ring: "ring-primary-500/40",
    selectedBg: "bg-primary-50 dark:bg-primary-500/10",
    selectedBorder: "border-primary-500",
  },
  success: {
    bg: "bg-success-500/10 dark:bg-success-500/20",
    text: "text-success-500",
    border: "border-success-500/30",
    iconBg: "bg-success-500",
    ring: "ring-success-500/40",
    selectedBg: "bg-success-50 dark:bg-success-500/10",
    selectedBorder: "border-success-500",
  },
  warning: {
    bg: "bg-warning-500/10 dark:bg-warning-500/20",
    text: "text-warning-500",
    border: "border-warning-500/30",
    iconBg: "bg-warning-500",
    ring: "ring-warning-500/40",
    selectedBg: "bg-warning-50 dark:bg-warning-500/10",
    selectedBorder: "border-warning-500",
  },
};

const Reports = () => {
  const [getReports, { isLoading }] = useGetReportsMutation();
  const [selectedReport, setSelectedReport] = useState("customers");
  const [dateRange, setDateRange] = useState([]);
  const [downloadHistory, setDownloadHistory] = useState([]);

  const activeReport = reportTypes.find((r) => r.id === selectedReport);
  const colors = colorMap[activeReport.color];

  const handleDownload = async () => {
    try {
      const blob = await getReports(selectedReport).unwrap();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `${selectedReport}-report-${dayjs().format("YYYY-MM-DD_HH-mm")}.csv`;
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadHistory((prev) => [
        { name: filename, type: activeReport.title, date: dayjs().format("DD MMM YYYY, hh:mm A") },
        ...prev.slice(0, 4),
      ]);

      toast.success("Report downloaded successfully!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to generate report. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h4 className="text-2xl font-semibold text-slate-900 dark:text-white">Export Reports</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate and download CSV reports for orders, customers, and inventory data.
          </p>
        </div>
      </div>

      {/* Report Type Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportTypes.map((report) => {
          const c = colorMap[report.color];
          const isSelected = selectedReport === report.id;

          return (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`relative cursor-pointer rounded-lg border-2 p-5 transition-all duration-200
                ${isSelected
                  ? `${c.selectedBg} ${c.selectedBorder} ring-2 ${c.ring}`
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className={`absolute top-3 right-3 w-6 h-6 rounded-full ${c.iconBg} flex items-center justify-center`}>
                  <Icon icon="heroicons:check" className="text-white text-xs" />
                </div>
              )}

              <div className={`w-12 h-12 rounded-lg ${c.bg} flex items-center justify-center mb-4`}>
                <Icon icon={report.icon} className={`text-2xl ${c.text}`} />
              </div>
              <h5 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                {report.title}
              </h5>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {report.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Configuration & Preview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration Panel */}
        <div className="lg:col-span-1 space-y-5">
          <Card title="Export Configuration" className="h-full">
            <div className="space-y-5">
              {/* Selected Report Info */}
              <div className={`rounded-lg p-4 ${colors.bg}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg ${colors.iconBg} flex items-center justify-center`}>
                    <Icon icon={activeReport.icon} className="text-white text-lg" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{activeReport.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{activeReport.fields.length} columns</p>
                  </div>
                </div>
              </div>

              {/* Date Range Filter (for orders) */}
              {activeReport.supportsDateFilter && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Date Range <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-900">
                    <Icon icon="heroicons-outline:calendar" className="text-slate-400 mx-2" />
                    <Flatpickr
                      value={dateRange}
                      options={{
                        mode: "range",
                        dateFormat: "Y-m-d",
                        maxDate: "today",
                      }}
                      onChange={(dates) => setDateRange(dates)}
                      className="bg-transparent border-none focus:ring-0 text-sm w-full text-slate-700 dark:text-slate-300"
                      placeholder="All time (no filter)"
                    />
                  </div>
                  {dateRange.length === 2 && (
                    <button
                      onClick={() => setDateRange([])}
                      className="text-xs text-primary-500 hover:text-primary-600 mt-1"
                    >
                      Clear date filter
                    </button>
                  )}
                </div>
              )}

              {/* Format Info */}
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <Icon icon="heroicons:document-text" className="text-slate-400 text-lg" />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">CSV Format</p>
                  <p className="text-xs text-slate-400">Comma-separated, Excel-compatible</p>
                </div>
              </div>

              {/* Download Button */}
              <Button
                text={isLoading ? "Generating Report..." : "Download CSV Report"}
                icon="heroicons-outline:arrow-down-tray"
                className="btn-dark w-full py-3"
                onClick={handleDownload}
                isLoading={isLoading}
                disabled={isLoading}
              />
            </div>
          </Card>
        </div>

        {/* Right: Column Preview & History */}
        <div className="lg:col-span-2 space-y-5">
          {/* Columns Preview */}
          <Card title="Columns Preview">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              The following columns will be included in your <span className="font-medium text-slate-700 dark:text-slate-200">{activeReport.title}</span> export:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeReport.fields.map((field, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600"
                >
                  <Icon icon="heroicons:check-circle" className={`text-sm ${colors.text}`} />
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{field}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center">
              <div className={`w-10 h-10 rounded-lg ${colorMap.primary.bg} flex items-center justify-center mx-auto mb-2`}>
                <Icon icon="heroicons:shopping-cart" className={`text-lg ${colorMap.primary.text}`} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Orders</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">Available</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center">
              <div className={`w-10 h-10 rounded-lg ${colorMap.success.bg} flex items-center justify-center mx-auto mb-2`}>
                <Icon icon="heroicons:users" className={`text-lg ${colorMap.success.text}`} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Customers</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">Available</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center">
              <div className={`w-10 h-10 rounded-lg ${colorMap.warning.bg} flex items-center justify-center mx-auto mb-2`}>
                <Icon icon="heroicons:cube" className={`text-lg ${colorMap.warning.text}`} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Inventory</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">Available</p>
            </div>
          </div>

          {/* Recent Downloads */}
          <Card title="Recent Downloads">
            {downloadHistory.length > 0 ? (
              <div className="space-y-3">
                {downloadHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center">
                        <Icon icon="heroicons:document-arrow-down" className="text-primary-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.type}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{item.date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                  <Icon icon="heroicons:document-arrow-down" className="text-2xl text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">No reports downloaded yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Select a report type and click download to get started</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;
