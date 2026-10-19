import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import { useCreateCustomerFollowUpMutation } from "@/store/api/customers/customersApiSlice";
import { useGetStaffQuery } from "@/store/api/management/managementApiSlice";
import dayjs from "dayjs";

const ScheduleFollowUpModal = ({ isOpen, onClose, customer }) => {
  const [type, setType] = useState("call");
  const [date, setDate] = useState(dayjs().add(1, "day").format("YYYY-MM-DD"));
  const [time, setTime] = useState("10:00");
  const [priority, setPriority] = useState("medium");
  const [assignedTo, setAssignedTo] = useState(customer?.assignedStaff?._id || customer?.assignedStaff || "");
  const [notes, setNotes] = useState("");
  const [reminders, setReminders] = useState({
    tenMin: true,
    fiveMin: true,
    exactTime: true,
  });

  const { data: staffData } = useGetStaffQuery({ limit: 100 });
  const staffList = staffData?.data?.users || staffData?.data?.staff || [];

  const [createCustomerFollowUp, { isLoading }] = useCreateCustomerFollowUpMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error("Please pick a scheduled date and time");
      return;
    }

    const scheduledAt = new Date(`${date}T${time}:00`);

    try {
      await createCustomerFollowUp({
        id: customer._id,
        data: {
          type,
          scheduledAt,
          priority,
          notes: notes.trim() || undefined,
          assignedTo: assignedTo || undefined,
          reminder10mSent: !reminders.tenMin,
          reminder5mSent: !reminders.fiveMin,
          reminder0mSent: !reminders.exactTime,
        },
      }).unwrap();

      toast.success("Follow-up scheduled successfully!");
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

        {/* Type & Priority */}
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
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 pl-10 pr-3.5 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition cursor-pointer"
                required
              />
            </div>
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
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-11 pl-10 pr-3.5 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition cursor-pointer"
                required
              />
            </div>
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
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Discuss material samples and revision 2 of floor plan..."
            className="w-full min-h-[96px] p-3.5 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition resize-y"
          />
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
