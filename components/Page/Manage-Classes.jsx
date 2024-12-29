"use client";

// Components
import PreLayout from "@/layout/Layout";
import MagicButton from "../Gen/Button";
import PopComponent from "../Gen/Popup";
import Overlay from "../Gen/Overlay";
import { Dropdown, InputField } from "../Gen/InputField";
import TableComponent from "../Gen/Table";

// States / Contexts
import { useAppContext } from "@/context/AppContext";
import { useDbContext } from "@/context/dbContext";
import { useState, useRef } from "react";

// libraries
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";

// functions

// Resuable components

// ----------------------------------------
//          Code Starts Here
// ----------------------------------------

export const ManageClasses = () => {
  const classnameRef = useRef(null);
  const { showPopup, togglePopup } = useAppContext();
  const { dbData, setDbData } = useDbContext();

  // const handleFileUpload = async (data) => {
  //   try {
  //     // Step 1: Parse the incoming data
  //     const classname = classnameRef.current.value;
  //     const students = await data.map((std) => std);

  //     // Step 2: Update the state
  //     setDbData((prev) => {
  //       let updatedClasses = [...(prev.classes || [])];

  //       const classExists = prev.classes.some((cls) =>
  //         cls.name.toLowerCase().includes(classname.toLowerCase())
  //       );

  //       // If the class doesn't exist, add it
  //       if (!classExists) {
  //         updatedClasses.push({
  //           id: `Class${uuidv4()}`, // Generate a unique ID for the class
  //           name: classname,
  //           students: students.map((std) => std.regNo), // Map students to their regNo
  //         });
  //       } else {
  //         console.error(`Class ${classname} already exists.`);
  //       }

  //       // Step 3: Update students
  //       let updatedStudents = [...(prev.students || [])];

  //       students.forEach((student) => {
  //         const stdExist = updatedStudents.some(
  //           (std) => std.regNo === student.regNo
  //         );
  //         if (!stdExist) {
  //           updatedStudents.push({
  //             ...student,
  //             id: `Student${uuidv4()}`, // Generate a unique ID for the student
  //           });
  //         }
  //       });

  //       // Step 4: Return the updated dbData state
  //       return {
  //         ...prev,
  //         classes: updatedClasses,
  //         students: updatedStudents,
  //       };
  //     });
  //   } catch (error) {
  //     console.error("Manage Class Error", error);
  //   }
  // };

  const handleFileUpload = async (data) => {
    try {
      // Step 1: Parse the incoming data
      const classname = classnameRef.current.value;
      const students = await data.map((std) => std);

      // Step 2: Update the state
      setDbData((prev) => {
        let updatedClasses = [...(prev.classes || [])];

        const classExists = prev.classes.some((cls) =>
          cls.name.toLowerCase().includes(classname.toLowerCase())
        );

        // If the class doesn't exist, add it
        if (!classExists) {
          const classId = `Class${uuidv4()}`; // Generate a unique ID for the class

          updatedClasses.push({
            id: classId, // Add classId to the class
            name: classname,
            students: students.map((std) => std.regNo), // Map students to their regNo
          });

          // Step 3: Update students with classId
          students = students.map((student) => ({
            ...student,
            classId, // Add classId property to each student
          }));
        } else {
          console.error(`Class ${classname} already exists.`);
        }

        // Step 4: Update students
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

        // Step 5: Return the updated dbData state
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

  const handleDeleteClass = (classId) => {
    setDbData((prev) => {
      const updatedClasses = prev.classes.filter((cls) => cls.id !== classId);

      // Get the list of student IDs in the deleted class
      const deletedClass = prev.classes.find((cls) => cls.id === classId);
      const studentsToDelete = deletedClass?.students || [];

      const updatedStudents = prev?.students?.filter(
        (student) => !studentsToDelete.includes(student.regNo)
      );

      return {
        ...prev,
        classes: updatedClasses,
        students: updatedStudents,
      };
    });
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
            <h3 className="text-xl font-bold text-gray-800 uppercase">
              {curr?.name}
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
            <button
              onClick={() => handleDeleteClass(curr?.id)}
              className="mt-2 mx-2 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition"
            >
              Delete Class
            </button>
          </div>
        ))}
      </div>

      {showPopup && (
        <>
          <PopComponent
            handleFileUpload={handleFileUpload}
            inputField={
              <InputField
                id="className"
                name="className"
                title="Classname"
                type="text"
                placeholder="SP21-BSE"
                ref={classnameRef}
                className="uppercase"
              />
            }
          />
          <Overlay />
        </>
      )}
    </PreLayout>
  );
};

// -----------------------------------------------------------
//          Individual Class Code Starts Here
// -----------------------------------------------------------

export const ManageIndividualClass = ({ slug }) => {
  const { showPopup, togglePopup } = useAppContext();
  const { dbData, setDbData } = useDbContext();

  const [activeDropdown, setActiveDropdown] = useState(null); // "advisor" or "sos"

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

  function toggleDropdown(name) {
    return (prev) => (prev === name ? null : name);
  }

  const handleFileUpload = (data) => {
    setDbData((prev) => {
      const prevResultObj = [...prev?.results]; // Copy existing results
      const prevStudentObj = [...prev?.students]; // Copy existing students

      // Step 1: Update results for students present in the new upload
      data.forEach((row) => {
        const { regNo, gpa, cgpa, ...courseGrades } = row; // Extract data
        const coursesArray = Object.entries(courseGrades).map(
          ([courseCode, marks]) => ({
            courseCode,
            marks: parseInt(marks, 10), // Convert marks to numbers
          })
        );

        const resultCardIndex = prevResultObj.findIndex(
          (r) => r.regNo === regNo
        );

        // updating result here. so yahan pr hi problem hu sakti hai
        if (resultCardIndex === -1) {
          const resultId = uuidv4();
          prevResultObj.push({
            regNo,
            resultId,
            resultCard: [
              {
                semester: 1,
                gpa: parseFloat(gpa),
                cgpa: parseFloat(cgpa),
                courses: coursesArray,
              },
            ],
          });

          const studentCardIndex = prevStudentObj.findIndex(
            (student) => student.regNo === regNo
          );

          if (studentCardIndex !== -1) {
            prevStudentObj[studentCardIndex].resultId = resultId; // Mutating the existing student
          }
        } else {
          const existingResult = prevResultObj[resultCardIndex];
          const updatedResultCard = [
            ...existingResult.resultCard,
            {
              semester: existingResult.resultCard.length + 1,
              gpa: parseFloat(gpa),
              cgpa: parseFloat(cgpa),
              courses: coursesArray,
            },
          ];

          const updatedResult = {
            ...existingResult,
            resultCard: updatedResultCard,
          };

          prevResultObj[resultCardIndex] = updatedResult;
        }
      });

      // Return updated data
      return { ...prev, results: prevResultObj, students: prevStudentObj };
    });
  };

  return (
    <PreLayout>
      <div className="w-full flex justify-between items-center">
        <h2 className="text-2xl font-semibold mb-4">
          {classData.name.toUpperCase()}
        </h2>
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
          {classData?.advisorId && classData?.sosId && (
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
          title={`Student Details`}
          key={`students-${classData.name}`}
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
};
