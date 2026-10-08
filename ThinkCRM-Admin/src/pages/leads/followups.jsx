import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import { useGetAllFollowUpsQuery, useUpdateFollowUpMutation } from "@/store/api/leads/followupApiSlice";

dayjs.extend(isToday);
dayjs.extend(isYesterday);

const FollowUpsCalendar = () => {
  const { data, isLoading, refetch } = useGetAllFollowUpsQuery();
  const [updateFollowUp, { isLoading: isUpdating }] = useUpdateFollowUpMutation();

  const followUps = data?.data?.followUps || [];

  const handleStatusChange = async (id, status) => {
    try {
      await updateFollowUp({
        id,
        data: { status }
      }).unwrap();
      toast.success(`Follow-up marked as ${status}`);
      refetch();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // Grouping logic
  const groupedFollowUps = useMemo(() => {
    const groups = {
      Overdue: [],
      Today: [],
      Upcoming: [],
      Completed: [],
    };

    const now = dayjs();

    followUps.forEach((fu) => {
      const scheduledDate = dayjs(fu.scheduledAt);

      if (fu.status === 'completed' || fu.status === 'cancelled') {
        groups.Completed.push(fu);
      } else if (scheduledDate.isBefore(now, 'day') || (scheduledDate.isSame(now, 'day') && scheduledDate.isBefore(now))) {
        // Technically overdue if time has passed, but let's just group by "day" before now for simplicity
        // or actually, let's just use strict date/time comparison.
        if (scheduledDate.isBefore(now)) {
           groups.Overdue.push(fu);
        } else {
           groups.Today.push(fu);
        }
      } else if (scheduledDate.isToday()) {
        groups.Today.push(fu);
      } else {
        groups.Upcoming.push(fu);
      }
    });

    return groups;
  }, [followUps]);

  if (isLoading) return <Loading />;

  const getIconForType = (type) => {
    switch (type) {
      case 'call': return 'heroicons:phone';
      case 'email': return 'heroicons:envelope';
      case 'meeting': return 'heroicons:user-group';
      case 'site_visit': return 'heroicons:map-pin';
      case 'whatsapp': return 'heroicons:chat-bubble-left-ellipsis';
      default: return 'heroicons:calendar';
    }
  };

  const renderGroup = (title, items, colorClass) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h4>
          <Badge label={items.length} className={`${colorClass} rounded-full`} />
        </div>
        <div className="space-y-4">
          {items.map((fu) => (
            <Card key={fu._id} bodyClass="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex gap-4 w-full">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl shrink-0 ${colorClass}`}>
                    <Icon icon={getIconForType(fu.type)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link to={`/leads/${fu.leadId?._id}`} className="text-base font-bold text-slate-900 dark:text-white hover:text-primary-500 transition-colors">
                        {fu.leadId?.fullName || 'Unknown Lead'}
                      </Link>
                      {fu.leadId?.company && (
                        <span className="text-xs text-slate-500">• {fu.leadId.company}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1 font-medium capitalize">
                        {fu.type.replace('_', ' ')}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Icon icon="heroicons:clock" className="w-4 h-4" />
                        {dayjs(fu.scheduledAt).format("MMM D, YYYY h:mm A")}
                      </span>
                      {fu.assignedTo && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Icon icon="heroicons:user" className="w-4 h-4" />
                          {fu.assignedTo.firstName} {fu.assignedTo.lastName}
                        </span>
                      )}
                    </div>
                    {fu.notes && (
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded text-sm text-slate-700 dark:text-slate-300">
                        {fu.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                  <Badge label={fu.status} className={`${fu.status === 'completed' ? 'bg-success-100 text-success-600' : fu.status === 'cancelled' ? 'bg-danger-100 text-danger-600' : 'bg-warning-100 text-warning-600'} capitalize w-fit`} />
                  
                  {fu.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        icon="heroicons:check" 
                        className="btn-success btn-sm !p-2" 
                        onClick={() => handleStatusChange(fu._id, 'completed')} 
                        disabled={isUpdating}
                        tooltip="Complete"
                      />
                      <Button 
                        icon="heroicons:x-mark" 
                        className="btn-danger btn-sm !p-2" 
                        onClick={() => handleStatusChange(fu._id, 'cancelled')} 
                        disabled={isUpdating}
                        tooltip="Cancel"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Follow-Ups Calendar</h4>
          <p className="text-sm text-slate-500 mt-1">Manage all scheduled calls, meetings, and emails across your leads.</p>
        </div>
      </div>

      {followUps.length === 0 ? (
        <Card>
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Icon icon="heroicons:calendar" className="text-4xl text-slate-400" />
            </div>
            <h5 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Follow-Ups Found</h5>
            <p className="text-slate-500 max-w-sm">There are no follow-ups scheduled yet. Go to a lead's profile to schedule one.</p>
            <Link to="/leads">
              <Button text="Go to Leads" className="btn-primary mt-6" />
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {renderGroup("Overdue", groupedFollowUps.Overdue, "bg-danger-500 text-white")}
          {renderGroup("Today", groupedFollowUps.Today, "bg-warning-500 text-white")}
          {renderGroup("Upcoming", groupedFollowUps.Upcoming, "bg-primary-500 text-white")}
          {renderGroup("Completed", groupedFollowUps.Completed, "bg-success-500 text-white")}
        </div>
      )}
    </div>
  );
};

export default FollowUpsCalendar;
