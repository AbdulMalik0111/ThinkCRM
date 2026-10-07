import React, { useState, useEffect } from "react";
import { useGetLeadsQuery, useUpdateLeadMutation } from "@/store/api/leads/leadsApiSlice";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";

// Define the exact statuses based on the backend schema
const STATUS_COLUMNS = [
  { id: "new", title: "New", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
  { id: "attempted", title: "Attempted", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
  { id: "contacted", title: "Contacted", color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800" },
  { id: "qualified", title: "Qualified", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
  { id: "follow_up", title: "Follow Up", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800" },
  { id: "measurement_pending", title: "Measurement", color: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800" },
  { id: "quotation_pending", title: "Quotation", color: "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800" },
  { id: "negotiation", title: "Negotiation", color: "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800" },
  { id: "won", title: "Won", color: "bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300 border-success-200 dark:border-success-800" },
  { id: "lost", title: "Lost", color: "bg-danger-100 dark:bg-danger-900/30 text-danger-800 dark:text-danger-300 border-danger-200 dark:border-danger-800" },
  { id: "junk", title: "Junk", color: "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600" }
];

const Pipeline = () => {
  // Fetch all leads without pagination limit for the board
  const { data: response, isLoading, refetch } = useGetLeadsQuery({ limit: 1000 });
  const [updateLead] = useUpdateLeadMutation();
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    if (response?.data?.leads) {
      setLeads(response.data.leads);
    }
  }, [response]);

  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData("leadId", leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    
    // Find the lead to update its local state immediately for fast UI response
    const lead = leads.find((l) => l._id === leadId);
    if (!lead || lead.status === newStatus) return;

    // Optimistic UI update
    setLeads((prev) => 
      prev.map((l) => (l._id === leadId ? { ...l, status: newStatus } : l))
    );

    try {
      await updateLead({ id: leadId, data: { status: newStatus } }).unwrap();
      toast.success("Status updated");
    } catch (error) {
      toast.error("Failed to update status");
      // Revert if failed
      refetch();
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col">
      <div className="flex justify-between items-center mb-5 flex-none">
        <div>
          <h4 className="font-bold text-2xl text-slate-900 dark:text-white">Lead Pipeline</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Drag and drop leads to update their status
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full min-w-max pb-2">
          {STATUS_COLUMNS.map((col) => {
            const columnLeads = leads.filter((l) => {
              // Group some statuses together if needed, but for now exact match
              if (col.id === 'measurement_pending') {
                return l.status.startsWith('measurement_');
              }
              if (col.id === 'quotation_pending') {
                return l.status.startsWith('quotation_');
              }
              return l.status === col.id;
            });
            
            return (
              <div
                key={col.id}
                className="w-80 h-full flex flex-col bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex-none"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column Header */}
                <div className={`px-4 py-3 border-b flex items-center justify-between rounded-t-lg ${col.color}`}>
                  <span className="font-bold text-sm tracking-wide uppercase">{col.title}</span>
                  <Badge label={columnLeads.length.toString()} className="bg-white/20 text-current" />
                </div>

                {/* Column Body */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {columnLeads.map((lead) => (
                    <div
                      key={lead._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead._id)}
                      className="bg-white dark:bg-slate-800 p-4 rounded shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">
                          {lead.fullName}
                        </span>
                        {lead.priority === 'high' || lead.priority === 'urgent' ? (
                          <Icon icon="heroicons:fire" className="text-danger-500 text-lg" />
                        ) : null}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Icon icon="heroicons:phone" /> {lead.phone}
                        </div>
                        <div className="flex items-center gap-1.5 capitalize">
                          <Icon icon="heroicons:briefcase" /> {lead.projectType}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          {lead.leadId}
                        </span>
                        <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          {lead.assignedTo ? `${lead.assignedTo.firstName?.[0]}${lead.assignedTo.lastName?.[0]}` : "?"}
                        </div>
                      </div>
                    </div>
                  ))}
                  {columnLeads.length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm italic p-4 text-center">
                      Drop leads here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Pipeline;
