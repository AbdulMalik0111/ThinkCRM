import React from "react";
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

  if (isLoading) return <Loading />;
  if (error) return <div>Error loading lead details.</div>;

  const lead = data?.data?.lead;
  if (!lead) return <div>Lead not found.</div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate("/leads")} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <Icon icon="heroicons:arrow-left" className="text-xl" />
          </button>
          <div>
            <h4 className="font-bold text-2xl text-slate-900 dark:text-white flex items-center gap-3">
              {lead.fullName}
              <Badge label={lead.status} className={`${getStatusColor(lead.status)} text-white capitalize`} />
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Lead ID: {lead.leadId} | Created on {new Date(lead.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            icon="heroicons:pencil-square"
            text="Edit Lead"
            className="btn-outline-primary"
            onClick={() => navigate(`/leads/${lead._id}/edit`)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-5">
          <Card title="Customer Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="block text-sm text-slate-500">Full Name</span>
                <span className="block text-sm font-medium text-slate-900 dark:text-white mt-1">{lead.fullName}</span>
              </div>
              <div>
                <span className="block text-sm text-slate-500">Phone Number</span>
                <span className="block text-sm font-medium text-slate-900 dark:text-white mt-1">{lead.phone}</span>
              </div>
              <div>
                <span className="block text-sm text-slate-500">Email Address</span>
                <span className="block text-sm font-medium text-slate-900 dark:text-white mt-1">{lead.email || '-'}</span>
              </div>
              <div>
                <span className="block text-sm text-slate-500">Alternate Phone</span>
                <span className="block text-sm font-medium text-slate-900 dark:text-white mt-1">{lead.alternatePhone || '-'}</span>
              </div>
              <div className="md:col-span-2">
                <span className="block text-sm text-slate-500">Address</span>
                <span className="block text-sm font-medium text-slate-900 dark:text-white mt-1">
                  {[lead.address, lead.location, lead.city, lead.state, lead.pincode].filter(Boolean).join(', ') || '-'}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Project Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="block text-sm text-slate-500">Project Type</span>
                <span className="block text-sm font-medium text-slate-900 dark:text-white mt-1 capitalize">{lead.projectType}</span>
              </div>
              <div>
                <span className="block text-sm text-slate-500">Estimated Budget</span>
                <span className="block text-sm font-medium text-slate-900 dark:text-white mt-1">
                  {lead.budget ? `₹${lead.budget.toLocaleString()}` : '-'}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className="block text-sm text-slate-500">Project Description</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                  {lead.projectDescription || '-'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Meta & Notes */}
        <div className="space-y-5">
          <Card title="Lead Meta">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                <span className="text-sm text-slate-500">Priority</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">{lead.priority}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                <span className="text-sm text-slate-500">Lead Source</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">{lead.leadSource}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                <span className="text-sm text-slate-500">Assigned To</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Expected Start</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {lead.expectedStartDate ? new Date(lead.expectedStartDate).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Internal Notes">
            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
              {lead.notes || 'No internal notes added for this lead.'}
            </p>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <LeadMeasurements leadId={lead._id} />
        <LeadQuotations leadId={lead._id} />
      </div>

      <LeadFollowUps leadId={lead._id} />

      {/* Activity Timeline */}
      <LeadActivities leadId={lead._id} />
    </div>
  );
};

export default LeadView;
