import React from "react";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";

/**
 * Shared confirmation modal for state-changing or action confirmations
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this action?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmType = "primary", // "danger", "primary", "success", "dark"
  isLoading = false,
}) => {
  const isDanger = confirmType === "danger";

  return (
    <Modal
      activeModal={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={title}
      className="max-w-[460px] font-inter"
      centered={true}
    >
      <div className="space-y-4 pt-1">
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs md:text-sm font-semibold transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs md:text-sm font-semibold transition disabled:opacity-60 ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700 active:bg-rose-800"
                : "bg-primary-600 hover:bg-primary-700 active:bg-primary-800"
            }`}
          >
            {isLoading && <Icon icon="heroicons-outline:arrow-path" className="text-sm animate-spin" />}
            <span>{isLoading ? "Processing..." : confirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
