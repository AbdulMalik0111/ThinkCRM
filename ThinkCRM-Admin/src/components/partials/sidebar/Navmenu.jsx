import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Collapse } from "react-collapse";
import Icon from "@/components/ui/Icon";
import { useDispatch, useSelector } from "react-redux";
import useMobileMenu from "@/hooks/useMobileMenu";
import Submenu from "./Submenu";
import PermissionGuard from "@/components/PermissionGuard";

const Navmenu = ({ menus }) => {
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  const toggleSubmenu = (i) => {
    if (activeSubmenu === i) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(i);
    }
  };

  const location = useLocation();
  const locationName = location.pathname.replace("/", "");
  const [mobileMenu, setMobileMenu] = useMobileMenu();
  const [activeMultiMenu, setMultiMenu] = useState(null);
  const dispatch = useDispatch();
  const { permissions } = useSelector((state) => state.auth);

  const toggleMultiMenu = (j) => {
    if (activeMultiMenu === j) {
      setMultiMenu(null);
    } else {
      setMultiMenu(j);
    }
  };

  const isLocationMatch = (targetLocation) => {
    return (
      locationName === targetLocation ||
      locationName.startsWith(`${targetLocation}/`)
    );
  };

  useEffect(() => {
    let submenuIndex = null;
    let multiMenuIndex = null;
    menus.forEach((item, i) => {
      if (isLocationMatch(item.link)) {
        submenuIndex = i;
      }

      if (item.child) {
        item.child.forEach((childItem, j) => {
          if (isLocationMatch(childItem.childlink)) {
            submenuIndex = i;
          }

          if (childItem.multi_menu) {
            childItem.multi_menu.forEach((nestedItem) => {
              if (isLocationMatch(nestedItem.multiLink)) {
                submenuIndex = i;
                multiMenuIndex = j;
              }
            });
          }
        });
      }
    });
    document.title = `ThinkCRM  | ${locationName}`;

    setActiveSubmenu(submenuIndex);
    setMultiMenu(multiMenuIndex);
    if (mobileMenu) {
      setMobileMenu(false);
    }
  }, [location]);

  return (
    <>
      <ul>
        {menus.reduce((acc, item) => {
          if (item.isHeadr) {
            acc.push({ ...item, isPendingHeader: true });
          } else {
            const hasPermission = !item.permission || (permissions && (permissions.includes(item.permission) || permissions.includes('all')));
            
            // If this item has children, we also need to check if ANY child has permission
            let hasChildPermission = false;
            if (item.child) {
              hasChildPermission = item.child.some(child => 
                !child.permission || (permissions && (permissions.includes(child.permission) || permissions.includes('all')))
              );
            }

            if (hasPermission || hasChildPermission) {
              for (let i = acc.length - 1; i >= 0; i--) {
                if (acc[i].isPendingHeader) {
                  acc[i].isPendingHeader = false;
                  break;
                }
              }
              acc.push(item);
            }
          }
          return acc;
        }, []).filter(item => !item.isPendingHeader).map((item, i) => (
          <PermissionGuard key={i} permission={item.permission}>
            <li
              className={` single-sidebar-menu 
                ${item.child ? "item-has-children" : ""}
                ${activeSubmenu === i ? "open" : ""}
                ${locationName === item.link ? "menu-item-active" : ""}`}
            >
              {/* single menu with no childred*/}
              {!item.child && !item.isHeadr && (
                <NavLink className="menu-link" to={item.link}>
                  <span className="menu-icon grow-0">
                    <Icon icon={item.icon} />
                  </span>
                  <div className="text-box grow">{item.title}</div>
                  {item.badge && <span className="menu-badge">{item.badge}</span>}
                </NavLink>
              )}
              {/* only for menulabel */}
              {item.isHeadr && !item.child && (
                <div className="menulabel">{item.title}</div>
              )}
              {/*    !!sub menu parent   */}
              {item.child && (
                <div
                  className={`menu-link ${
                    activeSubmenu === i
                      ? "parent_active not-collapsed"
                      : "collapsed"
                  }`}
                  onClick={() => toggleSubmenu(i)}
                >
                  <div className="flex-1 flex items-start">
                    <span className="menu-icon">
                      <Icon icon={item.icon} />
                    </span>
                    <div className="text-box">{item.title}</div>
                  </div>
                  <div className="flex-0">
                    <div
                      className={`menu-arrow transform transition-all duration-300 ${
                        activeSubmenu === i ? " rotate-90" : ""
                      }`}
                    >
                      <Icon icon="heroicons-outline:chevron-right" />
                    </div>
                  </div>
                </div>
              )}

              <Submenu
                activeSubmenu={activeSubmenu}
                item={item}
                i={i}
                toggleMultiMenu={toggleMultiMenu}
                activeMultiMenu={activeMultiMenu}
              />
            </li>
          </PermissionGuard>
        ))}
      </ul>
    </>
  );
};

export default Navmenu;
