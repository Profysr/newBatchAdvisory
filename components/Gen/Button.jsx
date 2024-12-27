/** @format */

import React from "react";

const MagicButton = ({
  title,
  icon,
  position,
  handleClick,
  otherClasses,
  disabledCondition,
  type = "button",
}) => {
  return (
    <button
      className={`relative inline-flex h-12 overflow-hidden rounded-md p-[1px] focus:outline-none disabled:bg-slate-700 disabled:cursor-not-allowed bg-slate-950 md:w-48 ${otherClasses}`}
      onClick={handleClick}
      aria-label="Magic Button Component"
      disabled={disabledCondition}
      type={type}
    >
      {/* <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" /> */}
      <span className="inline-flex h-full w-full items-center justify-center rounded-md  px-6 py-1 text-sm font-medium gap-2 text-white backdrop-blur-3xl ">
        {position === "left" && icon}
        {title}
        {position === "right" && icon}
      </span>
    </button>
  );
};

export default MagicButton;
