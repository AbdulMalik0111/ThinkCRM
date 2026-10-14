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
      className="max-w-xl font-inter"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 font-inter">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Project Name <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Master Bedroom Wardrobe & Vanity"
              className="w-full h-11 px-3.5 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Project Type <span className="text-danger-500">*</span>
            </label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-full h-11 px-3.5 pr-10 text-sm font-semibold border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition cursor-pointer"
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
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Budget (₹)
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 350000"
              className="w-full h-11 px-3.5 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-11 px-3.5 pr-10 text-sm font-semibold border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Project Lead / Staff
            </label>
            <select
              value={assignedStaff}
              onChange={(e) => setAssignedStaff(e.target.value)}
              className="w-full h-11 px-3.5 pr-10 text-sm font-semibold border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition cursor-pointer"
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
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-11 px-3.5 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Target Completion
            </label>
            <input
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
              className="w-full h-11 px-3.5 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Description / Scope
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Provide brief scope details, finishes, and requirements..."
              className="w-full min-h-[96px] p-3.5 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition resize-y"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs md:text-sm font-semibold transition"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs md:text-sm font-semibold transition disabled:opacity-60"
            disabled={isLoading}
          >
            {isLoading && <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-sm" />}
            <span>{isLoading ? "Adding..." : "Add Project"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProjectModal;
