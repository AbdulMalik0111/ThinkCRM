import React from "react";

/**
 * Standard Status & Source Pill Badges matching ThinkCRM design specifications
 */
export const LeadStatusBadge = ({ status }) => {
  const s = String(status || "new").toLowerCase();

  const styles = {
    new: "bg-amber-100 text-amber-700 border border-amber-200/60",
    contacted: "bg-sky-100 text-sky-700 border border-sky-200/60",
    qualified: "bg-emerald-100 text-emerald-700 border border-emerald-200/60",
    converted: "bg-amber-100 text-amber-800 border border-amber-200/60",
    won: "bg-emerald-100 text-emerald-700 border border-emerald-200/60",
    in_progress: "bg-blue-100 text-blue-700 border border-blue-200/60",
    "in progress": "bg-blue-100 text-blue-700 border border-blue-200/60",
    attempted: "bg-amber-50 text-amber-600 border border-amber-200/50",
    follow_up: "bg-purple-100 text-purple-700 border border-purple-200/60",
    lost: "bg-rose-100 text-rose-700 border border-rose-200/60",
    junk: "bg-slate-100 text-slate-600 border border-slate-200/60",
  };

  const labels = {
    new: "New",
    contacted: "Contacted",
    qualified: "Qualified",
    converted: "Converted",
    won: "Won",
    in_progress: "In Progress",
    "in progress": "In Progress",
    attempted: "Attempted",
    follow_up: "Follow Up",
    lost: "Lost",
    junk: "Junk",
  };

  const badgeStyle = styles[s] || "bg-slate-100 text-slate-700 border border-slate-200";
  const label = labels[s] || (s.charAt(0).toUpperCase() + s.slice(1));

  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[12px] font-semibold tracking-wide capitalize font-inter whitespace-nowrap ${badgeStyle}`}
    >
      {label}
    </span>
  );
};

export const LeadSourceBadge = ({ source }) => {
  const src = String(source || "website").toLowerCase();

  const styles = {
    website: "bg-blue-50 text-blue-600 border border-blue-200/70",
    "meta ads": "bg-purple-50 text-purple-600 border border-purple-200/70",
    meta_ads: "bg-purple-50 text-purple-600 border border-purple-200/70",
    referral: "bg-slate-100 text-slate-600 border border-slate-200",
    "google ads": "bg-indigo-50 text-indigo-600 border border-indigo-200/70",
    google_ads: "bg-indigo-50 text-indigo-600 border border-indigo-200/70",
    social_media: "bg-pink-50 text-pink-600 border border-pink-200/70",
    "social media": "bg-pink-50 text-pink-600 border border-pink-200/70",
    direct: "bg-emerald-50 text-emerald-600 border border-emerald-200/70",
    other: "bg-slate-50 text-slate-600 border border-slate-200",
  };

  const labels = {
    website: "Website",
    meta_ads: "Meta Ads",
    "meta ads": "Meta Ads",
    referral: "Referral",
    google_ads: "Google Ads",
    "google ads": "Google Ads",
    social_media: "Social Media",
    "social media": "Social Media",
    direct: "Direct",
    other: "Other",
  };

  const badgeStyle = styles[src] || "bg-slate-50 text-slate-600 border border-slate-200";
  const label = labels[src] || (src.charAt(0).toUpperCase() + src.slice(1));

  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[12px] font-semibold tracking-wide font-inter whitespace-nowrap ${badgeStyle}`}
    >
      {label}
    </span>
  );
};
