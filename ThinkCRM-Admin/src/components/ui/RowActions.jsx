import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/ui/Icon";

const RowActions = ({ actions = [], label = "Row actions", align = "right" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Position calculation and viewport boundary awareness
  const handleToggle = (e) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 190;
      const menuHeight = actions.length * 40 + 16;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let top = rect.bottom + 4;
      let left = align === "right" ? rect.right - menuWidth : rect.left;

      // Flip upward if near bottom edge
      if (top + menuHeight > windowHeight - 16) {
        top = Math.max(rect.top - menuHeight - 4, 16);
      }

      // Ensure within horizontal boundaries
      if (left < 16) left = 16;
      if (left + menuWidth > windowWidth - 16) {
        left = windowWidth - menuWidth - 16;
      }

      setMenuPosition({ top, left });
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close on outside click or scroll or escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleScroll = (e) => {
      // If user scrolls parent page, close menu
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const visibleActions = actions.filter(Boolean);

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Three-dot trigger button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={label}
        className={`h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${
          isOpen
            ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white"
            : "hover:bg-slate-100 dark:hover:bg-slate-700"
        }`}
      >
        <Icon icon="heroicons:ellipsis-vertical" className="text-lg" />
      </button>

      {/* Portal Dropdown Menu */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              zIndex: 99999,
            }}
            className="w-[190px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 focus:outline-none animate-fadeIn font-inter"
            role="menu"
            aria-orientation="vertical"
          >
            {visibleActions.map((action, idx) => {
              if (action.divider) {
                return (
                  <div
                    key={`div-${idx}`}
                    className="border-t border-slate-100 dark:border-slate-700 my-1"
                  />
                );
              }

              const isDanger = action.danger || action.variant === "danger";

              return (
                <button
                  key={action.label || idx}
                  type="button"
                  role="menuitem"
                  disabled={action.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    if (action.onClick) action.onClick();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium transition text-left ${
                    action.disabled
                      ? "opacity-40 cursor-not-allowed"
                      : isDanger
                      ? "text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/30 hover:text-danger-700"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {action.icon && (
                    <Icon
                      icon={action.icon}
                      className={`text-base flex-shrink-0 ${
                        isDanger ? "text-danger-500" : "text-slate-400"
                      }`}
                    />
                  )}
                  <span className="truncate">{action.label}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};

export default RowActions;
