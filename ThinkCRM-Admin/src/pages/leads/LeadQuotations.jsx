import React, { useState, useRef } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import Loading from "@/components/Loading";
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
    totalAmount: "",
    validUntil: "",
    notes: "",
    file: null,
  });

  if (isLoading) return <Loading />;
  
  const quotations = data?.data?.quotations || [];

  const handleOpenModal = () => {
    setFormData({ totalAmount: "", validUntil: "", notes: "", file: null });
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
      const dataPayload = new FormData();
      dataPayload.append("file", formData.file);
      
      const details = {
        totalAmount: Number(formData.totalAmount),
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined,
        notes: formData.notes,
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
    <Card title="Quotations" headerslot={<Button text="Upload New" icon="heroicons:arrow-up-tray" className="btn-primary btn-sm" onClick={handleOpenModal} />}>
      {quotations.length === 0 ? (
        <div className="text-center py-5 text-slate-500">No quotations uploaded.</div>
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

      <Modal activeModal={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Quotation" footerContent={
        <div className="flex justify-end gap-3">
          <Button text="Cancel" className="btn-light" onClick={() => setIsModalOpen(false)} />
          <Button text="Upload" className="btn-primary" onClick={handleSubmit} disabled={isCreating} />
        </div>
      }>
        <form className="space-y-4">
          <div>
            <label className="form-label">Quotation File (PDF/Image) *</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="form-control py-2 border border-slate-200 dark:border-slate-700 w-full rounded"
              accept=".pdf,.png,.jpg,.jpeg"
              required
            />
          </div>
          <Textinput
            label="Total Amount (₹) *"
            type="number"
            value={formData.totalAmount}
            onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
            placeholder="e.g. 150000"
            required
          />
          <div>
            <label className="form-label">Valid Until</label>
            <input
              type="date"
              className="form-control py-2"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            />
          </div>
          <Textarea
            label="Notes"
            placeholder="Any additional remarks..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </form>
      </Modal>
    </Card>
  );
};

export default LeadQuotations;
