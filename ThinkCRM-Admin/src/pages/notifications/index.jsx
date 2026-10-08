import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useGetNotificationsQuery, useMarkNotificationReadMutation } from "@/store/api/management/managementApiSlice";
import Loading from "@/components/Loading";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import { toast } from "react-toastify";

dayjs.extend(isToday);
dayjs.extend(isYesterday);

const Notifications = () => {
  const navigate = useNavigate();
  const { data: notificationsData, isLoading, error } = useGetNotificationsQuery({ page: 1, limit: 100 });
  const [markAsRead, { isLoading: isMarking }] = useMarkNotificationReadMutation();

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id).unwrap();
    } catch (err) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async (unreadNotifications) => {
    try {
      await Promise.all(unreadNotifications.map(n => markAsRead(n._id).unwrap()));
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to mark some notifications as read");
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif._id);
    }
    
    if (!notif.entityType || !notif.entityId) return;

    switch (notif.entityType) {
      case 'Lead':
      case 'FollowUp':
      case 'Quotation':
      case 'Measurement':
        navigate(`/leads/${notif.entityId}`);
        break;
      default:
        break;
    }
  };

  const notifications = notificationsData?.data?.notifications || [];

  // Group notifications
  const groupedNotifications = useMemo(() => {
    const groups = {
      Today: [],
      Yesterday: [],
      Older: []
    };

    notifications.forEach(notif => {
      if (dayjs(notif.createdAt).isToday()) {
        groups.Today.push(notif);
      } else if (dayjs(notif.createdAt).isYesterday()) {
        groups.Yesterday.push(notif);
      } else {
        groups.Older.push(notif);
      }
    });

    return groups;
  }, [notifications]);

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const hasUnread = unreadNotifications.length > 0;

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <div className="p-6 rounded-lg bg-danger-50 text-danger-600 border border-danger-200 flex items-center gap-3">
        <Icon icon="heroicons-outline:exclamation-triangle" className="w-6 h-6" />
        <span className="font-medium">Error loading notifications. Please try again.</span>
      </div>
    );
  }

  const getIconForNotification = (title) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("lead")) return "heroicons-outline:user";
    if (lowerTitle.includes("follow") || lowerTitle.includes("due")) return "heroicons-outline:calendar";
    if (lowerTitle.includes("measurement")) return "heroicons-outline:scissors";
    if (lowerTitle.includes("quotation")) return "heroicons-outline:document-text";
    if (lowerTitle.includes("alert") || lowerTitle.includes("warning") || lowerTitle.includes("overdue")) return "heroicons-outline:exclamation-triangle";
    if (lowerTitle.includes("success") || lowerTitle.includes("won")) return "heroicons-outline:check-circle";
    return "heroicons-outline:bell";
  };

  const getColorForNotification = (title) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("alert") || lowerTitle.includes("warning") || lowerTitle.includes("failed") || lowerTitle.includes("overdue")) return "text-danger-500 bg-danger-50 dark:bg-danger-500/10";
    if (lowerTitle.includes("success") || lowerTitle.includes("won")) return "text-success-500 bg-success-50 dark:bg-success-500/10";
    if (lowerTitle.includes("lead") || lowerTitle.includes("measurement")) return "text-primary-500 bg-primary-50 dark:bg-primary-500/10";
    if (lowerTitle.includes("quotation")) return "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10";
    if (lowerTitle.includes("follow")) return "text-warning-500 bg-warning-50 dark:bg-warning-500/10";
    return "text-slate-500 bg-slate-100 dark:bg-slate-700/50";
  };

  const renderGroup = (title, items) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6" key={title}>
        <h6 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">
          {title}
        </h6>
        <Card noborder className="shadow-none border border-slate-200 dark:border-slate-700">
          <ul className="divide-y divide-slate-100 dark:divide-slate-700 w-full m-0 p-0">
            {items.map((notif) => (
              <li 
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full p-4 transition-colors flex gap-4 cursor-pointer ${
                  notif.isRead 
                    ? 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700' 
                    : 'bg-primary-50/50 dark:bg-slate-800/80 hover:bg-primary-50 dark:hover:bg-slate-700'
                }`}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getColorForNotification(notif.title)}`}>
                  <Icon icon={getIconForNotification(notif.title)} className="w-6 h-6" />
                </div>
                
                {/* Content */}
                <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className={`text-base font-semibold ${notif.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <Badge label="New" className="bg-primary-500 text-white text-[10px] px-2 py-0.5" />
                      )}
                    </div>
                    <p className={`text-sm ${notif.isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                      {notif.body || notif.message || "No additional details available."}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-2">
                      <Icon icon="heroicons-outline:clock" className="w-3.5 h-3.5" />
                      <span>{dayjs(notif.createdAt).format('hh:mm A')}</span>
                      {title === 'Older' && <span>• {dayjs(notif.createdAt).format('DD MMM YYYY')}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  {!notif.isRead && (
                    <div className="flex-shrink-0 md:self-center">
                      <Button 
                        text="Mark as read"
                        icon="heroicons-outline:check"
                        className="btn-outline-primary btn-sm rounded-[999px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notif._id);
                        }}
                        disabled={isMarking}
                      />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-3">
            Notifications
            {hasUnread && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
                {unreadNotifications.length}
              </span>
            )}
          </h4>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Stay updated with your latest alerts and activities.
          </p>
        </div>
        
        {hasUnread && (
          <Button 
            text="Mark all as read" 
            className="btn-primary" 
            onClick={() => handleMarkAllAsRead(unreadNotifications)}
            disabled={isMarking}
          />
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <div className="flex flex-col justify-center items-center h-48 text-slate-500 space-y-3">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Icon icon="heroicons-outline:bell-slash" className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-base font-medium text-slate-600 dark:text-slate-300">No new notifications</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {renderGroup("Today", groupedNotifications.Today)}
          {renderGroup("Yesterday", groupedNotifications.Yesterday)}
          {renderGroup("Older", groupedNotifications.Older)}
        </div>
      )}
    </div>
  );
};

export default Notifications;
