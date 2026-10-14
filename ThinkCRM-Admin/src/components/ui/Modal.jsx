import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import React, { Fragment, useState } from "react";
import Icon from "@/components/ui/Icon";

const Modal = ({
  activeModal,
  onClose,
  noFade,
  disableBackdrop,
  className = "max-w-xl",
  children,
  footerContent,
  centered = true,
  scrollContent,
  themeClass = "",
  title = "",
  uncontrol,
  label = "Open Modal",
  labelClass,
}) => {
  const [showModal, setShowModal] = useState(false);

  const closeModal = () => {
    setShowModal(false);
  };

  const openModal = () => {
    setShowModal(!showModal);
  };

  const returnNull = () => {
    return null;
  };

  return (
    <>
      {uncontrol ? (
        <>
          <button
            type="button"
            onClick={openModal}
            className={`btn ${labelClass}`}
          >
            {label}
          </button>
          <Transition appear show={showModal} as={Fragment}>
            <Dialog
              as="div"
              className="relative z-99999 font-inter"
              onClose={!disableBackdrop ? closeModal : returnNull}
            >
              {!disableBackdrop && (
                <TransitionChild
                  as={Fragment}
                  enter={noFade ? "" : "duration-300 ease-out"}
                  enterFrom={noFade ? "" : "opacity-0"}
                  enterTo={noFade ? "" : "opacity-100"}
                  leave={noFade ? "" : "duration-200 ease-in"}
                  leaveFrom={noFade ? "" : "opacity-100"}
                  leaveTo={noFade ? "" : "opacity-0"}
                >
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
                </TransitionChild>
              )}

              <div className="fixed inset-0 overflow-y-auto">
                <div
                  className={`flex min-h-full justify-center text-center p-4 sm:p-6 ${
                    centered ? "items-center" : "items-start pt-16"
                  }`}
                >
                  <TransitionChild
                    as={Fragment}
                    enter={noFade ? "" : "duration-300 ease-out"}
                    enterFrom={noFade ? "" : "opacity-0 scale-95"}
                    enterTo={noFade ? "" : "opacity-100 scale-100"}
                    leave={noFade ? "" : "duration-200 ease-in"}
                    leaveFrom={noFade ? "" : "opacity-100 scale-100"}
                    leaveTo={noFade ? "" : "opacity-0 scale-95"}
                  >
                    <DialogPanel
                      className={`w-full transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 text-left align-middle border border-slate-200 dark:border-slate-700 transition-all font-inter ${className}`}
                    >
                      {title && (
                        <div
                          className={`relative py-4 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 bg-white dark:bg-slate-800 ${themeClass}`}
                        >
                          <h3 className="font-bold text-base md:text-lg text-slate-900 dark:text-white truncate pr-4">
                            {title}
                          </h3>
                          <button
                            type="button"
                            onClick={closeModal}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 transition flex-shrink-0"
                            title="Close"
                          >
                            <Icon icon="heroicons-outline:x-mark" className="text-lg" />
                          </button>
                        </div>
                      )}
                      <div
                        className={`p-6 ${
                          scrollContent ? "overflow-y-auto max-h-[75vh]" : ""
                        }`}
                      >
                        {children}
                      </div>
                      {footerContent && (
                        <div className="px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 rounded-b-2xl">
                          {footerContent}
                        </div>
                      )}
                    </DialogPanel>
                  </TransitionChild>
                </div>
              </div>
            </Dialog>
          </Transition>
        </>
      ) : (
        <Transition appear show={activeModal} as={Fragment}>
          <Dialog as="div" className="relative z-99999 font-inter" onClose={onClose}>
            <TransitionChild
              as={Fragment}
              enter={noFade ? "" : "duration-300 ease-out"}
              enterFrom={noFade ? "" : "opacity-0"}
              enterTo={noFade ? "" : "opacity-100"}
              leave={noFade ? "" : "duration-200 ease-in"}
              leaveFrom={noFade ? "" : "opacity-100"}
              leaveTo={noFade ? "" : "opacity-0"}
            >
              {!disableBackdrop && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
              )}
            </TransitionChild>

            <div className="fixed inset-0 overflow-y-auto">
              <div
                className={`flex min-h-full justify-center text-center p-4 sm:p-6 ${
                  centered ? "items-center" : "items-start pt-16"
                }`}
              >
                <TransitionChild
                  as={Fragment}
                  enter={noFade ? "" : "duration-300 ease-out"}
                  enterFrom={noFade ? "" : "opacity-0 scale-95"}
                  enterTo={noFade ? "" : "opacity-100 scale-100"}
                  leave={noFade ? "" : "duration-200 ease-in"}
                  leaveFrom={noFade ? "" : "opacity-100 scale-100"}
                  leaveTo={noFade ? "" : "opacity-0 scale-95"}
                >
                  <DialogPanel
                    className={`w-full transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 text-left align-middle border border-slate-200 dark:border-slate-700 transition-all font-inter ${className}`}
                  >
                    {title && (
                      <div
                        className={`relative py-4 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 bg-white dark:bg-slate-800 ${themeClass}`}
                      >
                        <h3 className="font-bold text-base md:text-lg text-slate-900 dark:text-white truncate pr-4">
                          {title}
                        </h3>
                        <button
                          type="button"
                          onClick={onClose}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 transition flex-shrink-0"
                          title="Close"
                        >
                          <Icon icon="heroicons-outline:x-mark" className="text-lg" />
                        </button>
                      </div>
                    )}
                    <div
                      className={`p-6 ${
                        scrollContent ? "overflow-y-auto max-h-[75vh]" : ""
                      }`}
                    >
                      {children}
                    </div>
                    {footerContent && (
                      <div className="px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 rounded-b-2xl">
                        {footerContent}
                      </div>
                    )}
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </Dialog>
        </Transition>
      )}
    </>
  );
};

export default Modal;
