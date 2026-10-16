import React, { useState, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from "@headlessui/react";
import Icon from "@/components/ui/Icon";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useGetLeadByIdQuery } from "@/store/api/leads/leadsApiSlice";
import { getAvatarColor } from "@/components/common/tableUtils";
import { LeadStatusBadge } from "./components/LeadStatusBadge";

// Modals
import AddFollowUpModal from "./components/AddFollowUpModal";
import ConvertLeadModal from "./components/ConvertLeadModal";
import DeleteLeadModal from "./components/DeleteLeadModal";

// Tab Subcomponents
import LeadActivities from "./LeadActivities";
import LeadFollowUps from "./LeadFollowUps";
import LeadMeasurements from "./LeadMeasurements";
import LeadQuotations from "./LeadQuotations";

const TABS = [
  { id: "overview", label: "Overview", icon: "heroicons-outline:squares-2x2" },
  { id: "follow_ups", label: "Follow-ups", icon: "heroicons-outline:calendar" },
  { id: "measurements", label: "Measurements", icon: "heroicons-outline:scale" },
  { id: "quotations", label: "Quotations", icon: "heroicons-outline:document-text" },
  { id: "files", label: "Files", icon: "heroicons-outline:folder-open" },
  { id: "activity", label: "Activity", icon: "heroicons-outline:bolt" },
];

const priorityStyles = {
  urgent: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  high: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  medium: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  low: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

const LeadView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useGetLeadByIdQuery(id);

  const [activeTab, setActiveTab] = useState("overview");

  // Modals state
  const [isAddFollowUpOpen, setIsAddFollowUpOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (isLoading) return <Loading />;
  if (error) {
    return (
      <div className="p-8 text-center text-rose-500 font-semibold font-inter">
        Failed to load lead details. Please try again.
      </div>
    );
  }

  const lead = data?.data?.lead || data?.data;
  if (!lead) {
    return (
      <div className="p-8 text-center text-slate-500 font-semibold font-inter">
        Lead not found.
      </div>
    );
  }

  const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, "") : "";
  const avatarBg = getAvatarColor(lead.fullName || "Lead");
  const assignedStaffName = lead.assignedTo
    ? `${lead.assignedTo.firstName || ""} ${lead.assignedTo.lastName || ""}`.trim() || "Unassigned"
    : "Unassigned";

  const leadFiles = lead.documents || [];

  return (
    <div className="space-y-6 font-inter">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <button
          onClick={() => navigate("/leads")}
          className="hover:text-primary-600 transition flex items-center gap-1 font-semibold"
        >
          <Icon icon="heroicons-outline:identification" />
          <span>Leads</span>
        </button>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 font-bold">{lead.fullName}</span>
      </div>

      {/* Main Header Banner - Flat Professional Design matching Customer page */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Avatar + Details */}
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative flex-shrink-0">
              <div
                className={`h-20 w-20 rounded-full flex items-center justify-center font-bold text-2xl uppercase border border-slate-200 dark:border-slate-700 ${avatarBg}`}
              >
                {lead.fullName?.charAt(0) || "L"}
              </div>
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-800" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {lead.fullName}
                </h2>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                  {lead.leadId || `LED-${lead._id.slice(-6).toUpperCase()}`}
                </span>
                <LeadStatusBadge status={lead.status} />
                {lead.priority && (
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${
                      priorityStyles[lead.priority] || priorityStyles.medium
                    }`}
                  >
                    {lead.priority} priority
                  </span>
                )}
                {lead.projectType && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
                    {lead.projectType}
                  </span>
                )}
              </div>

              {/* Sub-contact details - Enhanced bold typography */}
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-200 pt-1.5">
                {lead.phone && (
                  <span className="flex items-center gap-1.5">
                    <Icon icon="heroicons-outline:phone" className="text-slate-500 dark:text-slate-400 text-sm" />
                    <a
                      href={`tel:${lead.phone}`}
                      className="hover:text-primary-600 font-bold text-slate-800 dark:text-slate-100 transition"
                    >
                      {lead.phone}
                    </a>
                  </span>
                )}
                {lead.email && (
                  <span className="flex items-center gap-1.5">
                    <Icon icon="heroicons-outline:envelope" className="text-slate-500 dark:text-slate-400 text-sm" />
                    <a
                      href={`mailto:${lead.email}`}
                      className="hover:text-primary-600 font-bold text-slate-800 dark:text-slate-100 transition"
                    >
                      {lead.email}
                    </a>
                  </span>
                )}
                {(lead.city || lead.location || lead.address) && (
                  <span className="flex items-center gap-1.5">
                    <Icon icon="heroicons-outline:map-pin" className="text-slate-500 dark:text-slate-400 text-sm" />
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {lead.location || lead.city || lead.address}
                    </span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Icon icon="heroicons-outline:user" className="text-slate-500 dark:text-slate-400 text-sm" />
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    Assigned: {assignedStaffName}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Buttons & Menu */}
          <div className="flex items-center gap-2">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition inline-flex items-center gap-1.5"
                title="Call Lead"
              >
                <Icon icon="heroicons-outline:phone" className="text-base text-blue-600" />
                <span className="hidden sm:inline">Call</span>
              </a>
            )}
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noreferrer"
                className="h-10 px-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/70 text-xs font-bold transition inline-flex items-center gap-1.5"
                title="WhatsApp"
              >
                <Icon icon="whatsapp" className="text-base text-[#25D366]" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition inline-flex items-center gap-1.5"
                title="Email Lead"
              >
                <Icon icon="heroicons-outline:envelope" className="text-base text-slate-600" />
                <span className="hidden sm:inline">Email</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => navigate(`/leads/${lead._id}/edit`)}
              className="h-10 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Icon icon="heroicons-outline:pencil-square" className="text-base" />
              <span>Edit Lead</span>
            </button>

            {/* Three-Dot Dropdown Menu */}
            <Menu as="div" className="relative inline-block text-left">
              <MenuButton
                type="button"
                className="h-10 w-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white transition focus:outline-none cursor-pointer"
                title="More Actions"
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
                <MenuItems className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 z-40 focus:outline-none font-inter shadow-none">
                  <MenuItem>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => setIsAddFollowUpOpen(true)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                          active
                            ? "bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-white"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <Icon icon="heroicons-outline:calendar" className="text-base text-blue-500" />
                        <span>Schedule Follow-up</span>
                      </button>
                    )}
                  </MenuItem>

                  <MenuItem>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => setActiveTab("measurements")}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                          active
                            ? "bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-white"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <Icon icon="heroicons-outline:scale" className="text-base text-purple-500" />
                        <span>Schedule Measurement</span>
                      </button>
                    )}
                  </MenuItem>

                  <MenuItem>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => setActiveTab("quotations")}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                          active
                            ? "bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-white"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <Icon icon="heroicons-outline:document-text" className="text-base text-emerald-500" />
                        <span>Quotations</span>
                      </button>
                    )}
                  </MenuItem>

                  <MenuItem>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => setIsConvertModalOpen(true)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                          active
                            ? "bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-white"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <Icon icon="heroicons-outline:user-plus" className="text-base text-amber-500" />
                        <span>Convert to Customer</span>
                      </button>
                    )}
                  </MenuItem>

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
                        <span>Delete Lead</span>
                      </button>
                    )}
                  </MenuItem>
                </MenuItems>
              </Transition>
            </Menu>
          </div>
        </div>

        {/* Tab Navigation Menu - Professional 14px+, Semibold, Clean Indicators with Icons */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-200 dark:border-slate-700 pt-3 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-bold transition whitespace-nowrap cursor-pointer ${
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

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols wide) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions Card - Styled with rich icons & proper click handlers matching Customer page */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Quick Actions
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                    Fast shortcuts to advance this lead
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Add Follow-Up */}
                <button
                  type="button"
                  onClick={() => setIsAddFollowUpOpen(true)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition group text-left cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition border border-blue-200/50 dark:border-blue-800/50">
                    <Icon icon="heroicons-outline:calendar" className="text-lg" />
                  </div>
                  <div>
                    <span className="block text-[13px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      Add Follow-Up
                    </span>
                    <span className="block text-[11px] font-medium text-slate-400">
                      Schedule call or meeting
                    </span>
                  </div>
                </button>

                {/* 2. Schedule Measurement */}
                <button
                  type="button"
                  onClick={() => setActiveTab("measurements")}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition group text-left cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition border border-purple-200/50 dark:border-purple-800/50">
                    <Icon icon="heroicons-outline:scale" className="text-lg" />
                  </div>
                  <div>
                    <span className="block text-[13px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                      Schedule Measurement
                    </span>
                    <span className="block text-[11px] font-medium text-slate-400">
                      Book site visit
                    </span>
                  </div>
                </button>

                {/* 3. Upload Quotation */}
                <button
                  type="button"
                  onClick={() => setActiveTab("quotations")}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition group text-left cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition border border-emerald-200/50 dark:border-emerald-800/50">
                    <Icon icon="heroicons-outline:arrow-up-tray" className="text-lg" />
                  </div>
                  <div>
                    <span className="block text-[13px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      Upload Quotation
                    </span>
                    <span className="block text-[11px] font-medium text-slate-400">
                      Attach estimate
                    </span>
                  </div>
                </button>

                {/* 4. Send Quotation */}
                <button
                  type="button"
                  onClick={() => setActiveTab("quotations")}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-600 hover:bg-sky-50/40 dark:hover:bg-sky-950/20 transition group text-left cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-xl bg-sky-50 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition border border-sky-200/50 dark:border-sky-800/50">
                    <Icon icon="heroicons-outline:paper-airplane" className="text-lg" />
                  </div>
                  <div>
                    <span className="block text-[13px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition">
                      Send Quotation
                    </span>
                    <span className="block text-[11px] font-medium text-slate-400">
                      Dispatch proposal
                    </span>
                  </div>
                </button>

                {/* 5. Convert to Customer */}
                <button
                  type="button"
                  onClick={() => setIsConvertModalOpen(true)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition group text-left cursor-pointer sm:col-span-2 lg:col-span-2"
                >
                  <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition border border-amber-200/50 dark:border-amber-800/50">
                    <Icon icon="heroicons-outline:user-plus" className="text-lg" />
                  </div>
                  <div>
                    <span className="block text-[13px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                      Convert to Customer
                    </span>
                    <span className="block text-[11px] font-medium text-slate-400">
                      Promote lead and start projects
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Information Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Information Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                  <Icon icon="heroicons-outline:user" className="text-base text-blue-600" />
                  <span>Customer Information</span>
                </h4>
                <div className="space-y-4">
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Full Name
                    </span>
                    <span className="block text-[14px] font-bold text-slate-900 dark:text-white">
                      {lead.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Phone Number
                    </span>
                    <span className="block text-[14px] font-bold text-slate-900 dark:text-white">
                      {lead.phone || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Email Address
                    </span>
                    <span className="block text-[14px] font-bold text-slate-900 dark:text-white">
                      {lead.email || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Address / Location
                    </span>
                    <span className="block text-[14px] font-bold text-slate-900 dark:text-white">
                      {[lead.address, lead.location, lead.city, lead.state, lead.pincode]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Lead Source
                    </span>
                    <span className="block text-[14px] font-bold text-slate-900 dark:text-white capitalize">
                      {lead.leadSource ? lead.leadSource.replace("_", " ") : "Website"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Project & Requirements Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                  <Icon icon="heroicons-outline:briefcase" className="text-base text-purple-600" />
                  <span>Project & Requirements</span>
                </h4>
                <div className="space-y-4">
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Project Type
                    </span>
                    <span className="block text-[14px] font-bold text-slate-900 dark:text-white capitalize">
                      {lead.projectType || "Modular Kitchen"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Estimated Budget
                    </span>
                    <span className="block text-[14px] font-bold text-emerald-600 dark:text-emerald-400">
                      {lead.budget ? `₹${Number(lead.budget).toLocaleString("en-IN")}` : "Not Specified"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Expected Timeline
                    </span>
                    <span className="block text-[14px] font-bold text-slate-900 dark:text-white">
                      {lead.expectedStartDate
                        ? dayjs(lead.expectedStartDate).format("DD MMM YYYY")
                        : lead.preferredTimeline || "Immediate"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Priority
                    </span>
                    <span className="block text-[14px] font-bold text-slate-900 dark:text-white capitalize">
                      {lead.priority || "Medium"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Notes / Description
                    </span>
                    <span className="block text-[13.5px] font-semibold text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {lead.notes || lead.projectDescription || "No notes provided."}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Mini View */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Icon icon="heroicons-outline:bolt" className="text-base text-amber-500" />
                  <span>Recent Activity</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab("activity")}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  View All Activity →
                </button>
              </div>
              <LeadActivities leadId={lead._id} />
            </div>
          </div>

          {/* Right Column (1 Col wide) */}
          <div className="space-y-6">
            {/* Lead Status & Meta Details */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                Lead Overview
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Current Status</span>
                  <LeadStatusBadge status={lead.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Created On</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {dayjs(lead.createdAt).format("DD MMM YYYY, hh:mm A")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Last Updated</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {dayjs(lead.updatedAt).format("DD MMM YYYY, hh:mm A")}
                  </span>
                </div>
                {lead.nextFollowUp?.scheduledAt && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-xs font-semibold text-rose-500">Next Follow-up</span>
                    <span className="text-xs font-bold text-rose-600">
                      {dayjs(lead.nextFollowUp.scheduledAt).format("DD MMM YYYY, hh:mm A")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Staff Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                Assigned Team Member
              </h4>
              {lead.assignedTo ? (
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm uppercase border border-blue-200 dark:border-blue-800">
                    {lead.assignedTo.firstName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                      {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                    </h5>
                    <p className="text-xs font-medium text-slate-500">
                      {lead.assignedTo.email || "Staff Member"}
                    </p>
                    <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize">
                      {lead.assignedTo.role?.replace("_", " ") || "Sales Rep"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400 text-xs font-medium">
                  <Icon icon="heroicons-outline:user-minus" className="mx-auto text-2xl mb-1 text-slate-300" />
                  <p>No staff member assigned yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. FOLLOW-UPS TAB */}
      {activeTab === "follow_ups" && <LeadFollowUps leadId={lead._id} />}

      {/* 3. MEASUREMENTS TAB */}
      {activeTab === "measurements" && <LeadMeasurements leadId={lead._id} />}

      {/* 4. QUOTATIONS TAB */}
      {activeTab === "quotations" && <LeadQuotations leadId={lead._id} />}

      {/* 5. FILES TAB */}
      {activeTab === "files" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Lead Documents & Files
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                Files, quotations, and documents attached to this lead
              </p>
            </div>
          </div>

          {leadFiles.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Icon icon="heroicons-outline:folder-open" className="mx-auto text-4xl mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No documents uploaded yet</p>
              <p className="text-xs text-slate-400 mt-1">Quotations and project files will appear here once attached.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leadFiles.map((doc, idx) => (
                <div
                  key={doc._id || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 flex items-start gap-3"
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Icon icon="heroicons-outline:document" className="text-xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate">
                      {doc.title || doc.name || `Document #${idx + 1}`}
                    </h5>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {doc.createdAt ? dayjs(doc.createdAt).format("DD MMM YYYY") : "Attached"}
                    </p>
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 mt-2 hover:underline"
                      >
                        <Icon icon="heroicons-outline:arrow-down-tray" />
                        <span>Download</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. ACTIVITY TAB */}
      {activeTab === "activity" && <LeadActivities leadId={lead._id} />}

      {/* Modals */}
      <AddFollowUpModal
        isOpen={isAddFollowUpOpen}
        lead={lead}
        onClose={() => setIsAddFollowUpOpen(false)}
        onSuccess={() => {
          refetch();
          toast.success("Follow-up added to lead");
        }}
      />

      <ConvertLeadModal
        isOpen={isConvertModalOpen}
        lead={lead}
        onClose={() => setIsConvertModalOpen(false)}
        onSuccess={() => {
          refetch();
        }}
      />

      <DeleteLeadModal
        isOpen={isDeleteModalOpen}
        lead={lead}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => {
          navigate("/leads");
        }}
      />
    </div>
  );
};

export default LeadView;
