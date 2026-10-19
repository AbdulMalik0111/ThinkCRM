import React, { useState, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from "@headlessui/react";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  useGetCustomerByIdQuery,
  useDeleteCustomerMutation,
  useAddCustomerNoteMutation,
  useUpdateCustomerNoteMutation,
  useDeleteCustomerNoteMutation,
  useDeleteCustomerDocumentMutation,
  useUpdateCustomerFollowUpMutation,
  useDeleteCustomerFollowUpMutation,
  useSendCustomerQuotationMutation,
  useDeleteCustomerQuotationMutation,
} from "@/store/api/customers/customersApiSlice";

// Modals
import SendEmailModal from "./SendEmailModal";
import SendWhatsAppModal from "./SendWhatsAppModal";
import ScheduleFollowUpModal from "./ScheduleFollowUpModal";
import AddProjectModal from "./AddProjectModal";
import UploadDocumentModal from "./UploadDocumentModal";
import UploadCustomerQuotationModal from "./UploadCustomerQuotationModal";
import LogCallModal from "./LogCallModal";
import CustomerActivities from "./CustomerActivities";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import Modal from "@/components/ui/Modal";

const TABS = [
  { id: "overview", label: "Overview", icon: "heroicons-outline:squares-2x2" },
  { id: "projects", label: "Projects", icon: "heroicons-outline:briefcase" },
  { id: "communications", label: "Communications", icon: "heroicons-outline:chat-bubble-left-right" },
  { id: "quotations", label: "Quotations", icon: "heroicons-outline:document-text" },
  { id: "followups", label: "Follow-ups", icon: "heroicons-outline:calendar" },
  { id: "files", label: "Files & Documents", icon: "heroicons-outline:folder-open" },
  { id: "notes", label: "Notes", icon: "heroicons-outline:pencil-square" },
  { id: "activity", label: "Activity", icon: "heroicons-outline:bolt" },
];

const statusStyles = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  completed: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
  on_hold: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
};

const getActivityMeta = (type) => {
  switch (type) {
    case "customer_email_sent":
      return { title: "Email Sent", icon: "heroicons-outline:envelope", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" };
    case "customer_whatsapp_sent":
      return { title: "WhatsApp Sent", icon: "whatsapp", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" };
    case "customer_call_logged":
      return { title: "Call Logged", icon: "heroicons-outline:phone", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40" };
    case "customer_note_added":
    case "customer_note_updated":
    case "customer_note_deleted":
      return { title: "Note Activity", icon: "heroicons-outline:pencil-square", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40" };
    case "customer_file_uploaded":
      return { title: "Document Uploaded", icon: "heroicons-outline:arrow-up-tray", color: "text-teal-600 bg-teal-50 dark:bg-teal-950/40" };
    case "project_created":
    case "project_updated":
      return { title: "Project Activity", icon: "heroicons-outline:briefcase", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" };
    case "follow_up_created":
    case "follow_up_completed":
      return { title: "Follow-up", icon: "heroicons-outline:calendar", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40" };
    case "customer_created":
      return { title: "Customer Created", icon: "heroicons-outline:user-plus", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" };
    case "customer_updated":
      return { title: "Customer Updated", icon: "heroicons-outline:pencil", color: "text-slate-600 bg-slate-50 dark:bg-slate-700" };
    default:
      return { title: "CRM Event", icon: "heroicons-outline:bolt", color: "text-primary-600 bg-primary-50 dark:bg-primary-950/40" };
  }
};

const CustomerView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");

  // Modals state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [isLogCallModalOpen, setIsLogCallModalOpen] = useState(false);

  // Customer Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  // Notes state
  const [noteContent, setNoteContent] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [editNoteContent, setEditNoteContent] = useState("");
  const [deleteNoteConfirm, setDeleteNoteConfirm] = useState({
    isOpen: false,
    noteId: null,
    isLoading: false,
  });

  // Document deletion state
  const [deleteDocConfirm, setDeleteDocConfirm] = useState({
    isOpen: false,
    docId: null,
    docName: "",
    isLoading: false,
  });

  // Quotation deletion state
  const [deleteQuoteConfirm, setDeleteQuoteConfirm] = useState({
    isOpen: false,
    quoteId: null,
    quoteNumber: "",
    isLoading: false,
  });

  // RTK Query
  const { data, isLoading, isError, refetch } = useGetCustomerByIdQuery(id);
  const [deleteCustomer] = useDeleteCustomerMutation();
  const [addCustomerNote, { isLoading: isAddingNote }] = useAddCustomerNoteMutation();
  const [updateCustomerNote, { isLoading: isUpdatingNote }] = useUpdateCustomerNoteMutation();
  const [deleteCustomerNote] = useDeleteCustomerNoteMutation();
  const [deleteCustomerDocument] = useDeleteCustomerDocumentMutation();
  const [updateCustomerFollowUp] = useUpdateCustomerFollowUpMutation();
  const [deleteCustomerFollowUp] = useDeleteCustomerFollowUpMutation();
  const [sendCustomerQuotation, { isLoading: isSendingQuotation }] = useSendCustomerQuotationMutation();
  const [deleteCustomerQuotation] = useDeleteCustomerQuotationMutation();

  const handleConfirmDeleteCustomer = async () => {
    try {
      setIsDeletingCustomer(true);
      await deleteCustomer(id).unwrap();
      toast.success("Customer deleted successfully");
      setIsDeleteModalOpen(false);
      navigate("/customers");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete customer");
      setIsDeletingCustomer(false);
    }
  };

  const handleSendQuotation = async (quotationId) => {
    try {
      await sendCustomerQuotation(quotationId).unwrap();
      toast.success("Quotation sent to customer email successfully!");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to send quotation");
    }
  };

  const handleConfirmDeleteQuotation = async () => {
    if (!deleteQuoteConfirm.quoteId) return;
    try {
      setDeleteQuoteConfirm((prev) => ({ ...prev, isLoading: true }));
      await deleteCustomerQuotation(deleteQuoteConfirm.quoteId).unwrap();
      toast.success("Quotation deleted successfully");
      setDeleteQuoteConfirm({ isOpen: false, quoteId: null, quoteNumber: "", isLoading: false });
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete quotation");
      setDeleteQuoteConfirm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleCompleteFollowUp = async (followUpId) => {
    try {
      await updateCustomerFollowUp({
        customerId: id,
        followUpId,
        data: { status: "completed", outcome: "interested" },
      }).unwrap();
      toast.success("Follow-up marked as completed");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update follow-up");
    }
  };

  const handleCancelFollowUp = async (followUpId) => {
    try {
      await updateCustomerFollowUp({
        customerId: id,
        followUpId,
        data: { status: "cancelled", notes: "Cancelled by staff" },
      }).unwrap();
      toast.success("Follow-up cancelled");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to cancel follow-up");
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    try {
      await addCustomerNote({ id, content: noteContent.trim() }).unwrap();
      setNoteContent("");
      toast.success("Note added successfully");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add note");
    }
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    if (!editNoteContent.trim() || !editingNote) return;
    try {
      await updateCustomerNote({
        id,
        noteId: editingNote._id,
        content: editNoteContent.trim(),
      }).unwrap();
      setEditingNote(null);
      setEditNoteContent("");
      toast.success("Note updated successfully");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update note");
    }
  };

  const handleConfirmDeleteNote = async () => {
    if (!deleteNoteConfirm.noteId) return;
    try {
      setDeleteNoteConfirm((prev) => ({ ...prev, isLoading: true }));
      await deleteCustomerNote({ id, noteId: deleteNoteConfirm.noteId }).unwrap();
      toast.success("Note deleted successfully");
      setDeleteNoteConfirm({ isOpen: false, noteId: null, isLoading: false });
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete note");
      setDeleteNoteConfirm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleConfirmDeleteDoc = async () => {
    if (!deleteDocConfirm.docId) return;
    try {
      setDeleteDocConfirm((prev) => ({ ...prev, isLoading: true }));
      await deleteCustomerDocument({ id, docId: deleteDocConfirm.docId }).unwrap();
      toast.success("Document deleted successfully");
      setDeleteDocConfirm({ isOpen: false, docId: null, docName: "", isLoading: false });
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete document");
      setDeleteDocConfirm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  if (isLoading) return <Loading />;
  if (isError || !data?.data?.customer) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <Icon icon="heroicons-outline:exclamation-triangle" className="text-4xl text-amber-500 mx-auto mb-2" />
        <h4 className="text-lg font-bold text-slate-800 dark:text-white">Customer Not Found</h4>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          The customer profile you are looking for may have been archived or does not exist.
        </p>
        <Button text="Back to Directory" className="btn-primary btn-sm" onClick={() => navigate("/customers")} />
      </div>
    );
  }

  const {
    customer,
    leads = [],
    projects = customer?.projects || [],
    quotations = [],
    followUps = [],
    documents = customer?.documents || [],
    notes = customer?.notes || [],
    activities = [],
  } = data.data;

  // Helpers
  const formatCurrency = (amt) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  const handleCall = () => {
    if (customer.phone) {
      window.location.href = `tel:${customer.phone}`;
    } else {
      toast.info("No phone number available for this customer.");
    }
  };

  const handleDownloadFile = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      let dlUrl = url;
      if (url && url.includes("/upload/")) {
        dlUrl = url.replace("/upload/", `/upload/fl_attachment:${encodeURIComponent(fileName || "document")}/`);
      }
      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = fileName || "document";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Projects calculations
  const activeProjectsCount = projects.filter((p) => p.status === "active" || p.status === "in_progress").length;
  const completedProjectsCount = projects.filter((p) => p.status === "completed").length;
  const totalCustomerValue = customer.totalValue || projects.reduce((acc, p) => acc + (p.budget || 0), 0);

  const assignedStaffName = customer.assignedStaff
    ? `${customer.assignedStaff.firstName || ""} ${customer.assignedStaff.lastName || ""}`.trim() ||
      customer.assignedStaff.name ||
      "Unassigned"
    : "Unassigned";

  return (
    <div className="space-y-6 font-inter">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <button
          onClick={() => navigate("/customers")}
          className="hover:text-primary-600 transition flex items-center gap-1"
        >
          <Icon icon="heroicons-outline:users" />
          <span>Customers</span>
        </button>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 font-semibold">{customer.fullName}</span>
      </div>

      {/* Customer Header Banner - Pure Flat Design */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Avatar + Details */}
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="h-20 w-20 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                {customer.avatar ? (
                  <img src={customer.avatar} alt={customer.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary-600 uppercase">
                    {customer.fullName?.charAt(0) || "C"}
                  </span>
                )}
              </div>
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {customer.fullName}
                </h2>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                  {customer.customerId || "CUS-NEW"}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${
                    statusStyles[customer.status] || statusStyles.active
                  }`}
                >
                  {customer.status ? customer.status.replace("_", " ") : "Active"}
                </span>
                {customer.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Sub-contact details - Enhanced contrast and semi-bold */}
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-200 pt-1.5">
                <span className="flex items-center gap-1.5">
                  <Icon icon="heroicons-outline:phone" className="text-slate-500 dark:text-slate-400 text-sm" />
                  <a href={`tel:${customer.phone}`} className="hover:text-primary-600 font-semibold text-slate-800 dark:text-slate-100 transition">
                    {customer.phone || "—"}
                  </a>
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1.5">
                    <Icon icon="heroicons-outline:envelope" className="text-slate-500 dark:text-slate-400 text-sm" />
                    <a href={`mailto:${customer.email}`} className="hover:text-primary-600 font-semibold text-slate-800 dark:text-slate-100 transition">
                      {customer.email}
                    </a>
                  </span>
                )}
                {(customer.location || customer.city) && (
                  <span className="flex items-center gap-1.5">
                    <Icon icon="heroicons-outline:map-pin" className="text-slate-500 dark:text-slate-400 text-sm" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {customer.location || `${customer.city}${customer.state ? `, ${customer.state}` : ""}`}
                    </span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Icon icon="heroicons-outline:user" className="text-slate-500 dark:text-slate-400 text-sm" />
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    Assigned: {assignedStaffName}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Three-Dot Actions Menu */}
          <div className="relative">
            <Menu as="div" className="relative inline-block text-left">
              <MenuButton
                type="button"
                className="h-10 w-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white transition focus:outline-none"
                title="Customer Actions"
              >
                <Icon icon="heroicons-outline:ellipsis-vertical" className="text-xl" />
              </MenuButton>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <MenuItems className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 z-40 focus:outline-none font-inter">
                  <MenuItem>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={handleCall}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                          active
                            ? "bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-white"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <Icon icon="heroicons-outline:phone" className="text-base text-slate-500 dark:text-slate-400" />
                        <span>Call Customer</span>
                      </button>
                    )}
                  </MenuItem>

                  <MenuItem>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => setIsLogCallModalOpen(true)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                          active
                            ? "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300"
                            : "text-slate-700 dark:text-slate-200 hover:text-cyan-600"
                        }`}
                      >
                        <Icon icon="heroicons-outline:phone-arrow-up-right" className="text-base text-cyan-600 dark:text-cyan-400" />
                        <span>Log Call Interaction</span>
                      </button>
                    )}
                  </MenuItem>

                  <MenuItem>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => setIsWhatsAppModalOpen(true)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                          active
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                            : "text-slate-700 dark:text-slate-200 hover:text-emerald-600"
                        }`}
                      >
                        <Icon icon="whatsapp" className="text-base text-emerald-600 dark:text-emerald-400" />
                        <span>Send WhatsApp</span>
                      </button>
                    )}
                  </MenuItem>

                  <MenuItem>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => setIsEmailModalOpen(true)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                          active
                            ? "bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300"
                            : "text-slate-700 dark:text-slate-200 hover:text-primary-600"
                        }`}
                      >
                        <Icon icon="heroicons-outline:envelope" className="text-base text-primary-600 dark:text-primary-400" />
                        <span>Send Email</span>
                      </button>
                    )}
                  </MenuItem>

                  <MenuItem>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => setIsQuotationModalOpen(true)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                          active
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                            : "text-slate-700 dark:text-slate-200 hover:text-amber-600"
                        }`}
                      >
                        <Icon icon="heroicons-outline:document-arrow-up" className="text-base text-amber-600 dark:text-amber-400" />
                        <span>Upload Quotation</span>
                      </button>
                    )}
                  </MenuItem>

                  <MenuItem>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => setIsFollowUpModalOpen(true)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                          active
                            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                            : "text-slate-700 dark:text-slate-200 hover:text-blue-600"
                        }`}
                      >
                        <Icon icon="heroicons-outline:calendar" className="text-base text-blue-600 dark:text-blue-400" />
                        <span>Schedule Follow-up</span>
                      </button>
                    )}
                  </MenuItem>

                  <MenuItem>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => navigate(`/customers/${customer._id}/edit`)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                          active
                            ? "bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-white"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <Icon icon="heroicons-outline:pencil-square" className="text-base text-slate-500 dark:text-slate-400" />
                        <span>Edit Customer</span>
                      </button>
                    )}
                  </MenuItem>

                  <div className="border-t border-slate-100 dark:border-slate-700/80 my-1" />

                  <MenuItem>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => setActiveTab("notes")}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                          active
                            ? "bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-white"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <Icon icon="heroicons-outline:pencil-square" className="text-base text-purple-500" />
                        <span>Add Note</span>
                      </button>
                    )}
                  </MenuItem>

                  <MenuItem>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => setIsDocumentModalOpen(true)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                          active
                            ? "bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-white"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <Icon icon="heroicons-outline:arrow-up-tray" className="text-base text-teal-500" />
                        <span>Upload Document</span>
                      </button>
                    )}
                  </MenuItem>

                  {customer.sourceLeadId && (
                    <MenuItem>
                      {({ active }) => (
                        <button
                          type="button"
                          onClick={() => {
                            const leadId = customer.sourceLeadId._id || customer.sourceLeadId;
                            navigate(`/leads/${leadId}`);
                          }}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                            active
                              ? "bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-white"
                              : "text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          <Icon icon="heroicons-outline:arrow-top-right-on-square" className="text-base text-indigo-500" />
                          <span>View Source Lead</span>
                        </button>
                      )}
                    </MenuItem>
                  )}

                  <div className="border-t border-slate-100 dark:border-slate-700/80 my-1" />

                  <MenuItem>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => setIsDeleteModalOpen(true)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition text-rose-600 dark:text-rose-400 ${
                          active ? "bg-rose-50 dark:bg-rose-950/40" : ""
                        }`}
                      >
                        <Icon icon="heroicons-outline:trash" className="text-base text-rose-500" />
                        <span>Delete Customer</span>
                      </button>
                    )}
                  </MenuItem>
                </MenuItems>
              </Transition>
            </Menu>
          </div>
        </div>

        {/* Tab Navigation Menu - Professional 14px+, Semibold, Clean Indicators */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-200 dark:border-slate-700 pt-3 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
                  isActive
                    ? "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <Icon icon={tab.icon} className="text-base flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Display */}

      {/* 1. OVERVIEW TAB - Real Backend Values, No Fabricated Placeholders */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols wide on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions Card - Positioned at top */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                Quick Actions
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-400 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-primary-600 transition bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <Icon icon="heroicons-outline:briefcase" className="text-primary-500 text-base" />
                  <span>Add Project</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFollowUpModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-400 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-primary-600 transition bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <Icon icon="heroicons-outline:calendar" className="text-blue-500 text-base" />
                  <span>Follow-up</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsQuotationModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-400 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 transition bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <Icon icon="heroicons-outline:document-arrow-up" className="text-emerald-500 text-base" />
                  <span>Quotation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogCallModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-cyan-400 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-cyan-600 transition bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <Icon icon="heroicons-outline:phone-arrow-up-right" className="text-cyan-500 text-base" />
                  <span>Log Call</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("notes")}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-400 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-purple-600 transition bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <Icon icon="heroicons-outline:pencil-square" className="text-purple-500 text-base" />
                  <span>Add Note</span>
                </button>
              </div>
            </div>

            {/* Connected Leads Card - Direct access to all leads under this unique customer */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <Icon icon="heroicons-outline:user-group" className="text-base" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Connected Leads & Inquiries ({leads.length})
                    </h4>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  Unique verified customer profile
                </span>
              </div>

              <div className="space-y-3">
                {leads.map((ld) => {
                  const assignedName = ld.assignedTo
                    ? `${ld.assignedTo.firstName || ""} ${ld.assignedTo.lastName || ""}`.trim() ||
                      ld.assignedTo.name ||
                      "Staff"
                    : "Unassigned";

                  return (
                    <div
                      key={ld._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 hover:border-primary-300 dark:hover:border-primary-700 transition gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {ld.leadId || "LD-NEW"}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                            {ld.projectType || "General Requirement"}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                            {ld.status ? ld.status.replace("_", " ") : "New"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            Budget: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(ld.budget || 0)}</strong>
                          </span>
                          <span>•</span>
                          <span>Created: {dayjs(ld.createdAt).format("MMM D, YYYY")}</span>
                          <span>•</span>
                          <span>Assigned: {assignedName}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/leads/${ld._id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-primary-600 dark:text-primary-400 transition self-start sm:self-auto flex-shrink-0 cursor-pointer"
                      >
                        <span>Open Lead</span>
                        <Icon icon="heroicons-outline:arrow-top-right-on-square" className="text-sm" />
                      </button>
                    </div>
                  );
                })}

                {leads.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No leads linked to this customer record.
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                Customer Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <span className="text-slate-400 block text-xs font-medium">Full Name</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-medium">Phone</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.phone || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-medium">Email</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.email || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-medium">Alternate Phone</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.alternatePhone || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-medium">Source</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.source || "Direct"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-medium">Status</span>
                  <span className="mt-0.5 inline-block font-semibold capitalize text-emerald-600">
                    {customer.status ? customer.status.replace("_", " ") : "Active"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-medium">Assigned Staff</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {assignedStaffName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-medium">Tags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {customer.tags && customer.tags.length > 0 ? (
                      customer.tags.map((t) => (
                        <span
                          key={t}
                          className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                  <span className="text-slate-400 block text-xs font-medium">Customer Since</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium mt-0.5 block">
                    {dayjs(customer.createdAt).format("MMM D, YYYY, hh:mm A")}
                  </span>
                </div>
              </div>
            </div>

            {/* Address Information Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                Address Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-xs font-medium">Address</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.address || "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-medium">City</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.city || "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-medium">State</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.state || "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-medium">Pincode</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.pincode || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs font-medium">Country</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.country || "India"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1 Col wide on desktop) */}
          <div className="space-y-6">
            {/* Project Summary Card - Real Metrics Only */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                Relationship Summary
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Connected Leads</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{leads.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Active Projects</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{activeProjectsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Completed Projects</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{completedProjectsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Quotations</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{quotations.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Pending Follow-ups</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {followUps.filter((f) => f.status === "pending" || !f.status).length}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500 font-semibold">Total Pipeline Value</span>
                  <span className="font-bold text-sm text-primary-600">
                    {formatCurrency(totalCustomerValue)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Last Activity</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {activities[0]?.createdAt
                      ? dayjs(activities[0].createdAt).format("MMM D, YYYY")
                      : dayjs(customer.updatedAt).format("MMM D, YYYY")}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Communications Card - Real Backend Records */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Recent Communications</h4>
                <button
                  type="button"
                  onClick={() => setActiveTab("communications")}
                  className="text-xs font-semibold text-primary-600 hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {activities
                  .filter((a) =>
                    [
                      "customer_email_sent",
                      "customer_whatsapp_sent",
                      "customer_call_logged",
                      "follow_up_created",
                      "follow_up_completed",
                      "customer_note_added",
                    ].includes(a.type)
                  )
                  .slice(0, 4)
                  .map((act) => {
                    const meta = getActivityMeta(act.type);
                    const actor = act.performedBy
                      ? `${act.performedBy.firstName || ""} ${act.performedBy.lastName || ""}`.trim() ||
                        act.performedBy.name ||
                        "Staff"
                      : "Staff";

                    return (
                      <div key={act._id} className="flex items-start gap-3">
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}
                        >
                          <Icon icon={meta.icon} className="text-base" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {meta.title}
                            </p>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {dayjs(act.createdAt).format("MMM D, YYYY")}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words mt-0.5">
                            {act.description}
                          </p>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            By {actor}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                {activities.filter((a) =>
                  [
                    "customer_email_sent",
                    "customer_whatsapp_sent",
                    "customer_call_logged",
                    "follow_up_created",
                    "follow_up_completed",
                    "customer_note_added",
                  ].includes(a.type)
                ).length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No recent communications logged.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PROJECTS TAB */}
      {activeTab === "projects" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Customer Projects</h4>
            <Button
              text="Add Project"
              icon="heroicons-outline:plus"
              className="btn-primary btn-sm"
              onClick={() => setIsProjectModalOpen(true)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((proj, idx) => (
              <div
                key={proj._id || idx}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                      {proj.projectName || "Standard Project"}
                    </h5>
                    <span className="text-xs text-slate-400 font-medium">{proj.projectType}</span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      statusStyles[proj.status] || statusStyles.active
                    }`}
                  >
                    {proj.status?.replace("_", " ")}
                  </span>
                </div>

                {proj.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{proj.description}</p>
                )}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Budget</span>
                    <span className="font-bold text-primary-600">{formatCurrency(proj.budget)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Start Date</span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {proj.startDate ? dayjs(proj.startDate).format("MMM D, YYYY") : "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {projects.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                No active projects added yet. Click &ldquo;Add Project&rdquo; to create one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. COMMUNICATIONS TAB */}
      {activeTab === "communications" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Communication History</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                text="Log Call"
                icon="heroicons-outline:phone-arrow-up-right"
                className="btn-outline-dark btn-sm text-xs"
                onClick={() => setIsLogCallModalOpen(true)}
              />
              <Button
                text="Send WhatsApp"
                icon="whatsapp"
                className="btn-outline-dark btn-sm text-xs"
                onClick={() => setIsWhatsAppModalOpen(true)}
              />
              <Button
                text="Send Email"
                icon="heroicons-outline:envelope"
                className="btn-primary btn-sm text-xs"
                onClick={() => setIsEmailModalOpen(true)}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            {activities
              .filter((a) =>
                [
                  "customer_email_sent",
                  "customer_whatsapp_sent",
                  "customer_call_logged",
                  "lead_email_sent",
                  "lead_whatsapp_sent",
                  "call_logged",
                  "email_sent",
                  "whatsapp_sent",
                  "follow_up_created",
                  "follow_up_completed",
                ].includes(a.type)
              )
              .map((act) => {
                const meta = getActivityMeta(act.type);
                const actor = act.performedBy
                  ? `${act.performedBy.firstName || ""} ${act.performedBy.lastName || ""}`.trim() ||
                    act.performedBy.name ||
                    "System"
                  : "System";

                return (
                  <div key={act._id} className="p-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}
                      >
                        <Icon icon={meta.icon} className="text-base" />
                      </div>
                      <div>
                        <h6 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {meta.title}
                        </h6>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap break-words">
                          {act.description}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                          <span>Staff: {actor}</span>
                          <span>•</span>
                          <span>{dayjs(act.createdAt).format("DD MMM YYYY, hh:mm A")}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase flex-shrink-0">
                      Verified Event
                    </span>
                  </div>
                );
              })}

            {activities.filter((a) =>
              [
                "customer_email_sent",
                "customer_whatsapp_sent",
                "customer_call_logged",
                "lead_email_sent",
                "lead_whatsapp_sent",
                "call_logged",
                "email_sent",
                "whatsapp_sent",
                "follow_up_created",
                "follow_up_completed",
              ].includes(a.type)
            ).length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No outbound communications recorded yet. Send an email, initiate WhatsApp, or log a call interaction.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. QUOTATIONS TAB - Display and Manage All Quotations Across Leads & Customer */}
      {activeTab === "quotations" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Customer & Lead Quotations</h4>
              <p className="text-xs text-slate-500">
                All proposals linked to this customer and their connected requirements
              </p>
            </div>
            <Button
              text="Upload Quotation"
              icon="heroicons-outline:document-arrow-up"
              className="btn-primary btn-sm text-xs font-semibold"
              onClick={() => setIsQuotationModalOpen(true)}
            />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-inter">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Quotation #</th>
                    <th className="px-5 py-3.5">Associated Requirement</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {quotations.map((q) => {
                    const leadInfo = q.leadId;
                    const reqLabel = leadInfo
                      ? `${leadInfo.projectType || "Project"} (${leadInfo.leadId || "Lead"})`
                      : "Customer Proposal";

                    return (
                      <tr key={q._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                        <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">
                          {q.quotationNumber || `QT-${q._id?.slice(-6).toUpperCase()}`}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
                            <Icon icon="heroicons-outline:link" className="text-xs" />
                            <span>{reqLabel}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-primary-600 text-sm">
                          {formatCurrency(q.totalAmount || q.subtotal || q.amount)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded border capitalize ${
                              q.status === "sent"
                                ? "bg-teal-50 text-teal-700 border-teal-200"
                                : q.status === "approved" || q.status === "accepted"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {q.status || "Draft"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {dayjs(q.createdAt).format("MMM D, YYYY")}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {q.pdfUrl && (
                              <a
                                href={q.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-semibold px-2 py-1 rounded hover:bg-primary-50 dark:hover:bg-primary-950/40 transition"
                                title="Download PDF"
                              >
                                <Icon icon="heroicons-outline:arrow-down-tray" className="text-sm" />
                                <span>PDF</span>
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSendQuotation(q._id)}
                              disabled={isSendingQuotation}
                              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition disabled:opacity-50"
                              title="Send Quotation to Client via Email"
                            >
                              <Icon icon="heroicons-outline:paper-airplane" className="text-sm" />
                              <span>{q.status === "sent" ? "Resend" : "Send"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteQuoteConfirm({
                                  isOpen: true,
                                  quoteId: q._id,
                                  quoteNumber: q.quotationNumber || "this quotation",
                                  isLoading: false,
                                })
                              }
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                              title="Delete Quotation"
                            >
                              <Icon icon="heroicons-outline:trash" className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {quotations.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400">
                        No quotations created for this customer or their connected leads yet. Click &ldquo;Upload Quotation&rdquo; to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. FOLLOW-UPS TAB - Schedule and Complete Follow-ups Directly */}
      {activeTab === "followups" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Scheduled Follow-ups</h4>
            <Button
              text="Schedule Follow-up"
              icon="heroicons-outline:calendar"
              className="btn-primary btn-sm text-xs font-semibold"
              onClick={() => setIsFollowUpModalOpen(true)}
            />
          </div>

          <div className="space-y-3 font-inter">
            {followUps.map((f) => {
              const isCompleted = f.status === "completed";
              const isCancelled = f.status === "cancelled";
              const isPending = !isCompleted && !isCancelled;
              const leadTag = f.leadProjectType || (f.leadId ? `${f.leadId.projectType || "Lead"} (${f.leadId.leadId || ""})` : null);

              return (
                <div
                  key={f._id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCompleted
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : isCancelled
                          ? "bg-rose-50 text-rose-500 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400"
                          : "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400"
                      }`}
                    >
                      <Icon
                        icon={
                          isCompleted
                            ? "heroicons-outline:check-circle"
                            : isCancelled
                            ? "heroicons-outline:x-circle"
                            : "heroicons-outline:calendar"
                        }
                        className="text-lg"
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h6 className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                          {f.type} Follow-up
                        </h6>
                        {leadTag && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300">
                            {leadTag}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            isCompleted
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isCancelled
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {f.status || "Pending"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {f.notes || "No additional notes provided"}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                        <span>Scheduled: {dayjs(f.scheduledAt).format("DD MMM YYYY, hh:mm A")}</span>
                        <span>•</span>
                        <span>
                          Assigned to:{" "}
                          {f.assignedTo
                            ? `${f.assignedTo.firstName || ""} ${f.assignedTo.lastName || ""}`.trim() || f.assignedTo.name
                            : "Staff"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for pending follow-ups */}
                  {isPending && (
                    <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCompleteFollowUp(f._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold transition"
                      >
                        <Icon icon="heroicons-outline:check" className="text-sm" />
                        <span>Mark Completed</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelFollowUp(f._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-xs font-semibold transition"
                      >
                        <Icon icon="heroicons-outline:x-mark" className="text-sm" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {followUps.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                No follow-ups currently scheduled for this customer or linked requirements. Click &ldquo;Schedule Follow-up&rdquo; to add one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. FILES & DOCUMENTS TAB - Unified Customer and Lead Documents */}
      {activeTab === "files" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Customer Files & Documents</h4>
              <p className="text-xs text-slate-500">
                Unified storage for documents across customer profiles and connected lead requirements
              </p>
            </div>
            <Button
              text="Upload File"
              icon="heroicons-outline:arrow-up-tray"
              className="btn-primary btn-sm text-xs font-semibold"
              onClick={() => setIsDocumentModalOpen(true)}
            />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 font-inter">
            {documents.map((doc) => {
              const isLeadDoc = doc.sourceType === "lead";

              return (
                <div key={doc._id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-lg bg-red-50 text-red-500 border border-red-200 flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase">
                      {doc.name?.split(".").pop() || "PDF"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h6 className="text-xs font-bold text-slate-900 dark:text-white">{doc.name}</h6>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isLeadDoc
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                              : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800"
                          }`}
                        >
                          {isLeadDoc
                            ? `Lead: ${doc.leadProjectType || doc.leadNumber || "Lead"}`
                            : "Customer Document"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span>{doc.size ? `${(doc.size / (1024 * 1024)).toFixed(1)} MB` : "File"}</span>
                        <span>•</span>
                        <span>{dayjs(doc.uploadedAt || customer.updatedAt).format("MMM D, YYYY")}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-500">{doc.category || "General"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 hover:text-primary-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                      title="View Document"
                    >
                      <Icon icon="heroicons-outline:eye" className="text-sm" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(doc.url, doc.name)}
                      className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                      title="Download File"
                    >
                      <Icon icon="heroicons-outline:arrow-down-tray" className="text-sm" />
                    </button>
                    {!isLeadDoc && (
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteDocConfirm({
                            isOpen: true,
                            docId: doc._id,
                            docName: doc.name,
                            isLoading: false,
                          })
                        }
                        className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 hover:text-danger-600 hover:bg-red-50 transition"
                        title="Delete File"
                      >
                        <Icon icon="heroicons-outline:trash" className="text-sm" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {documents.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No documents uploaded yet. Upload contracts, blueprints, or design specifications.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. NOTES TAB - Full Functional CRUD with Unified Customer & Lead Notes */}
      {activeTab === "notes" && (
        <div className="space-y-6 font-inter">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Add Customer Note</h4>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                rows="3"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Log internal notes, design preferences, client feedback, or phone conversation summary..."
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary-500"
                required
              ></textarea>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  text={isAddingNote ? "Adding Note..." : "Add Note"}
                  className="btn-primary text-xs px-4 py-2 font-semibold"
                  isLoading={isAddingNote}
                  disabled={isAddingNote || !noteContent.trim()}
                />
              </div>
            </form>
          </div>

          <div className="space-y-3">
            {notes.map((n) => {
              const author = n.createdBy
                ? `${n.createdBy.firstName || ""} ${n.createdBy.lastName || ""}`.trim() ||
                  n.createdBy.name ||
                  "Staff"
                : "Staff";
              const isLeadNote = n.sourceType === "lead";

              return (
                <div
                  key={n._id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isLeadNote
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                            : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                        }`}
                      >
                        {isLeadNote ? `Lead Note: ${n.leadNumber || "Lead"}` : "Customer Note"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-medium">
                      {n.content}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Added by: {author}</span>
                      <span>•</span>
                      <span>{dayjs(n.createdAt).format("DD MMM YYYY, hh:mm A")}</span>
                      {n.updatedAt && n.updatedAt !== n.createdAt && (
                        <>
                          <span>•</span>
                          <span className="italic">Edited</span>
                        </>
                      )}
                    </div>
                  </div>

                  {!isLeadNote && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNote(n);
                          setEditNoteContent(n.content);
                        }}
                        className="text-slate-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        title="Edit Note"
                      >
                        <Icon icon="heroicons-outline:pencil" className="text-sm" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteNoteConfirm({
                            isOpen: true,
                            noteId: n._id,
                            isLoading: false,
                          })
                        }
                        className="text-slate-400 hover:text-danger-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        title="Delete Note"
                      >
                        <Icon icon="heroicons-outline:trash" className="text-sm" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {notes.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                No notes logged for this customer or connected leads yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. ACTIVITY TIMELINE TAB - Exact LeadActivities Timeline Component & Design */}
      {activeTab === "activity" && (
        <CustomerActivities
          activities={activities}
          onAddNote={() => setActiveTab("notes")}
          onRefresh={() => refetch()}
        />
      )}

      {/* Support Modals */}
      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        customer={customer}
      />
      <SendWhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        customer={customer}
      />
      <ScheduleFollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        customer={customer}
        leads={leads}
      />
      <AddProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        customerId={customer._id}
      />
      <UploadDocumentModal
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
        customerId={customer._id}
      />
      <UploadCustomerQuotationModal
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        customer={customer}
        leads={leads}
        onSuccess={() => refetch()}
      />
      <LogCallModal
        isOpen={isLogCallModalOpen}
        onClose={() => setIsLogCallModalOpen(false)}
        customer={customer}
        leads={leads}
        onSuccess={() => refetch()}
      />

      {/* Edit Note Modal */}
      {editingNote && (
        <Modal
          title="Edit Customer Note"
          activeModal={Boolean(editingNote)}
          onClose={() => setEditingNote(null)}
          className="max-w-lg font-inter"
        >
          <form onSubmit={handleUpdateNote} className="space-y-4 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                Note Content
              </label>
              <textarea
                rows="4"
                value={editNoteContent}
                onChange={(e) => setEditNoteContent(e.target.value)}
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary-500"
                required
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setEditingNote(null)}
                disabled={isUpdatingNote}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition font-inter"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingNote || !editNoteContent.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition font-inter disabled:opacity-50"
              >
                {isUpdatingNote && <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-sm" />}
                <span>{isUpdatingNote ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Customer Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteCustomer}
        title="Delete Customer"
        entityName={customer.fullName}
        isLoading={isDeletingCustomer}
        confirmText="Delete Customer"
      />

      {/* Delete Note Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteNoteConfirm.isOpen}
        onClose={() => setDeleteNoteConfirm({ isOpen: false, noteId: null, isLoading: false })}
        onConfirm={handleConfirmDeleteNote}
        title="Delete Note"
        entityName="this note"
        message="This note will be permanently deleted from the customer record along with any attachments."
        isLoading={deleteNoteConfirm.isLoading}
        confirmText="Delete Note"
      />

      {/* Delete Document Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteDocConfirm.isOpen}
        onClose={() => setDeleteDocConfirm({ isOpen: false, docId: null, docName: "", isLoading: false })}
        onConfirm={handleConfirmDeleteDoc}
        title="Delete Document"
        entityName={deleteDocConfirm.docName || "this document"}
        message="This document will be permanently deleted from the customer's records."
        isLoading={deleteDocConfirm.isLoading}
        confirmText="Delete Document"
      />

      {/* Delete Quotation Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteQuoteConfirm.isOpen}
        onClose={() => setDeleteQuoteConfirm({ isOpen: false, quoteId: null, quoteNumber: "", isLoading: false })}
        onConfirm={handleConfirmDeleteQuotation}
        title="Delete Quotation"
        entityName={deleteQuoteConfirm.quoteNumber || "this quotation"}
        message="This quotation document and proposal will be permanently removed from CRM records."
        isLoading={deleteQuoteConfirm.isLoading}
        confirmText="Delete Quotation"
      />
    </div>
  );
};

export default CustomerView;
