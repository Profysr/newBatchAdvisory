"use client";
import React, { useState, useEffect, useCallback } from "react";
// components
import MagicButton from "../Gen/Button";
import { Dropdown } from "../Gen/InputField";
import TableComponent from "../Gen/Table";
import PreLayout from "@/layout/Layout";

// states
import { useDbContext } from "@/context/dbContext";
import { useAppContext } from "@/context/AppContext";

// libraries

const AssignCoursesPage = ({ classId }) => {
  const { dbData, setDbData } = useDbContext();
  const { selectedRows, setSelectedRows } = useAppContext();
  const [data, setData] = useState(null);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [openDropDown, setOpenDropDown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const assignedClass = dbData?.classes?.find((cls) => cls.id === classId);

  const processCourseData = useCallback(
    (assignedClass, isFirstSemester, students) => {
      const schemeOfStudy = dbData?.schemeOfStudy.find(
        (sos) => sos.id === assignedClass.sosId
      );
      if (!schemeOfStudy) return [];

      const failedCourses = students.flatMap(
        (student) => student.failedCourses
      );

      return schemeOfStudy?.courses
        ?.map((courseId) => {
          const course = dbData?.courses?.find((crc) => crc.id === courseId);
          if (!course) return null;

          // Check if the course is assigned to any student
          const isAssigned =
            !isFirstSemester &&
            students.some((student) =>
              dbData.results
                ?.find((res) => res.regNo === student.regNo)
                ?.resultCard.some((semester) =>
                  semester.courses.some(
                    (semCourse) => semCourse.courseCode === course.id
                  )
                )
            );

          // Check if the course is in the list of failed courses
          const isFailedByAnyStudent = failedCourses.includes(course.id);

          // Filter the courses during processing based on assignment or failure
          if (!isAssigned || isFailedByAnyStudent) {
            return { ...course, isAssigned, isFailedByAnyStudent };
          }

          return null;
        })
        .filter((course) => course !== null); // Filter out null courses
    },
    [dbData]
  );

  const fetchData = useCallback(() => {
    if (!dbData) return;

    if (!assignedClass) return;

    const isFirstSemester = assignedClass?.students?.some((regNo) => {
      const student = dbData?.students?.find((s) => s.regNo === regNo);
      const result = dbData?.results?.find(
        (res) => res.regNo === student?.regNo
      );
      return !result?.resultCard || result?.resultCard?.length === 0;
    });

    const students = assignedClass?.students?.map((regNo) => {
      const student = dbData?.students?.find((s) => s.regNo === regNo);
      if (!student) return null;

      const result = dbData?.results?.find(
        (res) => res.regNo === student.regNo
      );
      if (!result)
        return { ...student, failedCourses: [], totalPassedCreditHours: 0 };

      const { failedCourses, totalPassedCreditHours } =
        result.resultCard?.reduce(
          (acc, semester) => {
            semester.courses.forEach((course) => {
              const courseData = dbData?.courses?.find(
                (crc) => crc.id === course.courseCode
              );
              if (courseData) {
                if (course.marks < 50)
                  acc.failedCourses.push(course.courseCode);
                else
                  acc.totalPassedCreditHours += parseInt(
                    courseData.creditHours || 0,
                    10
                  );
              }
            });
            return acc;
          },
          { failedCourses: [], totalPassedCreditHours: 0 }
        );

      return { ...student, failedCourses, totalPassedCreditHours };
    });

    let courses = processCourseData(assignedClass, isFirstSemester, students);

    const schemeOfStudy = dbData?.schemeOfStudy?.find(
      (sos) => sos.id === assignedClass.sosId
    );

    setData({
      className: assignedClass.name,
      isFirstSemester,
      students,
      schemeOfStudy: { ...schemeOfStudy, courses },
    });
    setFilteredCourses(courses);
  }, [dbData, classId, processCourseData]);

  // Filter courses
  const filterCourses = (filter) => {
    if (!data) return;

    const allCourses = data?.schemeOfStudy?.courses?.filter((course) => {
      const isNotAssigned = !course.isAssigned;
      const failedCourses = data?.students?.flatMap(
        (student) => student.failedCourses
      );
      const isFailedByAnyStudent = failedCourses.includes(course.id);
      return isNotAssigned || isFailedByAnyStudent;
    });
    let updatedCourses;

    switch (filter) {
      case "core":
        updatedCourses = allCourses.filter((course) =>
          course?.courseType?.toLowerCase()?.includes("core")
        );
        break;
      case "elective":
        updatedCourses = allCourses.filter((course) =>
          course?.courseType?.toLowerCase()?.includes("elective")
        );
        break;
      case "generalEducation":
        updatedCourses = allCourses.filter((course) =>
          course?.courseType?.toLowerCase()?.includes("general education")
        );
        break;
      case "supporting":
        updatedCourses = allCourses.filter((course) =>
          course?.courseType?.toLowerCase()?.includes("supporting")
        );
        break;
      case "notAssigned":
        updatedCourses = allCourses.filter((course) => {
          const isNotAssigned = !course.isAssigned;
          return isNotAssigned;
        });
        break;

      case "preRequisite":
        updatedCourses = allCourses.filter((course) => {
          const preReq = course.preRequisites;
          return preReq && preReq !== "-" && preReq.length > 0;
        });
        break;
      default:
        updatedCourses = allCourses;
    }
    setFilteredCourses(updatedCourses);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignCourses = () => {
    if (selectedRows?.length === 0) {
      console.log("No courses selected.");
      return;
    }

    const invalidCourses = selectedRows.filter((courseId) => {
      const course = data?.schemeOfStudy?.courses?.find(
        (course) => course.id === courseId
      );

      if (!course) {
        console.log(`Course not found in scheme of study: ${courseId}`);
        return true;
      }

      // Convert preRequisites string to array
      const prerequisites =
        course?.preRequisites === "-" ? [] : course?.preRequisites.split(",");

      // console.log(`\nChecking course: ${course.id}`);
      // console.log("Course details:", course);
      // console.log("Prerequisites:", prerequisites);

      // No prerequisites to check
      if (prerequisites.length === 0) {
        console.log(`No prerequisites for course: ${course.id}`);
        return false;
      }

      // Fetch assigned courses
      const assignedCourses =
        dbData?.classes?.find((classItem) => classItem.id === assignedClass.id)
          ?.assignedCourses || []; // Default to an empty array if not available

      // console.log("Classes Data:", data?.classes);
      // console.log("Assigned Class ID:", assignedClass.id);
      console.log("Assigned Courses for Current Class:", assignedCourses);

      if (!assignedCourses) {
        console.error(
          `No assigned courses found for class ID: ${assignedClass.id}. Please ensure the data is populated correctly.`
        );
        return true; // Block assignment
      }

      // Check if all prerequisites are met
      const prerequisitesMet = prerequisites.every((prerequisiteId) => {
        const isMet = assignedCourses?.includes(prerequisiteId);
        if (!isMet) {
          console.log(`Prerequisite not met: ${prerequisiteId}`);
        }
        return isMet;
      });

      if (!prerequisitesMet) {
        console.log(`Prerequisites not met for course: ${course.id}`);
        return true;
      }

      console.log(`All prerequisites met for course: ${course.id}`);
      return false;
    });

    if (invalidCourses.length > 0) {
      alert(
        `The following courses have unmet prerequisites: ${invalidCourses.join(
          ", "
        )}.`
      );
      console.log(
        "Some selected courses have unmet prerequisites. Aborting assignment."
      );
      return;
    }

    console.log("All selected courses passed the prerequisite checks.");
    setShowModal(true);
  };

  const handleConfirmAssignment = () => {
    const updatedAssignedClass = {
      ...assignedClass,
      assignedCourses: [
        ...(assignedClass.assignedCourses || []),
        ...selectedRows, // Add the selected courses
      ],
      currAssignedCourses: [...selectedRows],
    };

    const updatedClasses = dbData?.classes?.map((cls) =>
      cls.id === classId ? updatedAssignedClass : cls
    );

    setDbData({
      ...dbData,
      classes: updatedClasses,
    });

    setSelectedRows([]);
    setShowModal(false); // Close the modal
  };

  const courseFilterOptions = [
    { id: "all", name: "All Courses" },
    { id: "notAssigned", name: "Not Assigned Courses" },
    { id: "core", name: "Core Courses" },
    { id: "elective", name: "Elective Courses" },
    { id: "generalEducation", name: "General Education Courses" },
    { id: "supporting", name: "Supporting Courses" },
    { id: "preRequisite", name: "pre-Requisite" },
  ];

  // console.log(assignedClass);

  return (
    <PreLayout>
      {data ? (
        <>
          <div className="w-full flex justify-between items-center">
            <h2 className="text-2xl font-semibold mb-4">
              Scheme of Study for{" "}
              <span className="uppercase">{data.className}</span>
            </h2>
            <div className="relative">
              <MagicButton
                title="Filter Courses"
                handleClick={() => setOpenDropDown(!openDropDown)}
              />
              {openDropDown && (
                <>
                  <Dropdown
                    items={courseFilterOptions}
                    onSelect={(filter) => {
                      filterCourses(filter);
                      setOpenDropDown(false);
                    }}
                  />
                  <div
                    className="fixed inset-0 bg-black bg-opacity-30 z-10"
                    onClick={() => setOpenDropDown(!openDropDown)}
                  />
                </>
              )}
            </div>
          </div>
          <TableComponent
            data={filteredCourses}
            checkBoxOption={true}
            excludeColumns={["isAssigned", "isFailedByAnyStudent"]}
            actionBtns={
              <MagicButton
                title="Assign Courses"
                handleClick={handleAssignCourses}
                disabledCondition={selectedRows.length === 0}
              />
            }
            rowCondition={(row) => row?.isFailedByAnyStudent}
          />

          {/* Modal for Course Assignment */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20">
              <div className="bg-white p-8 rounded-md max-w-lg w-full">
                <h3 className="text-xl font-bold mb-4">
                  Confirm Course Assignment
                </h3>
                <ul>
                  {selectedRows.map((courseId) => {
                    const course = dbData?.courses?.find(
                      (course) => course.id === courseId
                    );
                    return (
                      <li key={courseId} className="mb-2">
                        {course?.courseTitle} - {course?.creditHours}
                      </li>
                    );
                  })}
                </ul>
                <div className="flex justify-end gap-2 mt-4">
                  <MagicButton
                    title="Go Back"
                    handleClick={() => setShowModal(false)}
                    classname={"!bg-slate-500"}
                  />
                  <MagicButton
                    title="Confirm"
                    handleClick={handleConfirmAssignment}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <p>Loading...</p>
      )}
    </PreLayout>
  );
};

export default AssignCoursesPage;
