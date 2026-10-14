import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

const Tooltip = ({
  title,
  children,
  className = "btn btn-dark",
  content = "Tooltip",
  theme,
  arrow,
  open,
  side,
  placement = "top",
  defaultOpen,
  onOpenChange,
  ...props
}) => {
  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        className={className}
      >
        <TooltipPrimitive.Trigger asChild>
          {children || <button className={className}>{title}</button>}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          {theme ? (
            <TooltipPrimitive.Content
              side={side || placement || "top"}
              sideOffset={5}
              align="center"
              className={`text-slate-50 dark:text-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] font-medium border border-transparent z-[99999] bg-${theme}-500`}
              {...props}
            >
              {content}
              {arrow ? (
                <></>
              ) : (
                <TooltipPrimitive.Arrow
                  className={`fill-current text-${theme}-500`}
                  width={11}
                  height={5}
                />
              )}
            </TooltipPrimitive.Content>
          ) : (
            <TooltipPrimitive.Content
              side={side || placement || "top"}
              sideOffset={5}
              align="center"
              className="text-white rounded-lg px-2.5 py-1.5 text-[13px] font-medium z-[99999] bg-slate-900 dark:bg-slate-800 border border-slate-700/60 font-inter"
              {...props}
            >
              {content}

              {arrow ? (
                <></>
              ) : (
                <TooltipPrimitive.Arrow
                  className="fill-slate-900 dark:fill-slate-800"
                  width={11}
                  height={5}
                />
              )}
            </TooltipPrimitive.Content>
          )}
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

export default Tooltip;
