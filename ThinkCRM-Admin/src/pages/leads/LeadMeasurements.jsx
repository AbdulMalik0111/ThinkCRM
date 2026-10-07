import React, { useState } from "react";
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
import { useGetLeadMeasurementsQuery, useCreateMeasurementMutation } from "@/store/api/interactions/interactionsApiSlice";

const LeadMeasurements = ({ leadId }) => {
  const { data, isLoading, refetch } = useGetLeadMeasurementsQuery(leadId);
  const [createMeasurement, { isLoading: isCreating }] = useCreateMeasurementMutation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    scheduledAt: [new Date()],
    notes: "",
  });

  if (isLoading) return <Loading />;
  
  const measurements = data?.data?.measurements || [];

  const handleOpenModal = () => {
    setFormData({ scheduledAt: [new Date()], notes: "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createMeasurement({
        leadId,
        data: {
          scheduledAt: formData.scheduledAt[0].toISOString(),
          notes: formData.notes,
        }
      }).unwrap();
      toast.success("Measurement scheduled");
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to schedule measurement");
    }
  };

  return (
    <Card title="Measurements" headerslot={<Button text="Schedule" icon="heroicons:plus" className="btn-primary btn-sm" onClick={handleOpenModal} />}>
      {measurements.length === 0 ? (
        <div className="text-center py-5 text-slate-500">No measurements scheduled.</div>
      ) : (
        <div className="space-y-4">
          {measurements.map((m) => (
            <div key={m._id} className="border border-slate-200 dark:border-slate-700 p-4 rounded-lg flex justify-between items-start">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-xl shrink-0">
                  <Icon icon="heroicons:ruler" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    Measurement Visit
                    <Badge label={m.status} className={`${m.status === 'completed' ? 'bg-success-100 text-success-600' : 'bg-warning-100 text-warning-600'} capitalize text-[10px]`} />
                  </h5>
                  <p className="text-xs text-slate-500 mt-1">
                    Scheduled: {dayjs(m.scheduledAt).format("MMM D, YYYY h:mm A")}
                  </p>
                  {m.notes && <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{m.notes}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal activeModal={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Measurement" footerContent={
        <div className="flex justify-end gap-3">
          <Button text="Cancel" className="btn-light" onClick={() => setIsModalOpen(false)} />
          <Button text="Schedule" className="btn-primary" onClick={handleSubmit} disabled={isCreating} />
        </div>
      }>
        <form className="space-y-4">
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
            placeholder="Any specific instructions for the measurer?"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </form>
      </Modal>
    </Card>
  );
};

export default LeadMeasurements;
