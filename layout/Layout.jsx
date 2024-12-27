import Header from "@/components/Gen/Header";
import React from "react";

const PreLayout = ({ children, otherClasses }) => {
  return (
    <div className="relative" aria-label="Layout Component">
      <div className="flex flex-col gap-6">
        <Header />

        <div className="relative">
          <div
            className="max-w-screen-xl mx-auto px-6"
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
