import React from "react";
import * as LucideIcons from "lucide-react";

// Official WhatsApp full-color brand icon (crisp green bubble + white handset)
const WhatsAppIcon = ({ className = "", width = "1.15em", height = "1.15em", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={width}
    height={height}
    className={className}
    {...props}
  >
    <path
      fill="#25D366"
      d="M12.004 2C6.486 2 2.012 6.474 2.012 11.993c0 1.815.488 3.52 1.34 5.006L2 22l5.132-1.346a9.954 9.954 0 0 0 4.872 1.339h.004c5.518 0 9.992-4.474 9.992-9.993 0-5.52-4.474-9.993-9.992-9.993z"
    />
    <path
      fill="#FFFFFF"
      d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.476-.15-.677.15-.2.301-.776.978-.952 1.179-.175.2-.351.226-.652.075s-1.27-.468-2.42-1.493c-.894-.798-1.498-1.784-1.674-2.085-.175-.301-.019-.464.132-.614.135-.135.301-.351.451-.527.15-.175.2-.301.301-.501.101-.2.05-.376-.025-.526-.075-.15-.677-1.632-.927-2.234-.244-.587-.492-.507-.677-.517h-.576c-.2 0-.526.075-.802.376s-1.053 1.028-1.053 2.508 1.078 2.909 1.229 3.11c.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.716.635.722.23 1.38.197 1.9-.12.578-.352 1.78-1.455 2.031-2.864.25-1.41-.051-2.617-.251-2.918-.2-.301-.501-.451-.802-.602z"
    />
  </svg>
);

// Brand SVGs for providers not in standard icon packs
const BrandIcons = {
  "logos:google-icon": (props) => (
    <svg viewBox="0 0 24 24" width="1.15em" height="1.15em" {...props}>
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
    </svg>
  ),
  "logos:facebook": (props) => (
    <svg viewBox="0 0 24 24" width="1.15em" height="1.15em" fill="#1877F2" {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  "logos:whatsapp-icon": WhatsAppIcon,
  "logos:whatsapp": WhatsAppIcon,
  "whatsapp": WhatsAppIcon,
  "whatsapp-icon": WhatsAppIcon,
  "heroicons:whatsapp": WhatsAppIcon,
  "heroicons-outline:whatsapp": WhatsAppIcon,
  "simple-icons:whatsapp": WhatsAppIcon,
  "bi:whatsapp": WhatsAppIcon,
  "ri:whatsapp-fill": WhatsAppIcon,
  "ri:whatsapp-line": WhatsAppIcon,
  "logos:instagram-icon": (props) => (
    <svg viewBox="0 0 24 24" width="1.15em" height="1.15em" fill="#E4405F" {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  "logos:meta-icon": (props) => (
    <svg viewBox="0 0 24 24" width="1.15em" height="1.15em" fill="#0081FB" {...props}>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
    </svg>
  ),
};

// Comprehensive Direct Mapping: Icon String -> Lucide Component Name
const ICON_MAP = {
  // Navigation & General
  "heroicons-outline:home": "Home",
  "heroicons:home": "Home",
  "home": "Home",
  "heroicons-outline:users": "Users",
  "heroicons:users": "Users",
  "users": "Users",
  "heroicons-outline:user": "User",
  "heroicons:user": "User",
  "heroicons-outline:user-group": "Users",
  "heroicons:user-group": "Users",
  "heroicons-outline:user-plus": "UserPlus",
  "heroicons:user-plus": "UserPlus",
  "user-plus": "UserPlus",

  // Analytics, Reports & KPIs
  "heroicons-outline:presentation-chart-line": "LineChart",
  "heroicons:presentation-chart-line": "LineChart",
  "heroicons-outline:chart-bar": "BarChart3",
  "heroicons:chart-bar": "BarChart3",
  "heroicons-outline:chart-pie": "PieChart",
  "heroicons:chart-pie": "PieChart",
  "heroicons-outline:trophy": "Trophy",
  "heroicons:trophy": "Trophy",
  "trophy": "Trophy",
  "heroicons-outline:funnel": "Filter",
  "heroicons:funnel": "Filter",
  "funnel": "Filter",
  "filter": "Filter",
  "heroicons-outline:currency-rupee": "IndianRupee",
  "heroicons:currency-rupee": "IndianRupee",
  "currency-rupee": "IndianRupee",
  "rupee": "IndianRupee",
  "heroicons-outline:arrow-trending-up": "TrendingUp",
  "heroicons:arrow-trending-up": "TrendingUp",
  "heroicons:arrow-trending-up-solid": "TrendingUp",
  "heroicons-outline:arrow-trending-down": "TrendingDown",
  "heroicons:arrow-trending-down": "TrendingDown",

  // Date, Time & Scheduling
  "heroicons-outline:calendar": "Calendar",
  "heroicons:calendar": "Calendar",
  "calendar": "Calendar",
  "heroicons-outline:clock": "Clock",
  "heroicons:clock": "Clock",
  "clock": "Clock",

  // Tables, Views & Layout
  "heroicons-outline:table-cells": "Table",
  "heroicons:table-cells": "Table",
  "heroicons-outline:table": "Table",
  "heroicons:table": "Table",
  "table": "Table",
  "heroicons-outline:template": "LayoutDashboard",
  "heroicons:template": "LayoutDashboard",
  "heroicons-outline:view-boards": "Kanban",
  "heroicons:view-boards": "Kanban",
  "heroicons-outline:view-columns": "Columns",
  "heroicons:view-columns": "Columns",
  "heroicons-outline:view-grid-add": "LayoutGrid",
  "heroicons:view-grid-add": "LayoutGrid",

  // Arrows & Chevrons
  "heroicons-outline:chevron-down": "ChevronDown",
  "heroicons:chevron-down": "ChevronDown",
  "chevron-down": "ChevronDown",
  "heroicons-outline:chevron-right": "ChevronRight",
  "heroicons:chevron-right": "ChevronRight",
  "chevron-right": "ChevronRight",
  "heroicons-outline:chevron-left": "ChevronLeft",
  "heroicons:chevron-left": "ChevronLeft",
  "chevron-left": "ChevronLeft",
  "heroicons-outline:chevron-double-right": "ChevronsRight",
  "heroicons:chevron-double-right": "ChevronsRight",
  "heroicons-outline:arrow-left": "ArrowLeft",
  "heroicons:arrow-left": "ArrowLeft",
  "akar-icons:arrow-left": "ArrowLeft",
  "heroicons-outline:arrow-right": "ArrowRight",
  "heroicons:arrow-right": "ArrowRight",
  "akar-icons:arrow-right": "ArrowRight",
  "ph:caret-right": "ChevronRight",

  // Actions & Controls
  "heroicons-outline:dots-vertical": "MoreVertical",
  "heroicons:dots-vertical": "MoreVertical",
  "heroicons:ellipsis-vertical": "MoreVertical",
  "dots-vertical": "MoreVertical",
  "heroicons-outline:dots-horizontal": "MoreHorizontal",
  "heroicons:dots-horizontal": "MoreHorizontal",
  "heroicons-outline:ellipsis-horizontal": "MoreHorizontal",
  "dots-horizontal": "MoreHorizontal",
  "heroicons-outline:plus": "Plus",
  "heroicons:plus": "Plus",
  "ic:round-plus": "Plus",
  "eva:plus-fill": "Plus",
  "plus": "Plus",
  "eva:minus-fill": "Minus",
  "heroicons-outline:x": "X",
  "heroicons:x": "X",
  "heroicons-outline:x-mark": "X",
  "heroicons:x-mark": "X",
  "x": "X",
  "heroicons-outline:trash": "Trash2",
  "heroicons:trash": "Trash2",
  "trash": "Trash2",
  "heroicons-outline:pencil-square": "Edit3",
  "heroicons:pencil-square": "Edit3",
  "heroicons-outline:pencil-alt": "Edit",
  "heroicons:pencil": "Edit3",
  "pencil": "Edit3",
  "edit": "Edit3",
  "heroicons-outline:eye": "Eye",
  "heroicons:eye": "Eye",
  "ph:eye": "Eye",
  "eye": "Eye",
  "heroicons-outline:eye-off": "EyeOff",
  "heroicons:eye-off": "EyeOff",
  "heroicons-outline:search": "Search",
  "heroicons:search": "Search",
  "heroicons-outline:magnifying-glass": "Search",
  "heroicons:magnifying-glass": "Search",
  "search": "Search",
  "heroicons-outline:refresh": "RefreshCw",
  "heroicons:refresh": "RefreshCw",
  "heroicons-outline:arrow-path": "RefreshCw",
  "heroicons:arrow-path": "RefreshCw",
  "jam:refresh-reverse": "RefreshCw",
  "heroicons-outline:share": "Share2",
  "heroicons:share": "Share2",

  // Communication & Contact
  "heroicons-outline:phone": "Phone",
  "heroicons:phone": "Phone",
  "solar:phone-outline": "Phone",
  "phone": "Phone",
  "heroicons-outline:mail": "Mail",
  "heroicons:mail": "Mail",
  "heroicons-outline:envelope": "Mail",
  "heroicons:envelope": "Mail",
  "mail": "Mail",
  "envelope": "Mail",
  "heroicons-outline:paper-airplane": "Send",
  "heroicons:paper-airplane": "Send",
  "heroicons-outline:chat-bubble-left-right": "MessageSquare",
  "heroicons:chat-bubble-left-right": "MessageSquare",
  "heroicons-outline:chat-bubble-bottom-center-text": "MessageCircle",
  "heroicons:chat-bubble-left-ellipsis": "MessageSquare",
  "ri:customer-service-2-fill": "Headphones",

  // Documents & Files
  "heroicons-outline:document-text": "FileText",
  "heroicons:document-text": "FileText",
  "document-text": "FileText",
  "heroicons-outline:document": "File",
  "heroicons:document": "File",
  "heroicons-outline:document-duplicate": "Copy",
  "heroicons:document-duplicate": "Copy",
  "heroicons-outline:document-arrow-down": "FileDown",
  "heroicons:document-arrow-down": "FileDown",
  "heroicons-outline:document-arrow-up": "FileUp",
  "heroicons:document-arrow-up": "FileUp",
  "heroicons-outline:arrow-down-tray": "Download",
  "heroicons:arrow-down-tray": "Download",
  "download": "Download",
  "heroicons-outline:arrow-up-tray": "Upload",
  "heroicons:arrow-up-tray": "Upload",
  "heroicons-outline:cloud-upload": "UploadCloud",
  "heroicons-outline:cloud-arrow-up": "UploadCloud",
  "heroicons-outline:arrow-top-right-on-square": "ExternalLink",
  "heroicons:arrow-top-right-on-square": "ExternalLink",
  "heroicons-outline:clipboard-check": "ClipboardCheck",
  "heroicons:clipboard-check": "ClipboardCheck",

  // Status & Feedback
  "heroicons-outline:check": "Check",
  "heroicons:check": "Check",
  "bi:check-lg": "Check",
  "heroicons-outline:check-circle": "CheckCircle2",
  "heroicons:check-circle": "CheckCircle2",
  "heroicons-outline:exclamation-triangle": "AlertTriangle",
  "heroicons:exclamation-triangle": "AlertTriangle",
  "heroicons-outline:information-circle": "Info",
  "heroicons:information-circle": "Info",
  "heroicons-outline:bell": "Bell",
  "heroicons:bell": "Bell",
  "heroicons-outline:bell-slash": "BellOff",
  "heroicons:bell-slash": "BellOff",
  "heroicons-outline:emoji-sad": "Frown",

  // Settings & System
  "heroicons-outline:cog": "Settings",
  "heroicons:cog": "Settings",
  "heroicons-outline:cog-6-tooth": "Settings",
  "heroicons:cog-6-tooth": "Settings",
  "clarity:settings-line": "Settings",
  "settings": "Settings",
  "heroicons-outline:key": "Key",
  "heroicons:key": "Key",
  "heroicons-outline:shield-check": "ShieldCheck",
  "heroicons:shield-check": "ShieldCheck",
  "heroicons-outline:login": "LogIn",
  "heroicons:login": "LogIn",
  "heroicons-outline:logout": "LogOut",
  "heroicons:logout": "LogOut",
  "heroicons-outline:menu-alt-1": "Menu",
  "heroicons-outline:menu-alt-3": "Menu",
  "menu": "Menu",

  // Miscellaneous
  "heroicons-outline:map-pin": "MapPin",
  "heroicons:map-pin": "MapPin",
  "mi:location": "MapPin",
  "heroicons-outline:map": "Map",
  "heroicons-outline:globe-alt": "Globe",
  "heroicons-outline:briefcase": "Briefcase",
  "heroicons:briefcase": "Briefcase",
  "heroicons-outline:calculator": "Calculator",
  "heroicons:calculator": "Calculator",
  "heroicons-outline:sparkles": "Sparkles",
  "heroicons:sparkles": "Sparkles",
  "heroicons-outline:chip": "Cpu",
  "heroicons:chip": "Cpu",
  "heroicons:cube": "Box",
  "heroicons:ruler": "Ruler",
  "heroicons:wrench-screwdriver": "Wrench",
  "heroicons:star": "Star",
  "ph:star-fill": "Star",
  "heroicons:bookmark": "Bookmark",
  "heroicons:paper-clip": "Paperclip",
  "heroicons:shopping-bag": "ShoppingBag",
  "heroicons:shopping-cart": "ShoppingCart",
  "heroicons:list-bullet": "List",
  "heroicons:numbered-list": "ListOrdered",
  "heroicons:link": "Link",
  "mdi:palette-outline": "Palette",
  "ph:moon-stars-fill": "Moon",
  "ph:sun-dim-fill": "Sun",
  "ph:heart-fill": "Heart",
  "uil:image-v": "Image",
  "eos-icons:loading": "Loader2",
};

/**
 * Intelligent Fallback: Resolves icon name to Lucide Icon Component
 */
const resolveLucideComponent = (iconName) => {
  if (!iconName) return LucideIcons.Sparkles;

  // 1. Direct Map
  const mapped = ICON_MAP[iconName];
  if (mapped && LucideIcons[mapped]) {
    return LucideIcons[mapped];
  }

  // 2. Exact match in Lucide
  if (LucideIcons[iconName]) {
    return LucideIcons[iconName];
  }

  // 3. Normalized name: strip prefix ("heroicons-outline:", "heroicons:", "ph:", etc.)
  const cleanName = iconName.replace(/^[^:]+:/, "").toLowerCase();

  // Try direct clean lookup
  if (ICON_MAP[cleanName] && LucideIcons[ICON_MAP[cleanName]]) {
    return LucideIcons[ICON_MAP[cleanName]];
  }

  // PascalCase conversion of cleanName (e.g. "arrow-left" -> "ArrowLeft")
  const pascalName = cleanName
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

  if (LucideIcons[pascalName]) {
    return LucideIcons[pascalName];
  }

  // 4. Keyword heuristics so no icon is ever missing
  if (cleanName.includes("trophy") || cleanName.includes("award") || cleanName.includes("win")) {
    return LucideIcons.Trophy;
  }
  if (cleanName.includes("lead") || cleanName.includes("user") || cleanName.includes("staff") || cleanName.includes("customer")) {
    return cleanName.includes("plus") ? LucideIcons.UserPlus : LucideIcons.Users;
  }
  if (cleanName.includes("rupee") || cleanName.includes("curr") || cleanName.includes("money") || cleanName.includes("revenue")) {
    return LucideIcons.IndianRupee;
  }
  if (cleanName.includes("filter") || cleanName.includes("funnel")) {
    return LucideIcons.Filter;
  }
  if (cleanName.includes("chart") || cleanName.includes("graph") || cleanName.includes("trend") || cleanName.includes("analytics")) {
    return LucideIcons.BarChart3;
  }
  if (cleanName.includes("calendar") || cleanName.includes("date") || cleanName.includes("day")) {
    return LucideIcons.Calendar;
  }
  if (cleanName.includes("time") || cleanName.includes("clock") || cleanName.includes("hour")) {
    return LucideIcons.Clock;
  }
  if (cleanName.includes("table") || cleanName.includes("grid") || cleanName.includes("cell")) {
    return LucideIcons.Table;
  }
  if (cleanName.includes("down")) return LucideIcons.ChevronDown;
  if (cleanName.includes("right")) return LucideIcons.ChevronRight;
  if (cleanName.includes("left")) return LucideIcons.ChevronLeft;
  if (cleanName.includes("up")) return LucideIcons.ChevronUp;
  if (cleanName.includes("edit") || cleanName.includes("pencil")) return LucideIcons.Edit3;
  if (cleanName.includes("trash") || cleanName.includes("delete") || cleanName.includes("remove")) return LucideIcons.Trash2;
  if (cleanName.includes("eye") || cleanName.includes("view")) return LucideIcons.Eye;
  if (cleanName.includes("mail") || cleanName.includes("envelope")) return LucideIcons.Mail;
  if (cleanName.includes("phone") || cleanName.includes("call")) return LucideIcons.Phone;
  if (cleanName.includes("search") || cleanName.includes("find")) return LucideIcons.Search;
  if (cleanName.includes("check") || cleanName.includes("done")) return LucideIcons.CheckCircle2;
  if (cleanName.includes("close") || cleanName.includes("cross") || cleanName.includes("cancel")) return LucideIcons.X;
  if (cleanName.includes("download") || cleanName.includes("export")) return LucideIcons.Download;
  if (cleanName.includes("upload") || cleanName.includes("import")) return LucideIcons.Upload;
  if (cleanName.includes("setting") || cleanName.includes("gear") || cleanName.includes("config")) return LucideIcons.Settings;
  if (cleanName.includes("home") || cleanName.includes("dashboard")) return LucideIcons.Home;

  // Ultimate fallback: clean Sparkles icon (never blank)
  return LucideIcons.Sparkles;
};

const Icon = ({ icon, className = "", width, rotate, hFlip, vFlip, ...props }) => {
  if (!icon) return null;

  // Universal WhatsApp fallback handler (matches any whatsapp string regardless of prefix/casing)
  const iconLower = String(icon).toLowerCase();
  if (iconLower.includes("whatsapp")) {
    return (
      <WhatsAppIcon
        width={width || "1.15em"}
        height={width || "1.15em"}
        className={`inline-block flex-shrink-0 align-middle ${className}`}
        {...props}
      />
    );
  }

  // Check custom brand SVG first
  if (BrandIcons[icon]) {
    const BrandComponent = BrandIcons[icon];
    return <BrandComponent className={`inline-block ${className}`} {...props} />;
  }

  const Component = resolveLucideComponent(icon);

  // Transformations
  const transforms = [];
  if (rotate) transforms.push(`rotate(${rotate}deg)`);
  if (hFlip && vFlip) transforms.push("scale(-1, -1)");
  else if (hFlip) transforms.push("scaleX(-1)");
  else if (vFlip) transforms.push("scaleY(-1)");

  const style = transforms.length ? { transform: transforms.join(" ") } : undefined;

  return (
    <Component
      width={width || "1.15em"}
      height={width || "1.15em"}
      strokeWidth={2}
      className={`inline-block flex-shrink-0 align-middle ${className}`}
      style={style}
      {...props}
    />
  );
};

export default Icon;
