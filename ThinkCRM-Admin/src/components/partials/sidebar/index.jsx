import React, { useRef, useEffect, useState } from "react";
import SidebarLogo from "./Logo";
import Navmenu from "./Navmenu";
import { menuItems } from "@/constant/data";
import SimpleBar from "simplebar-react";
import useSidebar from "@/hooks/useSidebar";
import useSemiDark from "@/hooks/useSemiDark";
import useSkin from "@/hooks/useSkin";
import svgRabitImage from "@/assets/images/svg/rabit.svg";

const Sidebar = () => {
  const scrollableNodeRef = useRef();
  const [scroll, setScroll] = useState(false);

  useEffect(() => {
    const node = scrollableNodeRef.current;
    if (!node) return;
    const handleScroll = () => {
      if (node.scrollTop > 0) {
        setScroll(true);
      } else {
        setScroll(false);
      }
    };
    node.addEventListener("scroll", handleScroll);
    return () => {
      node.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const [collapsed, setMenuCollapsed] = useSidebar();
  const [menuHover, setMenuHover] = useState(false);

  // semi dark option
  const [isSemiDark] = useSemiDark();
  // skin
  const [skin] = useSkin();
  return (
    <div className={isSemiDark ? "dark" : ""}>
      <div
        className={`sidebar-wrapper bg-white dark:bg-slate-800     ${collapsed ? "w-[72px] close_sidebar" : "w-[248px]"
          }
      ${menuHover ? "sidebar-hovered" : ""}
      border-r border-slate-200 dark:border-slate-700
      `}
        onMouseEnter={() => {
          setMenuHover(true);
        }}
        onMouseLeave={() => {
          setMenuHover(false);
        }}
      >
        <SidebarLogo menuHover={menuHover} />

        <div
          className="sidebar-menu px-4 h-[calc(100%-80px)] pb-24 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          ref={scrollableNodeRef}
        >
          <Navmenu menus={menuItems} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
