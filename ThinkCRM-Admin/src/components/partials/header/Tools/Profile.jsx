import React from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { MenuItem } from "@headlessui/react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logOut } from "@/store/api/auth/authSlice";

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logOut());
    navigate('/login');
    setIsLogoutModalOpen(false);
  };

  const ProfileMenu = [
    {
      label: "My Profile",
      icon: "heroicons-outline:user",
      action: () => {
        navigate("/profile");
      },
    },
    {
      label: "Change Password",
      icon: "heroicons-outline:key",
      action: () => {
        navigate("/change-password");
      },
    },
    {
      label: "Settings",
      icon: "heroicons-outline:cog",
      action: () => {
        navigate("/settings");
      },
    },
    {
      label: "Logout",
      icon: "heroicons-outline:login",
      isDanger: true,
      hasDivider: true,
      action: () => {
        setIsLogoutModalOpen(true);
      },
    },
  ];

  const profileLabel = () => {
    const fullName = user?.firstName ? `${user.firstName} ${user.lastName}` : "Admin User";
    const initial = user?.firstName ? user.firstName.charAt(0).toUpperCase() : "A";
    const roleName = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Administrator";

    return (
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-slate-700 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm">
          {initial}
        </div>
        {/* Name & Role (Hidden on mobile) */}
        <div className="hidden lg:flex flex-col text-left">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[160px]">
            {fullName}
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {roleName}
          </span>
        </div>
        {/* Chevron */}
        <div className="hidden lg:block text-slate-400 dark:text-slate-500 ml-1">
          <Icon icon="heroicons-outline:chevron-down" className="w-4 h-4" />
        </div>
      </div>
    );
  };

  return (
    <>
      <Dropdown label={profileLabel()} classMenuItems="w-[200px] top-[58px]">
        {ProfileMenu.map((item, index) => (
          <MenuItem key={index}>
            {({ isActive }) => (
              <div
                onClick={() => item.action()}
                className={`${
                  isActive
                    ? item.isDanger
                      ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500"
                      : "bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-300 dark:bg-opacity-50"
                    : item.isDanger
                    ? "text-red-600 dark:text-red-500"
                    : "text-slate-600 dark:text-slate-300"
                } block transition-colors duration-150 ${
                  item.hasDivider
                    ? "border-t border-slate-100 dark:border-slate-700 mt-1 pt-1"
                    : ""
                }`}
              >
                <div className={`block cursor-pointer px-4 py-2.5 rounded-md mx-1`}>
                  <div className="flex items-center">
                    <span className="block text-xl ltr:mr-3 rtl:ml-3">
                      <Icon icon={item.icon} />
                    </span>
                    <span className="block text-sm font-medium">{item.label}</span>
                  </div>
                </div>
              </div>
            )}
          </MenuItem>
        ))}
      </Dropdown>

      {/* Logout Confirmation Modal */}
      <Transition appear show={isLogoutModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsLogoutModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full dark:bg-red-900/30 mb-4">
                    <Icon icon="heroicons-outline:logout" className="w-6 h-6 text-red-600 dark:text-red-500" />
                  </div>
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold text-center leading-6 text-slate-900 dark:text-white"
                  >
                    Confirm Logout
                  </Dialog.Title>
                  <div className="mt-2 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Are you sure you want to log out of your account? You will need to enter your credentials to log back in.
                    </p>
                  </div>

                  <div className="mt-6 flex justify-center gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none"
                      onClick={() => setIsLogoutModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none"
                      onClick={handleLogout}
                    >
                      Yes, Log out
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default Profile;
