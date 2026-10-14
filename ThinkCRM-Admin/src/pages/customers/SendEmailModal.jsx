import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Select from "@/components/ui/Select";
import { toast } from "react-toastify";
import { useSendCustomerEmailMutation } from "@/store/api/customers/customersApiSlice";

const EMAIL_TEMPLATES = [
  {
    value: "follow_up",
    label: "Follow-up on Your Project",
    subject: "Follow-up on Your {{projectType}} Project",
    body: "Hi {{name}},\n\nI hope you are doing well. I wanted to follow up on our discussion regarding your {{projectType}} project. Please let me know if you have any questions or would like to schedule a site visit or next steps.\n\nBest regards,\nThinkCRM Team",
  },
  {
    value: "project_update",
    label: "Project Progress Update",
    subject: "Update Regarding Your Project: {{projectName}}",
    body: "Hi {{name}},\n\nWe wanted to share a quick update on your project progress. Our team is actively working on the current milestones according to the schedule.\n\nPlease feel free to reach out if you need any clarification.\n\nWarm regards,\nThinkCRM Team",
  },
  {
    value: "quotation_followup",
    label: "Quotation Follow-up",
    subject: "Following up on Quotation for {{projectType}}",
    body: "Hi {{name}},\n\nWe hope you have reviewed the quotation shared with you. We would love to discuss any adjustments or answer any questions you might have.\n\nLooking forward to hearing from you soon.\n\nBest regards,\nThinkCRM Team",
  },
  {
    value: "measurement_confirmation",
    label: "Measurement Confirmation",
    subject: "Site Measurement Scheduled for {{projectType}}",
    body: "Hi {{name}},\n\nThis is to confirm that our measurement specialist has been scheduled to visit your site. Please ensure site access is available.\n\nThank you,\nThinkCRM Team",
  },
  {
    value: "project_completion",
    label: "Project Completion & Handover",
    subject: "Congratulations! Project Completion - {{projectName}}",
    body: "Hi {{name}},\n\nWe are delighted to confirm that your project has reached completion. It has been a pleasure working with you. Please review the final handover documentation.\n\nBest regards,\nThinkCRM Team",
  },
  {
    value: "thank_you",
    label: "Thank You Note",
    subject: "Thank You for Choosing ThinkCRM",
    body: "Dear {{name}},\n\nThank you for choosing ThinkCRM. We truly appreciate your trust and business. We remain available for any assistance you may need in the future.\n\nWarm regards,\nThinkCRM Team",
  },
];

const SendEmailModal = ({ isOpen, onClose, customer }) => {
  const [to, setTo] = useState(customer?.email || "");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);

  const [sendCustomerEmail, { isLoading }] = useSendCustomerEmailMutation();

  // Populate template
  const handleTemplateChange = (val) => {
    setSelectedTemplate(val);
    const tmpl = EMAIL_TEMPLATES.find((t) => t.value === val);
    if (tmpl && customer) {
      const name = customer.fullName || "Customer";
      const projectType = customer.projectType || customer.projects?.[0]?.projectType || "Interior";
      const projectName = customer.projects?.[0]?.projectName || "Modular Kitchen";

      const sub = tmpl.subject
        .replace(/{{name}}/g, name)
        .replace(/{{projectType}}/g, projectType)
        .replace(/{{projectName}}/g, projectName);

      const bod = tmpl.body
        .replace(/{{name}}/g, name)
        .replace(/{{projectType}}/g, projectType)
        .replace(/{{projectName}}/g, projectName);

      setSubject(sub);
      setMessage(bod);
    }
  };

  // Mock file attachment handler
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttachments = files.map((file) => ({
      filename: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      fileType: file.type || "application/pdf",
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!to || !to.trim()) {
      toast.error("Recipient email address is required");
      return;
    }
    if (!subject || !subject.trim()) {
      toast.error("Subject line is required");
      return;
    }
    if (!message || !message.trim()) {
      toast.error("Message body cannot be empty");
      return;
    }

    try {
      await sendCustomerEmail({
        id: customer._id,
        emailData: {
          to: to.trim(),
          cc: cc.trim() || undefined,
          bcc: bcc.trim() || undefined,
          subject: subject.trim(),
          message: message.trim(),
          attachments,
        },
      }).unwrap();

      toast.success("Email sent successfully!");
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to send email");
    }
  };

  return (
    <Modal
      title="Send Email to Customer"
      labelclassName="btn-outline-dark"
      activeModal={isOpen}
      onClose={onClose}
      className="max-w-3xl"
    >
      <form onSubmit={handleSend} className="space-y-4 pt-1">
        {/* Recipient */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex-1">
            <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1">
              To <span className="text-danger-500">*</span>
            </label>
            <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900">
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                {customer?.fullName || "Customer"}
              </span>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="customer@example.com"
                className="bg-transparent text-sm text-slate-800 dark:text-slate-100 flex-1 outline-none"
                required
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCcBcc(!showCcBcc)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline self-end sm:self-center pt-2 sm:pt-4"
          >
            {showCcBcc ? "Hide Cc/Bcc" : "Cc, Bcc"}
          </button>
        </div>

        {/* CC / BCC fields */}
        {showCcBcc && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <div>
              <label className="form-label text-xs font-semibold text-slate-500 mb-1">Cc</label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="form-control text-xs py-1.5"
              />
            </div>
            <div>
              <label className="form-label text-xs font-semibold text-slate-500 mb-1">Bcc</label>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="bcc@example.com"
                className="form-control text-xs py-1.5"
              />
            </div>
          </div>
        )}

        {/* Template Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1">
              Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="form-control text-sm"
            >
              <option value="">Select a reusable template...</option>
              {EMAIL_TEMPLATES.map((tmpl) => (
                <option key={tmpl.value} value={tmpl.value}>
                  {tmpl.label}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-0 sm:pt-6">
            <button
              type="button"
              onClick={() => toast.info("Custom templates can be configured in CRM Settings.")}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1"
            >
              <Icon icon="heroicons:bookmark" className="text-sm" />
              <span>Save as Template</span>
            </button>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1">
            Subject <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Follow-up on Your Modular Kitchen Project"
            className="form-control text-sm font-medium"
            required
          />
        </div>

        {/* Message Editor simulation */}
        <div>
          <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1">
            Message
          </label>
          {/* Format Toolbar */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-t-lg text-slate-600 dark:text-slate-300">
            <span className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer font-bold text-xs">B</span>
            <span className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer italic text-xs">I</span>
            <span className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer underline text-xs">U</span>
            <span className="h-4 w-[1px] bg-slate-300 dark:bg-slate-600 mx-1" />
            <Icon icon="heroicons:list-bullet" className="text-sm cursor-pointer hover:text-blue-600" />
            <Icon icon="heroicons:numbered-list" className="text-sm cursor-pointer hover:text-blue-600" />
            <Icon icon="heroicons:link" className="text-sm cursor-pointer hover:text-blue-600 ml-1" />
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={7}
            placeholder="Write your email message here..."
            className="w-full p-3 border-x border-b border-slate-200 dark:border-slate-700 rounded-b-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
            required
          />
        </div>

        {/* Attachments list */}
        {attachments.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Attachments</label>
            <div className="space-y-1">
              {attachments.map((att, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Icon icon="heroicons:document-text" className="text-base text-rose-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                      {att.filename}
                    </span>
                    <span className="text-slate-400">({att.size})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-slate-400 hover:text-danger-500"
                  >
                    <Icon icon="heroicons:trash" className="text-sm" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Attachment action */}
        <div className="flex items-center justify-between pt-1">
          <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            <Icon icon="heroicons:paper-clip" className="text-sm" />
            <span>+ Attach Files (PDF, Images, Docs - Max 10MB each)</span>
            <input type="file" multiple onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Footer Actions */}
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
            <span>{isLoading ? "Sending..." : "Send Email"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SendEmailModal;
