import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import {
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useGetLeadByIdQuery,
} from "@/store/api/leads/leadsApiSlice";
import { useGetStaffQuery } from "@/store/api/management/managementApiSlice";
import PhoneInputWithCountry from "@/components/ui/PhoneInputWithCountry";
import { validatePhone, validateEmail, validateText, focusFirstError } from "@/utils/validation";

const TAB_ITEMS = [
  { id: "basic", label: "Basic Information", icon: "heroicons-outline:user" },
  { id: "project", label: "Project Details", icon: "heroicons-outline:briefcase" },
  { id: "address", label: "Address & Location", icon: "heroicons-outline:map-pin" },
  { id: "followup", label: "Follow-up & Actions", icon: "heroicons-outline:calendar" },
  { id: "notes", label: "Notes & History", icon: "heroicons-outline:document-text" },
  { id: "settings", label: "Tags & Settings", icon: "heroicons-outline:tag" },
];

const SOURCE_OPTIONS = [
  { value: "Website", label: "Website" },
  { value: "Meta Ads", label: "Meta Ads" },
  { value: "Facebook", label: "Facebook" },
  { value: "Instagram", label: "Instagram" },
  { value: "Google Ads", label: "Google Ads" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Referral", label: "Referral" },
  { value: "Phone", label: "Phone" },
  { value: "Walk-in", label: "Walk-in" },
  { value: "Manual", label: "Manual" },
  { value: "Other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "attempted", label: "Attempted" },
  { value: "qualified", label: "Qualified" },
  { value: "follow_up", label: "Follow-up" },
  { value: "in_progress", label: "In Progress" },
  { value: "measurement_pending", label: "Measurement Pending" },
  { value: "measurement_scheduled", label: "Measurement Scheduled" },
  { value: "measurement_completed", label: "Measurement Completed" },
  { value: "quotation_pending", label: "Quotation Pending" },
  { value: "quotation_sent", label: "Quotation Sent" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
  { value: "junk", label: "Junk" },
];

const PROJECT_TYPE_OPTIONS = [
  { value: "Modular Kitchen", label: "Modular Kitchen" },
  { value: "Wardrobe Design", label: "Wardrobe Design" },
  { value: "Full Home Interior", label: "Full Home Interior" },
  { value: "Office Interior", label: "Office Interior" },
  { value: "Bedroom", label: "Bedroom" },
  { value: "Living Room", label: "Living Room" },
  { value: "Commercial", label: "Commercial" },
  { value: "Other", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
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
  { value: "call", label: "Phone Call" },
  { value: "whatsapp", label: "WhatsApp Message" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "In-Person Meeting" },
  { value: "site_visit", label: "Site Visit" },
];

const PRESET_TAGS = ["Hot Lead", "High Value", "Urgent Followup", "Architect Referral", "Ready to Buy"];

const LeadForm = ({ isModal = false, onClose = null, leadId: propLeadId = null, initialData = null }) => {
  const navigate = useNavigate();
  const routeParams = useParams();
  const leadId = propLeadId || routeParams.id;
  const isEditMode = Boolean(leadId);

  const [activeTab, setActiveTab] = useState("basic");

  // RTK Query for fetching lead details if editing
  const { data: leadData, isLoading: isLoadingLead } = useGetLeadByIdQuery(leadId, {
    skip: !isEditMode || Boolean(initialData),
  });

  const { data: staffData } = useGetStaffQuery({ page: 1, limit: 100 });
  const staffList = staffData?.data?.users || staffData?.data?.staff || [];

  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();
  const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    alternatePhone: "",
    email: "",
    leadSource: "Website",
    status: "new",
    priority: "medium",
    assignedTo: "",

    // Project Details
    projectType: "Full Home Interior",
    projectDescription: "",
    requirement: "",
    budget: "",
    budgetRange: "₹5,00,000 - ₹8,00,000",
    preferredTimeline: "Within 2 months",
    expectedStartDate: "",

    // Address & Location
    address: "",
    city: "",
    state: "",
    pincode: "",
    location: "",

    // Initial Follow-up
    nextFollowUpDate: "",
    nextFollowUpTime: "17:00",
    nextFollowUpType: "call",
    sendReminderNotification: true,

    // Notes & Tags
    notes: "",
    tags: ["Hot Lead"],
  });

  const [newTagInput, setNewTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [errors, setErrors] = useState({});

  // Sync initialData or loaded lead into state
  useEffect(() => {
    const source = initialData || leadData?.data?.lead;
    if (source) {
      setFormData({
        fullName: source.fullName || "",
        phone: source.phone || "",
        alternatePhone: source.alternatePhone || "",
        email: source.email || "",
        leadSource: source.leadSource || "Website",
        status: source.status || "new",
        priority: source.priority || "medium",
        assignedTo: source.assignedTo?._id || source.assignedTo || "",

        projectType: source.projectType || "Full Home Interior",
        projectDescription: source.projectDescription || source.requirement || "",
        requirement: source.requirement || source.projectDescription || "",
        budget: source.budget !== undefined && source.budget !== null ? String(source.budget) : "",
        budgetRange: source.budgetRange || "₹5,00,000 - ₹8,00,000",
        preferredTimeline: source.preferredTimeline || "Within 2 months",
        expectedStartDate: source.expectedStartDate ? source.expectedStartDate.slice(0, 10) : "",

        address: source.address || "",
        city: source.city || "",
        state: source.state || "",
        pincode: source.pincode || "",
        location: source.location || (source.city ? `${source.city}, ${source.state || ""}` : ""),

        nextFollowUpDate: source.nextFollowUpAt ? source.nextFollowUpAt.slice(0, 10) : "",
        nextFollowUpTime: "17:00",
        nextFollowUpType: "call",
        sendReminderNotification: true,

        notes: source.notes || "",
        tags: Array.isArray(source.tags) && source.tags.length > 0 ? source.tags : ["Hot Lead"],
      });
    }
  }, [leadData, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (name === "city" || name === "state") {
        const city = name === "city" ? value : prev.city;
        const state = name === "state" ? value : prev.state;
        if (city && state) updated.location = `${city}, ${state}`;
        else if (city) updated.location = city;
      }
      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleToggleTag = (tag) => {
    setFormData((prev) => {
      const exists = prev.tags.includes(tag);
      return {
        ...prev,
        tags: exists ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
      };
    });
  };

  const handleAddCustomTag = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      e.preventDefault();
      const val = newTagInput.trim();
      if (val && !formData.tags.includes(val)) {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, val] }));
        setNewTagInput("");
        setShowTagInput(false);
      }
    }
  };

  const validateAll = () => {
    const errs = {};

    const nameRes = validateText(formData.fullName, { minLength: 2, required: true, fieldName: "Full Name" });
    if (!nameRes.isValid) errs.fullName = nameRes.error;

    const phoneRes = validatePhone(formData.phone, { required: true });
    if (!phoneRes.isValid) errs.phone = phoneRes.error;

    if (formData.alternatePhone) {
      const altPhoneRes = validatePhone(formData.alternatePhone, { required: false });
      if (!altPhoneRes.isValid) errs.alternatePhone = altPhoneRes.error;
    }

    if (formData.email) {
      const emailRes = validateEmail(formData.email, { required: false });
      if (!emailRes.isValid) errs.email = emailRes.error;
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      if (errs.fullName || errs.phone || errs.alternatePhone || errs.email) {
        setActiveTab("basic");
      }
      focusFirstError(errs, ["fullName", "phone", "email", "alternatePhone"]);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateAll()) return;

    try {
      const cleanPhone = formData.phone.toString().trim();
      const cleanAltPhone = formData.alternatePhone.toString().trim();

      const payload = {
        fullName: formData.fullName.trim(),
        phone: cleanPhone,
        alternatePhone: cleanAltPhone || undefined,
        email: formData.email.trim() ? formData.email.trim().toLowerCase() : undefined,
        leadSource: formData.leadSource,
        status: formData.status,
        priority: formData.priority,
        assignedTo: formData.assignedTo || undefined,

        projectType: formData.projectType,
        projectDescription: formData.projectDescription.trim() || undefined,
        requirement: formData.requirement.trim() || formData.projectDescription.trim() || undefined,
        budget: formData.budget ? Number(formData.budget) : undefined,
        budgetRange: formData.budgetRange || undefined,
        preferredTimeline: formData.preferredTimeline || undefined,
        expectedStartDate: formData.expectedStartDate ? new Date(formData.expectedStartDate).toISOString() : undefined,

        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        pincode: formData.pincode.trim() || undefined,
        location: formData.location.trim() || undefined,

        notes: formData.notes.trim() || undefined,
        tags: formData.tags,
      };

      if (!isEditMode && formData.nextFollowUpDate) {
        payload.nextFollowUpDate = formData.nextFollowUpDate;
        payload.nextFollowUpTime = formData.nextFollowUpTime || "17:00";
        payload.nextFollowUpType = formData.nextFollowUpType || "call";
        payload.sendReminderNotification = Boolean(formData.sendReminderNotification);
      }

      if (isEditMode) {
        await updateLead({ id: leadId, data: payload }).unwrap();
        toast.success("Lead updated successfully!");
        if (isModal && onClose) {
          onClose();
        } else {
          navigate(`/leads/${leadId}`);
        }
      } else {
        const res = await createLead(payload).unwrap();
        toast.success("Lead created successfully!");
        const newId = res?.data?.lead?._id || res?.lead?._id;
        if (isModal && onClose) {
          onClose();
        } else {
          navigate(newId ? `/leads/${newId}` : "/leads");
        }
      }
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save lead");
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className="w-full">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (isModal && onClose) onClose();
              else navigate(isEditMode ? `/leads/${leadId}` : "/leads");
            }}
            className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <Icon icon="heroicons-outline:arrow-left" className="text-xl" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {isEditMode ? "Edit Lead" : "Add Lead"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEditMode
                ? "Update complete lead details, project requirements, and follow-ups"
                : "Create a new lead with project requirements, follow-ups, and staff assignment"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            text="Cancel"
            className="btn-light text-xs font-semibold px-4 py-2"
            type="button"
            onClick={() => {
              if (isModal && onClose) onClose();
              else navigate(isEditMode ? `/leads/${leadId}` : "/leads");
            }}
          />
          <Button
            text={isSaving ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Create Lead")}
            className="btn-primary text-xs font-semibold px-5 py-2"
            type="button"
            disabled={isSaving}
            onClick={handleSubmit}
          />
        </div>
      </div>

      {/* Main Grid: Sidebar Tabs + Content Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar Tab Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2 space-y-1 sticky top-24">
            {TAB_ITEMS.map((tab) => {
              const isActive = activeTab === tab.id;
              const hasErr =
                (tab.id === "basic" && (errors.fullName || errors.phone || errors.email || errors.alternatePhone)) ||
                (tab.id === "project" && errors.budget);

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon icon={tab.icon} className={`text-base ${isActive ? "text-primary-600" : "text-slate-400"}`} />
                    <span>{tab.label}</span>
                  </div>
                  {hasErr && <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Tab Content Panel */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            
            {/* TAB 1: BASIC INFORMATION */}
            {activeTab === "basic" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Basic Information
                  </h3>
                  <p className="text-xs text-slate-400">Primary client contact and pipeline categorization</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Rahul Sharma"
                      className={`form-control text-sm ${errors.fullName ? "border-rose-400 focus:border-rose-500" : ""}`}
                      required
                    />
                    {errors.fullName && <p className="text-xs text-rose-500 mt-1 font-inter">{errors.fullName}</p>}
                  </div>

                  <div>
                    <PhoneInputWithCountry
                      label="Primary Phone"
                      required
                      value={formData.phone}
                      onChange={(val) => {
                        setFormData((prev) => ({ ...prev, phone: val }));
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                      }}
                      error={errors.phone}
                      name="phone"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="rahul@example.com"
                      className={`form-control text-sm ${errors.email ? "border-rose-400 focus:border-rose-500" : ""}`}
                    />
                    {errors.email && <p className="text-xs text-rose-500 mt-1 font-inter">{errors.email}</p>}
                  </div>

                  <div>
                    <PhoneInputWithCountry
                      label="Alternate Phone"
                      value={formData.alternatePhone}
                      onChange={(val) => {
                        setFormData((prev) => ({ ...prev, alternatePhone: val }));
                        if (errors.alternatePhone) setErrors((prev) => ({ ...prev, alternatePhone: null }));
                      }}
                      error={errors.alternatePhone}
                      name="alternatePhone"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Lead Source
                    </label>
                    <select
                      name="leadSource"
                      value={formData.leadSource}
                      onChange={handleChange}
                      className="form-control text-sm"
                    >
                      {SOURCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Pipeline Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="form-control text-sm"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Priority Level
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="form-control text-sm"
                    >
                      {PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Assigned Staff
                    </label>
                    <select
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleChange}
                      className="form-control text-sm"
                    >
                      <option value="">Unassigned</option>
                      {staffList.map((st) => (
                        <option key={st._id} value={st._id}>
                          {st.firstName} {st.lastName} ({st.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PROJECT DETAILS */}
            {activeTab === "project" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Project Information
                  </h3>
                  <p className="text-xs text-slate-400">Design scope, project category, and estimated budget</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Project Type
                    </label>
                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      className="form-control text-sm"
                    >
                      {PROJECT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Budget Range
                    </label>
                    <select
                      name="budgetRange"
                      value={formData.budgetRange}
                      onChange={handleChange}
                      className="form-control text-sm"
                    >
                      {BUDGET_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Specific Budget (₹)
                    </label>
                    <input
                      type="number"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      placeholder="e.g. 650000"
                      className="form-control text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Preferred Timeline
                    </label>
                    <select
                      name="preferredTimeline"
                      value={formData.preferredTimeline}
                      onChange={handleChange}
                      className="form-control text-sm"
                    >
                      {TIMELINE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Expected Start Date
                    </label>
                    <input
                      type="date"
                      name="expectedStartDate"
                      value={formData.expectedStartDate}
                      onChange={handleChange}
                      className="form-control text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Project Requirement & Scope
                    </label>
                    <textarea
                      name="projectDescription"
                      rows={4}
                      value={formData.projectDescription}
                      onChange={handleChange}
                      placeholder="Enter detailed room measurements, material specifications, finishes, and requirements..."
                      className="form-control text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ADDRESS & LOCATION */}
            {activeTab === "address" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Address & Location
                  </h3>
                  <p className="text-xs text-slate-400">Site address, geographic territory, and postal details</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Site Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="e.g. Flat 402, Oakwood Towers, Linking Road"
                      className="form-control text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Mumbai"
                      className="form-control text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="e.g. Maharashtra"
                      className="form-control text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Postal Code / PIN
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="e.g. 400050"
                      className="form-control text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Location / Landmark
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. Bandra West, Mumbai"
                      className="form-control text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: FOLLOW-UP & ACTIONS */}
            {activeTab === "followup" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Follow-up & Activity Scheduling
                  </h3>
                  <p className="text-xs text-slate-400">Set initial follow-up reminder and communication tasks</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Next Follow-up Date
                    </label>
                    <input
                      type="date"
                      name="nextFollowUpDate"
                      value={formData.nextFollowUpDate}
                      onChange={handleChange}
                      className="form-control text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Follow-up Time
                    </label>
                    <input
                      type="time"
                      name="nextFollowUpTime"
                      value={formData.nextFollowUpTime}
                      onChange={handleChange}
                      className="form-control text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Follow-up Method
                    </label>
                    <select
                      name="nextFollowUpType"
                      value={formData.nextFollowUpType}
                      onChange={handleChange}
                      className="form-control text-sm"
                    >
                      {FOLLOWUP_TYPES.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="relative flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="sendReminderNotification"
                        checked={formData.sendReminderNotification}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Send automated reminder notification to assigned staff
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: NOTES & HISTORY */}
            {activeTab === "notes" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Lead Notes & Context
                  </h3>
                  <p className="text-xs text-slate-400">Detailed interaction history, design notes, and background</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    General Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={6}
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Enter internal remarks, client requirements, budget discussions, or call summaries..."
                    className="form-control text-sm"
                  />
                </div>

                {isEditMode && leadData?.data?.lead?.notesList?.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Previous Notes History
                    </h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {leadData.data.lead.notesList.map((n, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs space-y-1 border border-slate-100 dark:border-slate-800">
                          <p className="text-slate-700 dark:text-slate-200">{n.content}</p>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{n.author ? `${n.author.firstName} ${n.author.lastName}` : "System"}</span>
                            <span>{new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: TAGS & SETTINGS */}
            {activeTab === "settings" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Lead Tags & Segmentation
                  </h3>
                  <p className="text-xs text-slate-400">Categorize this lead with smart search chips and filters</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">
                    Active Tags
                  </label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className="hover:text-primary-800 text-primary-400"
                        >
                          <Icon icon="heroicons-outline:x-mark" className="text-xs" />
                        </button>
                      </span>
                    ))}

                    {showTagInput ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={handleAddCustomTag}
                          placeholder="New tag name..."
                          className="px-2.5 py-1 text-xs border border-primary-400 rounded-md focus:outline-none bg-white dark:bg-slate-900"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomTag}
                          className="px-2 py-1 bg-primary-600 text-white rounded text-xs font-bold"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowTagInput(true)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:border-primary-500 hover:text-primary-600 transition"
                      >
                        <Icon icon="heroicons-outline:plus" className="text-xs" />
                        <span>Add Tag</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">
                    Quick Preset Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_TAGS.map((tag) => {
                      const isSelected = formData.tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className={`px-3 py-1 text-xs rounded-lg font-medium transition border ${
                            isSelected
                              ? "bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900"
                              : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Action Footer */}
            <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <Button
                text="Cancel"
                className="btn-light text-xs font-semibold px-4 py-2"
                type="button"
                onClick={() => {
                  if (isModal && onClose) onClose();
                  else navigate(isEditMode ? `/leads/${leadId}` : "/leads");
                }}
              />

              <div className="flex items-center gap-2">
                <Button
                  text={isSaving ? (isEditMode ? "Saving Changes..." : "Creating Lead...") : (isEditMode ? "Save Changes" : "Create Lead")}
                  className="btn-primary text-xs font-semibold px-5 py-2"
                  type="button"
                  disabled={isSaving}
                  onClick={handleSubmit}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadForm;
