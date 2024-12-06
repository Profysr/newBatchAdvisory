"use client";

import { useAppContext } from "@/context/AppContext";
import PreLayout from "@/layout/Layout";
import MagicButton from "../Gen/Button";
import PopComponent from "../Gen/Popup";
import Overlay from "../Gen/Overlay";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { useDbContext } from "@/context/dbContext";
import { Dropdown } from "../Gen/InputField";
import TableComponent from "../Gen/Table";
import { useState, useEffect } from "react";

export const ManageClasses = () => {
  const { showPopup, togglePopup } = useAppContext();
  const { dbData, setDbData, postData } = useDbContext();

  const handleFileUpload = async (data) => {
    try {
      // Step 1: Parse the incoming data
      const parsedData = JSON.parse(data);
      const { classname, students } = parsedData;

      // Step 2: Update the state
      setDbData((prev) => {
        let updatedClasses = [...(prev.classes || [])];

        const classExists = prev.classes.some((cls) =>
          cls.classname.toLowerCase().includes(classname.toLowerCase())
        );

        // If the class doesn't exist, add it
        if (!classExists) {
          updatedClasses.push({
            id: `Class${uuidv4()}`, // Generate a unique ID for the class
            classname,
            students: students.map((std) => std.regNo), // Map students to their regNo
          });
        } else {
          console.error(`Class ${classname} already exists.`);
        }

        // Step 3: Update students
        let updatedStudents = [...(prev.students || [])];

        students.forEach((student) => {
          const stdExist = updatedStudents.some(
            (std) => std.regNo === student.regNo
          );
          if (!stdExist) {
            updatedStudents.push({
              ...student,
              id: `Student${uuidv4()}`, // Generate a unique ID for the student
            });
          }
        });

        // Step 4: Return the updated dbData state
        return {
          ...prev,
          classes: updatedClasses,
          students: updatedStudents,
        };
      });
    } catch (error) {
      console.error("Manage Class Error", error);
    }
  };

  const getAdvisorById = (advisorId) => {
    const advisor = dbData?.advisors?.find((adv) => adv.id === advisorId);
    return advisor ? advisor.name : null;
  };

  return (
    <PreLayout>
      <div className="w-full flex justify-between items-center">
        <h2 className="text-2xl font-semibold mb-4">Manage Classes</h2>
        <MagicButton title="Add Class" handleClick={togglePopup} />
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dbData?.classes?.map((curr, index) => (
          <div
            key={index}
            className={`p-6 rounded-md transition bg-blue-200 backdrop:blur-md`}
          >
            <h3 className="text-xl font-bold text-gray-800 capitalize">
              {curr?.classname}
            </h3>
            <p className="text-sm text-gray-700 capitalize">
              Students: {curr?.students?.length}
            </p>
            <p className="text-sm text-gray-700 capitalize">
              Advisor: {getAdvisorById(curr?.advisorId) || "-"}
            </p>
            <Link href={`/manage-classes/${curr?.id}`}>
              <button className="mt-4 px-4 py-2 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-900 transition">
                View Details
              </button>
            </Link>
          </div>
        ))}
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

export const ManageIndividualClass = ({ slug }) => {
  const { showPopup, togglePopup } = useAppContext();
  const { dbData, setDbData } = useDbContext();

  const [activeDropdown, setActiveDropdown] = useState(null); // "advisor" or "sos"
  const [uploaded, setUploaded] = useState(true);

  // const [isFlagActive, setIsFlagActive] = useState(false);

  // Check if the flag is stored in localStorage when the page loads
  // useEffect(() => {
  //   const storedFlag = localStorage.getItem("isResultUploaded");
  //   if (storedFlag === "true") {
  //     setUploaded(true);
  //   }
  // }, []);

  // Early returns for loading and no data scenarios
  if (!dbData) return <div>Loading Manage Individual Class...</div>;

  const classData = dbData.classes?.find((cls) =>
    cls.id.toLowerCase().includes(slug.toLowerCase())
  );
  if (!classData) return <div>Class not found.</div>;

  // Get unassigned advisors
  const unassignedAdvisors = dbData?.advisors?.filter(
    (advisor) => !advisor.assignedClass
  );
  const studentsForTable = classData?.students?.map((studentId) =>
    dbData?.students?.find((student) => student?.regNo === studentId)
  );

  const handleSelectAdvisor = (advisorId) => {
    const selectedAdvisor = unassignedAdvisors?.find(
      (advisor) => advisor.id === advisorId
    );

    if (!selectedAdvisor) return;

    const updatedClassData = {
      ...classData,
      advisorId,
    };

    setDbData((prev) => ({
      ...prev,
      classes: prev.classes.map((cls) =>
        cls.id === classData.id ? updatedClassData : cls
      ),
      advisors: prev.advisors.map((advisor) =>
        advisor.id === advisorId
          ? { ...advisor, assignedClass: classData.id }
          : advisor
      ),
    }));

    setActiveDropdown(null);
  };

  // Handle selecting SOS
  const handleAssignSOS = (sosId) => {
    const selectedSos = dbData?.schemeOfStudy?.find((sos) => sos.id === sosId);

    if (!selectedSos) return;

    const updatedClassData = { ...classData, sosId: selectedSos.id };

    // Update the dbData to assign SOS
    setDbData((prev) => ({
      ...prev,
      classes: prev.classes.map((cls) =>
        cls.id === classData.id ? updatedClassData : cls
      ),
    }));

    setActiveDropdown(null); // Close the dropdown after assignment
  };

  // Handle file upload and update results
  const handleFileUpload = (data) => {
    const parsedData = JSON.parse(data);
    setDbData((prev) => {
      const updatedResults = [...prev.results];
      const updatedStudents = [...prev.students]; // Make a copy of the students data

      parsedData.forEach((resultEntry) => {
        const { regNo, resultCard } = resultEntry;
        const resultId = uuidv4(); // Generate a unique result ID

        const studentResultIndex = updatedResults?.findIndex(
          (r) => r.regNo === regNo
        );
        if (studentResultIndex === -1) {
          updatedResults.push({ regNo, resultId, resultCard });
        } else {
          const existingResult = updatedResults[studentResultIndex];
          const updatedResultCard = [...existingResult.resultCard];

          resultCard.forEach((newSemesterResult) => {
            const existingSemesterIndex = updatedResultCard.findIndex(
              (sem) => sem.semester === newSemesterResult.semester
            );
            if (existingSemesterIndex === -1) {
              updatedResultCard.push(newSemesterResult);
            } else {
              updatedResultCard[existingSemesterIndex] = {
                ...updatedResultCard[existingSemesterIndex],
                gpa: newSemesterResult.gpa,
                cgpa: newSemesterResult.cgpa,
              };
            }
          });

          updatedResults[studentResultIndex] = {
            ...existingResult,
            resultCard: updatedResultCard,
          };
        }

        // Add resultId to the respective student object in the students array
        const studentIndex = updatedStudents.findIndex(
          (student) => student.regNo === regNo
        );
        if (studentIndex !== -1) {
          updatedStudents[studentIndex] = {
            ...updatedStudents[studentIndex],
            resultId,
          };
        }
      });

      return { ...prev, results: updatedResults, students: updatedStudents };
    });

    setUploaded(false);
    // sessionStorage.setItem("isResultUploaded", newFlagState.toString());
  };
  return (
    <PreLayout>
      <div className="w-full flex justify-between items-center">
        <h2 className="text-2xl font-semibold mb-4">{classData.classname}</h2>
        <div className="relative">
          {!classData?.advisorId && (
            <>
              <MagicButton
                title="Assign Advisor"
                handleClick={() => setActiveDropdown(toggleDropdown("advisor"))}
              />
              {activeDropdown === "advisor" && (
                <Dropdown
                  items={unassignedAdvisors}
                  onSelect={handleSelectAdvisor}
                  noItemsText="No available advisors"
                  manageLink="/manage-advisor"
                  key={activeDropdown}
                />
              )}
            </>
          )}
          {classData?.advisorId && !classData?.sosId && (
            <>
              <MagicButton
                title="Assign SOS"
                handleClick={() => setActiveDropdown(toggleDropdown("sos"))}
              />
              {activeDropdown === "sos" && (
                <Dropdown
                  items={dbData.schemeOfStudy}
                  onSelect={handleAssignSOS}
                  noItemsText="No available SOS"
                  manageLink="/manage-sos"
                  key={activeDropdown}
                />
              )}
            </>
          )}
          {classData?.advisorId && classData?.sosId && uploaded && (
            <MagicButton
              title="Upload Class Result"
              handleClick={togglePopup}
            />
          )}
        </div>
      </div>

      {classData?.students?.length > 0 ? (
        <TableComponent
          data={studentsForTable}
          title={`Students of ${classData.classname}`}
          key={`students-${classData.classname}`}
          excludeColumns={["resultId"]}
        />
      ) : (
        <p className="text-gray-500">No students found for this class.</p>
      )}
      {showPopup && (
        <>
          <PopComponent handleFileUpload={handleFileUpload} />
          <Overlay />
        </>
      )}
    </PreLayout>
  );

  function toggleDropdown(name) {
    return (prev) => (prev === name ? null : name);
  }
};
