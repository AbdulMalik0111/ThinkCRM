import React from "react";
import useSkin from "@/hooks/useSkin";

const Card = ({
  children,
  title,
  subtitle,
  headerSlot,
  headerslot,
  className = " ",
  bodyClass = "p-6",
  noBorder,
  noborder,
  titleClass = "text-slate-900 dark:text-white",
  ...props
}) => {
  const [skin] = useSkin();
  const slot = headerSlot || headerslot;

  return (
    <div
      {...props}
      className={`
        card rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${className}`}
    >
      {(title || subtitle || slot) && (
        <header className={`card-header ${(noBorder || noborder) ? "no-border" : ""}`}>
          <div>
            {title && <div className={`card-title ${titleClass}`}>{title}</div>}
            {subtitle && <div className="card-subtitle">{subtitle}</div>}
          </div>
          {slot && <div className="card-header-slot">{slot}</div>}
        </header>
      )}
      <main className={`card-body ${bodyClass}`}>{children}</main>
    </div>
  );
};

export default Card;
