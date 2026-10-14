import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";
import { useAddCustomerDocumentMutation } from "@/store/api/customers/customersApiSlice";

const UploadDocumentModal = ({ isOpen, onClose, customerId }) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Agreement");
  const [fileUrl, setFileUrl] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fileType, setFileType] = useState("application/pdf");
  const [fileName, setFileName] = useState("");

  const [addCustomerDocument, { isLoading }] = useAddCustomerDocumentMutation();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      if (!name) setName(file.name);
      setFileSize(file.size);
      setFileType(file.type || "application/pdf");
      // Read data URL or simulated storage link
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Document title is required");
      return;
    }
    if (!fileUrl) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      await addCustomerDocument({
        id: customerId,
        documentData: {
          name: name.trim(),
          category,
          url: fileUrl,
          fileType,
          size: fileSize,
        },
      }).unwrap();

      toast.success("Document uploaded successfully!");
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to upload document");
    }
  };

  return (
    <Modal
      title="Upload Customer Document"
      activeModal={isOpen}
      onClose={onClose}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div>
          <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1">
            Document Title <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Signed Service Agreement"
            className="form-control text-sm"
            required
          />
        </div>

        <div>
          <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-control text-sm"
          >
            <option value="Agreement">Agreement / Contract</option>
            <option value="Quotation">Quotation</option>
            <option value="Site Photos">Site / Project Photos</option>
            <option value="Design Files">Design & Drawings</option>
            <option value="Invoice">Invoice / Payment Receipt</option>
            <option value="Other">Other Document</option>
          </select>
        </div>

        {/* File Dropzone */}
        <div>
          <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1">
            File Attachment <span className="text-danger-500">*</span>
          </label>
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-5 text-center bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition-colors cursor-pointer relative">
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              required
            />
            <Icon icon="heroicons:arrow-up-tray" className="mx-auto text-2xl text-slate-400 mb-2" />
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {fileName ? (
                <span className="font-bold text-blue-600 dark:text-blue-400">{fileName}</span>
              ) : (
                <>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">Click to upload</span> or drag and drop
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">PDF, DOC, PNG, JPG, or ZIP (max 10MB)</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <Button
            type="button"
            text="Cancel"
            className="btn-outline-dark text-xs py-2 px-4"
            onClick={onClose}
          />
          <Button
            type="submit"
            text={isLoading ? "Uploading..." : "Upload File"}
            className="btn-primary bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-5 font-semibold"
            isLoading={isLoading}
            disabled={isLoading}
          />
        </div>
      </form>
    </Modal>
  );
};

export default UploadDocumentModal;
