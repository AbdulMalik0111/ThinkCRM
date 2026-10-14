import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import { useAddCustomerNoteMutation } from "@/store/api/customers/customersApiSlice";

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
  const [addCustomerNote] = useAddCustomerNoteMutation();

  const handleUseTemplate = (tmpl) => {
    const name = customer?.fullName || "Valued Customer";
    const projectType = customer?.projectType || "Modular Kitchen";
    const formatted = tmpl.message
      .replace(/{{name}}/g, name)
      .replace(/{{projectType}}/g, projectType);
    setMessage(formatted);
  };

  const handleSendWhatsApp = async () => {
    if (!customer?.phone) {
      toast.error("Customer does not have a valid phone number");
      return;
    }
    if (!message.trim()) {
      toast.error("Message cannot be empty");
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
        content: `WhatsApp message initiated: "${message.slice(0, 100)}..."`,
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
      className="max-w-xl"
    >
      <div className="space-y-4 pt-1">
        {/* Recipient */}
        <div>
          <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1">
            To
          </label>
          <div className="flex items-center justify-between border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-800">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {customer?.phone || "No phone"} ({customer?.fullName})
            </span>
            <div className="relative group">
              <button
                type="button"
                className="text-xs font-semibold px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Use Template
              </button>
              <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1.5 hidden group-hover:block z-50">
                {WA_TEMPLATES.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleUseTemplate(t)}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="form-label text-xs font-semibold uppercase text-slate-500 mb-1">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
            rows={6}
            placeholder="Type your WhatsApp message..."
            className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="flex justify-end text-[11px] text-slate-400 mt-1">
            <span>{message.length} / 1000</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <Button
            type="button"
            text="Cancel"
            className="btn-outline-dark text-xs py-2 px-4"
            onClick={onClose}
          />
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
          >
            <Icon icon="heroicons:chat-bubble-left-ellipsis" className="text-base" />
            <span>Send WhatsApp</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SendWhatsAppModal;
