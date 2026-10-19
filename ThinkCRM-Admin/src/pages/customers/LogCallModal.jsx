import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import { useLogCustomerCallMutation } from "@/store/api/customers/customersApiSlice";
import { validateNumber, focusFirstError } from "@/utils/validation";

const LogCallModal = ({ isOpen, onClose, customer, leads = [], onSuccess }) => {
  const [outcome, setOutcome] = useState("connected");
  const [duration, setDuration] = useState(5);
  const [leadId, setLeadId] = useState(leads?.[0]?._id || "");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});

  const [logCustomerCall, { isLoading }] = useLogCustomerCallMutation();

  if (!customer) return null;

  const validate = () => {
    const newErrors = {};

    const durVal = validateNumber(duration, {
      required: false,
      min: 0,
      max: 1440,
      label: "Duration",
    });
    if (!durVal.isValid) newErrors.duration = durVal.error;

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

    try {
      await logCustomerCall({
        customerId: customer._id,
        data: {
          outcome,
          duration: Number(duration) || 0,
          leadId: leadId || undefined,
          notes: notes.trim(),
        },
      }).unwrap();

      toast.success("Phone call interaction logged successfully!");
      setErrors({});
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to log call interaction");
    }
  };

  return (
    <Modal
      title="Log Phone Call"
      activeModal={isOpen}
      onClose={onClose}
      className="max-w-md font-inter"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 font-inter">
        {/* Customer Header Info */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 uppercase font-semibold">Customer:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 ml-1.5">{customer?.fullName}</span>
          </div>
          <div className="text-slate-600 dark:text-slate-300 font-semibold">
            {customer?.phone || "No phone"}
          </div>
        </div>

        {/* Outcome */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Call Outcome <span className="text-danger-500">*</span>
          </label>
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className="w-full h-10 px-3 text-xs font-semibold border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition cursor-pointer"
            required
          >
            <option value="connected">Connected / Spoke with Client</option>
            <option value="callback_requested">Callback Requested</option>
            <option value="busy">Line Busy</option>
            <option value="no_answer">No Answer / Rang Out</option>
            <option value="wrong_number">Wrong Number</option>
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Call Duration (Minutes)
          </label>
          <input
            id="duration"
            type="number"
            min="0"
            max="1440"
            value={duration}
            onChange={(e) => {
              setDuration(e.target.value);
              if (errors.duration) setErrors((prev) => ({ ...prev, duration: null }));
            }}
            className={`w-full h-10 px-3 text-xs font-medium border rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 transition ${
              errors.duration
                ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-500"
                : "border-slate-300 dark:border-slate-600 focus:ring-primary-500/20 focus:border-primary-500"
            }`}
          />
          {errors.duration && (
            <p className="text-xs text-rose-500 mt-1 font-medium">{errors.duration}</p>
          )}
        </div>

        {/* Connected Lead selector */}
        {leads && leads.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Related Lead / Requirement
            </label>
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full h-10 px-3 text-xs font-semibold border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition cursor-pointer"
            >
              <option value="">General (Customer Level)</option>
              {leads.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.projectType || "Project"} — {l.leadId || "Lead"}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Conversation Notes & Summary
          </label>
          <textarea
            id="notes"
            rows="3"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              if (errors.notes) setErrors((prev) => ({ ...prev, notes: null }));
            }}
            placeholder="Key discussion points, objections, next steps or meeting agreements..."
            className={`w-full p-2.5 text-xs font-medium border rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 transition ${
              errors.notes
                ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-500"
                : "border-slate-300 dark:border-slate-600 focus:ring-primary-500/20 focus:border-primary-500"
            }`}
          />
          {errors.notes && (
            <p className="text-xs text-rose-500 mt-1 font-medium">{errors.notes}</p>
          )}
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition font-inter"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition font-inter disabled:opacity-50 cursor-pointer"
          >
            {isLoading && <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-sm" />}
            <span>{isLoading ? "Saving..." : "Log Call Interaction"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LogCallModal;
