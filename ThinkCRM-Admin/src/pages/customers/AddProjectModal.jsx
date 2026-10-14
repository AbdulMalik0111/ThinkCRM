import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import { useAddCustomerProjectMutation } from "@/store/api/customers/customersApiSlice";
import { useGetStaffQuery } from "@/store/api/management/managementApiSlice";
import dayjs from "dayjs";

const AddProjectModal = ({ isOpen, onClose, customerId }) => {
  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState("Modular Kitchen");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("active");
  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [completionDate, setCompletionDate] = useState("");
  const [description, setDescription] = useState("");
  const [assignedStaff, setAssignedStaff] = useState("");

  const { data: staffData } = useGetStaffQuery({ limit: 100 });
  const staffList = staffData?.data?.users || staffData?.data?.staff || [];

  const [addCustomerProject, { isLoading }] = useAddCustomerProjectMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName.trim() || !projectType.trim()) {
      toast.error("Project name and type are required");
      return;
    }

    try {
      await addCustomerProject({
        id: customerId,
        projectData: {
          projectName: projectName.trim(),
          projectType: projectType.trim(),
          budget: Number(budget) || 0,
          status,
          startDate: startDate ? new Date(startDate) : new Date(),
          completionDate: completionDate ? new Date(completionDate) : undefined,
          description: description.trim() || undefined,
          assignedStaff: assignedStaff || undefined,
        },
      }).unwrap();

      toast.success("Project added successfully!");
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add project");
    }
  };

  return (
    <Modal
      title="Add New Project"
      activeModal={isOpen}
      onClose={onClose}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1">
              Project Name <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Master Bedroom Wardrobe & Vanity"
              className="form-control text-sm"
              required
            />
          </div>

          <div>
            <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1">
              Project Type <span className="text-danger-500">*</span>
            </label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="form-control text-sm"
              required
            >
              <option value="Modular Kitchen">Modular Kitchen</option>
              <option value="Wardrobe">Wardrobe</option>
              <option value="Full Home">Full Home</option>
              <option value="Office Interior">Office Interior</option>
              <option value="Living Room">Living Room</option>
              <option value="Renovation">Renovation</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1">
              Budget (₹)
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 350000"
              className="form-control text-sm"
            />
          </div>

          <div>
            <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-control text-sm"
            >
              <option value="active">Active</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div>
            <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1">
              Project Lead / Staff
            </label>
            <select
              value={assignedStaff}
              onChange={(e) => setAssignedStaff(e.target.value)}
              className="form-control text-sm"
            >
              <option value="">Unassigned</option>
              {staffList.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.firstName} {st.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-control text-sm"
            />
          </div>

          <div>
            <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1">
              Target Completion
            </label>
            <input
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
              className="form-control text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1">
              Description / Scope
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Provide brief scope details, finishes, and requirements..."
              className="form-control text-sm"
            />
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
            text={isLoading ? "Adding..." : "Add Project"}
            className="btn-primary bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-5 font-semibold"
            isLoading={isLoading}
            disabled={isLoading}
          />
        </div>
      </form>
    </Modal>
  );
};

export default AddProjectModal;
