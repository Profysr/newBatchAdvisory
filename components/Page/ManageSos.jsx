"use client";

// components
import MagicButton from "../Gen/Button";
import PopComponent from "../Gen/Popup";
import Overlay from "../Gen/Overlay";
import PreLayout from "@/layout/Layout";
import TableComponent from "../Gen/Table";

// states and context
import { useDbContext } from "@/context/dbContext";
import { useAppContext } from "@/context/AppContext";
import { useState } from "react";

// libraries
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { InputField } from "../Gen/InputField";

// functions

// Reuseable Components

// ----------------------------------------
//          Code Starts Here
// ----------------------------------------

export const ManageSos = () => {
  const initialValue = {
    name: "",
    totalCreditHours: 133,
    minCreditHours: 12,
    maxCreditHours: 21,
  };
  const { showPopup, togglePopup } = useAppContext();
  const { dbData, setDbData } = useDbContext();
  const [sosRegulations, setSosRegulations] = useState(initialValue);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSosRegulations((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDelete = (id) => {
    setDbData((prev) => ({
      ...prev,
      schemeOfStudy: prev?.schemeOfStudy?.filter((sos) => sos?.id !== id),
    }));
  };

  const handleFileUpload = (data) => {
    const courses = data;

    setDbData((prev) => {
      const sosExists = prev?.schemeOfStudy?.some((sos) =>
        sos?.name?.toLowerCase().includes(sosRegulations?.name?.toLowerCase())
      );

      let updatedSchemeOfStudy = [...prev?.schemeOfStudy];
      if (!sosExists) {
        updatedSchemeOfStudy?.push({
          id: `sos${uuidv4()}`,
          ...sosRegulations,
          courses: courses?.map((c) => c?.id),
        });
      } else {
        updatedSchemeOfStudy = updatedSchemeOfStudy.map((sos) => {
          if (
            sos?.name
              ?.toLowerCase()
              .includes(sosRegulations?.name?.toLowerCase())
          ) {
            const updatedCourses = Array.from(
              new Set([...sos?.courses, ...courses?.map((c) => c.id)])
            );
            return { ...sos, courses: updatedCourses };
          }
          return sos;
        });
      }

      // Update courses
      const updatedCourses = [...prev.courses];
      courses?.forEach((course) => {
        const courseExists = updatedCourses?.some((c) => c?.id === course?.id);
        if (!courseExists) {
          updatedCourses.push(course);
        }
      });
      // Return updated dbData
      return {
        ...prev,
        schemeOfStudy: updatedSchemeOfStudy,
        courses: updatedCourses,
      };
    });
  };

  return (
    <PreLayout>
      <div className="w-full flex justify-between items-center">
        <h1 className="text-2xl font-bold">Schemes of Study</h1>
        <MagicButton title="Upload New SOS" handleClick={togglePopup} />
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dbData?.schemeOfStudy?.map((sos) => {
          return (
            <div
              key={sos?.id}
              className="border rounded-lg p-4 shadow-sm bg-blue-200 backdrop:blur-md space-y-2"
            >
              <h2 className="font-bold text-lg capitalize">{sos?.name}</h2>
              <p className="text-sm text-gray-700 capitalize">
                Total Credit Hours: {sos?.totalCreditHours}
              </p>
              <p className="text-sm text-gray-700 capitalize">
                Min. Credit Hours: {sos?.minCreditHours}
              </p>
              <p className="text-sm text-gray-700 capitalize">
                Max. Credit Hours: {sos?.maxCreditHours}
              </p>

              <div className="flex gap-2">
                <Link href={`/manage-sos/${sos?.id}`}>
                  <button className="mt-4 px-4 py-2 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-900 transition">
                    View SOS
                  </button>
                </Link>
                <button
                  onClick={() => handleDelete(sos?.id)}
                  className="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showPopup && (
        <>
          <PopComponent
            handleFileUpload={handleFileUpload}
            inputField={
              <div className="space-y-4">
                <InputField
                  id="name"
                  name="name"
                  title="Scheme of Study for"
                  type="text"
                  placeholder="Computer Science"
                  value={sosRegulations?.name}
                  onChange={handleInputChange}
                  className="uppercase"
                />
                <div className="flex gap-2">
                  <InputField
                    id="totalCreditHours"
                    name="totalCreditHours"
                    title="Total Credit Hours"
                    type="number"
                    placeholder="133"
                    value={sosRegulations?.totalCreditHours}
                    onChange={handleInputChange}
                  />
                  <InputField
                    id="minCreditHours"
                    name="minCreditHours"
                    title="Min. Credit Hours"
                    type="number"
                    placeholder="12"
                    value={sosRegulations?.minCreditHours}
                    onChange={handleInputChange}
                  />
                  <InputField
                    id="maxCreditHours"
                    name="maxCreditHours"
                    title="Max. Credit Hours"
                    type="number"
                    placeholder="21"
                    value={sosRegulations?.maxCreditHours}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            }
          />
          <Overlay />
        </>
      )}
    </PreLayout>
  );
};

// -----------------------------------------------------------
//          Individual SOS Code Starts Here
// -----------------------------------------------------------

export const ManageIndividualSos = ({ slug }) => {
  const { selectedRows, setSelectedRows } = useAppContext();

  const { dbData, setDbData } = useDbContext();
  if (!dbData) return <div>Loading Manage Individual SOS Page...</div>;

  const sos = dbData?.schemeOfStudy?.find((s) => s.id === slug);

  if (!sos) {
    return (
      <p className="text-gray-500 font-medium text-base grid place-items-center">
        Scheme of Study not found.
      </p>
    );
  }

  // Map the courses associated with the SOS
  const courses = sos?.courses
    ?.map((courseId) =>
      dbData?.courses?.find((course) => course?.id === courseId)
    )
    .filter((course) => course); // Filter out any undefined course

  const handleConfirmCourses = () => {
    setDbData((prev) => {
      if (selectedRows?.length === 0) {
        console.log("No courses selected for deletion.");
        return prev;
      }

      // Create a new array where selected courses are removed from the schemeOfStudy
      const updatedSchemeOfStudy = prev?.schemeOfStudy?.map((sosItem) => {
        if (sosItem?.id === sos?.id) {
          return {
            ...sosItem,
            courses: sosItem?.courses?.filter(
              (courseId) => !selectedRows.includes(courseId) // Remove selected courses
            ),
          };
        }
        return sosItem; // Keep other SOS items unchanged
      });

      return {
        ...prev,
        schemeOfStudy: updatedSchemeOfStudy, // Set the updated scheme of study
      };
    });
    setSelectedRows([]); // Clear the selected rows
  };

  const actionBtns = (
    <div className="flex gap-3">
      <MagicButton
        title={"Delete Courses"}
        handleClick={handleConfirmCourses}
        disabledCondition={selectedRows.length === 0} // Disable if no courses are selected
        classname={"!bg-red-600 !hover:bg-red-700"}
      />
    </div>
  );

  return (
    <PreLayout>
      <h1 className="text-2xl font-bold capitalize">
        Scheme of Study for {sos?.name}
      </h1>
      <TableComponent
        data={courses}
        key={`courses-${sos?.id}`}
        checkBoxOption={true}
        actionBtns={actionBtns}
      />
    </PreLayout>
  );
};
