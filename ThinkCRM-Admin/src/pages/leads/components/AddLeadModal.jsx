import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Icon from "@/components/ui/Icon";
import Flatpickr from "react-flatpickr";
import { toast } from "react-toastify";
import { useCreateLeadMutation } from "@/store/api/leads/leadsApiSlice";
import { useGetStaffQuery } from "@/store/api/management/managementApiSlice";
import PhoneInputWithCountry from "@/components/ui/PhoneInputWithCountry";
import { validatePhone, validateEmail, validateText, focusFirstError } from "@/utils/validation";

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

const AddLeadModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useSelector((state) => state.auth);
  const isOwnerOrAdmin = user && (user.role === "Owner" || user.role === "Admin");

  const [activeTab, setActiveTab] = useState("basic");
  const [createLead, { isLoading }] = useCreateLeadMutation();
  const { data: staffData } = useGetStaffQuery({ page: 1, limit: 100 }, { skip: !isOwnerOrAdmin });

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
    assignedTo: !isOwnerOrAdmin && user?._id ? user._id : "",
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
    if (!isOwnerOrAdmin && user?._id && !formData.assignedTo) {
      setFormData((prev) => ({ ...prev, assignedTo: user._id }));
    }
  }, [user, isOwnerOrAdmin]);

  if (!isOpen) return null;

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

    const nameRes = validateText(formData.fullName, { required: true, fieldName: "Full Name", min: 2, max: 100 });
    if (!nameRes.isValid) newErrors.fullName = nameRes.error;

    const phoneRes = validatePhone(formData.phone, { required: true });
    if (!phoneRes.isValid) newErrors.phone = phoneRes.error;

    const emailRes = validateEmail(formData.email, { required: false });
    if (!emailRes.isValid) newErrors.email = emailRes.error;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.fullName || newErrors.phone || newErrors.email) {
        setActiveTab("basic");
      }
      focusFirstError(newErrors, ["fullName", "phone", "email"]);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validateForm()) {
      setActiveTab("basic");
      return;
    }

    try {
      const phoneRes = validatePhone(formData.phone, { required: true });
      const finalPhone = phoneRes.formatted || formData.phone.trim();

      const payload = {
        fullName: formData.fullName.trim(),
        phone: finalPhone,
        email: formData.email.trim() || undefined,
        leadSource: formData.leadSource,
        status: formData.status,
        projectType: formData.projectType,
        requirement: formData.requirement.trim() || undefined,
        assignedTo: !isOwnerOrAdmin && user?._id ? user._id : (formData.assignedTo || undefined),
        budgetRange: formData.budgetRange || undefined,
        preferredTimeline: formData.preferredTimeline || undefined,
        city: formData.city.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        priority: formData.priority,
      };

      if (formData.nextFollowUpDate) {
        payload.nextFollowUpDate = formData.nextFollowUpDate;
        payload.nextFollowUpTime = formData.nextFollowUpTime;
        payload.nextFollowUpType = formData.nextFollowUpType;
        payload.sendReminderNotification = formData.sendReminderNotification;
      }

      await createLead(payload).unwrap();
      toast.success("Lead created successfully");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create lead");
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
              <Icon icon="heroicons-outline:plus" className="text-lg" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white font-inter">Add Lead</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <Icon icon="heroicons-outline:x" className="text-xl" />
          </button>
        </div>

        {/* Modal Body with Left Tabs and Right Form */}
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
                  <PhoneInputWithCountry
                    label="Phone Number"
                    required
                    value={formData.phone}
                    onChange={(val) => {
                      setFormData((prev) => ({ ...prev, phone: val }));
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                    }}
                    error={errors.phone}
                    placeholder="Enter 10-digit mobile number"
                    name="phone"
                  />

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

                {/* Assign To & Next Follow-up */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                      Assign To
                    </label>
                    {!isOwnerOrAdmin ? (
                      <input
                        type="text"
                        disabled
                        value={`${user?.firstName || ""} ${user?.lastName || ""} (Assigned to You)`}
                        className="w-full px-3.5 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-inter cursor-not-allowed"
                      />
                    ) : (
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
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                      Next Follow-up
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Flatpickr
                        value={formData.nextFollowUpDate}
                        onChange={([date]) =>
                          setFormData((prev) => ({
                            ...prev,
                            nextFollowUpDate: date ? date.toISOString().split("T")[0] : "",
                          }))
                        }
                        options={{ dateFormat: "d M Y", minDate: "today" }}
                        className="w-full px-3 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none font-inter"
                        placeholder="DD-MMM-YYYY"
                      />
                      <input
                        type="time"
                        name="nextFollowUpTime"
                        value={formData.nextFollowUpTime}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none font-inter"
                      />
                    </div>
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
                    placeholder="Looking for modular kitchen with modern design, acrylic finish and quartz countertop..."
                    className="w-full px-3.5 py-2.5 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-inter"
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
                      className="w-full px-3.5 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-inter"
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
                      className="w-full px-3.5 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-inter"
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

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                      Follow-up Date
                    </label>
                    <Flatpickr
                      value={formData.nextFollowUpDate}
                      onChange={([date]) =>
                        setFormData((prev) => ({
                          ...prev,
                          nextFollowUpDate: date ? date.toISOString().split("T")[0] : "",
                        }))
                      }
                      options={{ dateFormat: "d M Y", minDate: "today" }}
                      className="w-full px-3 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none font-inter"
                      placeholder="Select date"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-inter">
                      Follow-up Time
                    </label>
                    <input
                      type="time"
                      name="nextFollowUpTime"
                      value={formData.nextFollowUpTime}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none font-inter"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="sendReminderNotification"
                      checked={formData.sendReminderNotification}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[13.5px] font-medium text-slate-700 dark:text-slate-300 font-inter">
                      Send reminder notification to assigned staff
                    </span>
                  </label>
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
                    placeholder="Add any internal team notes or discussion points..."
                    className="w-full px-3.5 py-2.5 text-[13.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-inter"
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
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Icon icon="heroicons-outline:plus" className="text-base" />
                <span>Save Lead</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLeadModal;
