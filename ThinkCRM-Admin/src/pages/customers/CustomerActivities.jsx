import React, { useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import dayjs from "dayjs";

const getActivityConfig = (type) => {
  switch (type) {
    case "measurement_scheduled":
      return {
        title: "Measurement Scheduled",
        category: "Measurement",
        icon: "heroicons-outline:scale",
        badgeBg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
        nodeBg: "bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-950/50 dark:border-purple-800 dark:text-purple-400",
      };
    case "measurement_completed":
      return {
        title: "Measurement Completed",
        category: "Measurement",
        icon: "heroicons-outline:check-badge",
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        nodeBg: "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-400",
      };
    case "measurement_updated":
      return {
        title: "Measurement Updated",
        category: "Measurement",
        icon: "heroicons-outline:pencil-square",
        badgeBg: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
        nodeBg: "bg-sky-50 border-sky-200 text-sky-600 dark:bg-sky-950/50 dark:border-sky-800 dark:text-sky-400",
      };
    case "follow_up_created":
    case "follow_up_scheduled":
      return {
        title: "Follow-up Scheduled",
        category: "Follow-up",
        icon: "heroicons-outline:calendar-days",
        badgeBg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
        nodeBg: "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-400",
      };
    case "follow_up_completed":
      return {
        title: "Follow-up Completed",
        category: "Follow-up",
        icon: "heroicons-outline:check-circle",
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        nodeBg: "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-400",
      };
    case "follow_up_rescheduled":
      return {
        title: "Follow-up Rescheduled",
        category: "Follow-up",
        icon: "heroicons-outline:arrow-path",
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
        nodeBg: "bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-400",
      };
    case "follow_up_cancelled":
      return {
        title: "Follow-up Cancelled",
        category: "Follow-up",
        icon: "heroicons-outline:x-circle",
        badgeBg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
        nodeBg: "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-400",
      };
    case "quotation_uploaded":
      return {
        title: "Quotation Uploaded",
        category: "Quotation",
        icon: "heroicons-outline:document-arrow-up",
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
        nodeBg: "bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-400",
      };
    case "quotation_sent":
      return {
        title: "Quotation Sent",
        category: "Quotation",
        icon: "heroicons-outline:paper-airplane",
        badgeBg: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
        nodeBg: "bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-950/50 dark:border-teal-800 dark:text-teal-400",
      };
    case "quotation_updated":
      return {
        title: "Quotation Updated",
        category: "Quotation",
        icon: "heroicons-outline:document-text",
        badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
        nodeBg: "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-400",
      };
    case "quotation_deleted":
      return {
        title: "Quotation Removed",
        category: "Quotation",
        icon: "heroicons-outline:trash",
        badgeBg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
        nodeBg: "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-400",
      };
    case "lead_created":
      return {
        title: "Lead Created",
        category: "Lead",
        icon: "heroicons-outline:user-plus",
        badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
        nodeBg: "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-400",
      };
    case "lead_converted":
    case "customer_created":
      return {
        title: "Customer Created",
        category: "Customer",
        icon: "heroicons-outline:sparkles",
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        nodeBg: "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-400",
      };
    case "lead_linked":
      return {
        title: "Additional Lead Linked",
        category: "Customer",
        icon: "heroicons-outline:link",
        badgeBg: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
        nodeBg: "bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-950/50 dark:border-teal-800 dark:text-teal-400",
      };
    case "customer_merged":
      return {
        title: "Customer Deduplicated & Merged",
        category: "Customer",
        icon: "heroicons-outline:arrows-pointing-in",
        badgeBg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
        nodeBg: "bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-950/50 dark:border-purple-800 dark:text-purple-400",
      };
    case "customer_updated":
      return {
        title: "Customer Updated",
        category: "Customer",
        icon: "heroicons-outline:pencil-square",
        badgeBg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        nodeBg: "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400",
      };
    case "project_created":
    case "project_updated":
      return {
        title: "Project Activity",
        category: "Project",
        icon: "heroicons-outline:briefcase",
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
        nodeBg: "bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-400",
      };
    case "note_added":
    case "customer_note_added":
      return {
        title: "Note Added",
        category: "Notes",
        icon: "heroicons-outline:document-text",
        badgeBg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
        nodeBg: "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-400",
      };
    case "customer_note_updated":
      return {
        title: "Note Updated",
        category: "Notes",
        icon: "heroicons-outline:pencil",
        badgeBg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
        nodeBg: "bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-950/50 dark:border-purple-800 dark:text-purple-400",
      };
    case "customer_note_deleted":
      return {
        title: "Note Deleted",
        category: "Notes",
        icon: "heroicons-outline:trash",
        badgeBg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        nodeBg: "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400",
      };
    case "customer_file_uploaded":
    case "lead_document_uploaded":
      return {
        title: "Document Uploaded",
        category: "Documents",
        icon: "heroicons-outline:arrow-up-tray",
        badgeBg: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
        nodeBg: "bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-950/50 dark:border-teal-800 dark:text-teal-400",
      };
    case "customer_file_deleted":
    case "lead_document_deleted":
      return {
        title: "Document Removed",
        category: "Documents",
        icon: "heroicons-outline:trash",
        badgeBg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        nodeBg: "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400",
      };
    case "customer_email_sent":
    case "lead_email_sent":
    case "email_sent":
      return {
        title: "Email Sent",
        category: "Communication",
        icon: "heroicons-outline:envelope",
        badgeBg: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
        nodeBg: "bg-sky-50 border-sky-200 text-sky-600 dark:bg-sky-950/50 dark:border-sky-800 dark:text-sky-400",
      };
    case "customer_whatsapp_sent":
    case "lead_whatsapp_sent":
    case "whatsapp_sent":
      return {
        title: "WhatsApp Sent",
        category: "Communication",
        icon: "heroicons-outline:chat-bubble-left-right",
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        nodeBg: "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-400",
      };
    case "customer_call_logged":
    case "call_logged":
      return {
        title: "Call Logged",
        category: "Communication",
        icon: "heroicons-outline:phone-arrow-up-right",
        badgeBg: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
        nodeBg: "bg-cyan-50 border-cyan-200 text-cyan-600 dark:bg-cyan-950/50 dark:border-cyan-800 dark:text-cyan-400",
      };
    default:
      return {
        title: type?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Activity",
        category: "General",
        icon: "heroicons-outline:bolt",
        badgeBg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        nodeBg: "bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400",
      };
  }
};

const formatTimestamp = (date) => {
  if (!date) return "";
  const d = dayjs(date);
  const now = dayjs();
  if (d.isSame(now, "day")) {
    return `Today at ${d.format("h:mm A")}`;
  }
  if (d.isSame(now.subtract(1, "day"), "day")) {
    return `Yesterday at ${d.format("h:mm A")}`;
  }
  return d.format("MMM D, YYYY · h:mm A");
};

const formatDescription = (desc) => {
  if (!desc) return "";
  return desc.replace(
    /(\d{1,2}\/\d{1,2}\/\d{4}),\s*(\d{1,2}:\d{2})(:\d{2})?\s*(AM|PM)?/gi,
    (match) => {
      const parsed = dayjs(match);
      return parsed.isValid() ? parsed.format("MMM D, YYYY · h:mm A") : match;
    }
  );
};

const getActivityText = (activity) => {
  if (!activity) return "";
  // Prioritize full content from metadata if available
  if (activity.metadata?.content && (activity.type === "note_added" || activity.type === "customer_note_added")) {
    return `Note added: "${activity.metadata.content}"`;
  }
  if (activity.metadata?.message && (activity.type === "customer_whatsapp_sent" || activity.type === "lead_whatsapp_sent" || activity.type === "whatsapp_sent")) {
    return activity.description || `WhatsApp message initiated: "${activity.metadata.message}"`;
  }
  return activity.description || "";
};

const TimelineText = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  const isLong = text.length > 360;
  const displayText = isLong && !expanded ? `${text.slice(0, 340)}...` : text;

  return (
    <div>
      <p className="text-[13px] text-slate-600 dark:text-slate-300 font-normal leading-relaxed whitespace-pre-wrap break-words">
        {displayText}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 mt-1 inline-flex items-center gap-1 hover:underline cursor-pointer"
        >
          {expanded ? "Show less" : "Read full text →"}
        </button>
      )}
    </div>
  );
};

const getPerformer = (performedBy) => {
  if (!performedBy) return { name: "Think Admin", initials: "TA", avatar: null };
  const name =
    `${performedBy.firstName || ""} ${performedBy.lastName || ""}`.trim() ||
    performedBy.name ||
    "Think Admin";
  const initials = `${performedBy.firstName?.[0] || "T"}${performedBy.lastName?.[0] || "A"}`.toUpperCase();
  return { name, initials, avatar: performedBy.avatar };
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "follow_up", label: "Follow-ups" },
  { id: "quotation", label: "Quotations" },
  { id: "communication", label: "Communications" },
  { id: "notes", label: "Notes" },
  { id: "other", label: "Other" },
];

const CustomerActivities = ({ activities = [], onAddNote, onRefresh, isRefreshing = false }) => {
  const [filter, setFilter] = useState("all");

  const filteredActivities = useMemo(() => {
    if (filter === "all") return activities;
    return activities.filter((act) => {
      const t = act.type?.toLowerCase() || "";
      if (filter === "follow_up") return t.includes("follow_up");
      if (filter === "quotation") return t.includes("quotation");
      if (filter === "communication") {
        return t.includes("email") || t.includes("whatsapp") || t.includes("call");
      }
      if (filter === "notes") return t.includes("note");
      if (filter === "other") {
        return (
          !t.includes("follow_up") &&
          !t.includes("quotation") &&
          !t.includes("email") &&
          !t.includes("whatsapp") &&
          !t.includes("call") &&
          !t.includes("note")
        );
      }
      return true;
    });
  }, [activities, filter]);

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <Icon icon="heroicons-outline:clock" className="text-base" />
          </div>
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-100 font-inter text-sm">
              Activity Timeline
            </span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {activities.length}
            </span>
          </div>
        </div>
      }
      headerSlot={
        <div className="flex items-center gap-2">
          {/* Quick Filter Pills */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-0.5 rounded-lg text-xs font-medium">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-2.5 py-1 rounded-md transition font-inter cursor-pointer ${
                  filter === f.id
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Add Note Button */}
          {onAddNote && (
            <button
              type="button"
              onClick={onAddNote}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/50 hover:bg-primary-100 dark:hover:bg-primary-900/50 text-primary-600 dark:text-primary-400 text-xs font-semibold transition"
            >
              <Icon icon="heroicons-outline:plus" className="text-sm" />
              <span>Add Note</span>
            </button>
          )}

          {/* Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Refresh Timeline"
            >
              <Icon
                icon="heroicons-outline:arrow-path"
                className={`text-sm ${isRefreshing ? "animate-spin text-primary-600" : ""}`}
              />
            </button>
          )}
        </div>
      }
    >
      {filteredActivities.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Icon icon="heroicons-outline:calendar-days" className="text-2xl" />
          </div>
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1 font-inter">
            No activities recorded
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-inter">
            {filter === "all"
              ? "Follow-ups, quotation uploads, communications, and notes will appear in this timeline automatically."
              : `No activities found under the "${FILTERS.find((f) => f.id === filter)?.label}" filter.`}
          </p>
          {filter !== "all" && (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="mt-3 text-xs font-semibold text-primary-600 hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="relative pl-7 sm:pl-9 space-y-3.5 pt-1 font-inter">
          {/* Vertical continuous track rail */}
          <div className="absolute left-[13px] sm:left-[17px] top-4 bottom-4 w-[2px] bg-slate-200 dark:bg-slate-700" />

          {filteredActivities.map((activity, index) => {
            const config = getActivityConfig(activity.type);
            const performer = getPerformer(activity.performedBy);
            const isLatest = index === 0 && filter === "all";

            return (
              <div key={activity._id || index} className="relative group">
                {/* Node icon circle */}
                <div
                  className={`absolute -left-7 sm:-left-9 top-3.5 h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs z-10 transition-transform group-hover:scale-110 ${config.nodeBg}`}
                >
                  <Icon icon={config.icon} className="text-sm sm:text-base" />
                  {isLatest && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800 animate-pulse" />
                  )}
                </div>

                {/* Micro-Card */}
                <div className="bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl p-3.5 sm:p-4 transition duration-150">
                  {/* Card Header: Title, Category Badge, Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100 font-inter">
                        {config.title}
                      </h4>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${config.badgeBg}`}
                      >
                        {config.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <Icon icon="heroicons-outline:clock" className="text-xs text-slate-400" />
                      <span>{formatTimestamp(activity.createdAt)}</span>
                    </div>
                  </div>

                  {/* Card Description */}
                  <TimelineText text={formatDescription(getActivityText(activity))} />

                  {/* Card Footer: Performer meta & exact timestamp */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      {performer.avatar ? (
                        <img
                          src={performer.avatar}
                          alt={performer.name}
                          className="h-5 w-5 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center border border-slate-200 dark:border-slate-600">
                          {performer.initials}
                        </div>
                      )}
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                        {performer.name}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-normal">
                      {dayjs(activity.createdAt).format("DD MMM YYYY, hh:mm A")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default CustomerActivities;
