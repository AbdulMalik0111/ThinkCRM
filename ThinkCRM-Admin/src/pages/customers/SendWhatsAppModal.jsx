import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import { useAddCustomerNoteMutation } from "@/store/api/customers/customersApiSlice";
import { validatePhone, validateText } from "@/utils/validation";

const WA_TEMPLATES = [
  {
    title: "Project Follow-up",
    message: "Hi {{name}}, this is a follow-up on your {{projectType}} project. Please let me know if you would like to schedule a site visit or need any more information.\n\nThanks,\nThinkCRM Team",
  },
  {
    title: "Site Visit Confirmation",
    message: "Hello {{name}}, our team is scheduled to visit your site today for the {{projectType}} project. Please ensure access is available. Feel free to call us for directions.",
  },
  {
    title: "Quotation Sent",
    message: "Hi {{name}}, we have just shared the detailed quotation for your project. Please review and let us know if you need any adjustments. Have a great day!",
  },
  {
    title: "Completion Follow-up",
    message: "Dear {{name}}, we hope you are loving your new {{projectType}}! It was a pleasure working with you. Please reach out if you ever need any assistance or have questions.",
  },
];

const SendWhatsAppModal = ({ isOpen, onClose, customer }) => {
  const [message, setMessage] = useState(
    `This is a follow-up on your ${customer?.projectType || "interior"} project. Please let me know if you would like to schedule a site visit or need any more information.\n\nThanks,\nThinkCRM Team`
  );
  const [messageError, setMessageError] = useState("");
  const [addCustomerNote] = useAddCustomerNoteMutation();

  const handleUseTemplate = (tmpl) => {
    const name = customer?.fullName || "Valued Customer";
    const projectType = customer?.projectType || "Modular Kitchen";
    const formatted = tmpl.message
      .replace(/{{name}}/g, name)
      .replace(/{{projectType}}/g, projectType);
    setMessage(formatted);
    setMessageError("");
  };

  const handleSendWhatsApp = async () => {
    if (!customer?.phone) {
      toast.error("Customer does not have a phone number");
      return;
    }

    const phoneValidation = validatePhone(customer.phone);
    if (!phoneValidation.isValid) {
      toast.error(phoneValidation.error || "Customer has an invalid phone number");
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

    // Clean phone number (strip spaces, dashes, parentheses)
    let cleanPhone = customer.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message.trim())}`;
    window.open(waUrl, "_blank");

    // Log the communication into the customer's notes/activity
    try {
      await addCustomerNote({
        id: customer._id,
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
      title="Send WhatsApp Message"
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
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <Icon icon="whatsapp" className="text-base" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  {customer?.fullName || "Customer"}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {customer?.phone || "No phone number available"}
                </span>
              </div>
            </div>

            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition"
              >
                <Icon icon="heroicons-outline:document-text" className="text-xs text-slate-400" />
                <span>Templates</span>
                <Icon icon="heroicons-outline:chevron-down" className="text-xs text-slate-400" />
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 hidden group-hover:block z-50 animate-fadeIn">
                <div className="text-[11px] font-bold text-slate-400 uppercase px-2.5 py-1">
                  Select Template
                </div>
                {WA_TEMPLATES.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleUseTemplate(t)}
                    className="w-full text-left px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg transition"
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
            rows={5}
            placeholder="Type your WhatsApp message..."
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
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs md:text-sm font-semibold transition"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs md:text-sm font-semibold text-white bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] rounded-xl transition"
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
