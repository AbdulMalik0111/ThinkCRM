import React from "react";

const Radio = ({
  label,
  id,
  name,
  disabled,
  value,
  onChange,
  wrapperClass = "",
  labelClass = "text-slate-600 dark:text-slate-300 text-sm leading-6 select-none",
  checked,
  className = "",
}) => {
  const isChecked = Boolean(checked);

  const handleClick = (e) => {
    if (disabled) return;
    if (onChange) {
      onChange({ target: { value, name } });
    }
  };

  return (
    <div className="inline-block">
      <label
        className={`flex items-center gap-2.5 ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } ${wrapperClass}`}
        id={id}
        onClick={handleClick}
      >
        <input
          type="radio"
          className="sr-only"
          name={name}
          value={value}
          checked={isChecked}
          onChange={() => {}}
          disabled={disabled}
        />
        <span
          className={`flex-none rounded-full inline-flex items-center justify-center transition-all duration-150 ${className}`}
          style={{
            width: "18px",
            height: "18px",
            minWidth: "18px",
            minHeight: "18px",
            border: isChecked ? "2px solid #2563eb" : "2px solid #cbd5e1",
            backgroundColor: isChecked ? "#eff6ff" : "#ffffff",
          }}
        >
          {isChecked && (
            <span
              className="rounded-full"
              style={{
                width: "9px",
                height: "9px",
                backgroundColor: "#2563eb",
              }}
            />
          )}
        </span>
        {label && (
          <span
            className={`${labelClass} ${
              isChecked
                ? "font-semibold text-slate-900 dark:text-white"
                : "text-slate-600 dark:text-slate-300 font-normal"
            }`}
          >
            {label}
          </span>
        )}
      </label>
    </div>
  );
};

export default Radio;
