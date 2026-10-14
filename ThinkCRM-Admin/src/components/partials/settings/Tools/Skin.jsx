import React from "react";
import Radio from "@/components/ui/Radio";
import useSkin from "@/hooks/useSkin";

const Skin = () => {
  const [skin, setSkin] = useSkin("default");

  return (
    <div>
      <h4 className="text-slate-700 text-sm font-semibold dark:text-slate-200 mb-2.5">
        Skin
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <Radio
          label="Default"
          name="skin"
          value="default"
          checked={skin === "default"}
          onChange={() => setSkin("default")}
        />
        <Radio
          label="Bordered"
          name="skin"
          value="bordered"
          checked={skin === "bordered"}
          onChange={() => setSkin("bordered")}
        />
      </div>
    </div>
  );
};

export default Skin;
