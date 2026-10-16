import React from "react";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";
import { useDeleteLeadMutation } from "@/store/api/leads/leadsApiSlice";

const DeleteLeadModal = ({ isOpen, lead, onClose, onSuccess }) => {
  const [deleteLead, { isLoading }] = useDeleteLeadMutation();

  if (!isOpen || !lead) return null;

  const handleDelete = async () => {
    try {
      await deleteLead(lead._id).unwrap();
      toast.success("Lead deleted successfully");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete lead");
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden text-center shadow-none">
        {/* Header close button */}
        <div className="flex justify-end p-3 pb-0">
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <Icon icon="heroicons-outline:x" className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-1 flex flex-col items-center">
          {/* Circular Red Trash Icon */}
          <div className="h-16 w-16 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 flex items-center justify-center mb-4">
            <Icon icon="heroicons-outline:trash" className="text-3xl" />
          </div>

          <h3 className="text-lg font-bold text-slate-800 dark:text-white font-inter mb-1">
            Delete Lead
          </h3>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-inter mb-2">
            Are you sure you want to delete this lead?
          </h4>
          <p className="text-[13px] text-slate-500 font-inter max-w-xs mb-6">
            This action cannot be undone. All follow-ups, notes and related data for <span className="font-semibold text-slate-700 dark:text-slate-300">{lead.fullName}</span> will be permanently removed.
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-[13.5px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition font-inter"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-[13.5px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition font-inter disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Icon icon="heroicons-outline:refresh" className="animate-spin text-base" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete Lead</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteLeadModal;
