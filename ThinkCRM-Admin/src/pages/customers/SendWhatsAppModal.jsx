import React, { useState, useRef, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";
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
    title: "Consultation Booking",
    message: "Hello {{name}}, our design team would love to schedule a consultation for your {{projectType}} project. What day this week works best for you?",
  },
  {
    title: "Completion Follow-up",
    message: "Dear {{name}}, we hope you are loving your new {{projectType}}! It was a pleasure working with you. Please reach out if you ever need any assistance or have questions.",
  },
];

const SendWhatsAppModal = ({ isOpen, onClose, customer }) => {
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState("");
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const templateRef = useRef(null);
  const [addCustomerNote] = useAddCustomerNoteMutation();

  useEffect(() => {
    if (customer && isOpen) {
      const name = customer.fullName || "Customer";
      const projectType = customer.projectType || "interior";
      setMessage(
        `Hi ${name}, this is a follow-up regarding your ${projectType} project. Please let us know if you would like to schedule a site visit or need any more information.\n\nThanks,\nThinkCRM Team`
      );
      setMessageError("");
      setIsTemplateOpen(false);
    }
  }, [customer, isOpen]);

  // Click-outside handler for template dropdown to prevent accidental hiding
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (templateRef.current && !templateRef.current.contains(event.target)) {
        setIsTemplateOpen(false);
      }
    };

    if (isTemplateOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTemplateOpen]);

  const handleUseTemplate = (tmpl) => {
    const name = customer?.fullName || "Valued Customer";
    const projectType = customer?.projectType || "Modular Kitchen";
    const formatted = tmpl.message
      .replace(/{{name}}/g, name)
      .replace(/{{projectType}}/g, projectType);
    setMessage(formatted);
    setMessageError("");
    setIsTemplateOpen(false);
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
      maxLength: 4000,
      max: 4000,
      label: "WhatsApp message",
      allowSpecialChars: true,
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
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12.004 2C6.486 2 2.012 6.474 2.012 11.993c0 1.815.488 3.52 1.34 5.006L2 22l5.132-1.346a9.954 9.954 0 0 0 4.872 1.339h.004c5.518 0 9.992-4.474 9.992-9.993 0-5.52-4.474-9.993-9.992-9.993z" />
                  <path
                    fill="#FFFFFF"
                    d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.476-.15-.677.15-.2.301-.776.978-.952 1.179-.175.2-.351.226-.652.075s-1.27-.468-2.42-1.493c-.894-.798-1.498-1.784-1.674-2.085-.175-.301-.019-.464.132-.614.135-.135.301-.351.451-.527.15-.175.2-.301.301-.501.101-.2.05-.376-.025-.526-.075-.15-.677-1.632-.927-2.234-.244-.587-.492-.507-.677-.517h-.576c-.2 0-.526.075-.802.376s-1.053 1.028-1.053 2.508 1.078 2.909 1.229 3.11c.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.716.635.722.23 1.38.197 1.9-.12.578-.352 1.78-1.455 2.031-2.864.25-1.41-.051-2.617-.251-2.918-.2-.301-.501-.451-.802-.602z"
                  />
                </svg>
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

            <div className="relative" ref={templateRef}>
              <button
                type="button"
                onClick={() => setIsTemplateOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white dark:bg-slate-700 border rounded-lg transition shadow-2xs cursor-pointer ${
                  isTemplateOpen
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/10"
                    : "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                }`}
              >
                <Icon icon="heroicons-outline:document-text" className="text-xs text-slate-400" />
                <span>Templates</span>
                <Icon
                  icon="heroicons-outline:chevron-down"
                  className={`text-xs text-slate-400 transition-transform duration-200 ${
                    isTemplateOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isTemplateOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 shadow-xl z-50 animate-fadeIn">
                  <div className="text-[11px] font-bold text-slate-400 uppercase px-2.5 py-1 tracking-wider border-b border-slate-100 dark:border-slate-700/60 mb-1">
                    Select Template
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5">
                    {WA_TEMPLATES.map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleUseTemplate(t)}
                        className="w-full text-left px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-lg transition cursor-pointer"
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
              {message.length} / 4000
            </span>
          </div>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value.slice(0, 4000));
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
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs md:text-sm font-semibold transition cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 text-xs md:text-sm font-bold text-white bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] rounded-xl transition shadow-sm hover:shadow cursor-pointer"
          >
            <span className="h-5 w-5 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-2xs">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="#25D366">
                <path d="M12.004 2C6.486 2 2.012 6.474 2.012 11.993c0 1.815.488 3.52 1.34 5.006L2 22l5.132-1.346a9.954 9.954 0 0 0 4.872 1.339h.004c5.518 0 9.992-4.474 9.992-9.993 0-5.52-4.474-9.993-9.992-9.993z" />
                <path
                  fill="#FFFFFF"
                  d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.476-.15-.677.15-.2.301-.776.978-.952 1.179-.175.2-.351.226-.652.075s-1.27-.468-2.42-1.493c-.894-.798-1.498-1.784-1.674-2.085-.175-.301-.019-.464.132-.614.135-.135.301-.351.451-.527.15-.175.2-.301.301-.501.101-.2.05-.376-.025-.526-.075-.15-.677-1.632-.927-2.234-.244-.587-.492-.507-.677-.517h-.576c-.2 0-.526.075-.802.376s-1.053 1.028-1.053 2.508 1.078 2.909 1.229 3.11c.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.716.635.722.23 1.38.197 1.9-.12.578-.352 1.78-1.455 2.031-2.864.25-1.41-.051-2.617-.251-2.918-.2-.301-.501-.451-.802-.602z"
                />
              </svg>
            </span>
            <span>Send WhatsApp</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SendWhatsAppModal;
