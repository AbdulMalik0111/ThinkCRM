import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import Loading from "@/components/Loading";
import Flatpickr from "react-flatpickr";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  useGetLeadMeasurementsQuery,
  useCreateMeasurementMutation,
  useUpdateMeasurementMutation,
} from "@/store/api/interactions/interactionsApiSlice";

const LeadMeasurements = ({ leadId }) => {
  const { data, isLoading, refetch } = useGetLeadMeasurementsQuery(leadId);
  const [createMeasurement, { isLoading: isCreating }] = useCreateMeasurementMutation();
  const [updateMeasurement, { isLoading: isUpdating }] = useUpdateMeasurementMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState(null);
  const [formData, setFormData] = useState({
    scheduledAt: [new Date()],
    notes: "",
  });

  if (isLoading) return <Loading />;

  const measurements = data?.data?.measurements || [];

  // Determine overall 3-condition status
  const hasCompleted = measurements.some((m) => m.status === "completed");
  const hasScheduled = measurements.some(
    (m) => m.status === "scheduled" || (m.status === "pending" && m.scheduledAt)
  );

  let currentCondition = "not_started";
  if (hasCompleted) {
    currentCondition = "done";
  } else if (hasScheduled) {
    currentCondition = "scheduled";
  }

  const handleOpenScheduleModal = (meas = null) => {
    if (meas) {
      setEditingMeasurement(meas);
      setFormData({
        scheduledAt: meas.scheduledAt ? [dayjs(meas.scheduledAt).toDate()] : [new Date()],
        notes: meas.notes || "",
      });
    } else {
      setEditingMeasurement(null);
      setFormData({ scheduledAt: [new Date()], notes: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const scheduledDate =
        formData.scheduledAt && formData.scheduledAt[0]
          ? formData.scheduledAt[0].toISOString()
          : new Date().toISOString();

      if (editingMeasurement) {
        await updateMeasurement({
          id: editingMeasurement._id,
          leadId,
          data: {
            scheduledAt: scheduledDate,
            notes: formData.notes || "",
            status: "scheduled",
          },
        }).unwrap();
        toast.success("Measurement visit rescheduled successfully");
      } else {
        await createMeasurement({
          leadId,
          data: {
            scheduledAt: scheduledDate,
            notes: formData.notes || "",
          },
        }).unwrap();
        toast.success("Measurement scheduled successfully");
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to schedule measurement");
    }
  };

  const handleMarkAsDone = async (measurementId) => {
    try {
      await updateMeasurement({
        id: measurementId,
        leadId,
        data: { status: "completed" },
      }).unwrap();
      toast.success("Measurement marked as Done!");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update measurement");
    }
  };

  const handleMarkDirectDone = async () => {
    try {
      await createMeasurement({
        leadId,
        data: {
          scheduledAt: new Date().toISOString(),
          status: "completed",
          notes: "Measurement completed / Floor plan verified",
        },
      }).unwrap();
      toast.success("Measurement marked as Done!");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create measurement record");
    }
  };

  const handleReopen = async (measurementId) => {
    try {
      await updateMeasurement({
        id: measurementId,
        leadId,
        data: { status: "scheduled" },
      }).unwrap();
      toast.success("Measurement status reopened to Scheduled");
      refetch();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6 font-inter">
      {/* 3-Condition Measurement Pipeline Stepper */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/80">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Site Measurement Status
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              Current Condition:{" "}
              {currentCondition === "done" && (
                <span className="text-emerald-600 font-extrabold">Done / Completed</span>
              )}
              {currentCondition === "scheduled" && (
                <span className="text-blue-600 font-extrabold">Scheduled</span>
              )}
              {currentCondition === "not_started" && (
                <span className="text-slate-500 font-bold">Not Started (Default)</span>
              )}
            </h4>
          </div>

          <div className="flex items-center gap-2">
            {currentCondition === "not_started" && (
              <button
                type="button"
                onClick={handleMarkDirectDone}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition cursor-pointer"
                title="Mark measurement as completed directly"
              >
                <Icon icon="heroicons-outline:check" className="text-sm text-emerald-600" />
                <span>Quick Mark as Done</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenScheduleModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-none transition cursor-pointer"
            >
              <Icon icon="heroicons-outline:calendar" className="text-sm" />
              <span>Schedule Measurement</span>
            </button>
          </div>
        </div>

        {/* Visual 3-Stage Progress Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Condition 1: Not Started */}
          <div
            className={`p-3.5 rounded-xl border transition ${
              currentCondition === "not_started"
                ? "bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 ring-2 ring-slate-400/20"
                : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/60 opacity-80"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  currentCondition === "not_started"
                    ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}
              >
                1
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                  Not Started
                </span>
                <span className="block text-[11px] text-slate-500 font-medium">
                  Default initial condition
                </span>
              </div>
            </div>
          </div>

          {/* Condition 2: Scheduled */}
          <div
            className={`p-3.5 rounded-xl border transition ${
              currentCondition === "scheduled"
                ? "bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20"
                : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/60 opacity-80"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  currentCondition === "scheduled"
                    ? "bg-blue-600 text-white"
                    : currentCondition === "done"
                    ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}
              >
                2
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                  Scheduled
                </span>
                <span className="block text-[11px] text-slate-500 font-medium">
                  Measurement booked
                </span>
              </div>
            </div>
          </div>

          {/* Condition 3: Done */}
          <div
            className={`p-3.5 rounded-xl border transition ${
              currentCondition === "done"
                ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20"
                : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/60 opacity-80"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  currentCondition === "done"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}
              >
                3
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                  Done / Completed
                </span>
                <span className="block text-[11px] text-slate-500 font-medium">
                  Measurements captured
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Measurement List Card */}
      <Card
        title="Measurement Visits"
        headerSlot={
          <button
            type="button"
            onClick={() => handleOpenScheduleModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-none transition cursor-pointer"
          >
            <Icon icon="heroicons-outline:plus" className="text-sm" />
            <span>Schedule Measurement</span>
          </button>
        }
      >
        {measurements.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Icon
              icon="heroicons-outline:scale"
              className="mx-auto text-4xl mb-2 text-slate-300 dark:text-slate-600"
            />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Not Started - No measurement scheduled yet
            </p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Schedule a technician or design expert visit to capture site dimensions accurately.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenScheduleModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-none transition cursor-pointer"
              >
                <Icon icon="heroicons-outline:plus" className="text-sm" />
                <span>Schedule Measurement</span>
              </button>
              <button
                type="button"
                onClick={handleMarkDirectDone}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <Icon icon="heroicons-outline:check" className="text-sm text-emerald-600" />
                <span>Mark as Done (Already taken)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {measurements.map((m) => {
              const isDone = m.status === "completed";
              return (
                <div
                  key={m._id}
                  className={`border rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-start transition ${
                    isDone
                      ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        isDone
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                      }`}
                    >
                      <Icon icon={isDone ? "heroicons-outline:check-circle" : "heroicons-outline:scale"} />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Measurement Visit</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            isDone
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          }`}
                        >
                          {isDone ? "Done / Completed" : "Scheduled"}
                        </span>
                      </h5>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Scheduled: {dayjs(m.scheduledAt).format("MMM D, YYYY h:mm A")}
                        {m.assignedTo && (
                          <span className="ml-2 text-slate-600 dark:text-slate-300 font-semibold">
                            • Assigned: {m.assignedTo.firstName} {m.assignedTo.lastName}
                          </span>
                        )}
                      </p>
                      {m.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60">
                          {m.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions per measurement item */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {!isDone ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleMarkAsDone(m._id)}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          <Icon icon="heroicons-outline:check" className="text-sm" />
                          <span>Mark as Done</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenScheduleModal(m)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          <Icon icon="heroicons-outline:pencil-square" className="text-sm" />
                          <span>Reschedule</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReopen(m._id)}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        <Icon icon="heroicons-outline:arrow-path" className="text-sm" />
                        <span>Re-open</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Schedule / Reschedule Modal */}
        <Modal
          activeModal={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingMeasurement ? "Reschedule Measurement Visit" : "Schedule Site Measurement"}
          centered={true}
          footerContent={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs md:text-sm font-semibold transition cursor-pointer"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs md:text-sm font-semibold transition disabled:opacity-60 cursor-pointer"
                onClick={handleSubmit}
                disabled={isCreating || isUpdating}
              >
                {(isCreating || isUpdating) && (
                  <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-sm" />
                )}
                <span>{editingMeasurement ? "Update Schedule" : "Schedule Measurement"}</span>
              </button>
            </div>
          }
        >
          <form className="space-y-4 pt-1 font-inter">
            <div>
              <label className="form-label text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Date & Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Icon
                  icon="heroicons-outline:calendar-days"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none z-10"
                />
                <Flatpickr
                  className="form-control py-2.5 pl-10 pr-10 font-inter cursor-pointer text-sm"
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
            <Textarea
              label="Notes / Site Instructions"
              placeholder="e.g. Bring laser meter, client wants measurement of kitchen & master bedroom..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </form>
        </Modal>
      </Card>
    </div>
  );
};

export default LeadMeasurements;
