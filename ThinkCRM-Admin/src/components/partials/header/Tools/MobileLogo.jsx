import React from "react";
import { Link } from "react-router-dom";

const MobileLogo = () => {
  return (
    <Link to="/" className="block py-1">
      <img
        src="/logo.webp"
        alt="ThinkTive"
        className="h-7 max-w-[140px] w-auto object-contain"
      />
    </Link>
  );
};

export default MobileLogo;
