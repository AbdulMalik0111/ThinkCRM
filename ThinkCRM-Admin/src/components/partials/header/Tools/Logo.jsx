import React from "react";
import { Link } from "react-router-dom";

const Logo = () => {
  return (
    <div>
      <Link to="/dashboard" className="block py-1">
        <img
          src="/logo.webp"
          alt="ThinkTive"
          className="h-7 max-w-[150px] w-auto object-contain"
        />
      </Link>
    </div>
  );
};

export default Logo;
