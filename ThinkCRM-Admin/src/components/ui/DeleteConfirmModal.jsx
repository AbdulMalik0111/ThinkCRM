import React from "react";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";

/**
 * Universal ThinkCRM Delete Confirmation Modal
 * Replicates exact design from user's reference screenshot:
 * - Clean white header with title & close button
 * - Soft red rounded circular icon badge with trash icon
 * - Prominent bold confirmation question
 * - Subtitle explaining permanent deletion
 * - High-contrast warning alert banner ("This action cannot be undone. Please confirm to continue.")
 * - Right-aligned cancel and solid red delete buttons
 */
const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Record",
  entityName = "",
  entityType = "",
  message = null,
  isLoading = false,
  confirmText = "Delete Customer",
}) => {
  // Derive entity type if not explicitly passed
  const derivedType =
    entityType ||
    (title.toLowerCase().includes("customer")
      ? "customer"
      : title.toLowerCase().includes("lead")
      ? "lead"
      : title.toLowerCase().includes("staff")
      ? "staff account"
      : title.toLowerCase().includes("note")
      ? "note"
      : title.toLowerCase().includes("document")
      ? "document"
      : "record");

  const question =
    entityName && entityName !== "this record" && entityName !== "this item"
      ? `Are you sure you want to delete this ${derivedType}?`
      : `Are you sure you want to delete this ${derivedType}?`;

  const description =
    message ||
    `This ${derivedType} will be permanently deleted from the system along with their historical records, project data, communications, notes, and documents.`;

  return (
    <Modal
      title={title}
      activeModal={isOpen}
      onClose={isLoading ? () => {} : onClose}
      className="max-w-[480px] font-inter"
      noFade={false}
      centered={true}
    >
      <div className="pt-2 pb-1">
        {/* Centered Soft Red Circular Badge with Trash Icon */}
        <div className="h-16 w-16 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center mx-auto mb-4">
          <Icon icon="heroicons-outline:trash" className="text-2xl text-rose-500" />
        </div>

        {/* Centered Question */}
        <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white text-center mb-2 px-2">
          {question}
        </h3>

        {/* Centered Explanation with 'permanently deleted' highlighted */}
        <p className="text-xs md:text-[13px] text-slate-500 dark:text-slate-400 text-center max-w-md mx-auto mb-5 leading-relaxed">
          {description.includes("permanently deleted") ? (
            <>
              {description.split("permanently deleted")[0]}
              <strong className="font-semibold text-slate-700 dark:text-slate-200">
                permanently deleted
              </strong>
              {description.split("permanently deleted")[1]}
            </>
          ) : (
            description
          )}
        </p>

        {/* Warning Alert Banner Box */}
        <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl p-3.5 flex items-center gap-3 text-left mb-6">
          <div className="h-7 w-7 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
            <Icon icon="heroicons-outline:information-circle" className="text-lg text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
              This action cannot be undone.
            </p>
            <p className="text-xs text-rose-500/90 dark:text-rose-400/80 mt-0.5">
              Please confirm to continue.
            </p>
          </div>
        </div>

        {/* Right-Aligned Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs md:text-sm font-semibold transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs md:text-sm font-semibold transition disabled:opacity-60"
          >
            <Icon
              icon={isLoading ? "heroicons-outline:arrow-path" : "heroicons-outline:trash"}
              className={`text-base ${isLoading ? "animate-spin" : ""}`}
            />
            <span>{isLoading ? "Deleting..." : confirmText || "Delete"}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;
