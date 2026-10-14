import React from "react";
import Icon from "@/components/ui/Icon";

const Switch = ({
  prevIcon,
  nextIcon,
  label,
  id,
  disabled,
  value,
  onChange,
  activeClass = "bg-primary-600",
  wrapperClass = "",
  labelClass = "text-slate-600 dark:text-slate-300 text-sm leading-6 select-none",
  badge,
}) => {
  return (
    <div>
      <label
        className={`flex items-center ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } ${wrapperClass}`}
        id={id}
      >
        <input
          type="checkbox"
          className="hidden"
          checked={Boolean(value)}
          onChange={onChange}
          disabled={disabled}
        />
        <div
          className={`relative inline-flex h-6 w-[46px] mr-2.5 items-center rounded-full transition-colors duration-200 ${
            value ? activeClass : "bg-slate-200 dark:bg-slate-700"
          }`}
        >
          {badge && value && (
            <span className="absolute leading-[1px] left-1 top-1/2 -translate-y-1/2 capitalize font-bold text-white tracking-[1px]">
              {prevIcon ? (
                <Icon icon={prevIcon} />
              ) : (
                <span className="text-[9px]">on</span>
              )}
            </span>
          )}
          {badge && !value && (
            <span className="absolute right-1 leading-[1px] top-1/2 -translate-y-1/2 capitalize font-bold text-slate-500 tracking-[1px]">
              {nextIcon ? (
                <Icon icon={nextIcon} />
              ) : (
                <span className="text-[9px]">Off</span>
              )}
            </span>
          )}

          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white border border-slate-200 dark:border-slate-600 transition-transform duration-200 ${
              value ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </div>
        {label && <span className={labelClass}>{label}</span>}
      </label>
    </div>
  );
};

export default Switch;
