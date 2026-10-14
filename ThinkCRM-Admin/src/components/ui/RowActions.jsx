import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/ui/Icon";

/**
 * Standard ThinkCRM Three-Dot Row Action Component
 * Features:
 * - Clean portal-based dropdown menu (never clipped by AG Grid containers)
 * - Viewport boundary collision detection (flips upward / shifts left near edges)
 * - Professional 14px semi-bold typography, Lucide icons, soft hover states
 * - Logical dividers and destructive (danger) action styling
 * - Closes on outside click, scroll, or Escape key
 */
const RowActions = ({ actions = [], label = "Row actions", align = "right" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Position calculation and viewport boundary awareness
  const calculatePosition = () => {
    if (!buttonRef.current) return null;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 210;
    const visibleCount = actions.filter(Boolean).length;
    const menuHeight = visibleCount * 40 + 16;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const spaceBelow = windowHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;

    // Prefer downward placement unless very cramped at bottom
    const openUpward = spaceBelow < 180 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(openUpward ? spaceAbove : spaceBelow, 380);

    let top = openUpward
      ? Math.max(12, rect.top - Math.min(menuHeight, maxHeight) - 4)
      : rect.bottom + 4;

    let left = align === "right" ? rect.right - menuWidth : rect.left;

    // Boundary constraints
    if (left < 12) left = 12;
    if (left + menuWidth > windowWidth - 12) {
      left = windowWidth - menuWidth - 12;
    }

    return { top, left, maxHeight };
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!isOpen) {
      const pos = calculatePosition();
      if (pos) {
        // Dispatch global event to close any other open row action menus
        window.dispatchEvent(
          new CustomEvent("thinkcrm:close-row-actions", { detail: buttonRef.current })
        );
        setMenuPosition(pos);
        setIsOpen(true);
      }
    } else {
      setIsOpen(false);
    }
  };

  // Close when another row action opens, or on click outside / scroll / escape
  useEffect(() => {
    const handleOtherOpened = (e) => {
      if (e.detail !== buttonRef.current) {
        setIsOpen(false);
      }
    };

    window.addEventListener("thinkcrm:close-row-actions", handleOtherOpened);
    return () => {
      window.removeEventListener("thinkcrm:close-row-actions", handleOtherOpened);
    };
  }, []);

  // Close on outside click, escape, or outside scroll
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
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleResize = () => {
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
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
        className={`h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition focus:outline-none focus:ring-2 focus:ring-primary-500/25 ${
          isOpen
            ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white"
            : "hover:bg-slate-100 dark:hover:bg-slate-700/60"
        }`}
      >
        <Icon icon="heroicons-outline:dots-vertical" className="text-lg" />
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
              maxHeight: `${menuPosition.maxHeight || 380}px`,
              zIndex: 99999,
            }}
            className="w-[210px] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 focus:outline-none animate-fadeIn font-inter space-y-0.5"
            role="menu"
            aria-orientation="vertical"
          >
            {visibleActions.map((action, idx) => {
              if (action.divider) {
                return (
                  <div
                    key={`div-${idx}`}
                    className="border-t border-slate-100 dark:border-slate-700/80 my-1 mx-1"
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
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] font-semibold transition text-left ${
                    action.disabled
                      ? "opacity-40 cursor-not-allowed"
                      : isDanger
                      ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {action.icon && (
                    <Icon
                      icon={action.icon}
                      className={`text-base flex-shrink-0 ${
                        action.iconColor ||
                        (action.label?.toLowerCase().includes("whatsapp")
                          ? "text-[#25D366]"
                          : isDanger
                          ? "text-rose-500"
                          : "text-slate-400 dark:text-slate-400")
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
