import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";
import { useAddLeadNoteMutation } from "@/store/api/leads/leadsApiSlice";
import { validatePhone, validateText } from "@/utils/validation";

const WA_TEMPLATES = [
  {
    title: "Initial Inquiry Follow-up",
    message:
      "Hi {{name}}, thank you for reaching out to ThinkCRM regarding your {{projectType}} project. We would love to discuss your requirements and how we can bring your ideas to life. When would be a good time for a quick call?\n\nBest regards,\nThinkCRM Team",
  },
  {
    title: "Consultation / Site Visit Booking",
    message:
      "Hello {{name}}, would you like to schedule a free site consultation for your {{projectType}} project? Our design and measurement expert can visit at your convenience to take accurate measurements and share 3D concepts.\n\nWarm regards,\nThinkCRM Team",
  },
  {
    title: "Quotation Discussion",
    message:
      "Hi {{name}}, we have prepared the initial estimate for your {{projectType}} project. Let us know if you would like to review the quotation together or make any custom adjustments. Have a great day!\n\nThanks,\nThinkCRM Team",
  },
  {
    title: "Measurement Scheduled",
    message:
      "Dear {{name}}, our team is scheduled to visit your site for the {{projectType}} measurement. Please ensure site access is available. Feel free to reply if you need to reschedule.\n\nBest,\nThinkCRM Team",
  },
  {
    title: "Special Offer & Brochure Share",
    message:
      "Hi {{name}}, we're offering exclusive discounts on our {{projectType}} packages this month! Would you like us to share our latest modern design catalogue?\n\nWarm regards,\nThinkCRM Team",
  },
];

const SendWhatsAppModal = ({ isOpen, onClose, lead }) => {
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState("");
  const [addLeadNote] = useAddLeadNoteMutation();

  useEffect(() => {
    if (lead) {
      const name = lead.fullName || "there";
      const projectType = lead.projectType || "interior";
      setMessage(
        `Hi ${name}, this is a follow-up on your ${projectType} inquiry with ThinkCRM. Please let me know if you would like to schedule a site visit or need any more information.\n\nThanks,\nThinkCRM Team`
      );
      setMessageError("");
    }
  }, [lead]);

  const handleUseTemplate = (tmpl) => {
    const name = lead?.fullName || "Valued Client";
    const projectType = lead?.projectType || "Interior Design";
    const formatted = tmpl.message
      .replace(/{{name}}/g, name)
      .replace(/{{projectType}}/g, projectType);
    setMessage(formatted);
    setMessageError("");
  };

  const handleSendWhatsApp = async () => {
    if (!lead?.phone) {
      toast.error("Lead does not have a phone number");
      return;
    }

    const phoneValidation = validatePhone(lead.phone);
    if (!phoneValidation.isValid) {
      toast.error(phoneValidation.error || "Lead has an invalid phone number");
      return;
    }

    const msgValidation = validateText(message, {
      required: true,
      minLength: 2,
      maxLength: 1000,
      label: "WhatsApp message",
    });
    if (!msgValidation.isValid) {
      setMessageError(msgValidation.error);
      return;
    }

    // Normalized phone without + or special symbols for WhatsApp deep link
    let cleanPhone = lead.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message.trim())}`;
    window.open(waUrl, "_blank");

    // Log the communication into the lead's notes/activity
    try {
      await addLeadNote({
        id: lead._id,
        content: `WhatsApp message initiated: "${message.trim()}"`,
      }).unwrap();
    } catch (e) {
      // Non-blocking
    }

    toast.success("WhatsApp initiated in browser!");
    onClose();
  };

  return (
    <Modal
      title="Send WhatsApp Message to Lead"
      activeModal={isOpen}
      onClose={onClose}
      className="max-w-xl font-inter"
      centered={true}
    >
      <div className="space-y-4 pt-1">
        {/* Recipient Card */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
            Recipient
          </label>
          <div className="flex items-center justify-between border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#25D366] flex items-center justify-center">
                <Icon icon="whatsapp" className="text-base" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  {lead?.fullName || "Lead"}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {lead?.phone || "No phone number available"}
                </span>
              </div>
            </div>

            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition cursor-pointer"
              >
                <Icon icon="heroicons-outline:document-text" className="text-xs text-slate-400" />
                <span>Templates</span>
                <Icon icon="heroicons-outline:chevron-down" className="text-xs text-slate-400" />
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 hidden group-hover:block z-50 animate-fadeIn shadow-lg">
                <div className="text-[11px] font-bold text-slate-400 uppercase px-2.5 py-1">
                  Select Template
                </div>
                {WA_TEMPLATES.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleUseTemplate(t)}
                    className="w-full text-left px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg transition cursor-pointer"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              Message
            </label>
            <span className="text-[11px] font-medium text-slate-400">
              {message.length} / 1000
            </span>
          </div>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value.slice(0, 1000));
              if (messageError) setMessageError("");
            }}
            rows={6}
            placeholder="Type your WhatsApp message or pick a template above..."
            className={`w-full p-3.5 border rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:outline-none transition leading-relaxed ${
              messageError
                ? "border-rose-400 focus:border-rose-500"
                : "border-slate-200 dark:border-slate-700 focus:border-emerald-500"
            }`}
          />
          {messageError && (
            <p className="text-xs text-rose-500 mt-1 font-medium">{messageError}</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs md:text-sm font-semibold transition cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs md:text-sm font-semibold text-white bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] rounded-xl transition cursor-pointer"
          >
            <Icon icon="whatsapp" className="text-base" />
            <span>Send WhatsApp</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SendWhatsAppModal;
