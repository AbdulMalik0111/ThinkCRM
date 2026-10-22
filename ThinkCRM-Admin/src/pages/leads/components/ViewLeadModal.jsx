import React, { useState } from "react";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { LeadStatusBadge, LeadSourceBadge } from "./LeadStatusBadge";
import {
  useGetLeadByIdQuery,
  useGetLeadActivitiesQuery,
  useAddLeadNoteMutation,
} from "@/store/api/leads/leadsApiSlice";
import {
  useGetLeadFollowUpsQuery,
  useUpdateFollowUpMutation,
  useDeleteFollowUpMutation,
} from "@/store/api/leads/followupApiSlice";
import AddFollowUpModal from "./AddFollowUpModal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

const ViewLeadModal = ({ isOpen, leadId, onClose, onEditLead }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddFollowUpOpen, setIsAddFollowUpOpen] = useState(false);
  const [deletingFollowUpId, setDeletingFollowUpId] = useState(null);
  const [newNoteContent, setNewNoteContent] = useState("");

  const { data: leadData, isLoading: isLeadLoading, refetch: refetchLead } = useGetLeadByIdQuery(leadId, {
    skip: !leadId || !isOpen,
  });

  const { data: activitiesData } = useGetLeadActivitiesQuery(leadId, {
    skip: !leadId || !isOpen,
  });

  const { data: followUpsData, refetch: refetchFollowUps } = useGetLeadFollowUpsQuery(leadId, {
    skip: !leadId || !isOpen,
  });

  const [addLeadNote, { isLoading: isAddingNote }] = useAddLeadNoteMutation();
  const [updateFollowUp] = useUpdateFollowUpMutation();
  const [deleteFollowUp] = useDeleteFollowUpMutation();

  if (!isOpen || !leadId) return null;

  const lead = leadData?.data?.lead;
  const activities = activitiesData?.data?.activities || [];
  const followUps = followUpsData?.data?.followUps || [];

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    try {
      await addLeadNote({ id: leadId, content: newNoteContent.trim() }).unwrap();
      toast.success("Note added successfully");
      setNewNoteContent("");
      refetchLead();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add note");
    }
  };

  const handleToggleComplete = async (fu) => {
    try {
      const nextStatus = fu.status === "completed" ? "pending" : "completed";
      await updateFollowUp({
        id: fu._id,
        data: { status: nextStatus },
      }).unwrap();
      toast.success(`Follow-up marked as ${nextStatus}`);
      refetchFollowUps();
      refetchLead();
    } catch (err) {
      toast.error("Failed to update follow-up");
    }
  };

  const handleDeleteFollowUp = (id) => {
    setDeletingFollowUpId(id);
  };

  const handleConfirmDeleteFollowUp = async () => {
    if (!deletingFollowUpId) return;
    try {
      await deleteFollowUp(deletingFollowUpId).unwrap();
      toast.success("Follow-up deleted successfully");
      setDeletingFollowUpId(null);
      refetchFollowUps();
      refetchLead();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete follow-up");
    }
  };

  const cleanPhone = lead?.phone ? lead.phone.replace(/\D/g, "") : "";

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "followups", label: `Follow-ups (${followUps.length})` },
    { id: "notes", label: `Notes (${lead?.notesList?.length || 0})` },
    { id: "documents", label: "Documents" },
    { id: "quotations", label: "Quotations" },
    { id: "timeline", label: "Timeline" },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-none">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            {/* Lead Avatar & Basic Info */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-xl flex items-center justify-center flex-shrink-0 font-inter">
                {lead?.fullName?.charAt(0) || "L"}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white font-inter">
                    {lead?.fullName || "Lead Details"}
                  </h3>
                  {lead && <LeadStatusBadge status={lead.status} />}
                </div>
                <p className="text-[13px] text-slate-500 font-inter">
                  {lead?.projectType || "General Inquiry"}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons in Header */}
            <div className="flex items-center gap-2">
              {lead?.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-[13px] font-semibold font-inter transition"
                  title="Call lead"
                >
                  <Icon icon="heroicons-outline:phone" className="text-base text-slate-600" />
                  <span>Call</span>
                </a>
              )}

              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-[13px] font-semibold font-inter transition"
                  title="WhatsApp chat"
                >
                  <Icon icon="whatsapp" className="text-base text-[#25D366]" />
                  <span>WhatsApp</span>
                </a>
              )}

              {lead?.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-[13px] font-semibold font-inter transition"
                  title="Send email"
                >
                  <Icon icon="heroicons-outline:mail" className="text-base text-slate-600" />
                  <span>Email</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onEditLead && lead) onEditLead(lead);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold font-inter transition"
              >
                <Icon icon="heroicons-outline:pencil-square" className="text-base" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 ml-2 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Icon icon="heroicons-outline:x" className="text-xl" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 px-6 gap-6 overflow-x-auto bg-slate-50/50 dark:bg-slate-900/20">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 text-[13.5px] font-semibold transition border-b-2 whitespace-nowrap font-inter ${
                    isActive
                      ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Modal Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {isLeadLoading ? (
              <div className="flex items-center justify-center py-16">
                <Icon icon="heroicons-outline:refresh" className="animate-spin text-2xl text-blue-600" />
              </div>
            ) : !lead ? (
              <div className="text-center py-12 text-slate-500 font-inter">Lead not found.</div>
            ) : (
              <>
                {/* 1. OVERVIEW TAB: 3-column Card Layout matching reference */}
                {activeTab === "overview" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Card 1: Contact Information */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
                      <h4 className="text-[14px] font-bold text-slate-800 dark:text-white font-inter">
                        Contact Information
                      </h4>
                      <div className="space-y-3 font-inter text-[13.5px]">
                        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                          <Icon icon="heroicons-outline:phone" className="text-slate-400 text-base" />
                          <span>{lead.phone || "—"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                          <Icon icon="heroicons-outline:mail" className="text-slate-400 text-base" />
                          <span className="truncate">{lead.email || "—"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                          <Icon icon="heroicons-outline:map-pin" className="text-slate-400 text-base" />
                          <span>{lead.city || lead.address || "Mumbai, Maharashtra"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                          <Icon icon="heroicons-outline:globe-alt" className="text-slate-400 text-base" />
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Source:</span>
                            <LeadSourceBadge source={lead.leadSource} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                          <Icon icon="heroicons-outline:briefcase" className="text-slate-400 text-base" />
                          <div>
                            <span className="text-slate-500">Project Type: </span>
                            <span className="font-semibold">{lead.projectType || "Modular Kitchen"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <Icon icon="heroicons-outline:user" className="text-slate-400 text-base" />
                          <div>
                            <span className="text-slate-500 block text-xs">Assigned To:</span>
                            <span className="font-semibold text-slate-800 dark:text-white">
                              {lead.assignedTo
                                ? `${lead.assignedTo.firstName || ""} ${lead.assignedTo.lastName || ""}`.trim()
                                : "Unassigned"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Requirement Details */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
                      <h4 className="text-[14px] font-bold text-slate-800 dark:text-white font-inter">
                        Requirement Details
                      </h4>
                      <div className="space-y-4 font-inter text-[13.5px]">
                        <div>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {lead.requirement || "Looking for modular kitchen with modern design and storage solution."}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">
                            Budget Range
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {lead.budgetRange || "₹5,00,000 - ₹8,00,000"}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">
                            Preferred Timeline
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {lead.preferredTimeline || "Within 2 months"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Lead Activity (Mini Timeline Feed) */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
                      <h4 className="text-[14px] font-bold text-slate-800 dark:text-white font-inter">
                        Lead Activity
                      </h4>
                      <div className="space-y-3 font-inter">
                        {activities.slice(0, 4).map((act, idx) => (
                          <div key={act._id || idx} className="flex gap-3 text-[13px]">
                            <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                              <Icon icon="heroicons-outline:chat-bubble-left-right" className="text-sm" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {act.type?.replace(/_/g, " ")?.replace(/\b\w/g, (c) => c.toUpperCase()) || "Activity"}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {dayjs(act.createdAt).format("D MMM, hh:mm A")}
                                </span>
                              </div>
                              <p className="text-slate-500 text-xs mt-0.5 whitespace-pre-wrap break-words">
                                {act.description || act.content}
                              </p>
                            </div>
                          </div>
                        ))}
                        {activities.length === 0 && (
                          <div className="text-center py-6 text-slate-400 text-xs font-inter">
                            No activities logged yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. FOLLOW-UPS TAB: Sub-screen 7 in reference image */}
                {activeTab === "followups" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-slate-800 dark:text-white font-inter">
                        Lead Follow-ups
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsAddFollowUpOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold font-inter transition"
                      >
                        <Icon icon="heroicons-outline:plus" className="text-base" />
                        <span>Add Follow-up</span>
                      </button>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-[13.5px] font-inter">
                        <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700 text-xs uppercase">
                          <tr>
                            <th className="px-4 py-3">Date & Time</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Notes</th>
                            <th className="px-4 py-3">Created By</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {followUps.map((fu) => (
                            <tr key={fu._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                              <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                <div>{dayjs(fu.scheduledAt).format("DD MMM YYYY")}</div>
                                <div className="text-xs text-slate-400">{dayjs(fu.scheduledAt).format("hh:mm A")}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 capitalize">
                                  <Icon
                                    icon={
                                      fu.type === "call"
                                        ? "heroicons-outline:phone"
                                        : fu.type === "whatsapp"
                                        ? "whatsapp"
                                        : "heroicons-outline:mail"
                                    }
                                    className="text-xs"
                                  />
                                  {fu.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs">
                                {fu.notes}
                              </td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                                    {fu.createdBy?.firstName?.charAt(0) || "U"}
                                  </div>
                                  <span>
                                    {fu.createdBy
                                      ? `${fu.createdBy.firstName || ""} ${fu.createdBy.lastName || ""}`
                                      : "System"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleComplete(fu)}
                                    title={fu.status === "completed" ? "Mark Pending" : "Mark Complete"}
                                    className={`h-7 w-7 rounded flex items-center justify-center ${
                                      fu.status === "completed"
                                        ? "text-emerald-600 bg-emerald-50"
                                        : "text-slate-400 hover:text-emerald-600 hover:bg-slate-100"
                                    }`}
                                  >
                                    <Icon icon="heroicons-outline:check-circle" className="text-base" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteFollowUp(fu._id)}
                                    title="Delete"
                                    className="h-7 w-7 rounded flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  >
                                    <Icon icon="heroicons-outline:trash" className="text-base" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {followUps.length === 0 && (
                            <tr>
                              <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                                No follow-ups scheduled for this lead.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. NOTES TAB */}
                {activeTab === "notes" && (
                  <div className="space-y-4">
                    <form onSubmit={handleAddNote} className="space-y-2">
                      <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 font-inter">
                        Add a Note
                      </label>
                      <textarea
                        rows={3}
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="Write a note about this lead..."
                        className="w-full px-3.5 py-2.5 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-inter"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isAddingNote || !newNoteContent.trim()}
                          className="px-4 py-2 text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition font-inter disabled:opacity-50"
                        >
                          {isAddingNote ? "Adding..." : "Add Note"}
                        </button>
                      </div>
                    </form>

                    <div className="space-y-3 pt-3">
                      {lead?.notesList?.map((n, idx) => (
                        <div
                          key={n._id || idx}
                          className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 font-inter"
                        >
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {n.authorName || "Staff Member"}
                            </span>
                            <span>{dayjs(n.createdAt).format("D MMM YYYY, hh:mm A")}</span>
                          </div>
                          <p className="text-[13.5px] text-slate-700 dark:text-slate-300 whitespace-pre-line">
                            {n.content}
                          </p>
                        </div>
                      ))}
                      {(!lead?.notesList || lead.notesList.length === 0) && (
                        <p className="text-center py-6 text-slate-400 text-xs font-inter">
                          No notes have been added yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. DOCUMENTS TAB */}
                {activeTab === "documents" && (
                  <div className="text-center py-10 font-inter text-slate-500 text-sm">
                    <Icon icon="heroicons-outline:document-text" className="text-4xl text-slate-300 mx-auto mb-2" />
                    <p className="font-medium">No documents attached yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Upload floor plans, design specs or brochures.</p>
                  </div>
                )}

                {/* 5. QUOTATIONS TAB */}
                {activeTab === "quotations" && (
                  <div className="text-center py-10 font-inter text-slate-500 text-sm">
                    <Icon icon="heroicons-outline:calculator" className="text-4xl text-slate-300 mx-auto mb-2" />
                    <p className="font-medium">No quotations generated yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Generate estimated project quotations for this lead.</p>
                  </div>
                )}

                {/* 6. TIMELINE TAB */}
                {activeTab === "timeline" && (
                  <div className="space-y-4 font-inter">
                    {activities.map((act, idx) => (
                      <div key={act._id || idx} className="flex gap-3 text-[13.5px]">
                        <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                          <Icon icon="heroicons-outline:calendar" className="text-sm" />
                        </div>
                        <div className="flex-1 pb-4 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {act.type?.replace(/_/g, " ")?.replace(/\b\w/g, (c) => c.toUpperCase()) || "Activity"}
                            </span>
                            <span className="text-xs text-slate-400">
                              {dayjs(act.createdAt).format("DD MMM YYYY, hh:mm A")}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                            {act.description || act.content}
                          </p>
                        </div>
                      </div>
                    ))}
                    {activities.length === 0 && (
                      <p className="text-center py-8 text-slate-400 text-xs">No activity timeline recorded yet.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Follow-up Modal child */}
      <AddFollowUpModal
        isOpen={isAddFollowUpOpen}
        lead={lead}
        onClose={() => setIsAddFollowUpOpen(false)}
        onSuccess={() => {
          refetchFollowUps();
          refetchLead();
        }}
      />

      {/* Delete Follow-up Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingFollowUpId)}
        onClose={() => setDeletingFollowUpId(null)}
        onConfirm={handleConfirmDeleteFollowUp}
        title="Delete Follow-up"
        entityName="this follow-up"
        entityType="follow-up"
        message="This follow-up schedule and reminders will be permanently removed. This action cannot be undone."
        confirmText="Delete Follow-up"
      />
    </>
  );
};

export default ViewLeadModal;
