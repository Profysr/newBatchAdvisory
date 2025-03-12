"use client";
import React, { useEffect, useState, useMemo } from "react";
import PreLayout from "@/layout/Layout";
import TableGrid from "@/components/Gen/Table"; // Import your TableComponent
import WelcomeComponent from "../Gen/Welcome";
import { useDbContext } from "@/context/dbContext";
import MagicButton from "../Gen/Button";
import { useAppContext } from "@/context/AppContext";

const StudentPage = ({ session }) => {
  const { dbData, setDbData } = useDbContext();
  const { selectedRows, setSelectedRows } = useAppContext();
  const [data, setData] = useState(null);

  // Use useMemo to memoize the data transformation logic
  const memoizedData = useMemo(() => {
    if (!dbData || !session) return null;

    const classData = dbData.classes?.find((cls) => cls.id === session.classId);
    if (!classData) return null;

    // Map course codes to detailed course objects
    const detailedCourses = classData.assignedCourses
      .map((courseCode) =>
        dbData.courses.find((course) => course.id === courseCode)
      )
      .filter(Boolean); // Remove undefined if a course is not found

    const schemeOfStudy = dbData.schemeOfStudy?.find(
      (sos) => sos.id === classData.sosId
    );

    return {
      regNo: session.regNo,
      name: session.name,
      email: session.email,
      classData,
      schemeOfStudy,
      assignedCourses: detailedCourses,
    };
  }, [dbData, session]);

  useEffect(() => {
    if (memoizedData) {
      setData(memoizedData);
    }
  }, [memoizedData]);

  // const handleEnrollment = () => {
  //   if (selectedRows.length === 0) {
  //     console.log("No courses selected for enrollment.");
  //     return;
  //   }

  //   // Step 1: Calculate total credit hours for courses with valid prerequisites
  //   const totalSelectedCreditHours = selectedRows.reduce((total, courseId) => {
  //     const course = dbData?.courses?.find((course) => course.id === courseId);
  //     if (course) {
  //       // Extract credit hours as a number from the string (e.g., "3(2,1)" -> 3)
  //       const creditHours = course?.creditHours
  //         ? parseInt(course.creditHours.split("(")[0]) // Assuming format "3(2,1)"
  //         : 0;
  //       return total + creditHours; // Add credit hours to the total
  //     }
  //     return total; // If course is not found, return total as is
  //   }, 0);

  //   // Step 2: Validate credit hours
  //   const { minCreditHours, maxCreditHours } = data?.schemeOfStudy;

  //   if (minCreditHours === undefined || maxCreditHours === undefined) {
  //     console.error("Min or Max Credit Hours are undefined in schemeOfStudy");
  //     return;
  //   }

  //   if (
  //     totalSelectedCreditHours < minCreditHours ||
  //     totalSelectedCreditHours > maxCreditHours
  //   ) {
  //     console.log(
  //       `Total credit hours exceed the allowed range: ${minCreditHours} - ${maxCreditHours}`
  //     );
  //     return;
  //   }

  //   // Step 3: Get the student ID from the session
  //   const studentRegNo = session?.regNo;
  //   const student = dbData?.students?.find(
  //     (student) => student.regNo === studentRegNo
  //   );

  //   if (!student) {
  //     console.error("Student not found.");
  //     return;
  //   }

  //   // Step 4: Add selected courses to enrolledCourses
  //   const updatedStudent = { ...student }; // Create a copy of the student
  //   updatedStudent.enrolledCourses = updatedStudent.enrolledCourses || [];
  //   updatedStudent.enrolledCourses.push(...selectedRows);

  //   // Step 5: Update the student data in the dbData object
  //   const updatedStudents = dbData?.students?.map((s) =>
  //     s.regNo === studentRegNo ? updatedStudent : s
  //   );

  //   setDbData((prevData) => ({
  //     ...prevData,
  //     students: updatedStudents,
  //   }));

  //   console.log(
  //     "Enrollment completed successfully. Selected courses added to student's enrolled courses."
  //   );
  //   setSelectedRows([]); // Clear selected courses
  // };

  const handleEnrollment = () => {
    if (selectedRows.length === 0) {
      console.log("No courses selected for enrollment.");
      return;
    }

    // Step 1: Calculate total credit hours for selected courses
    const totalSelectedCreditHours = selectedRows.reduce((total, courseId) => {
      const course = dbData?.courses?.find((course) => course.id === courseId);
      if (course) {
        const creditHours = course?.creditHours
          ? parseInt(course.creditHours.split("(")[0]) // Assuming format "3(2,1)"
          : 0;
        return total + creditHours; // Add credit hours to the total
      }
      return total; // If course is not found, return total as is
    }, 0);

    // Step 2: Validate credit hours
    const { minCreditHours, maxCreditHours } = data?.schemeOfStudy;

    if (minCreditHours === undefined || maxCreditHours === undefined) {
      console.error("Min or Max Credit Hours are undefined in schemeOfStudy");
      return;
    }

    if (
      totalSelectedCreditHours < minCreditHours ||
      totalSelectedCreditHours > maxCreditHours
    ) {
      alert(
        `Total credit hours exceed the allowed range: ${minCreditHours} - ${maxCreditHours}`
      );
      return;
    }

    // Step 3: Get the student ID from the session
    const studentRegNo = session?.regNo;
    const student = dbData?.students?.find(
      (student) => student.regNo === studentRegNo
    );

    if (!student) {
      console.error("Student not found.");
      return;
    }

    const failedCourses = student?.failedCourses || []; // Courses the student has failed

    const coursesWithIssues = selectedRows.filter((courseId) => {
      const course = dbData?.courses?.find((course) => course.id === courseId);
      if (course) {
        // Convert preRequisites string to an array
        const preRequisitesArray =
          course.preRequisites === "-" ? [] : course.preRequisites.split(",");

        // Check if any prerequisite is in the failedCourses array
        return preRequisitesArray.some((prereq) =>
          failedCourses.includes(prereq)
        );
      }
      return false; // No course found or prerequisites are met
    });

    if (coursesWithIssues.length > 0) {
      console.log(
        "The following courses cannot be enrolled because prerequisites are failed:",
        coursesWithIssues
      );
      alert(
        "You cannot enroll in the selected courses because some prerequisites are in your failed courses list."
      );
      return;
    }

    // Step 5: Add selected courses to enrolledCourses
    const updatedStudent = { ...student }; // Create a copy of the student
    updatedStudent.enrolledCourses = updatedStudent.enrolledCourses || [];
    updatedStudent.enrolledCourses.push(...selectedRows);

    // Step 6: Update the student data in the dbData object
    const updatedStudents = dbData?.students?.map((s) =>
      s.regNo === studentRegNo ? updatedStudent : s
    );

    setDbData((prevData) => ({
      ...prevData,
      students: updatedStudents,
    }));

    console.log(
      "Enrollment completed successfully. Selected courses added to student's enrolled courses."
    );
    setSelectedRows([]); // Clear selected courses
  };

  const getEnrolledCourses = (courseCodes) => {
    if (!Array.isArray(courseCodes)) return [];
    return courseCodes
      .map((courseCode) =>
        dbData?.courses?.find((course) => course.courseCode === courseCode)
      )
      .filter(Boolean);
  };

  // console.log(data);

  return (
    <PreLayout>
      <WelcomeComponent username={session?.name} />

      {data ? (
        <div className="space-y-4">
          <TableGrid
            title="Enrolled Courses"
            data={getEnrolledCourses(
              dbData?.students?.find(
                (student) => student.regNo === session?.regNo
              )?.enrolledCourses
            )}
            excludeColumns={["preRequisites"]}
          />
          <TableGrid
            title="Assigned Courses"
            data={data.assignedCourses}
            excludeColumns={["preRequisites"]}
            checkBoxOption={true}
            actionBtns={
              <MagicButton
                title="Confirm Enrollment"
                handleClick={handleEnrollment}
                disabledCondition={selectedRows.length === 0}
              />
            }
          />
        </div>
      ) : (
        <p>No courses have been assigned to you yet.</p>
      )}
    </PreLayout>
  );
};

export default StudentPage;
