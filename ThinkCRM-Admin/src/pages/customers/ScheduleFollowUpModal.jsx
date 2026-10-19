import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import { useCreateCustomerFollowUpMutation } from "@/store/api/customers/customersApiSlice";
import { useGetStaffQuery } from "@/store/api/management/managementApiSlice";
import { validateText, validateDate, focusFirstError } from "@/utils/validation";
import dayjs from "dayjs";

const ScheduleFollowUpModal = ({ isOpen, onClose, customer, leads = [] }) => {
  const [type, setType] = useState("call");
  const [date, setDate] = useState(dayjs().add(1, "day").format("YYYY-MM-DD"));
  const [time, setTime] = useState("10:00");
  const [priority, setPriority] = useState("medium");
  const [assignedTo, setAssignedTo] = useState(customer?.assignedStaff?._id || customer?.assignedStaff || "");
  const [leadId, setLeadId] = useState(leads?.[0]?._id || "");
  const [notes, setNotes] = useState("");
  const [reminders, setReminders] = useState({
    tenMin: true,
    fiveMin: true,
    exactTime: true,
  });
  const [errors, setErrors] = useState({});

  const { data: staffData } = useGetStaffQuery({ limit: 100 });
  const staffList = staffData?.data?.users || staffData?.data?.staff || [];

  const [createCustomerFollowUp, { isLoading }] = useCreateCustomerFollowUpMutation();

  const handleFieldChange = (setter, field) => (e) => {
    setter(e.target.value);
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    const dateVal = validateDate(date, { required: true, label: "Scheduled Date" });
    if (!dateVal.isValid) newErrors.date = dateVal.error;

    if (!time || !time.trim()) {
      newErrors.time = "Please specify a scheduled time";
    }

    if (notes && notes.length > 2000) {
      newErrors.notes = "Notes cannot exceed 2000 characters";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      focusFirstError(newErrors);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const scheduledAt = new Date(`${date}T${time}:00`);
    if (isNaN(scheduledAt.getTime())) {
      setErrors({ date: "Please enter a valid calendar date and time" });
      return;
    }

    try {
      await createCustomerFollowUp({
        id: customer._id,
        data: {
          type,
          scheduledAt,
          priority,
          leadId: leadId || undefined,
          notes: notes.trim() || undefined,
          assignedTo: assignedTo || undefined,
          reminder10mSent: !reminders.tenMin,
          reminder5mSent: !reminders.fiveMin,
          reminder0mSent: !reminders.exactTime,
        },
      }).unwrap();

      toast.success("Follow-up scheduled successfully!");
      setErrors({});
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to schedule follow-up");
    }
  };

  return (
    <Modal
      title="Schedule Follow-up"
      activeModal={isOpen}
      onClose={onClose}
      className="max-w-xl font-inter"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Customer Header Info */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 uppercase font-semibold">Customer:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 ml-1.5">{customer?.fullName}</span>
          </div>
          <div className="text-slate-500 font-medium">
            {customer?.phone}
          </div>
        </div>

        {/* Connected Lead selector when available */}
        {leads && leads.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Related Lead / Requirement
            </label>
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full h-11 px-3.5 pr-10 text-sm font-semibold border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition cursor-pointer"
            >
              <option value="">General Follow-up (Customer Level)</option>
              {leads.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.projectType || "Project"} — {l.leadId || "Lead"} (Status: {l.status})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Type <span className="text-danger-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full h-11 px-3.5 pr-10 text-sm font-semibold border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition cursor-pointer"
              required
            >
              <option value="call">Phone Call</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="site_visit">Site Visit</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full h-11 px-3.5 pr-10 text-sm font-semibold border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Date <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <Icon
                icon="heroicons-outline:calendar-days"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none z-10"
              />
              <input
                id="date"
                type="date"
                value={date}
                onChange={handleFieldChange(setDate, "date")}
                className={`w-full h-11 pl-10 pr-3.5 text-sm font-medium border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition cursor-pointer ${
                  errors.date
                    ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-300 dark:border-slate-600 focus:ring-primary-500/20 focus:border-primary-500"
                }`}
              />
            </div>
            {errors.date && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.date}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Time <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <Icon
                icon="heroicons-outline:clock"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none z-10"
              />
              <input
                id="time"
                type="time"
                value={time}
                onChange={handleFieldChange(setTime, "time")}
                className={`w-full h-11 pl-10 pr-3.5 text-sm font-medium border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition cursor-pointer ${
                  errors.time
                    ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-300 dark:border-slate-600 focus:ring-primary-500/20 focus:border-primary-500"
                }`}
              />
            </div>
            {errors.time && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.time}</p>
            )}
          </div>
        </div>

        {/* Assigned Staff */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Assign Staff Member
          </label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full h-11 px-3.5 pr-10 text-sm font-semibold border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition cursor-pointer"
          >
            <option value="">Default (Customer's assigned staff / self)</option>
            {staffList.map((st) => (
              <option key={st._id} value={st._id}>
                {st.firstName} {st.lastName} ({st.role || "Staff"})
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Notes / Agenda
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={handleFieldChange(setNotes, "notes")}
            rows={3}
            placeholder="e.g. Discuss material samples and revision 2 of floor plan..."
            className={`w-full min-h-[96px] p-3.5 text-sm font-medium border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition resize-y ${
              errors.notes
                ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-500"
                : "border-slate-300 dark:border-slate-600 focus:ring-primary-500/20 focus:border-primary-500"
            }`}
          />
          {errors.notes && (
            <p className="text-xs text-rose-500 mt-1 font-medium">{errors.notes}</p>
          )}
        </div>

        {/* Reminders */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-semibold uppercase text-slate-500 block">
            Automated Reminders
          </label>
          <div className="flex flex-wrap gap-4 text-xs text-slate-700 dark:text-slate-300">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={reminders.tenMin}
                onChange={(e) => setReminders({ ...reminders, tenMin: e.target.checked })}
                className="rounded text-blue-600"
              />
              <span>10m before</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={reminders.fiveMin}
                onChange={(e) => setReminders({ ...reminders, fiveMin: e.target.checked })}
                className="rounded text-blue-600"
              />
              <span>5m before</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={reminders.exactTime}
                onChange={(e) => setReminders({ ...reminders, exactTime: e.target.checked })}
                className="rounded text-blue-600"
              />
              <span>At scheduled time</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs md:text-sm font-semibold transition"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs md:text-sm font-semibold transition disabled:opacity-60"
            disabled={isLoading}
          >
            {isLoading && <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-sm" />}
            <span>{isLoading ? "Scheduling..." : "Schedule Follow-up"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ScheduleFollowUpModal;
