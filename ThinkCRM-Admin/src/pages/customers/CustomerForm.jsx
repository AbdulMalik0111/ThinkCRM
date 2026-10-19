import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useGetCustomerByIdQuery,
} from "@/store/api/customers/customersApiSlice";
import { useGetStaffQuery } from "@/store/api/management/managementApiSlice";
import PhoneInputWithCountry from "@/components/ui/PhoneInputWithCountry";
import { validatePhone, validateEmail, validateText, validateNumber, focusFirstError } from "@/utils/validation";

const TAB_ITEMS = [
  { id: "basic", label: "Basic Information", icon: "heroicons-outline:user" },
  { id: "project", label: "Project Information", icon: "heroicons-outline:briefcase" },
  { id: "address", label: "Address & Location", icon: "heroicons-outline:map-pin" },
  { id: "communication", label: "Communication", icon: "heroicons-outline:chat-bubble-left-right" },
  { id: "documents", label: "Documents", icon: "heroicons-outline:document-text" },
  { id: "notes", label: "Notes", icon: "heroicons-outline:pencil-square" },
  { id: "settings", label: "Settings", icon: "heroicons-outline:cog-6-tooth" },
];

const PRESET_TAGS = ["VIP", "High Budget", "Repeat Customer", "Referral", "Architect"];

const CustomerForm = ({ isModal = false, onClose = null, customerId: propCustomerId = null, initialData = null }) => {
  const navigate = useNavigate();
  const routeParams = useParams();
  const customerId = propCustomerId || routeParams.id;
  const isEditMode = Boolean(customerId);

  const [activeTab, setActiveTab] = useState("basic");

  // RTK Queries & Mutations
  const { data: customerData, isLoading: isLoadingCustomer } = useGetCustomerByIdQuery(
    customerId,
    { skip: !isEditMode || Boolean(initialData) }
  );

  const { data: staffData } = useGetStaffQuery({ page: 1, limit: 100 });
  const staffList = staffData?.data?.users || [];

  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    alternatePhone: "",
    source: "Website",
    status: "active",
    assignedStaff: "",
    tags: ["VIP", "High Budget"],
    avatar: "",

    // Address
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    location: "",

    // Project
    projectName: "",
    projectType: "Modular Kitchen",
    projectDescription: "",
    totalValue: "",
    projectStatus: "active",
    expectedStartDate: "",
    expectedCompletionDate: "",

    // Communication
    preferredContactMethod: "Call",
    bestTimeToContact: "Morning (10 AM - 1 PM)",
    communicationNotes: "",

    // Notes
    generalNotes: "",

    // Business / Settings
    customerType: "Individual",
    companyName: "",
    gstin: "",
  });

  const [newTagInput, setNewTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [errors, setErrors] = useState({});

  // Sync initial data or loaded customer
  useEffect(() => {
    const source = initialData || customerData?.data?.customer;
    if (source) {
      const activeProject = source.projects?.[0] || {};
      setFormData({
        fullName: source.fullName || "",
        phone: source.phone || "",
        email: source.email || "",
        alternatePhone: source.alternatePhone || "",
        source: source.source || "Website",
        status: source.status || "active",
        assignedStaff: source.assignedStaff?._id || source.assignedStaff || "",
        tags: Array.isArray(source.tags) && source.tags.length > 0 ? source.tags : ["VIP"],
        avatar: source.avatar || "",

        address: source.address || "",
        city: source.city || "",
        state: source.state || "",
        pincode: source.pincode || "",
        country: source.country || "India",
        location: source.location || (source.city ? `${source.city}, ${source.state || ""}` : ""),

        projectName: activeProject.projectName || source.projectName || "",
        projectType: source.projectType || activeProject.projectType || "Modular Kitchen",
        projectDescription: activeProject.description || "",
        totalValue: source.totalValue || activeProject.budget || "",
        projectStatus: activeProject.status || source.status || "active",
        expectedStartDate: activeProject.startDate ? activeProject.startDate.slice(0, 10) : "",
        expectedCompletionDate: activeProject.completionDate ? activeProject.completionDate.slice(0, 10) : "",

        preferredContactMethod: "Call",
        bestTimeToContact: "Morning (10 AM - 1 PM)",
        communicationNotes: "",

        generalNotes: source.notes?.[0]?.content || "",

        customerType: source.customerType || "Individual",
        companyName: source.companyName || "",
        gstin: source.gstin || "",
      });
    }
  }, [customerData, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-compute location tag if city or state changed
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

  // Avatar upload
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Avatar image size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({ ...prev, avatar: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Tag management
  const handleAddTag = (tagToAdd) => {
    const tag = (tagToAdd || newTagInput).trim();
    if (!tag) return;
    if (formData.tags.includes(tag)) {
      toast.info(`Tag "${tag}" already added`);
      setNewTagInput("");
      setShowTagInput(false);
      return;
    }
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    setNewTagInput("");
    setShowTagInput(false);
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleClose = () => {
    if (onClose) onClose();
    else if (window.history.length > 1) navigate(-1);
    else navigate("/customers");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    const nameRes = validateText(formData.fullName, { required: true, fieldName: "Full Name", min: 2, max: 100 });
    if (!nameRes.isValid) newErrors.fullName = nameRes.error;

    const phoneRes = validatePhone(formData.phone, { required: true });
    if (!phoneRes.isValid) newErrors.phone = phoneRes.error;

    if (formData.alternatePhone) {
      const altRes = validatePhone(formData.alternatePhone, { required: false });
      if (!altRes.isValid) newErrors.alternatePhone = altRes.error;
    }

    if (formData.email) {
      const emailRes = validateEmail(formData.email, { required: false });
      if (!emailRes.isValid) newErrors.email = emailRes.error;
    }

    if (formData.totalValue) {
      const valRes = validateNumber(formData.totalValue, { required: false, min: 0, fieldName: "Budget / Total Value" });
      if (!valRes.isValid) newErrors.totalValue = valRes.error;
    }

    if (formData.expectedStartDate && formData.expectedCompletionDate) {
      if (new Date(formData.expectedCompletionDate) < new Date(formData.expectedStartDate)) {
        newErrors.expectedCompletionDate = "Completion date cannot be before start date";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.fullName || newErrors.phone || newErrors.alternatePhone || newErrors.email) {
        setActiveTab("basic");
      } else if (newErrors.totalValue || newErrors.expectedCompletionDate) {
        setActiveTab("project");
      }
      focusFirstError(newErrors, ["fullName", "phone", "email", "totalValue"]);
      return;
    }

    const payload = {
      fullName: formData.fullName.trim(),
      phone: phoneRes.formatted || formData.phone.trim(),
      email: formData.email.trim() || undefined,
      alternatePhone: formData.alternatePhone.trim() || undefined,
      source: formData.source,
      status: formData.status,
      assignedStaff: formData.assignedStaff || undefined,
      tags: formData.tags,
      avatar: formData.avatar || undefined,

      address: formData.address.trim() || undefined,
      city: formData.city.trim() || undefined,
      state: formData.state.trim() || undefined,
      pincode: formData.pincode.trim() || undefined,
      country: formData.country.trim() || "India",
      location: formData.location.trim() || undefined,

      projectType: formData.projectType,
      totalValue: formData.totalValue ? Number(formData.totalValue) : 0,

      customerType: formData.customerType,
      companyName: formData.customerType === "Business" ? formData.companyName.trim() : undefined,
      gstin: formData.customerType === "Business" ? formData.gstin.trim() : undefined,
    };

    // If adding a project
    if (formData.projectName.trim()) {
      payload.projects = [
        {
          projectName: formData.projectName.trim(),
          projectType: formData.projectType,
          budget: formData.totalValue ? Number(formData.totalValue) : 0,
          status: formData.projectStatus,
          startDate: formData.expectedStartDate || undefined,
          completionDate: formData.expectedCompletionDate || undefined,
          description: formData.projectDescription.trim() || undefined,
          assignedStaff: formData.assignedStaff || undefined,
        },
      ];
    }

    // If initial note
    if (formData.generalNotes.trim() && !isEditMode) {
      payload.notes = [
        {
          content: formData.generalNotes.trim(),
        },
      ];
    }

    try {
      if (isEditMode) {
        await updateCustomer({ id: customerId, data: payload }).unwrap();
        toast.success("Customer updated successfully!");
      } else {
        await createCustomer(payload).unwrap();
        toast.success("Customer created successfully!");
      }

      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || `Failed to ${isEditMode ? "update" : "create"} customer`);
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className={isModal ? "bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 font-inter" : "space-y-5 font-inter"}>
      {/* Header */}
      {isModal ? (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {isEditMode ? "Edit Customer" : "Add Customer"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditMode ? "Update complete historical customer information" : "Create a new verified customer profile"}
            </p>
          </div>
          <button
            onClick={handleClose}
            type="button"
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <Icon icon="heroicons-outline:x-mark" className="text-xl" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
              title="Back to Customers"
            >
              <Icon icon="heroicons-outline:arrow-left" className="text-base" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {isEditMode ? "Edit Customer" : "Add New Customer"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditMode
                  ? "Update complete customer details, projects, and communication preferences"
                  : "Create a new verified customer profile with complete contact and project details"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className={!isModal ? "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden" : ""}>
        {/* Main Content: Left Nav Tabs + Right Form Area */}
        <div className="flex flex-col md:flex-row min-h-[520px]">
        {/* Left Vertical Navigation Menu */}
        <div className="w-full md:w-56 border-r border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 p-3 space-y-1">
          {TAB_ITEMS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition text-left ${
                  isActive
                    ? "bg-primary-500 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon icon={tab.icon} className={`text-lg ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between p-6 bg-white dark:bg-slate-800">
          <div className="space-y-6">
            {/* 1. Basic Information Tab */}
            {activeTab === "basic" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Basic Information</h4>
                </div>

                {/* Profile Photo Row */}
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-primary-100 bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <Icon icon="heroicons:user" className="text-3xl text-slate-400" />
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                      <Icon icon="heroicons-outline:arrow-up-tray" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1">JPG, PNG, upto 2MB</p>
                  </div>
                </div>

                {/* 2-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Full Name <span className="text-danger-500">*</span>
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
                      Email
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
                      Source
                    </label>
                    <select
                      name="source"
                      value={formData.source}
                      onChange={handleChange}
                      className="form-control text-sm"
                    >
                      <option value="Website">Website</option>
                      <option value="Referral">Referral</option>
                      <option value="Walk-in">Walk-in</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Google">Google</option>
                      <option value="Meta Ads">Meta Ads</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="form-control text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Assigned Staff
                    </label>
                    <select
                      name="assignedStaff"
                      value={formData.assignedStaff}
                      onChange={handleChange}
                      className="form-control text-sm"
                    >
                      <option value="">Unassigned</option>
                      {staffList.map((st) => (
                        <option key={st._id} value={st._id}>
                          {st.name} ({st.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Tags
                    </label>
                    <div className="flex flex-wrap items-center gap-2 p-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50/50 dark:bg-slate-900/40">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-slate-400 hover:text-danger-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      {showTagInput ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                            placeholder="Tag name..."
                            className="h-7 px-2 text-xs border border-primary-500 rounded outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleAddTag()}
                            className="px-2 py-1 text-xs bg-primary-500 text-white rounded font-medium"
                          >
                            Add
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowTagInput(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/40 rounded transition"
                        >
                          <Icon icon="heroicons-outline:plus" className="text-sm" />
                          <span>Add Tag</span>
                        </button>
                      )}
                    </div>

                    {/* Quick Preset Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[11px] text-slate-400">Suggestions:</span>
                      {PRESET_TAGS.filter((t) => !formData.tags.includes(t)).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleAddTag(preset)}
                          className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Project Information Tab */}
            {activeTab === "project" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Project Information</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleChange}
                      placeholder="e.g. Master Bedroom & Modular Kitchen"
                      className="form-control text-sm"
                    />
                  </div>

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
                      <option value="Modular Kitchen">Modular Kitchen</option>
                      <option value="Wardrobe">Wardrobe</option>
                      <option value="Full Home">Full Home</option>
                      <option value="Office Interior">Office Interior</option>
                      <option value="Living Room">Living Room</option>
                      <option value="Bathroom">Bathroom</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Budget / Total Value (₹)
                    </label>
                    <input
                      type="number"
                      name="totalValue"
                      value={formData.totalValue}
                      onChange={handleChange}
                      placeholder="500000"
                      min="0"
                      className={`form-control text-sm ${errors.totalValue ? "border-rose-400 focus:border-rose-500" : ""}`}
                    />
                    {errors.totalValue && <p className="text-xs text-rose-500 mt-1 font-inter">{errors.totalValue}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Project Status
                    </label>
                    <select
                      name="projectStatus"
                      value={formData.projectStatus}
                      onChange={handleChange}
                      className="form-control text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
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

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Expected Completion Date
                    </label>
                    <input
                      type="date"
                      name="expectedCompletionDate"
                      value={formData.expectedCompletionDate}
                      onChange={handleChange}
                      className="form-control text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Project Description
                    </label>
                    <textarea
                      name="projectDescription"
                      rows="3"
                      value={formData.projectDescription}
                      onChange={handleChange}
                      placeholder="Outline client expectations, scope, finishes, material preferences..."
                      className="form-control text-sm"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Address & Location Tab */}
            {activeTab === "address" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Address & Location</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Street Address / Flat / Building
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="e.g. 123 Business Park, Andheri East"
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
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="400093"
                      className="form-control text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="India"
                      className="form-control text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Display Location Tag
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. Mumbai, MH"
                      className="form-control text-sm"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Short badge displayed in directory cards and tables</p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Communication Tab */}
            {activeTab === "communication" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Communication Preferences</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Preferred Contact Channel
                    </label>
                    <select
                      name="preferredContactMethod"
                      value={formData.preferredContactMethod}
                      onChange={handleChange}
                      className="form-control text-sm"
                    >
                      <option value="Call">Direct Phone Call</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Email">Email</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Best Time to Reach
                    </label>
                    <input
                      type="text"
                      name="bestTimeToContact"
                      value={formData.bestTimeToContact}
                      onChange={handleChange}
                      placeholder="e.g. Morning (10 AM - 1 PM)"
                      className="form-control text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Communication Guidelines
                    </label>
                    <textarea
                      name="communicationNotes"
                      rows="3"
                      value={formData.communicationNotes}
                      onChange={handleChange}
                      placeholder="Any specific communication instructions (e.g. Do not call during office hours, WhatsApp preferred for approvals)..."
                      className="form-control text-sm"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Documents Tab */}
            {activeTab === "documents" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Customer Documents</h4>
                </div>

                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="h-12 w-12 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-500 flex items-center justify-center mx-auto mb-3">
                    <Icon icon="heroicons-outline:document-arrow-up" className="text-2xl" />
                  </div>
                  <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    File Management System
                  </h5>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Customer documents (Agreements, Design Files, Quotations, Site Photos) can be uploaded and organized immediately from the customer profile after saving.
                  </p>
                </div>
              </div>
            )}

            {/* 6. Notes Tab */}
            {activeTab === "notes" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Initial Notes</h4>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Customer Background & Special Instructions
                  </label>
                  <textarea
                    name="generalNotes"
                    rows="6"
                    value={formData.generalNotes}
                    onChange={handleChange}
                    placeholder="Record initial client impressions, design aspirations, family requirements, or historical context..."
                    className="form-control text-sm"
                  ></textarea>
                </div>
              </div>
            )}

            {/* 7. Settings / Business Tab */}
            {activeTab === "settings" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Business & Settings</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      Customer Type
                    </label>
                    <select
                      name="customerType"
                      value={formData.customerType}
                      onChange={handleChange}
                      className="form-control text-sm"
                    >
                      <option value="Individual">Individual / Homeowner</option>
                      <option value="Business">Business / Commercial Client</option>
                    </select>
                  </div>

                  {formData.customerType === "Business" && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          placeholder="e.g. Acme Corp Private Limited"
                          className="form-control text-sm"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                          GSTIN / Tax ID
                        </label>
                        <input
                          type="text"
                          name="gstin"
                          value={formData.gstin}
                          onChange={handleChange}
                          placeholder="e.g. 27AAAAA0000A1Z5"
                          className="form-control text-sm font-mono uppercase"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs md:text-sm font-semibold transition"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs md:text-sm font-semibold transition disabled:opacity-60"
              disabled={isSaving}
            >
              {isSaving && <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-sm" />}
              <span>{isSaving ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Customer" : "Save Customer")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);
};

export default CustomerForm;
