import React from "react";
import Radio from "@/components/ui/Radio";
import useNavbarType from "@/hooks/useNavbarType";

const NavType = () => {
  const [navbarType, setNavbarType] = useNavbarType();
  const navTypes = [
    { label: "Sticky", value: "sticky" },
    { label: "Static", value: "static" },
    { label: "Floating", value: "floating" },
    { label: "Hidden", value: "hidden" },
  ];

  return (
    <div>
      <h4 className="text-slate-700 text-sm font-semibold dark:text-slate-200 mb-2.5">
        Navbar Type
      </h4>
      <div className="grid grid-cols-2 gap-3">
        {navTypes.map((item) => (
          <Radio
            key={item.value}
            label={item.label}
            name="navbarType"
            value={item.value}
            checked={navbarType === item.value}
            onChange={() => setNavbarType(item.value)}
          />
        ))}
      </div>
    </div>
  );
};

export default NavType;
