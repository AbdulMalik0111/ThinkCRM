import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import Chart from "react-apexcharts";
import Flatpickr from "react-flatpickr";
import { useGetDashboardMetricsQuery, useGetMedicineDemandQuery } from "@/store/api/analytics/analyticsApiSlice";
import Loading from "@/components/Loading";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";

const Analytics = () => {
  const [dateRange, setDateRange] = useState([]);

  const [dateFrom, dateTo] = dateRange || [];

  const { data: metricsResponse, isLoading, isFetching, refetch, error } = useGetDashboardMetricsQuery({
    dateFrom: dateFrom?.toISOString(),
    dateTo: dateTo?.toISOString()
  });

  const { data: demandResponse, isLoading: isLoadingDemand } = useGetMedicineDemandQuery({
    dateFrom: dateFrom?.toISOString(),
    dateTo: dateTo?.toISOString()
  });

  const handleDateChange = (dates) => {
    if (dates.length === 2) {
      // Validate 6 months max
      const diffDays = dayjs(dates[1]).diff(dayjs(dates[0]), 'day');
      if (diffDays > 185) {
        toast.error("Maximum analytics range is 6 months.");
        return;
      }
      setDateRange(dates);
    }
  };

  const metrics = metricsResponse?.data || {};
  const medicineDemand = demandResponse?.data || [];

  // Trend Chart Data
  const trendLabels = metrics.dailyTrends?.map(d => dayjs(d._id).format("MMM DD")) || [];
  const revenueData = metrics.dailyTrends?.map(d => d.netSales) || [];
  const ordersData = metrics.dailyTrends?.map(d => d.totalOrders) || [];

  const trendChartOptions = {
    chart: { type: "area", toolbar: { show: false } },
    colors: ["#4669FA", "#50C793"],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    xaxis: { categories: trendLabels },
    yaxis: [
      { title: { text: "Net Revenue (₹)" }, labels: { formatter: (val) => `₹${val.toFixed(0)}` } },
      { opposite: true, title: { text: "Orders" }, labels: { formatter: (val) => val.toFixed(0) } }
    ],
    tooltip: { shared: true, intersect: false },
    noData: { text: "No trend data available for selected range" }
  };

  const trendChartSeries = [
    { name: "Net Revenue", type: "area", data: revenueData },
    { name: "Total Orders", type: "line", data: ordersData }
  ];

  // Donut Chart Data
  const donutLabels = metrics.orderStatusBreakdown?.map(d => d._id) || [];
  const donutData = metrics.orderStatusBreakdown?.map(d => d.count) || [];

  const donutChartOptions = {
    labels: donutLabels,
    chart: { type: "donut" },
    dataLabels: { enabled: false },
    legend: { position: "bottom" },
    noData: { text: "No orders found in selected range" }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Top Bar: Filters & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
        <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 dark:text-white">
          Advanced Analytics
        </h4>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded p-1 bg-slate-50 dark:bg-slate-900 relative">
            <Icon icon="heroicons-outline:calendar" className="text-slate-500 mx-2" />
            <Flatpickr
              value={dateRange}
              options={{
                mode: "range",
                dateFormat: "Y-m-d",
                maxDate: "today"
              }}
              onChange={handleDateChange}
              placeholder="Select Date Range"
              className="bg-transparent border-none focus:ring-0 text-sm w-48 text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            />
            {dateRange && dateRange.length > 0 && (
              <button 
                onClick={() => setDateRange([])} 
                className="text-slate-400 hover:text-red-500 mx-2 transition-colors"
                title="Clear Filter (Show All Data)"
              >
                <Icon icon="heroicons-outline:x-mark" />
              </button>
            )}
          </div>
          <Button 
            icon="heroicons-outline:refresh"
            onClick={refetch}
            disabled={isFetching}
            className={`btn-light p-2 h-10 w-10 flex items-center justify-center rounded ${isFetching ? 'opacity-50' : ''}`}
            title="Refresh Analytics"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded bg-red-50 text-red-600 border border-red-200">
          Error loading dashboard metrics.
        </div>
      )}

      {/* Section 1: Financial & Usage KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card bodyClass="p-4 flex flex-col justify-center items-center text-center">
          <div className="text-slate-500 text-sm font-medium mb-1">Net Revenue</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">₹{metrics.netSales?.toFixed(2) || "0.00"}</div>
        </Card>
        <Card bodyClass="p-4 flex flex-col justify-center items-center text-center">
          <div className="text-slate-500 text-sm font-medium mb-1">Total Orders</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.totalOrders || "0"}</div>
        </Card>
        <Card bodyClass="p-4 flex flex-col justify-center items-center text-center">
          <div className="text-slate-500 text-sm font-medium mb-1">Daily Active Users</div>
          <div className="text-3xl font-bold text-blue-500">{metrics.dau || "0"}</div>
        </Card>
        <Card bodyClass="p-4 flex flex-col justify-center items-center text-center">
          <div className="text-slate-500 text-sm font-medium mb-1">Monthly Active Users</div>
          <div className="text-3xl font-bold text-green-500">{metrics.mau || "0"}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card bodyClass="p-4 flex items-center justify-between border-l-4 border-amber-500">
          <div>
            <div className="text-slate-500 text-sm font-medium">Pending Prescriptions</div>
            <div className="text-xs text-slate-400">Action Required</div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.pendingPrescriptions || 0}</div>
        </Card>
        <Card bodyClass="p-4 flex items-center justify-between border-l-4 border-indigo-500">
          <div>
            <div className="text-slate-500 text-sm font-medium">New Medicine Requests</div>
            <div className="text-xs text-slate-400">Unfulfilled Sourcing</div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.newMedicineRequests || 0}</div>
        </Card>
      </div>

      {/* Section 2: Visual Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Revenue & Orders Trend">
            <div className="mt-4">
              {revenueData.length > 0 || ordersData.length > 0 ? (
                <Chart options={trendChartOptions} series={trendChartSeries} height={350} />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-slate-400">
                  No trend data available for selected range
                </div>
              )}
            </div>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card title="Order Status Distribution">
            <div className="mt-4 flex justify-center">
              {donutData.length > 0 ? (
                <Chart options={donutChartOptions} series={donutData} type="donut" height={350} />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-slate-400">
                  No orders found in selected range
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Section 3: Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top Selling Products">
          <div className="overflow-x-auto mt-4 max-h-[400px]">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
                <tr>
                  <th className="table-th text-left py-2 px-3">Product</th>
                  <th className="table-th text-right py-2 px-3">Units Sold</th>
                  <th className="table-th text-right py-2 px-3">Gross Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700">
                {metrics.topProducts?.length > 0 ? (
                  metrics.topProducts.map(product => (
                    <tr key={product._id}>
                      <td className="table-td py-2 px-3 font-medium">
                        {product.name}
                        <div className="text-xs text-slate-400">{product.sku}</div>
                      </td>
                      <td className="table-td py-2 px-3 text-right">{product.totalQuantitySold}</td>
                      <td className="table-td py-2 px-3 text-right">₹{product.grossRevenue?.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" className="text-center py-8 text-slate-500">No product sales data in selected range</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Unfulfilled Medicine Demand">
          <div className="overflow-x-auto mt-4 max-h-[400px]">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
                <tr>
                  <th className="table-th text-left py-2 px-3">Medicine</th>
                  <th className="table-th text-center py-2 px-3">Requests</th>
                  <th className="table-th text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700">
                {isLoadingDemand ? (
                   <tr><td colSpan="3" className="text-center py-4"><Loading /></td></tr>
                ) : medicineDemand.length > 0 ? (
                  medicineDemand.map(demand => (
                    <tr key={demand.medicineName}>
                      <td className="table-td py-2 px-3 font-medium capitalize">
                        {demand.medicineName}
                        <div className="text-xs text-slate-400">Last: {dayjs(demand.lastRequested).format("MMM DD, YYYY")}</div>
                      </td>
                      <td className="table-td py-2 px-3 text-center">
                        <span className="badge bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 rounded-full px-2 py-1">
                          {demand.requestCount}
                        </span>
                      </td>
                      <td className="table-td py-2 px-3">
                        <Badge 
                          label={demand.status} 
                          className={
                            demand.status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                            demand.status === 'SOURCING' ? 'bg-blue-100 text-blue-600' :
                            demand.status === 'FULFILLED' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-slate-100 text-slate-600'
                          } 
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" className="text-center py-8 text-slate-500">No unfulfilled medicine requests found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
