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
    <div className="fixed inset-0 z-50 overflow-y-auto font-inter">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centering Layout */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
        {/* Popup Modal Dialog */}
        <div
          className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 text-left shadow-2xl border border-slate-200/90 dark:border-slate-700/80 transition-all my-6 animate-modalPopIn flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-700/80 bg-gradient-to-r from-slate-50/90 via-white to-slate-50/90 dark:from-slate-900/40 dark:via-slate-800 dark:to-slate-900/40 flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                {avatar ? (
                  <div className="h-14 w-14 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100 flex-shrink-0">
                    <img
                      src={avatar}
                      alt={title || "Quick View"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary-500/10 via-primary-500/20 to-primary-600/30 text-primary-600 dark:text-primary-400 border border-primary-200/60 dark:border-primary-800/60 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-sm">
                    {title?.charAt(0)?.toUpperCase() || "Q"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate leading-snug">
                      {title || "Overview"}
                    </h3>
                    {badge}
                  </div>
                  {subtitle && (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/80 transition flex-shrink-0"
                title="Close (Esc)"
              >
                <Icon icon="heroicons-outline:x-mark" className="text-xl" />
              </button>
            </div>
          </div>

          {/* Body Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {groups.map((group, gIdx) => (
              <div key={group.title || gIdx} className="space-y-3">
                {group.title && (
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-1 bg-primary-600 rounded-full inline-block" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {group.title}
                    </h4>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {group.items.map((item, iIdx) => {
                    const isPhone =
                      item.label?.toLowerCase().includes("phone") &&
                      item.value &&
                      item.value !== "—" &&
                      item.value !== "Not specified";
                    const isEmail =
                      item.label?.toLowerCase().includes("email") &&
                      item.value &&
                      item.value !== "—" &&
                      item.value !== "No email";

                    return (
                      <div
                        key={item.label || iIdx}
                        className={`rounded-xl p-3.5 bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 transition-colors hover:border-slate-300 dark:hover:border-slate-600/70 flex flex-col justify-between ${
                          item.fullWidth ? "sm:col-span-2" : ""
                        }`}
                      >
                        <span className="text-xs text-slate-400 dark:text-slate-400 block font-medium uppercase tracking-wider mb-1">
                          {item.label}
                        </span>
                        <div className="text-slate-900 dark:text-slate-100 font-semibold break-words leading-relaxed">
                          {isPhone ? (
                            <a
                              href={`tel:${item.value}`}
                              className="text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1.5"
                            >
                              <Icon icon="heroicons-outline:phone" className="text-xs" />
                              <span>{item.value}</span>
                            </a>
                          ) : isEmail ? (
                            <a
                              href={`mailto:${item.value}`}
                              className="text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1.5"
                            >
                              <Icon icon="heroicons-outline:envelope" className="text-xs" />
                              <span>{item.value}</span>
                            </a>
                          ) : (
                            <span>{item.value || "—"}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/50 flex items-center justify-between gap-3 flex-shrink-0 rounded-b-2xl">
            <Button
              type="button"
              text="Close"
              className="btn-outline-dark text-xs font-semibold px-4 py-2 rounded-xl"
              onClick={onClose}
            />

            <div className="flex items-center gap-2.5">
              {onEdit && (
                <Button
                  type="button"
                  text="Edit"
                  icon="heroicons:pencil-square"
                  className="btn-outline-primary text-xs font-semibold px-4 py-2 rounded-xl"
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
                  className="btn-primary text-xs font-semibold px-4.5 py-2 rounded-xl shadow-xs hover:shadow"
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

export { QuickViewDrawer as QuickViewModal };
export default QuickViewDrawer;
