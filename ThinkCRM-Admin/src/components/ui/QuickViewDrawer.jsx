import React, { useEffect } from "react";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";

const QuickViewDrawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  avatar,
  groups = [],
  onViewDetails,
  onEdit,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-inter">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white dark:bg-slate-800 flex flex-col border-l border-slate-200 dark:border-slate-700 animate-slideInRight">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center gap-3.5">
              {avatar ? (
                <div className="h-12 w-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 flex-shrink-0">
                  <img src={avatar} alt={title} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {title?.charAt(0) || "Q"}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {title}
                  </h3>
                  {badge}
                </div>
                {subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title="Close Drawer (Esc)"
            >
              <Icon icon="heroicons-outline:x-mark" className="text-xl" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {groups.map((group, gIdx) => (
              <div key={group.title || gIdx} className="space-y-3">
                {group.title && (
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-700">
                    {group.title}
                  </h4>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {group.items.map((item, iIdx) => (
                    <div
                      key={item.label || iIdx}
                      className={item.fullWidth ? "sm:col-span-2" : ""}
                    >
                      <span className="text-xs text-slate-400 block font-medium">
                        {item.label}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5 block break-words">
                        {item.value || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-3">
            <Button
              type="button"
              text="Close"
              className="btn-outline-dark text-xs px-4 py-2"
              onClick={onClose}
            />

            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  type="button"
                  text="Edit"
                  icon="heroicons:pencil-square"
                  className="btn-outline-primary text-xs px-4 py-2"
                  onClick={() => {
                    onClose();
                    onEdit();
                  }}
                />
              )}
              {onViewDetails && (
                <Button
                  type="button"
                  text="View Full Details"
                  icon="heroicons-outline:arrow-top-right-on-square"
                  className="btn-primary text-xs px-4 py-2"
                  onClick={() => {
                    onClose();
                    onViewDetails();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewDrawer;
