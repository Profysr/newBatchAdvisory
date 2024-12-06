"use client";
import { createContext, useCallback, useContext, useState } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [selectedRows, setSelectedRows] = useState([]);

  // Toggles
  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);
  const togglePopup = useCallback(() => setShowPopup((prev) => !prev), []);

  // set functions
  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);
  const handleDivClick = useCallback(() => {
    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.click();
  }, []);

  const handleCheckboxChange = useCallback((id) => {
    setSelectedRows((prev) => {
      if (prev.includes(id)) {
        return prev.filter((rowId) => rowId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        isSidebarOpen,
        showPopup,
        isLoading,
        setIsLoading,
        isDragging,
        setIsDragging,

        selectedRows,
        setSelectedRows,

        togglePopup,
        toggleSidebar,

        handleDragOver,
        handleDragLeave,
        handleDivClick,
        handleCheckboxChange,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
