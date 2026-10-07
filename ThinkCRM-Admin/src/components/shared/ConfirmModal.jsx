import React from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

/**
 * Shared confirmation modal for destructive or state-changing actions
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this action?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmType = "danger", // "danger", "primary", "success", "dark"
  isLoading = false
}) => {
  return (
    <Modal
      activeModal={isOpen}
      onClose={onClose}
      title={title}
      centered
    >
      <div className="space-y-4">
        <p className="text-slate-600 dark:text-slate-300 text-sm">
          {message}
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button 
            text={cancelText} 
            className="btn-outline-dark" 
            onClick={onClose} 
            disabled={isLoading}
          />
          <Button 
            text={isLoading ? "Processing..." : confirmText} 
            className={`btn-${confirmType}`} 
            onClick={onConfirm} 
            disabled={isLoading}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
