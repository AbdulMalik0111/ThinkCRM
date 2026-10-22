import React from "react";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { useDeleteLeadMutation } from "@/store/api/leads/leadsApiSlice";
import { toast } from "react-toastify";

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
    <DeleteConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Lead"
      entityName={lead.fullName || "this lead"}
      entityType="lead"
      message={`This lead (${lead.fullName || "Client"}) will be permanently deleted from the system along with their follow-ups, notes, quotations, documents, and activity records.`}
      isLoading={isLoading}
      confirmText="Delete Lead"
    />
  );
};

export default DeleteLeadModal;
