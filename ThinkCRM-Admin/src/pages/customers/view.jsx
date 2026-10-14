import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  useGetCustomerByIdQuery,
  useDeleteCustomerMutation,
  useAddCustomerNoteMutation,
  useDeleteCustomerNoteMutation,
  useDeleteCustomerDocumentMutation,
} from "@/store/api/customers/customersApiSlice";

// Modals
import SendEmailModal from "./SendEmailModal";
import SendWhatsAppModal from "./SendWhatsAppModal";
import ScheduleFollowUpModal from "./ScheduleFollowUpModal";
import AddProjectModal from "./AddProjectModal";
import UploadDocumentModal from "./UploadDocumentModal";
import CustomerForm from "./CustomerForm";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "projects", label: "Projects" },
  { id: "communications", label: "Communications" },
  { id: "quotations", label: "Quotations" },
  { id: "followups", label: "Follow-ups" },
  { id: "files", label: "Files & Documents" },
  { id: "notes", label: "Notes" },
  { id: "activity", label: "Activity" },
];

const statusStyles = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  completed: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
  on_hold: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
};

const CustomerView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);

  // Modals state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  // Quick note state in Notes tab
  const [noteContent, setNoteContent] = useState("");

  // RTK Query
  const { data, isLoading, isError, refetch } = useGetCustomerByIdQuery(id);
  const [deleteCustomer] = useDeleteCustomerMutation();
  const [addCustomerNote, { isLoading: isAddingNote }] = useAddCustomerNoteMutation();
  const [deleteCustomerNote] = useDeleteCustomerNoteMutation();
  const [deleteCustomerDocument] = useDeleteCustomerDocumentMutation();

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

  if (isLoading) return <Loading />;
  if (isError || !data?.data?.customer) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <Icon icon="heroicons:exclamation-triangle" className="text-4xl text-amber-500 mx-auto mb-2" />
        <h4 className="text-lg font-bold text-slate-800 dark:text-white">Customer Not Found</h4>
        <p className="text-sm text-slate-500 mt-1 mb-4">The customer profile you are looking for may have been deleted or does not exist.</p>
        <Button text="Back to Directory" className="btn-primary btn-sm" onClick={() => navigate("/customers")} />
      </div>
    );
  }

  const { customer, quotations = [], followUps = [], activities = [] } = data.data;

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

  const handleDeleteCustomer = async () => {
    if (window.confirm(`Are you sure you want to delete "${customer.fullName}"? This action can be reversed by an administrator.`)) {
      try {
        await deleteCustomer(customer._id).unwrap();
        toast.success("Customer removed successfully");
        navigate("/customers");
      } catch (err) {
        toast.error(err?.data?.message || "Failed to delete customer");
      }
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    try {
      await addCustomerNote({ id: customer._id, content: noteContent.trim() }).unwrap();
      setNoteContent("");
      toast.success("Note added successfully");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add note");
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteCustomerNote({ id: customer._id, noteId }).unwrap();
        toast.success("Note deleted");
      } catch (err) {
        toast.error("Failed to delete note");
      }
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        await deleteCustomerDocument({ id: customer._id, docId }).unwrap();
        toast.success("Document deleted");
      } catch (err) {
        toast.error("Failed to delete document");
      }
    }
  };

  // Projects calculations
  const projects = customer.projects || [];
  const activeProjectsCount = projects.filter((p) => p.status === "active" || p.status === "in_progress").length;
  const completedProjectsCount = projects.filter((p) => p.status === "completed").length;
  const totalCustomerValue = customer.totalValue || projects.reduce((acc, p) => acc + (p.budget || 0), 0);

  return (
    <div className="space-y-6">
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

      {/* Customer Header Banner (Matches Screen 3) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Avatar + Details */}
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 flex items-center justify-center shadow-inner">
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
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
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

              {/* Sub-contact details */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1">
                <span className="flex items-center gap-1.5">
                  <Icon icon="heroicons:phone" className="text-slate-400 text-sm" />
                  <a href={`tel:${customer.phone}`} className="hover:text-primary-600 font-medium">
                    {customer.phone}
                  </a>
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1.5">
                    <Icon icon="heroicons:envelope" className="text-slate-400 text-sm" />
                    <a href={`mailto:${customer.email}`} className="hover:text-primary-600 font-medium">
                      {customer.email}
                    </a>
                  </span>
                )}
                {(customer.location || customer.city) && (
                  <span className="flex items-center gap-1.5">
                    <Icon icon="heroicons:map-pin" className="text-slate-400 text-sm" />
                    <span>{customer.location || `${customer.city}${customer.state ? `, ${customer.state}` : ""}`}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action Buttons Group */}
          <div className="flex flex-wrap items-center gap-2.5 relative">
            {/* Call */}
            <button
              onClick={handleCall}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition shadow-sm"
            >
              <Icon icon="heroicons:phone" className="text-sm text-slate-500" />
              <span>Call</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-300 bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition shadow-sm"
            >
              <Icon icon="logos:whatsapp-icon" className="text-sm" />
              <span>WhatsApp</span>
            </button>

            {/* Email */}
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-primary-300 bg-primary-50 text-xs font-semibold text-primary-700 hover:bg-primary-100 dark:bg-primary-950/40 dark:text-primary-300 dark:border-primary-800 transition shadow-sm"
            >
              <Icon icon="heroicons:envelope" className="text-sm text-primary-600" />
              <span>Email</span>
            </button>

            {/* Edit */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-500 text-xs font-semibold text-white hover:bg-primary-600 transition shadow-sm"
            >
              <Icon icon="heroicons:pencil-square" className="text-sm" />
              <span>Edit</span>
            </button>

            {/* More Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                className="h-9 w-9 rounded-lg border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Icon icon="heroicons:ellipsis-vertical" className="text-base" />
              </button>

              {showMoreDropdown && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-30 animate-fadeIn"
                  onMouseLeave={() => setShowMoreDropdown(false)}
                >
                  <button
                    onClick={() => {
                      setShowMoreDropdown(false);
                      setIsWhatsAppModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-left font-medium"
                  >
                    <Icon icon="heroicons-outline:chat-bubble-bottom-center-text" />
                    <span>Send Message</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMoreDropdown(false);
                      setActiveTab("notes");
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-left font-medium"
                  >
                    <Icon icon="heroicons-outline:pencil-square" />
                    <span>Add Note</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMoreDropdown(false);
                      setIsDocumentModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-left font-medium"
                  >
                    <Icon icon="heroicons-outline:arrow-up-tray" />
                    <span>Upload Document</span>
                  </button>
                  {customer.sourceLeadId && (
                    <button
                      onClick={() => {
                        setShowMoreDropdown(false);
                        const leadId = customer.sourceLeadId._id || customer.sourceLeadId;
                        navigate(`/leads/${leadId}`);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-left font-medium"
                    >
                      <Icon icon="heroicons-outline:arrow-top-right-on-square" />
                      <span>View Lead</span>
                    </button>
                  )}
                  <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                  <button
                    onClick={() => {
                      setShowMoreDropdown(false);
                      setIsDeleteModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/30 text-left font-medium"
                  >
                    <Icon icon="heroicons-outline:trash" />
                    <span>Delete Customer</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-6 mt-6 border-t border-slate-100 dark:border-slate-700 pt-3 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs font-semibold pb-2.5 border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Display */}

      {/* 1. OVERVIEW TAB (Matches Screen 3) */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols wide on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                Customer Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Full Name</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Phone</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.phone}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Email</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.email || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Alternate Phone</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.alternatePhone || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Source</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.source || "Website"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Status</span>
                  <span className="mt-0.5 inline-block font-semibold capitalize text-emerald-600">
                    {customer.status ? customer.status.replace("_", " ") : "Active"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Assigned Staff</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.assignedStaff?.name || "Amit Kumar"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Tags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {customer.tags?.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-slate-50 dark:border-slate-700/50">
                  <span className="text-slate-400 block font-medium">Created</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium mt-0.5 block">
                    {dayjs(customer.createdAt).format("MMM D, YYYY, hh:mm A")}
                  </span>
                </div>
              </div>
            </div>

            {/* Address Information Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                Address Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block font-medium">Address</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.address || "123 Business Park, Andheri East"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">City</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.city || "Mumbai"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">State</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.state || "Maharashtra"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Pincode</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.pincode || "400093"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Country</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block">
                    {customer.country || "India"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                Quick Actions
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-400 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-primary-600 transition bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <Icon icon="heroicons-outline:briefcase" className="text-primary-500 text-base" />
                  <span>Add Project</span>
                </button>
                <button
                  onClick={() => setIsFollowUpModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-400 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-primary-600 transition bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <Icon icon="heroicons-outline:calendar" className="text-blue-500 text-base" />
                  <span>Schedule Follow-up</span>
                </button>
                <button
                  onClick={() => setIsDocumentModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-400 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-primary-600 transition bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <Icon icon="heroicons-outline:arrow-up-tray" className="text-emerald-500 text-base" />
                  <span>Upload Document</span>
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-400 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-primary-600 transition bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <Icon icon="heroicons-outline:pencil-square" className="text-purple-500 text-base" />
                  <span>Add Note</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (1 Col wide on desktop) */}
          <div className="space-y-6">
            {/* Project Summary Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                Project Summary
              </h4>
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total Projects</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{projects.length || 1}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Active Projects</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{activeProjectsCount || 1}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Completed Projects</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{completedProjectsCount || 0}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500 font-semibold">Total Value</span>
                  <span className="font-bold text-sm text-primary-600">
                    {formatCurrency(totalCustomerValue || 500000)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Last Activity</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {activities[0]?.createdAt
                      ? dayjs(activities[0].createdAt).format("MMM D, YYYY")
                      : dayjs(customer.updatedAt).format("MMM D, YYYY")}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Communications Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Recent Communications</h4>
                <button
                  onClick={() => setActiveTab("communications")}
                  className="text-xs font-semibold text-primary-600 hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {activities.slice(0, 4).map((act) => (
                  <div key={act._id} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-slate-500">
                      <Icon
                        icon={
                          act.action?.includes("EMAIL")
                            ? "heroicons:envelope"
                            : act.action?.includes("FOLLOWUP")
                            ? "heroicons:calendar"
                            : act.action?.includes("NOTE")
                            ? "heroicons:pencil-square"
                            : "heroicons:document-text"
                        }
                        className="text-sm text-primary-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {act.action?.replace("_", " ")}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {dayjs(act.createdAt).format("MMM D, YYYY")}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {act.details?.summary || act.details?.subject || act.details?.content || "Customer touchpoint"}
                      </p>
                    </div>
                  </div>
                ))}

                {activities.length === 0 && (
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
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3"
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
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Communication History</h4>
            <div className="flex gap-2">
              <Button
                text="Send WhatsApp"
                icon="logos:whatsapp-icon"
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

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 shadow-sm">
            {activities
              .filter((a) => a.action?.includes("EMAIL") || a.action?.includes("WHATSAPP") || a.action?.includes("FOLLOWUP"))
              .map((act) => (
                <div key={act._id} className="p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center flex-shrink-0">
                      <Icon icon="heroicons:envelope" className="text-base" />
                    </div>
                    <div>
                      <h6 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {act.details?.subject || act.action?.replace("_", " ")}
                      </h6>
                      <p className="text-xs text-slate-500 mt-1">
                        {act.details?.summary || act.details?.messagePreview || "Sent communication record"}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                        <span>Staff: {act.performedBy?.name || "System"}</span>
                        <span>•</span>
                        <span>{dayjs(act.createdAt).format("DD MMM YYYY, hh:mm A")}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase">
                    Delivered
                  </span>
                </div>
              ))}

            {activities.filter((a) => a.action?.includes("EMAIL") || a.action?.includes("WHATSAPP")).length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No outbound communications recorded yet. Send an email or WhatsApp to initiate contact.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. QUOTATIONS TAB */}
      {activeTab === "quotations" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Associated Quotations</h4>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Quotation #</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {quotations.map((q) => (
                    <tr key={q._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">
                        {q.quotationNumber || `QT-${q._id?.slice(-6).toUpperCase()}`}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-primary-600">
                        {formatCurrency(q.totalAmount || q.subtotal)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {q.status || "Draft"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {dayjs(q.createdAt).format("MMM D, YYYY")}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {q.pdfUrl && (
                          <a
                            href={q.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline font-semibold"
                          >
                            Download PDF
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                  {quotations.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400">
                        No quotations created for this customer yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. FOLLOW-UPS TAB */}
      {activeTab === "followups" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Scheduled Follow-ups</h4>
            <Button
              text="Schedule Follow-up"
              icon="heroicons-outline:calendar"
              className="btn-primary btn-sm text-xs"
              onClick={() => setIsFollowUpModalOpen(true)}
            />
          </div>

          <div className="space-y-3">
            {followUps.map((f) => (
              <div
                key={f._id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Icon icon="heroicons-outline:calendar" className="text-lg" />
                  </div>
                  <div>
                    <h6 className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                      {f.type} Follow-up
                    </h6>
                    <p className="text-xs text-slate-500 mt-0.5">{f.notes || "No additional notes provided"}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span>Scheduled: {dayjs(f.scheduledAt).format("DD MMM YYYY, hh:mm A")}</span>
                      <span>•</span>
                      <span>Assigned to: {f.assignedTo?.name || "Staff"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                      f.status === "completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {f.status}
                  </span>
                </div>
              </div>
            ))}

            {followUps.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                No follow-ups currently scheduled for this customer.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. FILES & DOCUMENTS TAB (Matches Screen 3 & Screen 6) */}
      {activeTab === "files" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Customer Files & Documents</h4>
            <Button
              text="Upload File"
              icon="heroicons-outline:arrow-up-tray"
              className="btn-primary btn-sm text-xs"
              onClick={() => setIsDocumentModalOpen(true)}
            />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 shadow-sm">
            {customer.documents?.map((doc) => (
              <div key={doc._id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase">
                    {doc.name?.split(".").pop() || "PDF"}
                  </div>
                  <div>
                    <h6 className="text-xs font-bold text-slate-900 dark:text-white">{doc.name}</h6>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{(doc.size ? `${(doc.size / (1024 * 1024)).toFixed(1)} MB` : "2.4 MB")}</span>
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
                    download={doc.name}
                    target="_blank"
                    rel="noreferrer"
                    className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 hover:text-primary-600 hover:bg-slate-100 transition"
                    title="Download File"
                  >
                    <Icon icon="heroicons-outline:arrow-down-tray" className="text-sm" />
                  </a>
                  <button
                    onClick={() => handleDeleteDoc(doc._id)}
                    className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 hover:text-danger-600 hover:bg-red-50 transition"
                    title="Delete File"
                  >
                    <Icon icon="heroicons-outline:trash" className="text-sm" />
                  </button>
                </div>
              </div>
            ))}

            {(!customer.documents || customer.documents.length === 0) && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No documents uploaded yet. Upload service contracts, quotations, or design drawings.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. NOTES TAB */}
      {activeTab === "notes" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Add Customer Note</h4>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                rows="3"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Log internal notes, design preferences, client feedback, or phone conversation summary..."
                className="form-control text-xs"
                required
              ></textarea>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  text={isAddingNote ? "Adding..." : "Add Note"}
                  className="btn-primary btn-sm text-xs"
                  isLoading={isAddingNote}
                  disabled={isAddingNote}
                />
              </div>
            </form>
          </div>

          <div className="space-y-3">
            {customer.notes?.map((n) => (
              <div
                key={n._id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex items-start justify-between gap-4"
              >
                <div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{n.content}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                    <span>Added by: {n.createdBy?.name || "Staff"}</span>
                    <span>•</span>
                    <span>{dayjs(n.createdAt).format("DD MMM YYYY, hh:mm A")}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteNote(n._id)}
                  className="text-slate-400 hover:text-danger-500 p-1"
                  title="Delete Note"
                >
                  <Icon icon="heroicons-outline:trash" className="text-sm" />
                </button>
              </div>
            ))}

            {(!customer.notes || customer.notes.length === 0) && (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                No notes logged for this customer yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. ACTIVITY TIMELINE TAB */}
      {activeTab === "activity" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Complete Activity Timeline</h4>
            <Button
              text="Add Note"
              icon="heroicons-outline:plus"
              className="btn-primary btn-sm text-xs"
              onClick={() => setActiveTab("notes")}
            />
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
            {activities.map((act) => (
              <div key={act._id} className="relative flex items-start gap-4">
                <span className="absolute -left-6 mt-1 h-5 w-5 rounded-full border-2 border-white dark:border-slate-800 bg-primary-500 flex items-center justify-center text-[10px] text-white">
                  •
                </span>
                <div className="flex-1 bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <h6 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {act.action?.replace("_", " ")}
                    </h6>
                    <span className="text-[10px] text-slate-400">
                      {dayjs(act.createdAt).format("MMM D, YYYY, hh:mm A")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {act.details?.summary || act.details?.content || act.details?.subject || "System activity recorded"}
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-2">
                    Performed by: {act.performedBy?.name || "System"}
                  </span>
                </div>
              </div>
            ))}

            {activities.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                No activity records logged for this customer.
              </div>
            )}
          </div>
        </div>
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
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CustomerForm
              isModal={true}
              customerId={customer._id}
              initialData={customer}
              onClose={() => {
                setIsEditModalOpen(false);
                refetch();
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteCustomer}
        title="Delete Customer Profile"
        entityName={customer.fullName}
        message="Are you sure you want to permanently delete this customer profile? Associated project history and past logs will be archived safely."
        isLoading={isDeletingCustomer}
        confirmText="Delete Customer"
      />
    </div>
  );
};

export default CustomerView;
