import React, { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import Flatpickr from "react-flatpickr";
import { toast } from "react-toastify";
import { useUpdateLeadMutation } from "@/store/api/leads/leadsApiSlice";
import { useGetStaffQuery } from "@/store/api/management/managementApiSlice";

const SOURCE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "meta_ads", label: "Meta Ads" },
  { value: "referral", label: "Referral" },
  { value: "google_ads", label: "Google Ads" },
  { value: "social_media", label: "Social Media" },
  { value: "direct", label: "Direct" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in_progress", label: "In Progress" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
  { value: "junk", label: "Junk" },
];

const PROJECT_TYPE_OPTIONS = [
  { value: "Modular Kitchen", label: "Modular Kitchen" },
  { value: "Wardrobe Design", label: "Wardrobe Design" },
  { value: "Full Home Interior", label: "Full Home Interior" },
  { value: "Office Interior", label: "Office Interior" },
  { value: "Living Room", label: "Living Room" },
  { value: "Commercial", label: "Commercial" },
  { value: "Renovation", label: "Renovation" },
  { value: "Other", label: "Other" },
];

const BUDGET_OPTIONS = [
  { value: "₹1,00,000 - ₹3,00,000", label: "₹1,00,000 - ₹3,00,000" },
  { value: "₹3,00,000 - ₹5,00,000", label: "₹3,00,000 - ₹5,00,000" },
  { value: "₹5,00,000 - ₹8,00,000", label: "₹5,00,000 - ₹8,00,000" },
  { value: "₹8,00,000 - ₹15,00,000", label: "₹8,00,000 - ₹15,00,000" },
  { value: "₹15,00,000+", label: "₹15,00,000+" },
];

const TIMELINE_OPTIONS = [
  { value: "Immediate", label: "Immediate" },
  { value: "Within 1 month", label: "Within 1 month" },
  { value: "Within 2 months", label: "Within 2 months" },
  { value: "2-4 months", label: "2-4 months" },
  { value: "Flexible", label: "Flexible" },
];

const FOLLOWUP_TYPES = [
  { value: "call", label: "Call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "site_visit", label: "Site Visit" },
];

const EditLeadModal = ({ isOpen, lead, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [updateLead, { isLoading }] = useUpdateLeadMutation();
  const { data: staffData } = useGetStaffQuery({ page: 1, limit: 100 });

  const staffList = staffData?.data?.users || staffData?.data?.staff || [];

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    countryCode: "+91",
    email: "",
    leadSource: "website",
    status: "new",
    projectType: "Modular Kitchen",
    requirement: "",
    assignedTo: "",
    nextFollowUpDate: "",
    nextFollowUpTime: "17:00",
    nextFollowUpType: "call",
    sendReminderNotification: true,
    budgetRange: "₹5,00,000 - ₹8,00,000",
    preferredTimeline: "Within 2 months",
    city: "",
    address: "",
    notes: "",
    priority: "medium",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (lead) {
      let rawPhone = lead.phone || "";
      let cCode = "+91";
      if (rawPhone.startsWith("+91")) {
        cCode = "+91";
        rawPhone = rawPhone.replace("+91", "").trim();
      }

      setFormData({
        fullName: lead.fullName || "",
        phone: rawPhone,
        countryCode: cCode,
        email: lead.email || "",
        leadSource: lead.leadSource || "website",
        status: lead.status || "new",
        projectType: lead.projectType || "Modular Kitchen",
        requirement: lead.requirement || "",
        assignedTo: lead.assignedTo?._id || lead.assignedTo || "",
        nextFollowUpDate: lead.nextFollowUp?.scheduledAt ? lead.nextFollowUp.scheduledAt.split("T")[0] : "",
        nextFollowUpTime: lead.nextFollowUp?.scheduledAt
          ? new Date(lead.nextFollowUp.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
          : "17:00",
        nextFollowUpType: lead.nextFollowUp?.type || "call",
        sendReminderNotification: true,
        budgetRange: lead.budgetRange || "₹5,00,000 - ₹8,00,000",
        preferredTimeline: lead.preferredTimeline || "Within 2 months",
        city: lead.city || "",
        address: lead.address || "",
        notes: lead.notes || "",
        priority: lead.priority || "medium",
      });
      setErrors({});
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setActiveTab("basic");
      return;
    }

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        phone: `${formData.countryCode} ${formData.phone.trim().replace(/^(\+91|\+)/, "").trim()}`,
        email: formData.email.trim() || undefined,
        leadSource: formData.leadSource,
        status: formData.status,
        projectType: formData.projectType,
        requirement: formData.requirement.trim() || undefined,
        assignedTo: formData.assignedTo || undefined,
        budgetRange: formData.budgetRange || undefined,
        preferredTimeline: formData.preferredTimeline || undefined,
        city: formData.city.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        priority: formData.priority,
      };

      await updateLead({ id: lead._id, data: payload }).unwrap();
      toast.success("Lead updated successfully");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update lead");
    }
  };

  const navItems = [
    { id: "basic", label: "Basic Information", icon: "heroicons-outline:user" },
    { id: "requirement", label: "Requirement Details", icon: "heroicons-outline:document-text" },
    { id: "followup", label: "Follow-up & Assignment", icon: "heroicons-outline:calendar" },
    { id: "additional", label: "Additional Information", icon: "heroicons-outline:information-circle" },
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Icon icon="heroicons-outline:pencil-square" className="text-lg" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white font-inter">Edit Lead</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <Icon icon="heroicons-outline:x" className="text-xl" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Vertical Navigation */}
          <div className="w-56 border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-semibold text-left transition font-inter ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon icon={item.icon} className="text-base flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Form Fields */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === "basic" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      className={`w-full px-3.5 py-2 text-[13.5px] rounded-lg border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-inter ${
                        errors.fullName ? "border-rose-400" : "border-slate-200 dark:border-slate-700"
                      }`}
                    />
                    {errors.fullName && <p className="text-xs text-rose-500 mt-1 font-inter">{errors.fullName}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                      Phone <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                      <span className="inline-flex items-center px-3 text-[13.5px] font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 font-inter">
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                        className="flex-1 px-3 py-2 text-[13.5px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none font-inter"
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-rose-500 mt-1 font-inter">{errors.phone}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email address"
                      className="w-full px-3.5 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-inter"
                    />
                    {errors.email && <p className="text-xs text-rose-500 mt-1 font-inter">{errors.email}</p>}
                  </div>

                  {/* Lead Source */}
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                      Source <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="leadSource"
                      value={formData.leadSource}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-inter"
                    >
                      {SOURCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Lead Status */}
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                      Status <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-inter"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Project Type */}
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                      Project Type
                    </label>
                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-inter"
                    >
                      {PROJECT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Requirement */}
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                    Requirement
                  </label>
                  <input
                    type="text"
                    name="requirement"
                    value={formData.requirement}
                    onChange={handleChange}
                    placeholder="Enter requirement details..."
                    className="w-full px-3.5 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-inter"
                  />
                </div>

                {/* Assign To */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                      Assign To
                    </label>
                    <select
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-inter"
                    >
                      <option value="">Select staff</option>
                      {staffList.map((st) => (
                        <option key={st._id} value={st._id}>
                          {st.firstName} {st.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "requirement" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                    Detailed Requirement / Scope
                  </label>
                  <textarea
                    rows={4}
                    name="requirement"
                    value={formData.requirement}
                    onChange={handleChange}
                    placeholder="Looking for modular kitchen with modern design..."
                    className="w-full px-3.5 py-2.5 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none font-inter"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                      Budget Range
                    </label>
                    <select
                      name="budgetRange"
                      value={formData.budgetRange}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none font-inter"
                    >
                      {BUDGET_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                      Preferred Timeline
                    </label>
                    <select
                      name="preferredTimeline"
                      value={formData.preferredTimeline}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none font-inter"
                    >
                      {TIMELINE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                      City / Location
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Mumbai, Maharashtra"
                      className="w-full px-3.5 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none font-inter"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                      Property Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Flat/House No, Building, Area"
                      className="w-full px-3.5 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none font-inter"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "followup" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                      Follow-up Type
                    </label>
                    <select
                      name="nextFollowUpType"
                      value={formData.nextFollowUpType}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none font-inter"
                    >
                      {FOLLOWUP_TYPES.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                      Assign Staff
                    </label>
                    <select
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none font-inter"
                    >
                      <option value="">Select staff</option>
                      {staffList.map((st) => (
                        <option key={st._id} value={st._id}>
                          {st.firstName} {st.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "additional" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                    Priority
                  </label>
                  <div className="flex gap-4">
                    {["low", "medium", "high"].map((p) => (
                      <label key={p} className="flex items-center gap-2 cursor-pointer capitalize text-[13.5px] font-inter">
                        <input
                          type="radio"
                          name="priority"
                          value={p}
                          checked={formData.priority === p}
                          onChange={handleChange}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                    Notes
                  </label>
                  <textarea
                    rows={4}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Add internal notes..."
                    className="w-full px-3.5 py-2.5 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none font-inter"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-[13.5px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition font-inter"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 text-[13.5px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-none font-inter disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Icon icon="heroicons-outline:refresh" className="animate-spin text-base" />
                <span>Updating...</span>
              </>
            ) : (
              <span>Update Lead</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditLeadModal;
