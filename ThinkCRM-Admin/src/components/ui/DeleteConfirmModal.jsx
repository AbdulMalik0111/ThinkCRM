import React from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  entityName = "this record",
  message = "Are you sure you want to delete this item? Historical activities and associated records will be preserved in accordance with CRM policies.",
  isLoading = false,
  confirmText = "Delete",
}) => {
  return (
    <Modal
      title=""
      activeModal={isOpen}
      onClose={isLoading ? () => {} : onClose}
      className="max-w-md font-inter"
      noFade={false}
    >
      <div className="text-center pt-2 pb-4 space-y-4">
        {/* Warning Icon Container */}
        <div className="h-14 w-14 rounded-full bg-red-50 dark:bg-red-950/40 text-danger-500 border border-red-200 dark:border-red-800 flex items-center justify-center mx-auto shadow-sm">
          <Icon icon="heroicons-outline:exclamation-triangle" className="text-2xl" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">
            &ldquo;{entityName}&rdquo;
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <Button
            type="button"
            text="Cancel"
            className="btn-outline-dark text-xs px-5 py-2.5"
            onClick={onClose}
            disabled={isLoading}
          />
          <Button
            type="button"
            text={isLoading ? "Deleting..." : confirmText}
            className="btn-danger text-xs px-5 py-2.5 font-semibold"
            isLoading={isLoading}
            disabled={isLoading}
            onClick={onConfirm}
          />
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;
