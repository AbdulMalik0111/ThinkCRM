import React from "react";
import Radio from "@/components/ui/Radio";
import useContentWidth from "@/hooks/useContentWidth";

const CWidth = () => {
  const [contentWidth, setContentWidth] = useContentWidth();

  return (
    <div>
      <h4 className="text-slate-700 text-sm font-semibold dark:text-slate-200 mb-2.5">
        Content Width
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <Radio
          label="Full Width"
          name="cwidth"
          value="full"
          checked={contentWidth === "full"}
          onChange={() => setContentWidth("full")}
        />
        <Radio
          label="Boxed"
          name="cwidth"
          value="boxed"
          checked={contentWidth === "boxed"}
          onChange={() => setContentWidth("boxed")}
        />
      </div>
    </div>
  );
};

export default CWidth;
