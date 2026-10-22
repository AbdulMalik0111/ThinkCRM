import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";
import { useSendLeadEmailMutation } from "@/store/api/leads/leadsApiSlice";
import { validateEmail, validateText, focusFirstError } from "@/utils/validation";

const EMAIL_TEMPLATES = [
  {
    value: "inquiry_followup",
    label: "Initial Inquiry Follow-up",
    subject: "Following up on your {{projectType}} inquiry - ThinkCRM",
    body: "Dear {{name}},\n\nThank you for reaching out to ThinkCRM regarding your upcoming {{projectType}} project.\n\nWe would love to learn more about your vision, style preferences, and space requirements to provide you with the best design solutions and tailored estimates.\n\nCould we arrange a brief introductory call or a site visit this week at your convenience?\n\nPlease feel free to reply directly to this email or call us at your earliest convenience.\n\nWarm regards,\nThinkCRM Team",
  },
  {
    value: "site_visit_request",
    label: "Schedule Site Visit & Consultation",
    subject: "Complimentary Site Visit & Design Consultation for {{projectType}}",
    body: "Dear {{name}},\n\nTo ensure we give you the most accurate designs and quotation for your {{projectType}} project, we would be pleased to schedule a complimentary site measurement and consultation visit.\n\nOur expert will review your floor plan, assess spatial opportunities, and guide you through our finish options.\n\nPlease let us know what dates and times work best for you.\n\nBest regards,\nThinkCRM Team",
  },
  {
    value: "quotation_proposal",
    label: "Quotation & Project Proposal",
    subject: "Quotation & Project Proposal for {{projectType}} - ThinkCRM",
    body: "Dear {{name}},\n\nThank you for considering ThinkCRM for your {{projectType}} project. Attached/enclosed is the detailed quotation outlining the scope of work, material specifications, and investment breakdown.\n\nWe are happy to answer any questions, explore value engineering alternatives, or customize materials to match your exact budget and preferences.\n\nLooking forward to speaking with you soon.\n\nSincerely,\nThinkCRM Team",
  },
  {
    value: "catalog_portfolio",
    label: "Brochure & Project Portfolio",
    subject: "ThinkCRM Portfolio & Modern Design Ideas for {{projectType}}",
    body: "Dear {{name}},\n\nWe are delighted to share our latest portfolio showcasing modern design concepts, custom finishes, and completed {{projectType}} transformations.\n\nTake a look through our work and let us know which styles catch your eye. We look forward to helping you design your dream space.\n\nWarm regards,\nThinkCRM Team",
  },
  {
    value: "check_in",
    label: "General Follow-up / Check-in",
    subject: "Checking in on your {{projectType}} project",
    body: "Hi {{name}},\n\nI hope everything is going well with you. I wanted to touch base to see if you have had a chance to consider your {{projectType}} project plans, or if there is anything else you need from our end.\n\nWe are here whenever you are ready to take the next step.\n\nBest regards,\nThinkCRM Team",
  },
];

const SendEmailModal = ({ isOpen, onClose, lead }) => {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});

  const [sendLeadEmail, { isLoading }] = useSendLeadEmailMutation();

  useEffect(() => {
    if (lead) {
      setTo(lead.email || "");
      setSelectedTemplate("");
      const name = lead.fullName || "Client";
      const projectType = lead.projectType || "Interior Design";
      setSubject(`Inquiry Follow-up: ${projectType} - ThinkCRM`);
      setMessage(
        `Dear ${name},\n\nThank you for your interest in ThinkCRM. We would love to discuss your ${projectType} project requirements and how we can bring your ideas to life.\n\nPlease let us know when would be a convenient time for a quick call or site meeting.\n\nWarm regards,\nThinkCRM Team`
      );
      setErrors({});
    }
  }, [lead, isOpen]);

  // Populate template
  const handleTemplateChange = (val) => {
    setSelectedTemplate(val);
    const tmpl = EMAIL_TEMPLATES.find((t) => t.value === val);
    if (tmpl && lead) {
      const name = lead.fullName || "Valued Client";
      const projectType = lead.projectType || "Interior Design";

      const sub = tmpl.subject
        .replace(/{{name}}/g, name)
        .replace(/{{projectType}}/g, projectType);

      const bod = tmpl.body
        .replace(/{{name}}/g, name)
        .replace(/{{projectType}}/g, projectType);

      setSubject(sub);
      setMessage(bod);
      if (errors.subject) setErrors((prev) => ({ ...prev, subject: null }));
      if (errors.message) setErrors((prev) => ({ ...prev, message: null }));
    }
  };

  // Attachment handler - reads files into base64 for direct SMTP attachment
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      if (file.size > 15 * 1024 * 1024) {
        toast.warning(`File ${file.name} exceeds 15MB limit`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = (reader.result || "").split(",")[1];
        setAttachments((prev) => [
          ...prev,
          {
            filename: file.name,
            content: base64Data,
            encoding: "base64",
            contentType: file.type || "application/octet-stream",
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          },
        ]);
      };
      reader.onerror = () => {
        toast.error(`Failed to read file ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const newErrors = {};

    const toVal = validateEmail(to, { required: true, label: "Recipient Email" });
    if (!toVal.isValid) newErrors.to = toVal.error;

    if (cc && cc.trim()) {
      const ccVal = validateEmail(cc, { required: false, label: "Cc Email" });
      if (!ccVal.isValid) newErrors.cc = ccVal.error;
    }

    if (bcc && bcc.trim()) {
      const bccVal = validateEmail(bcc, { required: false, label: "Bcc Email" });
      if (!bccVal.isValid) newErrors.bcc = bccVal.error;
    }

    const subVal = validateText(subject, { required: true, minLength: 2, maxLength: 500, max: 500, label: "Subject", allowSpecialChars: true });
    if (!subVal.isValid) newErrors.subject = subVal.error;

    const msgVal = validateText(message, { required: true, minLength: 2, maxLength: 10000, max: 10000, label: "Message", allowSpecialChars: true });
    if (!msgVal.isValid) newErrors.message = msgVal.error;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      focusFirstError(newErrors);
      return false;
    }
    return true;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await sendLeadEmail({
        id: lead._id,
        emailData: {
          to: to.trim().toLowerCase(),
          cc: cc.trim().toLowerCase() || undefined,
          bcc: bcc.trim().toLowerCase() || undefined,
          subject: subject.trim(),
          message: message.trim(),
          attachments,
        },
      }).unwrap();

      toast.success("Email sent to lead successfully!");
      setErrors({});
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to send email to lead");
    }
  };

  return (
    <Modal
      title="Send Email to Lead"
      activeModal={isOpen}
      onClose={onClose}
      className="max-w-3xl font-inter"
      centered={true}
    >
      <form onSubmit={handleSend} className="space-y-4 pt-1">
        {/* Recipient */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex-1">
            <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1 block">
              To <span className="text-danger-500">*</span>
            </label>
            <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 bg-white dark:bg-slate-900 ${
              errors.to ? "border-rose-400" : "border-slate-200 dark:border-slate-700"
            }`}>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 whitespace-nowrap">
                {lead?.fullName || "Lead"}
              </span>
              <input
                id="to"
                type="email"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  if (errors.to) setErrors((prev) => ({ ...prev, to: null }));
                }}
                placeholder="lead@example.com"
                className="bg-transparent text-sm text-slate-800 dark:text-slate-100 flex-1 outline-none"
              />
            </div>
            {errors.to && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.to}</p>}
          </div>
          <button
            type="button"
            onClick={() => setShowCcBcc(!showCcBcc)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline self-end sm:self-center pt-2 sm:pt-4 cursor-pointer"
          >
            {showCcBcc ? "Hide Cc/Bcc" : "Cc, Bcc"}
          </button>
        </div>

        {/* CC / BCC fields */}
        {showCcBcc && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <div>
              <label className="form-label text-xs font-semibold text-slate-500 mb-1 block">Cc</label>
              <input
                id="cc"
                type="text"
                value={cc}
                onChange={(e) => {
                  setCc(e.target.value);
                  if (errors.cc) setErrors((prev) => ({ ...prev, cc: null }));
                }}
                placeholder="cc@example.com"
                className={`w-full px-3 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none ${
                  errors.cc ? "border-rose-400" : "border-slate-200 dark:border-slate-700 focus:border-blue-500"
                }`}
              />
              {errors.cc && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.cc}</p>}
            </div>
            <div>
              <label className="form-label text-xs font-semibold text-slate-500 mb-1 block">Bcc</label>
              <input
                id="bcc"
                type="text"
                value={bcc}
                onChange={(e) => {
                  setBcc(e.target.value);
                  if (errors.bcc) setErrors((prev) => ({ ...prev, bcc: null }));
                }}
                placeholder="bcc@example.com"
                className={`w-full px-3 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none ${
                  errors.bcc ? "border-rose-400" : "border-slate-200 dark:border-slate-700 focus:border-blue-500"
                }`}
              />
              {errors.bcc && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.bcc}</p>}
            </div>
          </div>
        )}

        {/* Template Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1 block">
              Template (Quick Load or Write Custom Below)
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">Select a reusable template...</option>
              {EMAIL_TEMPLATES.map((tmpl) => (
                <option key={tmpl.value} value={tmpl.value}>
                  {tmpl.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1 block">
            Subject <span className="text-danger-500">*</span>
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (errors.subject) setErrors((prev) => ({ ...prev, subject: null }));
            }}
            placeholder="e.g. Following up on your Modular Kitchen inquiry"
            className={`w-full px-3.5 py-2 text-sm font-medium rounded-lg border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none ${
              errors.subject ? "border-rose-400 focus:border-rose-500" : "border-slate-200 dark:border-slate-700 focus:border-blue-500"
            }`}
          />
          {errors.subject && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.subject}</p>}
        </div>

        {/* Message Editor */}
        <div>
          <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1 block">
            Message <span className="text-danger-500">*</span>
          </label>
          {/* Format Toolbar */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-t-lg text-slate-600 dark:text-slate-300">
            <span className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer font-bold text-xs select-none">
              B
            </span>
            <span className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer italic text-xs select-none">
              I
            </span>
            <span className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer underline text-xs select-none">
              U
            </span>
            <span className="h-4 w-[1px] bg-slate-300 dark:bg-slate-600 mx-1" />
            <Icon icon="heroicons:list-bullet" className="text-sm cursor-pointer hover:text-blue-600" />
            <Icon icon="heroicons:numbered-list" className="text-sm cursor-pointer hover:text-blue-600" />
            <Icon icon="heroicons:link" className="text-sm cursor-pointer hover:text-blue-600 ml-1" />
          </div>
          <textarea
            id="message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (errors.message) setErrors((prev) => ({ ...prev, message: null }));
            }}
            rows={7}
            placeholder="Write your email message here or edit the selected template..."
            className={`w-full p-3 border-x border-b rounded-b-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:outline-none font-sans leading-relaxed ${
              errors.message ? "border-rose-400 focus:border-rose-500" : "border-slate-200 dark:border-slate-700 focus:border-blue-500"
            }`}
          />
          {errors.message && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.message}</p>}
        </div>

        {/* Attachments list */}
        {attachments.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase block">Attachments</label>
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
                    className="text-slate-400 hover:text-danger-500 cursor-pointer"
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
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs md:text-sm font-semibold transition cursor-pointer"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs md:text-sm font-semibold transition disabled:opacity-60 cursor-pointer"
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
