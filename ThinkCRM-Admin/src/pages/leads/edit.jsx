import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Loading from "@/components/Loading";
import { useGetLeadByIdQuery, useUpdateLeadMutation } from "@/store/api/leads/leadsApiSlice";
import { toast } from "react-toastify";
import Flatpickr from "react-flatpickr";

const PROJECT_TYPE_OPTIONS = [
  { value: "Kitchen", label: "Kitchen" },
  { value: "Wardrobe", label: "Wardrobe" },
  { value: "Bedroom", label: "Bedroom" },
  { value: "Living Room", label: "Living Room" },
  { value: "Office", label: "Office" },
  { value: "Full Home", label: "Full Home" },
  { value: "Commercial", label: "Commercial" },
  { value: "Other", label: "Other" },
];

const LEAD_SOURCE_OPTIONS = [
  { value: "Meta", label: "Meta" },
  { value: "Facebook", label: "Facebook" },
  { value: "Instagram", label: "Instagram" },
  { value: "Website", label: "Website" },
  { value: "Google", label: "Google" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Referral", label: "Referral" },
  { value: "Phone", label: "Phone" },
  { value: "Walk-in", label: "Walk-in" },
  { value: "Manual", label: "Manual" },
  { value: "Other", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "attempted", label: "Attempted" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "follow_up", label: "Follow Up" },
  { value: "measurement_pending", label: "Measurement Pending" },
  { value: "measurement_scheduled", label: "Measurement Scheduled" },
  { value: "measurement_completed", label: "Measurement Completed" },
  { value: "quotation_pending", label: "Quotation Pending" },
  { value: "quotation_sent", label: "Quotation Sent" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "junk", label: "Junk" },
];

const EditLead = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: leadData, isLoading: isLoadingLead } = useGetLeadByIdQuery(id);
  const [updateLead, { isLoading }] = useUpdateLeadMutation();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    alternatePhone: "",
    email: "",
    location: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    projectType: "Full Home",
    projectDescription: "",
    budget: "",
    expectedStartDate: [],
    leadSource: "Manual",
    priority: "medium",
    status: "new",
    notes: "",
  });

  useEffect(() => {
    if (leadData?.data?.lead) {
      const lead = leadData.data.lead;
      setFormData({
        fullName: lead.fullName || "",
        phone: lead.phone || "",
        alternatePhone: lead.alternatePhone || "",
        email: lead.email || "",
        location: lead.location || "",
        address: lead.address || "",
        city: lead.city || "",
        state: lead.state || "",
        pincode: lead.pincode || "",
        projectType: lead.projectType || "Full Home",
        projectDescription: lead.projectDescription || "",
        budget: lead.budget || "",
        expectedStartDate: lead.expectedStartDate ? [new Date(lead.expectedStartDate)] : [],
        leadSource: lead.leadSource || "Manual",
        priority: lead.priority || "medium",
        status: lead.status || "new",
        notes: lead.notes || "",
      });
    }
  }, [leadData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        budget: formData.budget ? Number(formData.budget) : undefined,
        expectedStartDate: formData.expectedStartDate[0]
          ? formData.expectedStartDate[0].toISOString()
          : undefined,
      };

      await updateLead({ id, data: payload }).unwrap();
      toast.success("Lead updated successfully");
      navigate(`/leads/${id}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update lead");
    }
  };

  if (isLoadingLead) return <Loading />;

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(`/leads/${id}`)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <Icon icon="heroicons:arrow-left" className="text-xl" />
          </button>
          <h4 className="font-bold text-2xl text-slate-900 dark:text-white">Edit Lead</h4>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-5">
            <Card title="Customer Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Textinput
                  label="Full Name *"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                />
                <Textinput
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
                <Textinput
                  label="Phone Number *"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Primary phone number"
                  required
                />
                <Textinput
                  label="Alternate Phone"
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>
            </Card>

            <Card title="Project Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <Select
                  label="Project Type *"
                  name="projectType"
                  value={formData.projectType}
                  onChange={handleChange}
                  options={PROJECT_TYPE_OPTIONS}
                  required
                />
                <Textinput
                  label="Estimated Budget (₹)"
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="e.g. 500000"
                />
              </div>
              <Textarea
                label="Project Description"
                name="projectDescription"
                value={formData.projectDescription}
                onChange={handleChange}
                placeholder="Detailed requirements..."
                row={4}
              />
            </Card>

            <Card title="Location Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <Textinput
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
                <Textinput
                  label="Location Area"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                />
                <Textinput
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
                <Textinput
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                />
                <Textinput
                  label="Pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                />
              </div>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-5">
            <Card title="Lead Meta">
              <div className="space-y-5">
                <Select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  options={STATUS_OPTIONS}
                />
                <Select
                  label="Lead Source"
                  name="leadSource"
                  value={formData.leadSource}
                  onChange={handleChange}
                  options={LEAD_SOURCE_OPTIONS}
                />
                <Select
                  label="Priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  options={PRIORITY_OPTIONS}
                />
                <div>
                  <label className="form-label block text-sm mb-2 text-slate-900 dark:text-slate-300">
                    Expected Start Date
                  </label>
                  <Flatpickr
                    className="form-control py-2"
                    value={formData.expectedStartDate}
                    onChange={(date) => setFormData((prev) => ({ ...prev, expectedStartDate: date }))}
                    placeholder="Select Date"
                  />
                </div>
              </div>
            </Card>

            <Card title="Internal Notes">
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any internal notes about this lead..."
                row={4}
              />
            </Card>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            text="Cancel"
            className="btn-light"
            onClick={() => navigate(`/leads/${id}`)}
          />
          <Button
            text={isLoading ? "Saving..." : "Update Lead"}
            className="btn-primary"
            type="submit"
            disabled={isLoading}
          />
        </div>
      </form>
    </div>
  );
};

export default EditLead;
