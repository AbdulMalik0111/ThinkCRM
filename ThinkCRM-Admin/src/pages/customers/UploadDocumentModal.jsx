import React, { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";
import { apiSlice } from "@/store/api/apiSlice";
import { uploadFileWithProgress } from "@/utils/uploadWithProgress";
import { useAddCustomerDocumentMutation } from "@/store/api/customers/customersApiSlice";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "zip",
  "xls",
  "xlsx",
];

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const UploadDocumentModal = ({ isOpen, onClose, customerId }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Agreement");
  const [customCategory, setCustomCategory] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fileType, setFileType] = useState("application/pdf");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef(null);

  const [addCustomerDocument] = useAddCustomerDocumentMutation();

  const handleProcessFile = (file) => {
    setErrorMsg("");
    if (!file) return;

    // Check size limit
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg("File exceeds the maximum 10MB size limit.");
      toast.error("File size cannot exceed 10MB");
      return;
    }

    // Check file extension
    const ext = file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMsg(`Unsupported file type (.${ext}). Supported: PDF, DOCX, PNG, JPG, ZIP, XLSX.`);
      toast.error(`Unsupported file type: .${ext}`);
      return;
    }

    setFileName(file.name);
    setSelectedFile(file);
    if (!name) {
      // Auto-populate document title without extension
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setName(baseName);
    }
    setFileSize(file.size);
    setFileType(file.type || "application/octet-stream");

    try {
      setFileUrl(URL.createObjectURL(file));
    } catch (e) {
      setFileUrl(file.name);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    handleProcessFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleProcessFile(file);
  };

  const handleRemoveFile = () => {
    setFileName("");
    setSelectedFile(null);
    setFileUrl("");
    setFileSize(0);
    setFileType("");
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Document title is required");
      return;
    }
    if (!selectedFile && !fileUrl) {
      toast.error("Please attach a document file");
      return;
    }
    if (isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const finalCategory =
        category === "Other" && customCategory?.trim()
          ? customCategory.trim()
          : category;

      const payload = new FormData();
      if (selectedFile) {
        payload.append("file", selectedFile);
      }
      payload.append("name", name.trim());
      payload.append("category", finalCategory);
      payload.append("type", finalCategory);

      await uploadFileWithProgress({
        url: `customers/${customerId}/documents`,
        formData: payload,
        onProgress: (percent) => setUploadProgress(percent),
      });

      dispatch(
        apiSlice.util.invalidateTags([
          { type: "Customer", id: customerId },
          "Dashboard",
        ])
      );

      toast.success("Document uploaded successfully!");
      handleRemoveFile();
      setName("");
      setCustomCategory("");
      onClose();
    } catch (err) {
      toast.error(err?.message || err?.data?.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Modal
      title="Upload Customer Document"
      activeModal={isOpen}
      onClose={onClose}
      className="max-w-xl font-inter"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 font-inter">
        {/* Document Title */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Document Title <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Signed Service Agreement"
            className="w-full h-11 px-3.5 text-[14.5px] font-medium border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-11 px-3.5 pr-10 text-[14.5px] font-semibold border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition cursor-pointer"
          >
            <option value="Agreement">Agreement / Contract</option>
            <option value="Quotation">Quotation / Estimate</option>
            <option value="Site Photos">Site / Project Photos</option>
            <option value="Design Files">Design & Drawings</option>
            <option value="Invoice">Invoice / Payment Receipt</option>
            <option value="Identity Proof">Identity / KYC Proof</option>
            <option value="Other">Other Document</option>
          </select>
        </div>

        {/* Custom Category Input when Other is selected */}
        {category === "Other" && (
          <div className="animate-fadeIn">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Specify Category / Custom Name
            </label>
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="e.g. 3D Render, Material Sample, Elevation..."
              className="w-full h-11 px-3.5 text-[14.5px] font-medium border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-1">
              This custom name will be saved as the document's category.
            </p>
          </div>
        )}

        {/* File Dropzone */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            File Attachment <span className="text-danger-500">*</span>
          </label>

          {!fileName ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-7 text-center transition-all cursor-pointer relative ${
                isDragging
                  ? "border-primary-500 bg-primary-50/50 dark:bg-primary-950/20"
                  : "border-slate-300 dark:border-slate-600 hover:border-primary-500 dark:hover:border-primary-500 bg-slate-50/60 dark:bg-slate-800/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <Icon
                icon="heroicons-outline:cloud-upload"
                className="mx-auto text-4xl text-primary-500 mb-2"
              />
              <div className="text-[14.5px] font-semibold text-slate-700 dark:text-slate-200">
                <span className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
                  Click to upload
                </span>{" "}
                or drag and drop
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                PDF, DOCX, PNG, JPG, or ZIP (auto-compressed on Cloudinary without loss of quality)
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/20 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center flex-shrink-0">
                  <Icon icon="heroicons-outline:document-text" className="text-xl" />
                </div>
                <div className="overflow-hidden">
                  <span className="block font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                    {fileName}
                  </span>
                  <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                    {formatBytes(fileSize)} • Cloudinary high-fidelity compression
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-primary-600 hover:underline px-2 py-1"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-danger-600 hover:bg-white dark:hover:bg-slate-800 transition"
                  title="Remove file"
                >
                  <Icon icon="heroicons-outline:trash" className="text-base" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs font-semibold text-danger-500 mt-1.5">{errorMsg}</p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs md:text-sm font-semibold transition"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="relative overflow-hidden inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs md:text-sm font-semibold transition disabled:opacity-60 min-w-[170px]"
            disabled={isUploading || (!selectedFile && !fileUrl)}
          >
            {isUploading && (
              <div
                className="absolute left-0 top-0 bottom-0 bg-primary-500/40 transition-all duration-150 pointer-events-none"
                style={{ width: `${uploadProgress}%` }}
              />
            )}
            {isUploading ? (
              <div className="relative z-10 flex items-center gap-2">
                <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-sm" />
                <span>{uploadProgress === 100 ? "Processing..." : `Uploading ${uploadProgress}%...`}</span>
              </div>
            ) : (
              <span className="relative z-10">Upload Document</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UploadDocumentModal;
