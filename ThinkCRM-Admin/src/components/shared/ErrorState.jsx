import React from "react";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";

const ErrorState = ({ title = "Something went wrong", message = "We encountered an error loading this data.", onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-800 rounded-md border border-danger-200 dark:border-danger-900">
      <div className="h-20 w-20 bg-danger-100 dark:bg-danger-900/30 rounded-full flex items-center justify-center mb-4">
        <Icon icon="heroicons-outline:exclamation-triangle" className="text-4xl text-danger-500" />
      </div>
      <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">{title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{message}</p>
      
      {onRetry && (
        <Button 
          text="Try Again" 
          className="btn-outline-danger" 
          onClick={onRetry} 
          icon="heroicons-outline:arrow-path"
        />
      )}
    </div>
  );
};

export default ErrorState;
