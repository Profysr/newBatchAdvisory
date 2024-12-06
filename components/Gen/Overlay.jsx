import { useAppContext } from "@/context/AppContext";
import React from "react";

const Overlay = () => {
  const { isSidebarOpen, toggleSidebar, togglePopup } = useAppContext();
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-10"
      onClick={isSidebarOpen ? toggleSidebar : togglePopup}
    />
  );
};

export default Overlay;
