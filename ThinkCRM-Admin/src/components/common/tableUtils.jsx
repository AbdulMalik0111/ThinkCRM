import React from "react";
import dayjs from "dayjs";

/**
 * Currency formatter for INR
 */
export const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

/**
 * Date formatter matching screenshot: "Oct 14, 2026"
 */
export const formatDate = (val) => {
  if (!val) return "—";
  return dayjs(val).format("MMM D, YYYY");
};

/**
 * Deterministic pastel avatar background color based on name
 */
export const getAvatarColor = (name = "") => {
  const colors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  ];
  const charCode = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return colors[charCode % colors.length];
};

/**
 * Status pill with leading dot matching the reference image:
 * • Active (emerald)
 * • In Progress (blue)
 * • Completed (emerald)
 * • On Hold (amber)
 * • Lost (rose)
 * • Follow-up (purple)
 */
export const renderStatusPill = (status = "active") => {
  const s = String(status).toLowerCase().replace(/[\s-]/g, "_");
  const config = {
    active: {
      label: "Active",
      pill: "bg-emerald-50 text-emerald-600 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
      dot: "bg-emerald-500",
    },
    in_progress: {
      label: "In Progress",
      pill: "bg-blue-50 text-blue-600 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
      dot: "bg-blue-500",
    },
    completed: {
      label: "Completed",
      pill: "bg-emerald-50 text-emerald-600 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
      dot: "bg-emerald-500",
    },
    on_hold: {
      label: "On Hold",
      pill: "bg-amber-50 text-amber-600 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
      dot: "bg-amber-500",
    },
    lost: {
      label: "Lost",
      pill: "bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
      dot: "bg-rose-500",
    },
    follow_up: {
      label: "Follow-up",
      pill: "bg-purple-50 text-purple-600 border border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
      dot: "bg-purple-500",
    },
    new: {
      label: "New",
      pill: "bg-blue-50 text-blue-600 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
      dot: "bg-blue-500",
    },
    attempted: {
      label: "Attempted",
      pill: "bg-amber-50 text-amber-600 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
      dot: "bg-amber-500",
    },
    contacted: {
      label: "Contacted",
      pill: "bg-blue-50 text-blue-600 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
      dot: "bg-blue-500",
    },
    qualified: {
      label: "Qualified",
      pill: "bg-purple-50 text-purple-600 border border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
      dot: "bg-purple-500",
    },
    won: {
      label: "Won",
      pill: "bg-emerald-50 text-emerald-600 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
      dot: "bg-emerald-500",
    },
    junk: {
      label: "Junk",
      pill: "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      dot: "bg-slate-400",
    },
    suspended: {
      label: "Suspended",
      pill: "bg-amber-50 text-amber-600 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
      dot: "bg-amber-500",
    },
  };

  const item = config[s] || {
    label: String(status).replace("_", " "),
    pill: "bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 w-[118px] min-w-[118px] max-w-[118px] py-1 px-2.5 rounded-full text-xs font-semibold ${item.pill} font-inter whitespace-nowrap text-center flex-shrink-0`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${item.dot} flex-shrink-0`}></span>
      <span className="truncate">{item.label}</span>
    </span>
  );
};
