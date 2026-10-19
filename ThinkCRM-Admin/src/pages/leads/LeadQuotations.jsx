import React, { useState, useRef } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import Loading from "@/components/Loading";
import Flatpickr from "react-flatpickr";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useGetLeadQuotationsQuery, useCreateQuotationMutation, useSendQuotationMutation } from "@/store/api/interactions/interactionsApiSlice";

const LeadQuotations = ({ leadId }) => {
  const { data, isLoading, refetch } = useGetLeadQuotationsQuery(leadId);
  const [createQuotation, { isLoading: isCreating }] = useCreateQuotationMutation();
  const [sendQuotation, { isLoading: isSending }] = useSendQuotationMutation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      toast.error("Please select a file to upload");
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
      dataPayload.append("notes", formData.notes || "");
      dataPayload.append("message", formData.notes || "");
      if (formData.validUntil) {
        dataPayload.append("validUntil", new Date(formData.validUntil).toISOString());
      }
      
      const details = {
        amount: amountVal,
        totalAmount: amountVal,
        quotationNumber,
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
      toast.error(err?.data?.message || "Failed to upload quotation");
    }
  };

  const handleSend = async (quotationId) => {
    if (window.confirm("Are you sure you want to send this quotation to the customer?")) {
      try {
        await sendQuotation({ leadId, quotationId }).unwrap();
        toast.success("Quotation sent successfully");
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || "Failed to send quotation");
      }
    }
  };

  return (
    <Card
      title="Quotations"
      headerSlot={
        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-none transition cursor-pointer"
        >
          <Icon icon="heroicons-outline:arrow-up-tray" className="text-sm" />
          <span>Upload Quotation</span>
        </button>
      }
    >
      {quotations.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <Icon icon="heroicons-outline:document-text" className="mx-auto text-4xl mb-2 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No quotations uploaded yet</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Upload a proposal or price estimate PDF to share with the customer.</p>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-none transition cursor-pointer"
          >
            <Icon icon="heroicons-outline:arrow-up-tray" className="text-sm" />
            <span>Upload Quotation</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {quotations.map((q) => (
            <div key={q._id} className="border border-slate-200 dark:border-slate-700 p-4 rounded-lg flex flex-col sm:flex-row gap-4 justify-between items-start">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl shrink-0">
                  <Icon icon="heroicons:document-text" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    Quotation #{q.quotationNumber}
                    <Badge label={q.status} className={`${q.status === 'sent' ? 'bg-success-100 text-success-600' : q.status === 'accepted' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'} capitalize text-[10px]`} />
                  </h5>
                  <p className="text-xs text-slate-500 mt-1">
                    Amount: ₹{q.totalAmount?.toLocaleString()} | Uploaded: {dayjs(q.createdAt).format("MMM D, YYYY")}
                  </p>
                  {q.notes && <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{q.notes}</p>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0 w-full sm:w-auto">
                <a href={q.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm w-full sm:w-auto text-center inline-flex items-center justify-center gap-2">
                  <Icon icon="heroicons:eye" /> View File
                </a>
                {q.status === 'draft' && (
                  <Button className="btn-success btn-sm w-full sm:w-auto" text="Send to Customer" onClick={() => handleSend(q._id)} disabled={isSending} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        activeModal={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Quotation"
        footerContent={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs md:text-sm font-semibold transition font-inter"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs md:text-sm font-semibold transition disabled:opacity-60 font-inter"
              onClick={handleSubmit}
              disabled={isCreating}
            >
              {isCreating && <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-sm" />}
              <span>Upload Quotation</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4 pt-1 font-inter">
          {/* File Upload Box */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
              <Icon icon="heroicons-outline:document-arrow-up" className="text-sm text-emerald-600 dark:text-emerald-400" />
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
                <Icon icon="heroicons-outline:cloud-arrow-up" className="text-3xl text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Click to select quotation file
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG (Max 15MB)</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Total Amount */}
            <div>
              <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                <Icon icon="heroicons-outline:currency-rupee" className="text-sm text-emerald-600 dark:text-emerald-400" />
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
                <Icon icon="heroicons-outline:hashtag" className="text-sm text-emerald-600 dark:text-emerald-400" />
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
              <Icon icon="heroicons-outline:calendar-days" className="text-sm text-emerald-600 dark:text-emerald-400" />
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
              <Icon icon="heroicons-outline:pencil-square" className="text-sm text-emerald-600 dark:text-emerald-400" />
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
    </Card>
  );
};

export default LeadQuotations;
