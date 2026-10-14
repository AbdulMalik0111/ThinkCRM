import React from "react";
import Radio from "@/components/ui/Radio";
import useFooterType from "@/hooks/useFooterType";

const FooType = () => {
  const [footerType, setFooterType] = useFooterType();
  const fotypes = [
    { label: "Sticky", value: "sticky" },
    { label: "Static", value: "static" },
    { label: "Hidden", value: "hidden" },
  ];

  return (
    <div>
      <h4 className="text-slate-700 text-sm font-semibold dark:text-slate-200 mb-2.5">
        Footer Type
      </h4>
      <div className="grid grid-cols-3 gap-3">
        {fotypes.map((item) => (
          <Radio
            key={item.value}
            label={item.label}
            name="footerType"
            value={item.value}
            checked={footerType === item.value}
            onChange={() => setFooterType(item.value)}
          />
        ))}
      </div>
    </div>
  );
};

export default FooType;
