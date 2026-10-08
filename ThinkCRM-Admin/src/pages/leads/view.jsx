import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Loading from "@/components/Loading";
import { useGetLeadByIdQuery } from "@/store/api/leads/leadsApiSlice";
import LeadActivities from "./LeadActivities";
import LeadFollowUps from "./LeadFollowUps";
import LeadMeasurements from "./LeadMeasurements";
import LeadQuotations from "./LeadQuotations";

const getStatusColor = (status) => {
  const map = {
    new: "bg-blue-500",
    attempted: "bg-amber-500",
    contacted: "bg-indigo-500",
    qualified: "bg-purple-500",
    follow_up: "bg-orange-500",
    won: "bg-success-500",
    lost: "bg-danger-500",
    junk: "bg-slate-500",
  };
  return map[status] || "bg-slate-400";
};

const LeadView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetLeadByIdQuery(id);
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) return <Loading />;
  if (error) return <div>Error loading lead details.</div>;

  const lead = data?.data?.lead;
  if (!lead) return <div>Lead not found.</div>;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "follow_ups", label: "Follow-ups" },
    { id: "measurements", label: "Measurements" },
    { id: "quotations", label: "Quotations" },
    { id: "files", label: "Files" },
    { id: "activity", label: "Activity" }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card noborder className="bg-white dark:bg-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-2xl uppercase">
              {lead.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h4 className="font-bold text-xl text-slate-900 dark:text-white">
                  {lead.fullName}
                </h4>
                <Badge label={lead.status} className={`${getStatusColor(lead.status)} text-white capitalize text-xs`} />
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><Icon icon="heroicons:envelope" /> {lead.email || "No Email"}</span>
                <span className="flex items-center gap-1.5"><Icon icon="heroicons:map-pin" /> {lead.city || lead.location || "No Location"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
            <div className="text-sm text-slate-500 mr-2">Assigned To</div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                {lead.assignedTo ? lead.assignedTo.firstName.charAt(0) : "?"}
              </div>
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Info Card */}
                <Card title="Customer Information">
                  <div className="space-y-4">
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Name</span>
                      <span className="block text-sm text-slate-900 dark:text-white">{lead.fullName}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone</span>
                      <span className="block text-sm text-slate-900 dark:text-white">{lead.phone}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</span>
                      <span className="block text-sm text-slate-900 dark:text-white">{lead.email || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Address</span>
                      <span className="block text-sm text-slate-900 dark:text-white">
                        {[lead.address, lead.location, lead.city, lead.state, lead.pincode].filter(Boolean).join(', ') || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Source</span>
                      <span className="block text-sm text-slate-900 dark:text-white capitalize">{lead.leadSource}</span>
                    </div>
                  </div>
                </Card>
                
                {/* Project Info Card */}
                <Card title="Project Information">
                  <div className="space-y-4">
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Project Type</span>
                      <span className="block text-sm text-slate-900 dark:text-white capitalize">{lead.projectType}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Budget</span>
                      <span className="block text-sm text-slate-900 dark:text-white">
                        {lead.budget ? `₹${lead.budget.toLocaleString()}` : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Timeline</span>
                      <span className="block text-sm text-slate-900 dark:text-white">
                        {lead.expectedStartDate ? new Date(lead.expectedStartDate).toLocaleDateString() : 'Not Specified'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</span>
                      <span className="block text-sm text-slate-900 dark:text-white capitalize">{lead.priority}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Notes</span>
                      <span className="block text-sm text-slate-900 dark:text-white whitespace-pre-wrap">{lead.notes || lead.projectDescription || '-'}</span>
                    </div>
                  </div>
                </Card>
              </div>
              
              {/* Recent Activity Mini View */}
              <Card title="Recent Activity">
                <LeadActivities leadId={lead._id} limit={3} />
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card title="Quick Actions">
                <div className="space-y-3">
                  <Button icon="heroicons:phone" text="Add Follow-up" className="w-full btn-primary bg-blue-600 hover:bg-blue-700" />
                  <Button icon="heroicons:calendar" text="Schedule Measurement" className="w-full btn-primary bg-indigo-600 hover:bg-indigo-700" />
                  <Button icon="heroicons:document-arrow-up" text="Upload Quotation" className="w-full btn-primary bg-emerald-600 hover:bg-emerald-700" />
                  <Button icon="heroicons:paper-airplane" text="Send Quotation" className="w-full btn-primary bg-sky-600 hover:bg-sky-700" />
                  <Button icon="heroicons:user-plus" text="Convert to Customer" className="w-full btn-dark" />
                </div>
              </Card>
              
              <Card title="Lead Details">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                       <Icon icon="heroicons:information-circle" className="text-slate-500" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Status changed to Follow Up</div>
                      <div className="text-[10px] text-slate-400">Aug 12, 2024</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                       <Icon icon="heroicons:plus" className="text-slate-500" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Lead created</div>
                      <div className="text-[10px] text-slate-400">{new Date(lead.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "follow_ups" && <LeadFollowUps leadId={lead._id} />}
        {activeTab === "measurements" && <LeadMeasurements leadId={lead._id} />}
        {activeTab === "quotations" && <LeadQuotations leadId={lead._id} />}
        {activeTab === "files" && (
          <Card>
            <div className="text-center py-10 text-slate-500">
              <Icon icon="heroicons:document-duplicate" className="mx-auto text-4xl mb-3 text-slate-300" />
              <p>Files management coming soon.</p>
            </div>
          </Card>
        )}
        {activeTab === "activity" && (
          <Card>
             <LeadActivities leadId={lead._id} />
          </Card>
        )}
      </div>
    </div>
  );
};

export default LeadView;
