import React, { useState, useRef } from "react";
import Icon from "@/components/ui/Icon";
import Flatpickr from "react-flatpickr";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useCreateQuotationMutation } from "@/store/api/interactions/interactionsApiSlice";

const UploadQuotationModal = ({ isOpen, lead, onClose, onSuccess }) => {
  const [createQuotation, { isLoading }] = useCreateQuotationMutation();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    quotationNumber: `QT-${Date.now().toString().slice(-6)}`,
    amount: "",
    validUntil: dayjs().add(30, "day").format("YYYY-MM-DD"),
    message: "",
    file: null,
  });

  const [errors, setErrors] = useState({});

  if (!isOpen || !lead) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFormData((prev) => ({ ...prev, file: selectedFile }));
      if (errors.file) {
        setErrors((prev) => ({ ...prev, file: null }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }
    if (!formData.file) {
      newErrors.file = "Please select a quotation document (PDF or image)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = new FormData();
      payload.append("file", formData.file);
      payload.append("quotationNumber", formData.quotationNumber || `QT-${Date.now().toString().slice(-6)}`);
      payload.append("amount", Number(formData.amount));
      payload.append("totalAmount", Number(formData.amount));
      payload.append("customerName", lead.fullName || "Valued Customer");
      payload.append("customerEmail", lead.email || "");
      payload.append("message", formData.message.trim());
      payload.append("notes", formData.message.trim());
      if (formData.validUntil) {
        payload.append("validUntil", dayjs(formData.validUntil).toISOString());
      }

      // Also append as JSON data string in case backend routes parse req.body.data
      payload.append(
        "data",
        JSON.stringify({
          quotationNumber: formData.quotationNumber,
          amount: Number(formData.amount),
          totalAmount: Number(formData.amount),
          customerName: lead.fullName || "Valued Customer",
          customerEmail: lead.email || "",
          message: formData.message.trim(),
          notes: formData.message.trim(),
          validUntil: formData.validUntil ? dayjs(formData.validUntil).toISOString() : undefined,
        })
      );

      await createQuotation({
        leadId: lead._id,
        formData: payload,
      }).unwrap();

      toast.success("Quotation uploaded successfully");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to upload quotation");
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Icon icon="heroicons-outline:document-text" className="text-lg" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white font-inter">
                Upload Quotation
              </h3>
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
          {/* File Upload Box */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
              Quotation Document (PDF / Image) <span className="text-rose-500">*</span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,image/*,.doc,.docx"
              className="hidden"
            />
            {formData.file ? (
              <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon icon="heroicons-outline:document-arrow-up" className="text-xl text-emerald-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                      {formData.file.name}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {(formData.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, file: null }))}
                  className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                  title="Remove file"
                >
                  <Icon icon="heroicons-outline:trash" className="text-base" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition ${
                  errors.file
                    ? "border-rose-400 bg-rose-50/20"
                    : "border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                <Icon icon="heroicons-outline:cloud-arrow-up" className="text-3xl text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Click to select quotation file
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG (Max 15MB)</p>
              </div>
            )}
            {errors.file && <p className="text-xs text-rose-500 mt-1 font-inter">{errors.file}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Amount */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                Total Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="e.g., 250000"
                  className={`w-full pl-7 pr-3 py-2 text-[13.5px] rounded-lg border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none font-inter ${
                    errors.amount ? "border-rose-400" : "border-slate-200 dark:border-slate-700"
                  }`}
                />
              </div>
              {errors.amount && <p className="text-xs text-rose-500 mt-1 font-inter">{errors.amount}</p>}
            </div>

            {/* Quotation Number */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                Quotation #
              </label>
              <input
                type="text"
                name="quotationNumber"
                value={formData.quotationNumber}
                onChange={handleChange}
                placeholder="QT-00123"
                className="w-full px-3 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none font-inter"
              />
            </div>
          </div>

          {/* Valid Until Date */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
              Valid Until
            </label>
            <Flatpickr
              value={formData.validUntil ? dayjs(formData.validUntil).toDate() : ""}
              onChange={([d]) => {
                if (d) {
                  setFormData((prev) => ({
                    ...prev,
                    validUntil: dayjs(d).format("YYYY-MM-DD"),
                  }));
                } else {
                  setFormData((prev) => ({ ...prev, validUntil: "" }));
                }
              }}
              options={{
                dateFormat: "d M Y",
                minDate: dayjs().toDate(),
              }}
              className="w-full px-3 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none font-inter"
              placeholder="Select expiry date"
            />
          </div>

          {/* Message / Notes */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
              Proposal Notes / Summary
            </label>
            <textarea
              rows={2}
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Quotation including 18% GST and 5-year hardware warranty..."
              className="w-full px-3.5 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-inter"
            />
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
            className="flex items-center gap-2 px-5 py-2 text-[13.5px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-none font-inter disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Icon icon="heroicons-outline:refresh" className="animate-spin text-base" />
                <span>Uploading...</span>
              </>
            ) : (
              <span>Upload Quotation</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadQuotationModal;
