"use client";

// Components
import PreLayout from "@/layout/Layout";
import TableComponent from "../Gen/Table";
import EmptyPage from "../Gen/EmptyPage";
import MagicButton from "../Gen/Button";
import Overlay from "../Gen/Overlay";
import { InputField } from "../Gen/InputField";

// states and contexts
import { useAppContext } from "@/context/AppContext";
import { useDbContext } from "@/context/dbContext";
import { useState } from "react";

// Libraries
import { v4 as uuidv4 } from "uuid";

// functions
import { generatePassword } from "@/functions/utiliy";

// Resuable components
const AdvisorPopUp = () => {
  const { dbData, setDbData } = useDbContext();
  const { togglePopup } = useAppContext();
  const [advisorCount, setAdvisorCount] = useState(
    dbData?.advisors?.length || 0
  );
  const initialState = {
    name: "",
    email: "",
    password: generatePassword("adv", advisorCount),
    assignedClass: "",
  };
  const [formData, setFormData] = useState(initialState);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const newAdvisor = {
      id: `Advisor${uuidv4()}`,
      ...formData,
    };

    setDbData((prev) => {
      const advisorExists = prev?.advisors?.some(
        (existingAdvisor) => existingAdvisor?.email === newAdvisor?.email
      );

      if (advisorExists) {
        console.log("This advisor already exists.");
        return prev;
      }
      const updatedAdvisors = [...(prev.advisors || []), newAdvisor];

      const updatedClasses = prev?.classes?.map((cls) =>
        cls.id === formData.assignedClass
          ? { ...cls, advisorId: newAdvisor.id }
          : cls
      );

      return {
        ...prev,
        advisors: updatedAdvisors,
        classes: updatedClasses,
      };
    });

    setAdvisorCount(advisorCount + 1); // Increment advisor count
    setFormData(initialState);
    togglePopup();
  };

  return (
    <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-96 min-h-48 grid place-items-center">
      <form onSubmit={handleFormSubmit} className="w-full space-y-4">
        <div className="w-full">
          <InputField
            id="name"
            name="name"
            type="text"
            title="Advisor Name"
            placeholder="Dr Yawar Abbas"
            value={formData.name}
            onChange={handleInputChange}
          />
        </div>
        <div className="w-full">
          <InputField
            id="email"
            name="email"
            type="email"
            title="Advisor Email"
            placeholder="adv1@gmail.com"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>
        <div className="w-full">
          <InputField
            id="password"
            name="password"
            type="text"
            title="Password"
            placeholder="adv1"
            value={formData.password}
            onChange={handleInputChange}
          />
        </div>

        <div className="flex flex-col w-full">
          <label htmlFor="assignedClass" className="text-sm">
            Assign Class
          </label>
          <select
            id="assignedClass"
            name="assignedClass"
            value={formData.assignedClass}
            onChange={handleInputChange}
            className="w-full px-2 py-3 rounded-md border-2 border-gray-300 focus:border-gray-600 placeholder:opacity-75 placeholder:text-xs text-sm focus:outline-none"
          >
            <option value="" disabled>
              Select Class
            </option>
            {dbData?.classes
              ?.filter((cls) => !cls.advisorId)
              ?.map((cls) => (
                <option key={cls?.id} value={cls?.id}>
                  {cls?.name.toUpperCase()}
                </option>
              ))}
          </select>
        </div>

        <MagicButton title="Add Advisor" type="submit" classname="ml-auto" />
      </form>
    </div>
  );
};

// ----------------------------------------
//          Code Starts Here
// ----------------------------------------

const ManageAdvisors = () => {
  const { showPopup, togglePopup } = useAppContext();
  const { dbData } = useDbContext();

  const getClassnameById = (classId) => {
    const classData = dbData?.classes?.find((cls) => cls?.id === classId);

    return classData ? classData.name.toUpperCase() : null;
  };

  const advisorsWithClassname = dbData?.advisors?.map((advisor) => ({
    ...advisor,
    assignedClass: getClassnameById(advisor.assignedClass),
  }));

  return (
    <PreLayout>
      {advisorsWithClassname?.length > 0 ? (
        <>
          <div className="w-full flex justify-between items-center">
            <h2 className="text-2xl font-semibold mb-4">Manage Advisors</h2>
            <MagicButton title="Add Advisor" handleClick={togglePopup} />
          </div>

          <TableComponent
            data={advisorsWithClassname}
            title="Batch Advisors"
            key="Batch Advisors"
          />
        </>
      ) : (
        <div className="w-full flex flex-col gap-4 justify-center items-center">
          <EmptyPage />
          <MagicButton title="Add Batch Advisor" handleClick={togglePopup} />
        </div>
      )}
      {showPopup && (
        <>
          <Overlay />
          <AdvisorPopUp />
        </>
      )}
    </PreLayout>
  );
};

export default ManageAdvisors;
