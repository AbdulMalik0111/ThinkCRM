import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";
import { useConvertLeadToCustomerMutation } from "@/store/api/leads/leadsApiSlice";

const ConvertLeadModal = ({ isOpen, lead, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [convertLead, { isLoading }] = useConvertLeadToCustomerMutation();
  const [createCustomerRecord, setCreateCustomerRecord] = useState(true);

  if (!isOpen || !lead) return null;

  const handleConvert = async () => {
    if (isLoading) return;
    try {
      const res = await convertLead(lead._id).unwrap();
      toast.success("Lead converted to customer successfully!");
      if (onSuccess) onSuccess();
      onClose();

      const customerId = res?.data?.customer?._id || res?.data?._id;
      if (customerId) {
        navigate(`/customers/${customerId}`);
      }
    } catch (err) {
      toast.error(err?.data?.message || "Failed to convert lead to customer");
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

        {/* Body */}
        <div className="px-6 pb-6 pt-1 flex flex-col items-center">
          {/* Circular User Icon */}
          <div className="h-16 w-16 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
            <Icon icon="heroicons-outline:user-plus" className="text-3xl" />
          </div>

          <h3 className="text-lg font-bold text-slate-800 dark:text-white font-inter mb-1">
            Convert to Customer
          </h3>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-inter mb-2">
            Convert this lead to a customer?
          </h4>
          <p className="text-[13px] text-slate-500 font-inter max-w-xs mb-5">
            The lead information for <span className="font-semibold text-slate-700 dark:text-slate-300">{lead.fullName}</span> will be moved to customers and you can continue managing their projects.
          </p>

          {/* Checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer mb-6 text-left w-full justify-center">
            <input
              type="checkbox"
              checked={createCustomerRecord}
              onChange={(e) => setCreateCustomerRecord(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 font-inter">
              Create a new customer from this lead
            </span>
          </label>

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
              onClick={handleConvert}
              disabled={isLoading || !createCustomerRecord}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-[13.5px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition font-inter disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Icon icon="heroicons-outline:refresh" className="animate-spin text-base" />
                  <span>Converting...</span>
                </>
              ) : (
                <span>Convert to Customer</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConvertLeadModal;
