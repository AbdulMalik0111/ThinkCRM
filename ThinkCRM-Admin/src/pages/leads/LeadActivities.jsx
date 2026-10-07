import React from "react";
import { useGetLeadActivitiesQuery } from "@/store/api/leads/leadsApiSlice";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Loading from "@/components/Loading";
import dayjs from "dayjs";

const getActivityIcon = (type) => {
  const map = {
    'status_change': 'heroicons:arrow-path-rounded-square',
    'lead_created': 'heroicons:user-plus',
    'lead_updated': 'heroicons:pencil-square',
    'note_added': 'heroicons:document-text',
    'follow_up_scheduled': 'heroicons:calendar',
    'follow_up_completed': 'heroicons:check-circle',
    'email_sent': 'heroicons:envelope',
    'call_logged': 'heroicons:phone',
    'assigned': 'heroicons:user',
    'unassigned': 'heroicons:user-minus',
  };
  return map[type] || 'heroicons:bolt';
};

const getActivityColor = (type) => {
  const map = {
    'status_change': 'text-blue-500 bg-blue-100 dark:bg-blue-900',
    'lead_created': 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900',
    'lead_updated': 'text-amber-500 bg-amber-100 dark:bg-amber-900',
    'note_added': 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900',
    'follow_up_scheduled': 'text-orange-500 bg-orange-100 dark:bg-orange-900',
    'follow_up_completed': 'text-success-500 bg-success-100 dark:bg-success-900',
    'assigned': 'text-purple-500 bg-purple-100 dark:bg-purple-900',
  };
  return map[type] || 'text-slate-500 bg-slate-100 dark:bg-slate-700';
};

const LeadActivities = ({ leadId }) => {
  const { data, isLoading, error } = useGetLeadActivitiesQuery(leadId);

  if (isLoading) return <Loading />;
  if (error) return <div className="text-danger-500">Failed to load activities.</div>;

  const activities = data?.data?.activities || [];

  return (
    <Card title="Activity Timeline">
      {activities.length === 0 ? (
        <div className="text-center py-5 text-slate-500">No activity recorded yet.</div>
      ) : (
        <ul className="relative border-l border-slate-200 dark:border-slate-700 ml-3 space-y-6">
          {activities.map((activity, index) => (
            <li key={activity._id || index} className="pl-8 relative">
              <span className={`absolute -left-[18px] top-1 h-9 w-9 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-800 ${getActivityColor(activity.type)}`}>
                <Icon icon={getActivityIcon(activity.type)} className="text-lg" />
              </span>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                  {activity.type.replace(/_/g, ' ')}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {dayjs(activity.createdAt).format("MMM D, YYYY h:mm A")}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {activity.description}
              </p>
              {activity.performedBy && (
                <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                  <Icon icon="heroicons:user" />
                  By {activity.performedBy.firstName} {activity.performedBy.lastName}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default LeadActivities;
