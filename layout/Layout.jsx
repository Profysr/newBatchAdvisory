import Header from "@/components/Gen/Header";
import React from "react";

const PreLayout = ({ children, otherClasses }) => {
  return (
    <div className="relative" aria-label="Dashboard Layout">
      <div className="w-screen min-h-screen flex flex-col gap-6">
        <Header />

        <div className="relative">
          <div
            className="w-screen min-h-screen max-w-screen-xl mx-auto px-4"
            style={{ paddingBlockStart: "1rem", paddingBlockEnd: "2rem" }}
          >
            <div
              className={`flex flex-col  justify-center items-center ${
                otherClasses ? otherClasses : ""
              }`}
              style={{ gap: "2rem" }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreLayout;
