import React from "react";
import { Link } from "react-router-dom";

const MobileLogo = () => {
  return (
    <Link to="/" className="flex items-center space-x-2">
      <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center shadow-xs shrink-0">
        <img src="/favicon.svg" alt="ThinkTive" className="w-full h-full object-contain" />
      </div>
      <div className="flex flex-col whitespace-nowrap">
        <div className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none flex items-baseline">
          <span>ThinkTive</span>
          <span className="text-[#06B6D4] font-black text-lg leading-none">.</span>
        </div>
        <span className="text-[8px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">
          IT Solution
        </span>
      </div>
    </Link>
  );
};

export default MobileLogo;
