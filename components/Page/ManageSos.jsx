"use client";

import Link from "next/link";
import MagicButton from "../Gen/Button";
import PopComponent from "../Gen/Popup";
import Overlay from "../Gen/Overlay";
import { useDbContext } from "@/context/dbContext";
import { v4 as uuidv4 } from "uuid";
import { useAppContext } from "@/context/AppContext";
import PreLayout from "@/layout/Layout";
import TableComponent from "../Gen/Table";

export const ManageSos = () => {
  const { showPopup, togglePopup } = useAppContext();
  const { dbData, setDbData } = useDbContext();

  const handleFileUpload = (data) => {
    const parsedData = JSON.parse(data);
    const { name, courses } = parsedData;
    setDbData((prev) => {
      const sosExists = prev.schemeOfStudy.some((sos) =>
        sos.name.toLowerCase().includes(name.toLowerCase())
      );

      let updatedSchemeOfStudy = [...prev.schemeOfStudy];
      if (!sosExists) {
        updatedSchemeOfStudy.push({
          id: `sos${uuidv4()}`,
          name,
          courses: courses.map((c) => c.id),
        });
      } else {
        updatedSchemeOfStudy = updatedSchemeOfStudy.map((sos) => {
          if (sos.name.toLowerCase().includes(name.toLowerCase())) {
            const updatedCourses = Array.from(
              new Set([...sos.courses, ...courses.map((c) => c.id)])
            );
            return { ...sos, courses: updatedCourses };
          }
          return sos;
        });
      }
      // Update courses
      const updatedCourses = [...prev.courses];
      courses.forEach((course) => {
        const courseExists = updatedCourses.some((c) => c.id === course.id);
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
        {dbData?.schemeOfStudy.map((sos) => {
          const totalCourses = sos?.courses?.length || 0; // Safely get the total number of courses
          return (
            <div
              key={sos?.id}
              className="border rounded-lg p-4 shadow-sm bg-blue-200 backdrop:blur-md"
            >
              <h2 className="font-bold text-lg capitalize">{sos?.name}</h2>
              <p className="text-sm text-gray-700 capitalize">
                Total Courses: {totalCourses}
              </p>

              <Link href={`/manage-sos/${sos?.id}`}>
                <button className="mt-4 px-4 py-2 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-900 transition">
                  View SOS
                </button>
              </Link>
            </div>
          );
        })}
      </div>

      {showPopup && (
        <>
          <PopComponent handleFileUpload={handleFileUpload} />
          <Overlay />
        </>
      )}
    </PreLayout>
  );
};

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
  const courses = sos?.courses?.map((courseId) =>
    dbData?.courses?.find((course) => course?.id === courseId)
  );

  const handleConfirmCourses = () => {
    setDbData((prev) => {
      if (selectedRows?.length === 0) {
        console.log("No courses selected for confirmation.");
        return prev;
      }

      const updatedCourses = prev.courses.map((course) => {
        if (selectedRows?.includes(course.id)) {
          return { ...course, isOffered: false };
        }
        return { ...course, isOffered: true };
      });

      // Check if any courses has been updated
      const anyUpdates = updatedCourses?.some((course) => {
        selectedRows?.includes(course?.id) && course?.offer === true;
      });

      if (anyUpdates) {
        console.log("Courses have been confirmed successfully.");
      } else {
        console.log("No changes made, please try again.");
      }

      return {
        ...prev,
        courses: updatedCourses,
      };
    });
    setSelectedRows([]);
  };

  const actionBtns = (
    <div className="flex gap-3">
      <MagicButton
        title={"Not Offered"}
        handleClick={handleConfirmCourses}
        disabledCondition={selectedRows.length === 0}
      />
    </div>
  );

  return (
    <PreLayout>
      <h1 className="text-2xl font-bold capitalize">
        Scheme of Study for {sos.name}
      </h1>
      <TableComponent
        data={courses}
        key={`courses-${sos.id}`}
        checkBoxOption={true}
        actionBtns={actionBtns}
        excludeColumns={["isOffered"]}
      />
    </PreLayout>
  );
};
