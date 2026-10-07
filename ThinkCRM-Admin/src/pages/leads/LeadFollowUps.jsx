import React, { useState } from "react";
import { useParams } from "react-router-dom";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Loading from "@/components/Loading";
import Flatpickr from "react-flatpickr";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useGetLeadFollowUpsQuery, useCreateFollowUpMutation, useUpdateFollowUpMutation } from "@/store/api/leads/followupApiSlice";

const FOLLOWUP_TYPES = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "site_visit", label: "Site Visit" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "other", label: "Other" },
];

const LeadFollowUps = ({ leadId }) => {
  const { data, isLoading, refetch } = useGetLeadFollowUpsQuery(leadId);
  const [createFollowUp, { isLoading: isCreating }] = useCreateFollowUpMutation();
  const [updateFollowUp, { isLoading: isUpdating }] = useUpdateFollowUpMutation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "call",
    scheduledAt: [new Date()],
    notes: "",
  });

  if (isLoading) return <Loading />;
  
  const followUps = data?.data?.followUps || [];

  const handleOpenModal = () => {
    setFormData({ type: "call", scheduledAt: [new Date()], notes: "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createFollowUp({
        leadId,
        data: {
          type: formData.type,
          scheduledAt: formData.scheduledAt[0].toISOString(),
          notes: formData.notes,
        }
      }).unwrap();
      toast.success("Follow-up scheduled");
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to schedule follow-up");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateFollowUp({
        id,
        data: { status }
      }).unwrap();
      toast.success(`Follow-up marked as ${status}`);
      refetch();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  return (
    <Card title="Follow-ups" headerslot={<Button text="Schedule" icon="heroicons:plus" className="btn-primary btn-sm" onClick={handleOpenModal} />}>
      {followUps.length === 0 ? (
        <div className="text-center py-5 text-slate-500">No follow-ups scheduled.</div>
      ) : (
        <div className="space-y-4">
          {followUps.map((fu) => (
            <div key={fu._id} className="border border-slate-200 dark:border-slate-700 p-4 rounded-lg flex flex-col sm:flex-row gap-4 justify-between items-start">
              <div className="flex gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xl shrink-0 ${fu.status === 'completed' ? 'bg-success-100 text-success-600' : fu.status === 'cancelled' ? 'bg-danger-100 text-danger-600' : 'bg-blue-100 text-blue-600'}`}>
                  <Icon icon={
                    fu.type === 'call' ? 'heroicons:phone' : 
                    fu.type === 'email' ? 'heroicons:envelope' : 
                    fu.type === 'meeting' ? 'heroicons:user-group' : 
                    fu.type === 'whatsapp' ? 'heroicons:chat-bubble-left-ellipsis' : 'heroicons:calendar'
                  } />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                    {fu.type.replace('_', ' ')}
                    {fu.status === 'pending' && dayjs(fu.scheduledAt).isBefore(dayjs()) && (
                      <Badge label="Overdue" className="bg-danger-500 text-white text-[10px]" />
                    )}
                  </h5>
                  <p className="text-xs text-slate-500 mt-1">
                    Scheduled: {dayjs(fu.scheduledAt).format("MMM D, YYYY h:mm A")}
                  </p>
                  {fu.notes && <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{fu.notes}</p>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0 w-full sm:w-auto">
                <Badge label={fu.status} className={`${fu.status === 'completed' ? 'bg-success-100 text-success-600' : fu.status === 'cancelled' ? 'bg-danger-100 text-danger-600' : 'bg-warning-100 text-warning-600'} capitalize w-fit`} />
                {fu.status === 'pending' && (
                  <div className="flex gap-2 mt-2 w-full sm:w-auto">
                    <Button className="btn-success btn-sm w-full sm:w-auto" text="Complete" onClick={() => handleStatusChange(fu._id, 'completed')} />
                    <Button className="btn-danger btn-sm w-full sm:w-auto" text="Cancel" onClick={() => handleStatusChange(fu._id, 'cancelled')} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal activeModal={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Follow-up" footerContent={
        <div className="flex justify-end gap-3">
          <Button text="Cancel" className="btn-light" onClick={() => setIsModalOpen(false)} />
          <Button text="Schedule" className="btn-primary" onClick={handleSubmit} disabled={isCreating} />
        </div>
      }>
        <form className="space-y-4">
          <Select
            label="Type"
            options={FOLLOWUP_TYPES}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />
          <div>
            <label className="form-label">Date & Time</label>
            <Flatpickr
              className="form-control py-2"
              data-enable-time
              value={formData.scheduledAt}
              onChange={(date) => setFormData({ ...formData, scheduledAt: date })}
              options={{ minDate: "today" }}
            />
          </div>
          <Textarea
            label="Notes"
            placeholder="What needs to be discussed?"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </form>
      </Modal>
    </Card>
  );
};

export default LeadFollowUps;
