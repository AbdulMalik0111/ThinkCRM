import React from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import useDarkMode from "@/hooks/useDarkMode";
import useSidebar from "@/hooks/useSidebar";
import useSemiDark from "@/hooks/useSemiDark";
import useSkin from "@/hooks/useSkin";

// using public logo
// import MobileLogo from "@/assets/images/logo/logo-c.jpeg";
// import MobileLogoWhite from "@/assets/images/logo/logo-c-white.jpeg";
const SidebarLogo = ({ menuHover }) => {
  const [isDark] = useDarkMode();
  const [collapsed, setMenuCollapsed] = useSidebar();
  // semi dark
  const [isSemiDark] = useSemiDark();
  // skin
  const [skin] = useSkin();
  return (
    <div
      className={` logo-segment flex justify-between items-center bg-white dark:bg-slate-800 z-9 py-6  px-4 
      ${menuHover ? "logo-hovered" : ""}
      ${
        skin === "bordered"
          ? " border-b border-r-0 border-slate-200 dark:border-slate-700"
          : " border-none"
      }
      
      `}
    >
      <Link to="/dashboard">
        <div className="flex items-center space-x-3">
          {(!collapsed || menuHover) ? (
            <div className="flex items-center space-x-2.5 py-1">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-xs shrink-0">
                <img src="/favicon.svg" alt="ThinkTive" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col whitespace-nowrap">
                <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none flex items-baseline">
                  <span>ThinkTive</span>
                  <span className="text-[#06B6D4] font-black text-xl leading-none">.</span>
                </div>
                <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  IT Solution
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-xs">
              <img src="/favicon.svg" alt="ThinkTive" className="w-full h-full object-contain" />
            </div>
          )}
        </div>
      </Link>

      {(!collapsed || menuHover) && (
        <div
          onClick={() => setMenuCollapsed(!collapsed)}
          className={`h-4 w-4 border-[1.5px] border-slate-900 dark:border-slate-700 rounded-full transition-all duration-150
          ${
            collapsed
              ? ""
              : "ring-2 ring-inset ring-offset-4 ring-black-900 dark:ring-slate-400 bg-slate-900 dark:bg-slate-400 dark:ring-offset-slate-700"
          }
          `}
        ></div>
      )}
    </div>
  );
};

export default SidebarLogo;
