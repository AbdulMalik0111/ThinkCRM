import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Select from "@/components/ui/Select";
import Pagination from "@/components/ui/Pagination";
import Tooltip from "@/components/ui/Tooltip";
import { useGetLeadsQuery, useDeleteLeadMutation } from "@/store/api/leads/leadsApiSlice";
import Loading from "@/components/Loading";
import PermissionGuard from "@/components/PermissionGuard";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import Flatpickr from "react-flatpickr";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "attempted", label: "Attempted" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "junk", label: "Junk" },
];

const SOURCE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "social_media", label: "Social Media" },
  { value: "direct", label: "Direct" },
  { value: "other", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const getStatusColor = (status) => {
  const map = {
    new: "bg-blue-500",
    attempted: "bg-amber-500",
    contacted: "bg-indigo-500",
    qualified: "bg-purple-500",
    won: "bg-success-500",
    lost: "bg-danger-500",
    junk: "bg-slate-500",
  };
  return map[status] || "bg-slate-400";
};

const getPriorityColor = (priority) => {
  if (priority === "high") return "text-danger-500 bg-danger-50";
  if (priority === "medium") return "text-amber-500 bg-amber-50";
  return "text-success-500 bg-success-50";
};

const Leads = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [priority, setPriority] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [sortBy, setSortBy] = useState("-createdAt");

  const queryParams = {
    page: currentPage,
    limit,
    ...(search && { search }),
    ...(status && { status }),
    ...(source && { source }),
    ...(priority && { priority }),
    ...(dateRange[0] && { startDate: dateRange[0].toISOString() }),
    ...(dateRange[1] && { endDate: dateRange[1].toISOString() }),
    sort: sortBy,
  };

  const { data: response, isLoading, isFetching, refetch } = useGetLeadsQuery(queryParams);
  const [deleteLead] = useDeleteLeadMutation();

  const leads = response?.data?.leads || [];
  const totalPages = response?.data?.totalPages || 1;
  const totalLeads = response?.data?.total || 0;

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      try {
        await deleteLead(id).unwrap();
        toast.success("Lead deleted successfully");
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || "Failed to delete lead");
      }
    }
  };

  const handleFilterReset = () => {
    setSearch("");
    setStatus("");
    setSource("");
    setPriority("");
    setDateRange([]);
    setCurrentPage(1);
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="font-bold text-2xl text-slate-900 dark:text-white">Leads Management</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Total {totalLeads} lead{totalLeads !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon="heroicons-outline:arrow-path"
            className="btn-outline-dark h-10 w-10 p-0 flex items-center justify-center"
            onClick={refetch}
            disabled={isFetching}
          />
          <PermissionGuard permission="leads.create">
            <Button
              icon="heroicons-outline:plus"
              text="Add New Lead"
              className="btn-primary h-10"
              onClick={() => navigate("/leads/new")}
            />
          </PermissionGuard>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <Textinput
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setCurrentPage(1);
            }}
            options={[{ value: "", label: "All Statuses" }, ...STATUS_OPTIONS]}
          />
          <Select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setCurrentPage(1);
            }}
            options={[{ value: "", label: "All Priorities" }, ...PRIORITY_OPTIONS]}
          />
          <Select
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setCurrentPage(1);
            }}
            options={[{ value: "", label: "All Sources" }, ...SOURCE_OPTIONS]}
          />
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800">
            <div className="px-2 text-slate-500"><Icon icon="heroicons-outline:calendar" /></div>
            <Flatpickr
              className="w-full bg-transparent border-none focus:ring-0 text-sm py-2"
              value={dateRange}
              placeholder="Filter by date range"
              options={{ mode: "range" }}
              onChange={(dates) => {
                setDateRange(dates);
                if (dates.length === 2) setCurrentPage(1);
              }}
            />
          </div>
        </div>
        {(search || status || source || priority || dateRange.length > 0) && (
          <div className="flex justify-end">
            <button onClick={handleFilterReset} className="text-sm text-danger-500 font-medium hover:underline">
              Clear All Filters
            </button>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card noborder>
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700">
                <thead className="bg-slate-200 dark:bg-slate-700">
                  <tr>
                    <th scope="col" className="table-th">Customer</th>
                    <th scope="col" className="table-th">Contact</th>
                    <th scope="col" className="table-th">Project Details</th>
                    <th scope="col" className="table-th">Status</th>
                    <th scope="col" className="table-th">Priority</th>
                    <th scope="col" className="table-th">Assigned To</th>
                    <th scope="col" className="table-th text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700">
                  {leads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="table-td">
                        <div className="flex items-center">
                          <div>
                            <span className="text-sm text-slate-900 dark:text-white font-medium block">
                              {lead.fullName}
                            </span>
                            <span className="text-xs text-slate-500 block mt-1 capitalize">
                              Source: {lead.leadSource}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                          {lead.email && <div className="truncate max-w-[150px]" title={lead.email}>{lead.email}</div>}
                          <div>{lead.phone}</div>
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                          <span className="font-medium text-slate-900 dark:text-white block capitalize">{lead.projectType}</span>
                          {lead.budget ? <span className="text-xs mt-1">Budget: ₹{lead.budget.toLocaleString()}</span> : null}
                        </div>
                      </td>
                      <td className="table-td">
                        <Badge
                          label={lead.status}
                          className={`${getStatusColor(lead.status)} text-white capitalize`}
                        />
                      </td>
                      <td className="table-td">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(lead.priority)}`}>
                          {lead.priority}
                        </span>
                      </td>
                      <td className="table-td">
                        {lead.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold uppercase">
                              {lead.assignedTo.firstName?.[0]}{lead.assignedTo.lastName?.[0]}
                            </div>
                            <span className="text-sm text-slate-600 dark:text-slate-300">
                              {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="table-td text-center">
                        <div className="flex justify-center space-x-3">
                          <Tooltip content="View Details" placement="top">
                            <button
                              className="action-btn text-primary-500"
                              onClick={() => navigate(`/leads/${lead._id}`)}
                            >
                              <Icon icon="heroicons:eye" className="text-xl" />
                            </button>
                          </Tooltip>
                          <PermissionGuard permission="leads.update">
                            <Tooltip content="Edit" placement="top">
                              <button
                                className="action-btn text-success-500"
                                onClick={() => navigate(`/leads/${lead._id}/edit`)}
                              >
                                <Icon icon="heroicons:pencil-square" className="text-xl" />
                              </button>
                            </Tooltip>
                          </PermissionGuard>
                          <PermissionGuard permission="leads.delete">
                            <Tooltip content="Delete" placement="top">
                              <button
                                className="action-btn text-danger-500"
                                onClick={() => handleDelete(lead._id)}
                              >
                                <Icon icon="heroicons:trash" className="text-xl" />
                              </button>
                            </Tooltip>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-slate-500">
                        No leads found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <span className="text-sm text-slate-500">
              Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalLeads)} of {totalLeads} entries
            </span>
            <Pagination
              totalPages={totalPages}
              currentPage={currentPage}
              handlePageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default Leads;
