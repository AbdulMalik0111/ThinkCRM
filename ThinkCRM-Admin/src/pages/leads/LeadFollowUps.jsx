import React, { useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Loading from "@/components/Loading";
import Flatpickr from "react-flatpickr";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  useGetLeadFollowUpsQuery,
  useCreateFollowUpMutation,
  useUpdateFollowUpMutation,
  useDeleteFollowUpMutation,
  useDeleteAllLeadFollowUpsMutation,
} from "@/store/api/leads/followupApiSlice";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

const FOLLOWUP_TYPES = [
  { value: "call", label: "Phone Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "site_visit", label: "Site Visit" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "other", label: "Other" },
];

const getTypeMeta = (type) => {
  switch (type) {
    case "call":
      return {
        label: "Phone Call",
        icon: "heroicons-outline:phone",
        color: "text-sky-600 dark:text-sky-400",
        bg: "bg-sky-50 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/60",
      };
    case "email":
      return {
        label: "Email",
        icon: "heroicons-outline:envelope",
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60",
      };
    case "meeting":
      return {
        label: "Meeting",
        icon: "heroicons-outline:user-group",
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60",
      };
    case "site_visit":
      return {
        label: "Site Visit",
        icon: "heroicons-outline:map-pin",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60",
      };
    case "whatsapp":
      return {
        label: "WhatsApp",
        icon: "whatsapp",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60",
      };
    default:
      return {
        label: "Follow-up",
        icon: "heroicons-outline:calendar",
        color: "text-slate-600 dark:text-slate-400",
        bg: "bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-700",
      };
  }
};

const LeadFollowUps = ({ leadId }) => {
  const { data, isLoading, isFetching, refetch } = useGetLeadFollowUpsQuery(leadId);
  const [createFollowUp, { isLoading: isCreating }] = useCreateFollowUpMutation();
  const [updateFollowUp] = useUpdateFollowUpMutation();
  const [deleteFollowUp, { isLoading: isDeletingSingle }] = useDeleteFollowUpMutation();
  const [deleteAllLeadFollowUps, { isLoading: isDeletingAll }] = useDeleteAllLeadFollowUpsMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const [formData, setFormData] = useState({
    type: "call",
    scheduledAt: [new Date()],
    notes: "",
    reminders: {
      tenMin: true,
      fiveMin: true,
      exact: true,
    },
  });

  const followUps = useMemo(() => data?.data?.followUps || [], [data]);

  // Status counts
  const counts = useMemo(() => {
    let pending = 0;
    let completed = 0;
    let overdue = 0;
    let cancelled = 0;
    const now = dayjs();
    followUps.forEach((fu) => {
      if (fu.status === "completed") completed++;
      else if (fu.status === "cancelled") cancelled++;
      else if (fu.status === "pending") {
        if (dayjs(fu.scheduledAt).isBefore(now)) overdue++;
        else pending++;
      }
    });
    return { all: followUps.length, pending, completed, overdue, cancelled };
  }, [followUps]);

  // Filtered and Sorted list: Pending/Upcoming meetings always at the top!
  const filteredFollowUps = useMemo(() => {
    const now = dayjs();
    let list = [...followUps];

    if (statusFilter !== "all") {
      list = list.filter((fu) => {
        if (statusFilter === "completed") return fu.status === "completed";
        if (statusFilter === "cancelled") return fu.status === "cancelled";
        if (statusFilter === "overdue") {
          return fu.status === "pending" && dayjs(fu.scheduledAt).isBefore(now);
        }
        if (statusFilter === "pending") {
          return fu.status === "pending" && !dayjs(fu.scheduledAt).isBefore(now);
        }
        return true;
      });
    }

    // Always prioritize Pending / Overdue follow-ups at the top so reps see upcoming meetings first
    return list.sort((a, b) => {
      const isPendingA = a.status === "pending";
      const isPendingB = b.status === "pending";

      // 1. Pending always on top
      if (isPendingA && !isPendingB) return -1;
      if (!isPendingA && isPendingB) return 1;

      // 2. If both are pending, sort by scheduledAt ascending (earliest scheduled meeting first)
      if (isPendingA && isPendingB) {
        return new Date(a.scheduledAt) - new Date(b.scheduledAt);
      }

      // 3. If both completed/cancelled, sort by scheduledAt descending (most recent first)
      return new Date(b.scheduledAt) - new Date(a.scheduledAt);
    });
  }, [followUps, statusFilter]);

  const handleOpenModal = () => {
    setFormData({
      type: "call",
      scheduledAt: [new Date()],
      notes: "",
      reminders: { tenMin: true, fiveMin: true, exact: true },
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createFollowUp({
        leadId,
        data: {
          type: formData.type,
          scheduledAt: formData.scheduledAt[0].toISOString(),
          notes: formData.notes,
          reminder10mSent: !formData.reminders.tenMin,
          reminder5mSent: !formData.reminders.fiveMin,
          reminder0mSent: !formData.reminders.exact,
        },
      }).unwrap();
      toast.success("Follow-up scheduled successfully");
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to schedule follow-up");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateFollowUp({
        id,
        data: { status },
      }).unwrap();
      toast.success(`Follow-up marked as ${status}`);
      refetch();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleConfirmDeleteSingle = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFollowUp(deleteTarget._id).unwrap();
      toast.success("Follow-up deleted successfully");
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete follow-up");
    }
  };

  const handleConfirmDeleteAll = async () => {
    try {
      await deleteAllLeadFollowUps(leadId).unwrap();
      toast.success("All follow-ups deleted successfully");
      setIsDeleteAllOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete all follow-ups");
    }
  };

  const renderStatusBadge = (fu) => {
    const isOverdue = fu.status === "pending" && dayjs(fu.scheduledAt).isBefore(dayjs());
    if (fu.status === "completed") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
          <Icon icon="heroicons-outline:check-circle" className="text-xs" />
          Completed
        </span>
      );
    }
    if (fu.status === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
          <Icon icon="heroicons-outline:x-circle" className="text-xs" />
          Cancelled
        </span>
      );
    }
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 animate-pulse">
          <Icon icon="heroicons-outline:exclamation-triangle" className="text-xs" />
          Overdue
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
        <Icon icon="heroicons-outline:clock" className="text-xs" />
        Pending
      </span>
    );
  };

  if (isLoading) return <Loading />;

  return (
    <>
      <Card
        title={
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Icon icon="heroicons-outline:calendar-days" className="text-base" />
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-100 font-inter text-sm">
                Follow-Ups
              </span>
              <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {followUps.length}
              </span>
            </div>
            {counts.overdue > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 flex items-center gap-1">
                <Icon icon="heroicons-outline:exclamation-circle" className="text-xs" />
                {counts.overdue} Overdue
              </span>
            )}
          </div>
        }
        headerSlot={
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Status Filter Pills */}
            {followUps.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-0.5 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-md transition font-inter cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  All ({counts.all})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                  className={`px-2.5 py-1 rounded-md transition font-inter cursor-pointer ${
                    statusFilter === "pending"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Pending ({counts.pending})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("completed")}
                  className={`px-2.5 py-1 rounded-md transition font-inter cursor-pointer ${
                    statusFilter === "completed"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Completed ({counts.completed})
                </button>
                {counts.overdue > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter("overdue")}
                    className={`px-2.5 py-1 rounded-md transition font-inter cursor-pointer ${
                      statusFilter === "overdue"
                        ? "bg-rose-500 text-white font-bold shadow-xs"
                        : "text-rose-600 dark:text-rose-400 hover:bg-rose-50"
                    }`}
                  >
                    Overdue ({counts.overdue})
                  </button>
                )}
              </div>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => refetch()}
              className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Refresh Follow-ups"
            >
              <Icon
                icon="heroicons-outline:arrow-path"
                className={`text-sm ${isFetching ? "animate-spin text-primary-600" : ""}`}
              />
            </button>

            {/* Delete All Button */}
            {followUps.length > 0 && (
              <button
                type="button"
                onClick={() => setIsDeleteAllOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-semibold transition cursor-pointer"
                title="Delete all follow-ups for this lead"
              >
                <Icon icon="heroicons-outline:trash" className="text-sm" />
                <span>Delete All</span>
              </button>
            )}

            {/* Add Follow-up Button */}
            <button
              type="button"
              onClick={handleOpenModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-none transition cursor-pointer"
            >
              <Icon icon="heroicons-outline:plus" className="text-sm" />
              <span>Add Follow-up</span>
            </button>
          </div>
        }
      >
        {filteredFollowUps.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Icon icon="heroicons-outline:calendar-days" className="text-2xl text-slate-300 dark:text-slate-600" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 font-inter">
              {followUps.length === 0 ? "No follow-ups scheduled yet" : "No follow-ups match this filter"}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto font-inter">
              {followUps.length === 0
                ? "Keep this lead engaged by planning your next call, email, or meeting."
                : "Try switching filter options above to see other scheduled follow-ups."}
            </p>
            {followUps.length === 0 ? (
              <button
                type="button"
                onClick={handleOpenModal}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-none transition cursor-pointer"
              >
                <Icon icon="heroicons-outline:plus" className="text-sm" />
                <span>Schedule First Follow-up</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className="mt-3 text-xs font-semibold text-primary-600 hover:underline cursor-pointer"
              >
                View All Follow-ups
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 font-inter">
            {filteredFollowUps.map((fu) => {
              const meta = getTypeMeta(fu.type);
              const isOverdue = fu.status === "pending" && dayjs(fu.scheduledAt).isBefore(dayjs());

              return (
                <div
                  key={fu._id}
                  className={`border rounded-xl p-4 transition-all duration-150 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center ${
                    isOverdue
                      ? "border-rose-300 dark:border-rose-800 bg-rose-50/25 dark:bg-rose-950/20 shadow-xs"
                      : fu.status === "pending"
                      ? "border-blue-200 dark:border-blue-800/80 bg-blue-50/15 dark:bg-blue-950/15 shadow-xs"
                      : "border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 opacity-90 hover:opacity-100"
                  }`}
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${meta.bg} ${meta.color}`}
                    >
                      <Icon icon={meta.icon} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h5 className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100 font-inter">
                          {meta.label}
                        </h5>
                        {fu.status === "pending" && dayjs(fu.scheduledAt).isSame(dayjs(), "day") && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Today
                          </span>
                        )}
                        {renderStatusBadge(fu)}
                      </div>

                      {/* Scheduled Time */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <Icon icon="heroicons-outline:calendar-days" className="text-xs text-slate-400" />
                        <span>
                          Scheduled:{" "}
                          <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                            {dayjs(fu.scheduledAt).format("ddd, D MMM YYYY · h:mm A")}
                          </strong>
                        </span>
                      </div>

                      {/* Notes snippet */}
                      {fu.notes && (
                        <div className="mt-2.5 text-[14.5px] font-semibold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80">
                          <span className="font-bold text-slate-500 dark:text-slate-400 mr-2 text-xs uppercase tracking-wider">
                            Note:
                          </span>
                          {fu.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center w-full md:w-auto justify-end border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-100 dark:border-slate-700">
                    {fu.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(fu._id, "completed")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          <Icon icon="heroicons-outline:check" className="text-xs" />
                          <span>Complete</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(fu._id, "cancelled")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          <Icon icon="heroicons-outline:x-mark" className="text-xs" />
                          <span>Cancel</span>
                        </button>
                      </>
                    )}

                    {fu.status !== "pending" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(fu._id, "pending")}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-primary-600 text-xs font-medium hover:underline transition cursor-pointer"
                      >
                        <Icon icon="heroicons-outline:arrow-path" className="text-xs" />
                        <span>Reopen</span>
                      </button>
                    )}

                    {/* Single Delete Button */}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(fu)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Delete follow-up"
                    >
                      <Icon icon="heroicons-outline:trash" className="text-base" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Delete Single Follow-Up Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDeleteSingle}
        title="Delete Follow-up"
        entityType="follow-up"
        entityName={
          deleteTarget
            ? `${getTypeMeta(deleteTarget.type).label} on ${dayjs(deleteTarget.scheduledAt).format("MMM D, YYYY")}`
            : ""
        }
        message="Are you sure you want to delete this scheduled follow-up? This record will be permanently removed from this lead."
        confirmText="Delete Follow-up"
        isLoading={isDeletingSingle}
      />

      {/* Delete All Follow-Ups Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteAllOpen}
        onClose={() => setIsDeleteAllOpen(false)}
        onConfirm={handleConfirmDeleteAll}
        title="Delete All Follow-ups"
        entityType="follow-up schedules"
        entityName={`all ${followUps.length} follow-ups`}
        message={`Are you sure you want to delete all ${followUps.length} follow-ups for this lead? All completed, pending, and scheduled records will be permanently removed.`}
        confirmText="Delete All Follow-ups"
        isLoading={isDeletingAll}
      />

      {/* Schedule Follow-up Modal */}
      <Modal
        activeModal={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Follow-up"
        footerContent={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs md:text-sm font-semibold transition font-inter"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs md:text-sm font-semibold transition disabled:opacity-60 font-inter"
              onClick={handleSubmit}
              disabled={isCreating}
            >
              {isCreating && <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-sm" />}
              <span>Schedule Follow-up</span>
            </button>
          </div>
        }
      >
        <form className="space-y-4 pt-1 font-inter">
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <Icon icon="heroicons-outline:tag" className="text-sm text-primary-500" />
              <span>Follow-up Type</span>
            </label>
            <Select
              options={FOLLOWUP_TYPES}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <Icon icon="heroicons-outline:calendar-days" className="text-sm text-primary-500" />
              <span>
                Date & Time <span className="text-rose-500">*</span>
              </span>
            </label>
            <div className="relative">
              <Icon
                icon="heroicons-outline:calendar-days"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none z-10"
              />
              <Flatpickr
                className="w-full pl-9 pr-9 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-inter cursor-pointer"
                value={formData.scheduledAt}
                onChange={(dates) => {
                  if (dates && dates.length > 0) {
                    setFormData({ ...formData, scheduledAt: dates });
                  }
                }}
                options={{
                  enableTime: true,
                  dateFormat: "d M Y h:i K",
                  time_24hr: false,
                  minDate: dayjs().startOf("day").toDate(),
                }}
              />
              <Icon
                icon="heroicons-outline:clock"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none z-10"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <Icon icon="heroicons-outline:pencil-square" className="text-sm text-primary-500" />
              <span>Discussion Notes</span>
            </label>
            <Textarea
              placeholder="What needs to be discussed or planned?"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <Icon icon="heroicons-outline:bell" className="text-sm text-primary-500" />
              <span>Email Reminders</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reminders.tenMin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reminders: { ...formData.reminders, tenMin: e.target.checked },
                    })
                  }
                  className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">10 minutes before</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reminders.fiveMin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reminders: { ...formData.reminders, fiveMin: e.target.checked },
                    })
                  }
                  className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">5 minutes before</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reminders.exact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reminders: { ...formData.reminders, exact: e.target.checked },
                    })
                  }
                  className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">At scheduled time</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default LeadFollowUps;
