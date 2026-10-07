import React from "react";
import Icon from "@/components/ui/Icon";

const EmptyState = ({ title = "No Data Found", message = "There is no data available to display.", icon = "heroicons-outline:inbox" }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-800 rounded-md">
      <div className="h-20 w-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
        <Icon icon={icon} className="text-4xl text-slate-400 dark:text-slate-500" />
      </div>
      <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">{title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{message}</p>
    </div>
  );
};

export default EmptyState;
