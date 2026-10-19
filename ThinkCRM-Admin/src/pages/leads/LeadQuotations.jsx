import React, { useState, useRef } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import Loading from "@/components/Loading";
import Flatpickr from "react-flatpickr";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  useGetLeadQuotationsQuery,
  useCreateQuotationMutation,
  useSendQuotationMutation,
  useDeleteQuotationMutation,
} from "@/store/api/interactions/interactionsApiSlice";

const LeadQuotations = ({ leadId, lead }) => {
  const { data, isLoading, refetch } = useGetLeadQuotationsQuery(leadId);
  const [createQuotation, { isLoading: isCreating }] = useCreateQuotationMutation();
  const [sendQuotation, { isLoading: isSending }] = useSendQuotationMutation();
  const [deleteQuotation, { isLoading: isDeleting }] = useDeleteQuotationMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmSendQuotation, setConfirmSendQuotation] = useState(null);
  const [confirmDeleteQuotation, setConfirmDeleteQuotation] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    quotationNumber: `QT-${Date.now().toString().slice(-6)}`,
    totalAmount: "",
    validUntil: dayjs().add(30, "day").format("YYYY-MM-DD"),
    notes: "",
    file: null,
  });

  if (isLoading) return <Loading />;

  const quotations = data?.data?.quotations || [];

  const handleOpenModal = () => {
    setFormData({
      quotationNumber: `QT-${Date.now().toString().slice(-6)}`,
      totalAmount: "",
      validUntil: dayjs().add(30, "day").format("YYYY-MM-DD"),
      notes: "",
      file: null,
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      toast.error("Please select a quotation file (PDF or image) to upload");
      return;
    }

    try {
      const quotationNumber = formData.quotationNumber || `QT-${Date.now().toString().slice(-6)}`;
      const amountVal = Number(formData.totalAmount) || 0;

      const dataPayload = new FormData();
      dataPayload.append("file", formData.file);
      dataPayload.append("amount", amountVal);
      dataPayload.append("totalAmount", amountVal);
      dataPayload.append("quotationNumber", quotationNumber);
      dataPayload.append("customerName", lead?.fullName || "Valued Customer");
      dataPayload.append("customerEmail", lead?.email || "");
      dataPayload.append("notes", formData.notes || "");
      dataPayload.append("message", formData.notes || "");
      if (formData.validUntil) {
        dataPayload.append("validUntil", new Date(formData.validUntil).toISOString());
      }

      const details = {
        amount: amountVal,
        totalAmount: amountVal,
        quotationNumber,
        customerName: lead?.fullName || "Valued Customer",
        customerEmail: lead?.email || "",
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined,
        notes: formData.notes,
        message: formData.notes,
      };

      dataPayload.append("data", JSON.stringify(details));

      await createQuotation({
        leadId,
        formData: dataPayload,
      }).unwrap();

      toast.success("Quotation uploaded successfully");
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to upload quotation");
    }
  };

  const getFullFileUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    const backendOrigin = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5050/api/v1")
      .replace(/\/api\/v1\/?$/, "");
    return `${backendOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleViewFile = (rawUrl) => {
    const fullUrl = getFullFileUrl(rawUrl);
    if (!fullUrl) {
      toast.warning("No file document attached to this quotation");
      return;
    }
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  const handleConfirmSend = async () => {
    if (!confirmSendQuotation) return;
    try {
      await sendQuotation({
        leadId,
        quotationId: confirmSendQuotation._id,
      }).unwrap();
      toast.success("Quotation sent to customer successfully");
      setConfirmSendQuotation(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to send quotation");
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteQuotation) return;
    try {
      await deleteQuotation({
        leadId,
        quotationId: confirmDeleteQuotation._id,
      }).unwrap();
      toast.success("Quotation deleted successfully");
      setConfirmDeleteQuotation(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to delete quotation");
    }
  };

  return (
    <Card
      title="Quotations"
      headerSlot={
        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-lg text-xs font-semibold shadow-none transition cursor-pointer font-inter"
        >
          <Icon icon="heroicons-outline:arrow-up-tray" className="text-sm" />
          <span>Upload Quotation</span>
        </button>
      }
    >
      {quotations.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-inter">
          <Icon
            icon="heroicons-outline:document-text"
            className="mx-auto text-4xl mb-2.5 text-slate-300 dark:text-slate-600"
          />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No quotations uploaded yet
          </p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Upload a proposal or price estimate PDF to share with the customer.
          </p>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-none transition cursor-pointer font-inter"
          >
            <Icon icon="heroicons-outline:arrow-up-tray" className="text-sm" />
            <span>Upload Quotation</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5 font-inter">
          {quotations.map((q) => {
            const fileUrl = q.uploadedFile?.url || q.fileUrl || q.url;
            const amountVal =
              q.amount !== undefined ? q.amount : (q.totalAmount !== undefined ? q.totalAmount : 0);
            const fileName = q.uploadedFile?.fileName;
            const isSent = q.status === "sent";
            const isDraft = q.status === "draft" || !q.status;

            return (
              <div
                key={q._id}
                className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
              >
                {/* Left side: Icon + Information */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0 font-bold border border-indigo-100 dark:border-indigo-900/40">
                    <Icon icon="heroicons-outline:document-text" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="text-[14.5px] font-bold text-slate-900 dark:text-white font-inter">
                        Quotation #{q.quotationNumber}
                      </h5>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border capitalize font-inter ${
                          isSent
                            ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800"
                            : q.status === "accepted"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                            : q.status === "rejected"
                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                            : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {q.status || "Draft"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[12.5px] text-slate-500 dark:text-slate-400 font-inter flex-wrap">
                      <span>
                        Amount:{" "}
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          ₹{Number(amountVal).toLocaleString("en-IN")}
                        </span>
                      </span>
                      <span>•</span>
                      <span>Uploaded: {dayjs(q.createdAt).format("DD MMM YYYY")}</span>
                      {q.validUntil && (
                        <>
                          <span>•</span>
                          <span>Valid until {dayjs(q.validUntil).format("DD MMM YYYY")}</span>
                        </>
                      )}
                    </div>

                    {fileName && (
                      <div className="pt-0.5">
                        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 max-w-sm truncate">
                          <Icon
                            icon="heroicons-outline:paper-clip"
                            className="text-xs flex-shrink-0 text-slate-400"
                          />
                          <span className="truncate">{fileName}</span>
                        </span>
                      </div>
                    )}

                    {(q.notes || q.message) && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 pt-1 line-clamp-2 italic font-inter">
                        "{q.notes || q.message}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right side: Modern Redesigned Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap shrink-0 sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleViewFile(fileUrl)}
                    disabled={!fileUrl}
                    className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border text-xs font-semibold shadow-sm transition font-inter ${
                      fileUrl
                        ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400 opacity-60 cursor-not-allowed"
                    }`}
                    title={fileUrl ? "View quotation PDF document" : "No document attached"}
                  >
                    <Icon icon="heroicons-outline:eye" className="text-base text-slate-500" />
                    <span>View File</span>
                  </button>

                  {isDraft && (
                    <button
                      type="button"
                      onClick={() => setConfirmSendQuotation(q)}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition cursor-pointer font-inter shadow-emerald-500/10"
                    >
                      <Icon icon="heroicons-outline:paper-airplane" className="text-sm" />
                      <span>Send To Customer</span>
                    </button>
                  )}

                  {isSent && (
                    <span className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-semibold select-none font-inter">
                      <Icon
                        icon="heroicons-outline:check-circle"
                        className="text-base text-sky-600 dark:text-sky-400"
                      />
                      <span>Sent {q.sentAt ? dayjs(q.sentAt).format("DD MMM") : ""}</span>
                    </span>
                  )}

                  {/* Delete Quotation Button */}
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteQuotation(q)}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800 text-xs font-semibold shadow-sm transition cursor-pointer"
                    title="Delete quotation"
                  >
                    <Icon icon="heroicons-outline:trash" className="text-base" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Quotation Modal */}
      <Modal
        activeModal={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Quotation"
        footerContent={
          <div className="flex justify-end gap-3 font-inter">
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs md:text-sm font-semibold transition"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs md:text-sm font-semibold transition disabled:opacity-60 cursor-pointer"
              onClick={handleSubmit}
              disabled={isCreating}
            >
              {isCreating && (
                <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-sm" />
              )}
              <span>Upload Quotation</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4 pt-1 font-inter">
          {/* File Upload Box */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
              <Icon
                icon="heroicons-outline:document-arrow-up"
                className="text-sm text-emerald-600 dark:text-emerald-400"
              />
              <span>
                Quotation Document (PDF / Image) <span className="text-rose-500">*</span>
              </span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,image/*,.doc,.docx"
              className="hidden"
            />
            {formData.file ? (
              <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    icon="heroicons-outline:document-arrow-up"
                    className="text-xl text-emerald-600 flex-shrink-0"
                  />
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
                  className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                  title="Remove file"
                >
                  <Icon icon="heroicons-outline:trash" className="text-base" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <Icon
                  icon="heroicons-outline:cloud-arrow-up"
                  className="text-3xl text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5"
                />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Click to select quotation file
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supports PDF, PNG, JPG (Max 15MB)
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Total Amount */}
            <div>
              <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                <Icon
                  icon="heroicons-outline:currency-rupee"
                  className="text-sm text-emerald-600 dark:text-emerald-400"
                />
                <span>
                  Total Amount (₹) <span className="text-rose-500">*</span>
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold text-sm pointer-events-none select-none">
                  ₹
                </span>
                <input
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  placeholder="e.g., 250000"
                  className="w-full pl-8 pr-3 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-inter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  required
                />
              </div>
            </div>

            {/* Quotation Number */}
            <div>
              <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                <Icon
                  icon="heroicons-outline:hashtag"
                  className="text-sm text-emerald-600 dark:text-emerald-400"
                />
                <span>Quotation #</span>
              </label>
              <div className="relative">
                <Icon
                  icon="heroicons-outline:hashtag"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none z-10"
                />
                <input
                  type="text"
                  value={formData.quotationNumber}
                  onChange={(e) => setFormData({ ...formData, quotationNumber: e.target.value })}
                  placeholder="QT-00123"
                  className="w-full pl-9 pr-3 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-inter"
                />
              </div>
            </div>
          </div>

          {/* Valid Until Date using Flatpickr */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
              <Icon
                icon="heroicons-outline:calendar-days"
                className="text-sm text-emerald-600 dark:text-emerald-400"
              />
              <span>Valid Until</span>
            </label>
            <div className="relative">
              <Icon
                icon="heroicons-outline:calendar-days"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none z-10"
              />
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
                className="w-full pl-9 pr-3 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-inter cursor-pointer"
                placeholder="Select expiry date"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
              <Icon
                icon="heroicons-outline:pencil-square"
                className="text-sm text-emerald-600 dark:text-emerald-400"
              />
              <span>Proposal Notes / Summary</span>
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Quotation including 18% GST and 5-year hardware warranty..."
              className="w-full px-3.5 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-inter"
            />
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal for Sending to Customer (Popup, NOT window.confirm/alert) */}
      {confirmSendQuotation && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden text-center shadow-2xl font-inter">
            {/* Header close button */}
            <div className="flex justify-end p-3 pb-0">
              <button
                type="button"
                onClick={() => setConfirmSendQuotation(null)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Icon icon="heroicons-outline:x" className="text-xl" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 pt-1 flex flex-col items-center">
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-900/40 shadow-sm">
                <Icon icon="heroicons-outline:paper-airplane" className="text-3xl" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-inter mb-1">
                Send Quotation to Customer
              </h3>
              <p className="text-[13px] text-slate-500 font-inter mb-4">
                Are you sure you want to send this quotation? The proposal details and PDF document will be emailed directly to the customer.
              </p>

              {/* Summary Card */}
              <div className="w-full bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3.5 mb-5 border border-slate-100 dark:border-slate-800 text-left font-inter space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Quotation #:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {confirmSendQuotation.quotationNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Amount:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ₹{Number(confirmSendQuotation.amount ?? confirmSendQuotation.totalAmount ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Recipient:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[210px]">
                    {confirmSendQuotation.customerEmail || lead?.email || "No email on lead"}
                  </span>
                </div>
                {confirmSendQuotation.uploadedFile?.fileName && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Document:</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[210px]">
                      {confirmSendQuotation.uploadedFile.fileName}
                    </span>
                  </div>
                )}
              </div>

              {/* Warning if no email */}
              {!confirmSendQuotation.customerEmail && !lead?.email && (
                <div className="w-full p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs mb-4 text-left font-medium flex items-center gap-2">
                  <Icon icon="heroicons-outline:exclamation-triangle" className="text-base flex-shrink-0" />
                  <span>No customer email address on file. Please add an email to the lead before sending.</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setConfirmSendQuotation(null)}
                  disabled={isSending}
                  className="flex-1 px-4 py-2.5 text-[13.5px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition font-inter cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSend}
                  disabled={isSending}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13.5px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition disabled:opacity-60 font-inter cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  {isSending ? (
                    <>
                      <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-sm" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon="heroicons-outline:paper-airplane" className="text-sm" />
                      <span>Confirm & Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Quotation (Popup, NOT window.confirm/alert) */}
      {confirmDeleteQuotation && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden text-center shadow-2xl font-inter">
            {/* Header close button */}
            <div className="flex justify-end p-3 pb-0">
              <button
                type="button"
                onClick={() => setConfirmDeleteQuotation(null)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Icon icon="heroicons-outline:x" className="text-xl" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 pt-1 flex flex-col items-center">
              <div className="h-16 w-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 border border-rose-100 dark:border-rose-900/40 shadow-sm">
                <Icon icon="heroicons-outline:trash" className="text-3xl" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-inter mb-1">
                Delete Quotation
              </h3>
              <p className="text-[13px] text-slate-500 font-inter mb-4">
                Are you sure you want to delete quotation <span className="font-bold text-slate-800 dark:text-slate-200">#{confirmDeleteQuotation.quotationNumber}</span>? This action cannot be undone.
              </p>

              {/* Quotation Info */}
              <div className="w-full bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 mb-5 border border-slate-100 dark:border-slate-800 text-left font-inter space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Amount:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ₹{Number(confirmDeleteQuotation.amount ?? confirmDeleteQuotation.totalAmount ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>
                {confirmDeleteQuotation.uploadedFile?.fileName && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Document:</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[210px]">
                      {confirmDeleteQuotation.uploadedFile.fileName}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteQuotation(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 text-[13.5px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition font-inter cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13.5px] font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition disabled:opacity-60 font-inter cursor-pointer shadow-md shadow-rose-500/20"
                >
                  {isDeleting ? (
                    <>
                      <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-sm" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon="heroicons-outline:trash" className="text-sm" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default LeadQuotations;
