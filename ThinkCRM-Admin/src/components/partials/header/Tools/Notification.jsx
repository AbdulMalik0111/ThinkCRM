import React from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { Link, useNavigate } from "react-router-dom";
import { MenuItem } from "@headlessui/react";
import { useGetNotificationsQuery, useMarkNotificationReadMutation } from "@/store/api/management/managementApiSlice";

const notifyLabel = (unreadCount) => {
  return (
    <span className="relative lg:h-[32px] lg:w-[32px] lg:bg-slate-100 lg:dark:bg-slate-900 dark:text-white text-slate-900 cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center">
      <Icon icon="heroicons-outline:bell" className={unreadCount > 0 ? "animate-tada" : ""} />
      {unreadCount > 0 && (
        <span className="absolute right-0 top-0 h-4 w-4 bg-red-500 text-[8px] font-semibold flex flex-col items-center justify-center rounded-full text-white z-99">
          {unreadCount}
        </span>
      )}
    </span>
  );
};

const Notification = () => {
  const { data: notifResponse } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  
  const notifications = notifResponse?.data?.notifications || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navigate = useNavigate();

  const handleRead = (item) => {
    if (!item.isRead) {
      markRead(item._id);
    }
    
    if (!item.referenceType || !item.referenceId) return;

    switch (item.referenceType) {
      case 'Order':
        navigate(`/orders/${item.referenceId}`);
        break;
      case 'Purchase':
        navigate(`/purchases/${item.referenceId}`);
        break;
      case 'Product':
        navigate(`/catalog/products/${item.referenceId}`);
        break;
      case 'Batch':
        navigate(`/inventory/expiry`);
        break;
      case 'MedicineRequest':
        navigate(`/medicine-requests/${item.referenceId}`);
        break;
      default:
        break;
    }
  };

  return (
    <Dropdown classMenuItems="md:w-[300px] top-[58px]" label={notifyLabel(unreadCount)}>
      <div className="flex justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-600">
        <div className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-6">
          Notifications
        </div>
        <div className="text-slate-800 dark:text-slate-200 text-xs md:text-right">
          <Link to="/notifications" className="underline">
            View all
          </Link>
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto">
        {notifications?.map((item, i) => (
          <MenuItem key={item._id || i}>
            {({ isActive }) => (
              <div
                onClick={() => handleRead(item)}
                className={`${
                  isActive
                    ? "bg-slate-100 dark:bg-slate-700 dark:bg-opacity-70 text-slate-800"
                    : "text-slate-600 dark:text-slate-300"
                } block w-full px-4 py-2 text-sm  cursor-pointer`}
              >
                <div className="flex ltr:text-left rtl:text-right">
                  <div className="flex-1">
                    <div
                      className={`${
                        isActive || !item.isRead
                          ? "text-slate-800 dark:text-slate-100 font-medium"
                          : " text-slate-600 dark:text-slate-300"
                      } text-sm`}
                    >
                      {item.title}
                    </div>
                    <div
                      className={`${
                        isActive
                          ? "text-slate-500 dark:text-slate-200"
                          : " text-slate-600 dark:text-slate-300"
                      } text-xs leading-4 mt-1`}
                    >
                      {item.body || item.message || "No additional details available."}
                    </div>
                    <div className="text-slate-400 dark:text-slate-400 text-xs mt-1">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {!item.isRead && (
                    <div className="flex-0 mt-1">
                      <span className="h-[10px] w-[10px] bg-danger-500 border border-white dark:border-slate-400 rounded-full inline-block"></span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </MenuItem>
        ))}
        {notifications.length === 0 && (
          <div className="p-4 text-center text-sm text-slate-500">
            No notifications
          </div>
        )}
      </div>
    </Dropdown>
  );
};

export default Notification;
