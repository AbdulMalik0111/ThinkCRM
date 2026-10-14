import React, { Fragment } from "react";
import Icon from "@/components/ui/Icon";
import { useSelector, useDispatch } from "react-redux";
import { Transition } from "@headlessui/react";
import { handleCustomizer } from "@/store/layout";
import SimpleBar from "simplebar-react";
import Semidark from "./Tools/Semidark";
import RtlSwicth from "./Tools/Rtl";
import Skin from "./Tools/Skin";
import Theme from "./Tools/Theme";
import ContentWidth from "./Tools/ContentWidth";
import Menulayout from "./Tools/Menulayout";
import MenuClose from "./Tools/MenuClose";
import MenuHidden from "./Tools/MenuHidden";
import NavbarType from "./Tools/NavbarType";
import FooType from "./Tools/FooterType";
import useWidth from "@/hooks/useWidth";

const Setings = () => {
  const isOpen = useSelector((state) => state.layout.customizer);
  const dispatch = useDispatch();
  // ** Toggles  Customizer Open
  const setCustomizer = (val) => dispatch(handleCustomizer(val));

  const { width, breakpoints } = useWidth();

  return (
    <div>
      {!isOpen && (
        <span
          className="fixed md:ltr:right-[-32px] ltr:right-0 rtl:left-0 md:rtl:left-[-32px] top-1/2 z-888 translate-y-1/2 bg-slate-800 text-slate-50 dark:bg-slate-700 dark:text-slate-300 cursor-pointer transform rotate-90 flex items-center text-sm font-medium px-2 py-2 border border-slate-700 dark:border-slate-600 ltr:rounded-b rtl:rounded-t"
          onClick={() => setCustomizer(true)}
        >
          <Icon
            icon="clarity:settings-line"
            className="text-slate-50 text-lg animate-spin"
          />
          <span className="hidden md:inline-block ltr:ml-2 rtl:mr-2">
            Settings
          </span>
        </span>
      )}

      <div
        className={`
        setting-wrapper fixed ltr:right-0 rtl:left-0 top-0 md:w-[400px] w-[340px]
         bg-white dark:bg-slate-800 h-screen z-9999
          border-l border-slate-200 dark:border-slate-700 transition-all duration-200
          ${
            isOpen
              ? "translate-x-0 opacity-100 visible"
              : "ltr:translate-x-full rtl:-translate-x-full opacity-0 invisible"
          }
        `}
      >
        <SimpleBar className="px-6 h-full">
          <header className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 -mx-6 px-6 py-[15px] mb-6">
            <div>
              <span className="block text-xl text-slate-900 font-bold dark:text-white">
                Theme customizer
              </span>
              <span className="block text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                Customize & Preview in Real Time
              </span>
            </div>
            <div
              className="cursor-pointer text-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              onClick={() => setCustomizer(false)}
            >
              <Icon icon="heroicons-outline:x-mark" />
            </div>
          </header>
          <div className="space-y-5 pb-24">
            <Skin />
            <Theme />
            <Semidark />
            <hr className="-mx-6 border-slate-200 dark:border-slate-700" />

            <div>
              <RtlSwicth />
            </div>
            <hr className="-mx-6 border-slate-200 dark:border-slate-700" />
            <ContentWidth />
            {width >= breakpoints.xl && <Menulayout />}

            <div className="pt-2">
              <MenuClose />
            </div>
            <div className="pt-2">
              <MenuHidden />
            </div>
            <hr className="-mx-6 border-slate-200 dark:border-slate-700" />
            <NavbarType />
            <FooType />
          </div>
        </SimpleBar>
      </div>

      <Transition as={Fragment} show={isOpen}>
        <div
          className="overlay bg-white/50 fixed inset-0 z-999"
          onClick={() => setCustomizer(false)}
        ></div>
      </Transition>
    </div>
  );
};

export default Setings;
