import React, { useState, useRef } from "react";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";
import { useUploadLeadDocumentMutation } from "@/store/api/leads/leadsApiSlice";

const DOCUMENT_CATEGORIES = [
  "Floor Plan",
  "Site Photo",
  "Architectural Drawing",
  "Specification Sheet",
  "Agreement / Contract",
  "Measurement Sheet",
  "Client Reference",
  "Other",
];

const UploadLeadDocumentModal = ({ isOpen, lead, onClose, onSuccess }) => {
  const [uploadLeadDocument, { isLoading }] = useUploadLeadDocumentMutation();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "Floor Plan",
    file: null,
  });

  const [errors, setErrors] = useState({});

  if (!isOpen || !lead) return null;

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFormData((prev) => ({
        ...prev,
        file: selectedFile,
        name: prev.name.trim() ? prev.name : selectedFile.name.replace(/\.[^/.]+$/, ""),
      }));
      if (errors.file) {
        setErrors((prev) => ({ ...prev, file: null }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Please enter a document name or title";
    }
    if (!formData.file) {
      newErrors.file = "Please select a file to upload";
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
      payload.append("name", formData.name.trim());
      payload.append("type", formData.category);
      payload.append("category", formData.category);

      await uploadLeadDocument({
        leadId: lead._id,
        formData: payload,
      }).unwrap();

      toast.success("Document uploaded successfully");
      setFormData({ name: "", category: "Floor Plan", file: null });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to upload document");
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn font-inter">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold border border-teal-100 dark:border-teal-900/40">
              <Icon icon="heroicons-outline:paper-clip" className="text-xl" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white font-inter">
                Upload Lead Document
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Attach project drawings, site photos, or floor plans for {lead.fullName}
              </p>
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
          {/* File Picker Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Select Document File <span className="text-rose-500">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                formData.file
                  ? "border-teal-500 bg-teal-50/20 dark:bg-teal-950/20"
                  : errors.file
                  ? "border-rose-400 bg-rose-50/20 dark:bg-rose-950/20"
                  : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 bg-slate-50/50 dark:bg-slate-900/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.png,.jpg,.jpeg,.dwg,.doc,.docx,.xls,.xlsx"
              />

              {formData.file ? (
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl mb-2">
                    <Icon icon="heroicons-outline:document-check" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                    {formData.file.name}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    {(formData.file.size / 1024).toFixed(1)} KB • Click to change file
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xl mb-2">
                    <Icon icon="heroicons-outline:cloud-arrow-up" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Click to browse or drag and drop
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Supports PDF, CAD drawings, images, and documents
                  </span>
                </div>
              )}
            </div>
            {errors.file && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.file}</p>}
          </div>

          {/* Document Title / Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Document Title / Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: null });
              }}
              placeholder="e.g. Master Bedroom Floor Plan v1"
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none transition font-inter ${
                errors.name
                  ? "border-rose-400 focus:border-rose-500"
                  : "border-slate-200 dark:border-slate-700 focus:border-primary-500"
              }`}
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.name}</p>}
          </div>

          {/* Document Category / Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Document Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500 transition font-inter"
            >
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-[13.5px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition font-inter cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 text-[13.5px] font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition shadow-none font-inter disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-base" />
                  <span>Uploading...</span>
                </>
              ) : (
                <span>Upload Document</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadLeadDocumentModal;
