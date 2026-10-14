import React from "react";
import Radio from "@/components/ui/Radio";
import useDarkmode from "@/hooks/useDarkMode";

const Theme = () => {
  const [isDark, setDarkMode] = useDarkmode();

  return (
    <div>
      <h4 className="text-slate-700 text-sm font-semibold dark:text-slate-200 mb-2.5">
        Theme
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <Radio
          label="Light"
          name="theme"
          value="light"
          checked={!isDark}
          onChange={() => setDarkMode(false)}
        />
        <Radio
          label="Dark"
          name="theme"
          value="dark"
          checked={Boolean(isDark)}
          onChange={() => setDarkMode(true)}
        />
      </div>
    </div>
  );
};

export default Theme;
