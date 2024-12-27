"use client";
import { createContext, useContext, useState, useEffect } from "react";

// Create the context for dbData management
const DbContext = createContext();

export const DbProvider = ({ children }) => {
  const [dbData, setDbData] = useState(null);
  useEffect(() => {
    const storedData = sessionStorage.getItem("dbData");

    if (storedData) {
      setDbData(JSON.parse(storedData));
    } else {
      getData();
    }
  }, []);

  // Function to fetch data from db.json
  const getData = async () => {
    try {
      const response = await fetch("/api/db");
      if (response.ok) {
        const data = await response.json();
        setDbData(data);
        sessionStorage.setItem("dbData", JSON.stringify(data)); // Persist data in sessionStorage
      } else {
        console.error(
          "Failed to fetch data from db.json:",
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Function to post new data to db.json
  const postData = async (newData) => {
    try {
      const response = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setDbData(updatedData); // Update the state with the updated data
        sessionStorage.setItem("dbData", JSON.stringify(updatedData)); // Persist updated data in sessionStorage
      } else {
        console.error("Failed to post data to db.json:", response.statusText);
      }
    } catch (error) {
      console.error("Error posting data:", error);
    }
  };

  // Automatically post data to the server whenever dbData changes
  useEffect(() => {
    if (dbData) {
      const previousData = sessionStorage.getItem("dbData");

      if (JSON.stringify(dbData) !== previousData) {
        postData(dbData);
        console.log(
          "Data successfully posted to db.json and stored in sessionStorage."
        );
      }
    }
  }, [dbData]);

  return (
    <DbContext.Provider value={{ dbData, setDbData, getData, postData }}>
      {children}
    </DbContext.Provider>
  );
};

// Custom hook to use the context
export const useDbContext = () => {
  const context = useContext(DbContext);
  if (!context) {
    throw new Error("useDbContext must be used within a DbProvider");
  }
  return context;
};
