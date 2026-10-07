import React from "react";
import Badge from "@/components/ui/Badge";

const getBadgeLabelAndClass = (status) => {
  const norm = (status || "").toLowerCase().replace(/_/g, " ");
  switch (norm) {
    case "active":
    case "published":
    case "in stock":
    case "delivered":
    case "paid":
    case "received":
      return { label: norm, className: "bg-emerald-600 text-white font-semibold shadow-sm" };
    case "draft":
    case "hidden":
    case "inactive":
    case "suspended":
    case "disabled":
    case "low stock":
    case "pending":
    case "ordered":
      return { label: norm, className: "bg-amber-500 text-white font-semibold shadow-sm" };
    case "out of stock":
    case "discontinued":
    case "expired":
    case "cancelled":
    case "rejected":
    case "failed":
      return { label: norm, className: "bg-rose-500 text-white font-semibold shadow-sm" };
    case "processing":
    case "confirmed":
      return { label: norm, className: "bg-blue-600 text-white font-semibold shadow-sm" };
    case "return requested":
    case "returned":
      return { label: norm, className: "bg-orange-500 text-white font-semibold shadow-sm" };
    case "refund pending":
      return { label: norm, className: "bg-fuchsia-600 text-white font-semibold shadow-sm" };
    case "refunded":
      return { label: norm, className: "bg-teal-600 text-white font-semibold shadow-sm" };
    default:
      return { label: norm || "unknown", className: "bg-slate-500 text-white font-semibold shadow-sm" };
  }
};

/**
 * Shared Status Badge for all Admin Panel tables
 */
const StatusBadge = ({ status }) => {
  const { label, className } = getBadgeLabelAndClass(status?.toLowerCase());
  return (
    <Badge
      label={label.charAt(0).toUpperCase() + label.slice(1)}
      className={`${className} capitalize px-3 py-1`}
    />
  );
};

export default StatusBadge;
