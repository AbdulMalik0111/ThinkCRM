import React, { useState } from "react";
import Icon from "@/components/ui/Icon";
import Flatpickr from "react-flatpickr";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useCreateFollowUpMutation } from "@/store/api/leads/followupApiSlice";

const FOLLOWUP_TYPES = [
  { value: "call", label: "Call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "site_visit", label: "Site Visit" },
  { value: "other", label: "Other" },
];

const AddFollowUpModal = ({ isOpen, lead, onClose, onSuccess }) => {
  const [createFollowUp, { isLoading }] = useCreateFollowUpMutation();

  const [formData, setFormData] = useState({
    type: "call",
    date: dayjs().format("YYYY-MM-DD"),
    time: dayjs().add(1, "hour").format("HH:mm"),
    notes: "",
    sendReminderNotification: true,
  });

  const [errors, setErrors] = useState({});

  if (!isOpen || !lead) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.time) newErrors.time = "Time is required";
    if (!formData.notes.trim()) newErrors.notes = "Notes are required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const scheduledAt = dayjs(`${formData.date} ${formData.time}`).toISOString();

      await createFollowUp({
        leadId: lead._id,
        data: {
          type: formData.type,
          scheduledAt,
          notes: formData.notes.trim(),
          reminder10mSent: !formData.sendReminderNotification,
          reminder5mSent: !formData.sendReminderNotification,
          reminder0mSent: !formData.sendReminderNotification,
        },
      }).unwrap();

      toast.success("Follow-up scheduled successfully");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to schedule follow-up");
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Icon icon="heroicons-outline:calendar" className="text-lg" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white font-inter">Add Follow-up</h3>
              <p className="text-xs text-slate-500 font-inter">For {lead.fullName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <Icon icon="heroicons-outline:x" className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Follow-up Type */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                Follow-up Type <span className="text-rose-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-inter"
              >
                {FOLLOWUP_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                Date <span className="text-rose-500">*</span>
              </label>
              <Flatpickr
                value={formData.date}
                onChange={([d]) => {
                  if (d) {
                    setFormData((prev) => ({
                      ...prev,
                      date: dayjs(d).format("YYYY-MM-DD"),
                    }));
                  }
                }}
                options={{
                  dateFormat: "d M Y",
                  minDate: dayjs().startOf("day").toDate(),
                }}
                className={`w-full px-3 py-2 text-[13.5px] rounded-lg border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none font-inter ${
                  errors.date ? "border-rose-400" : "border-slate-200 dark:border-slate-700"
                }`}
                placeholder="Select date"
              />
              {errors.date && <p className="text-xs text-rose-500 mt-1 font-inter">{errors.date}</p>}
            </div>

            {/* Time */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-[13.5px] rounded-lg border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none font-inter ${
                  errors.time ? "border-rose-400" : "border-slate-200 dark:border-slate-700"
                }`}
              />
              {errors.time && <p className="text-xs text-rose-500 mt-1 font-inter">{errors.time}</p>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
              Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Discuss kitchen layout and share design ideas..."
              className={`w-full px-3.5 py-2.5 text-[13.5px] rounded-lg border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-inter ${
                errors.notes ? "border-rose-400" : "border-slate-200 dark:border-slate-700"
              }`}
            />
            {errors.notes && <p className="text-xs text-rose-500 mt-1 font-inter">{errors.notes}</p>}
          </div>

          {/* Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="sendReminderNotification"
                checked={formData.sendReminderNotification}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[13.5px] font-medium text-slate-700 dark:text-slate-300 font-inter">
                Send reminder notification
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-[13.5px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition font-inter"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 text-[13.5px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-none font-inter disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Icon icon="heroicons-outline:refresh" className="animate-spin text-base" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Follow-up</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFollowUpModal;
