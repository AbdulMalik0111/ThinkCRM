import React from "react";
import Radio from "@/components/ui/Radio";
import useMenuLayout from "@/hooks/useMenulayout";

const Menulayout = () => {
  const [menuType, setMenuLayout] = useMenuLayout();

  return (
    <div>
      <h4 className="text-slate-700 text-sm font-semibold dark:text-slate-200 mb-2.5">
        Menu Layout
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <Radio
          label="Vertical"
          name="menulayout"
          value="vertical"
          checked={menuType === "vertical"}
          onChange={() => setMenuLayout("vertical")}
        />
        <Radio
          label="Horizontal"
          name="menulayout"
          value="horizontal"
          checked={menuType === "horizontal"}
          onChange={() => setMenuLayout("horizontal")}
        />
      </div>
    </div>
  );
};

export default Menulayout;
