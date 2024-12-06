"use client";
import { useState, useEffect, useCallback } from "react";
import MagicButton from "../Gen/Button";
import TableComponent from "../Gen/Table";
import PreLayout from "@/layout/Layout";
import { useDbContext } from "@/context/dbContext";
import WelcomeComponent from "../Gen/Welcome";
import Overlay from "../Gen/Overlay";
import { useAppContext } from "@/context/AppContext";

const AdvisorPage = ({ session }) => {
  const { dbData } = useDbContext();
  const { showPopup, togglePopup } = useAppContext();
  const [data, setData] = useState(null);
  const [studentType, setStudentType] = useState("all"); // Filter for student types

  const lowCgpaThreshold = 2.0;

  const getData = useCallback(() => {
    if (!dbData) return;

    const assignedClassId = session.assignedClass;
    if (!assignedClassId) {
      console.log("No class assigned to this advisor.");
      setData(null);
      return;
    }

    try {
      const assignedClass = dbData.classes.find(
        (cls) => cls.id === assignedClassId
      );

      const isFirstSemester = assignedClass.semester === 1; // First semester check

      const studentsInClass = assignedClass.students.map((regNo) =>
        dbData.students.find((student) => student.regNo === regNo)
      );

      const studentsWithDetails = studentsInClass.map((student) => {
        const result = dbData.results.find(
          (res) => res.regNo === student.regNo
        );
        const mostRecentCgpa =
          result?.resultCard?.[result.resultCard.length - 1]?.cgpa || null;
        const failedCourses = result?.resultCard.reduce((failed, semester) => {
          semester.courses.forEach((course) => {
            if (course.marks < 50) failed.push(course.courseCode);
          });
          return failed;
        }, []);
        const enrolledCourses = result?.resultCard.reduce(
          (courses, semester) => {
            semester.courses.forEach((course) => {
              if (!courses.includes(course.courseCode)) {
                courses.push(course.courseCode);
              }
            });
            return courses;
          },
          []
        );

        const isFirstSemester =
          result.resultCard.length === 1 &&
          result.resultCard[0].semester === "Spring 2021";

        return {
          id: student.id,
          regNo: student.regNo,
          name: student.name,
          cgpa: mostRecentCgpa,
          failedCourses: failedCourses.length ? failedCourses : [],
          enrolledCourses: enrolledCourses.length ? enrolledCourses : [],
          isFirstSemester, // Adding this check
        };
      });

      const schemeOfStudy = dbData.schemeOfStudy.find(
        (sos) => sos.id === assignedClass.sosId
      );

      // Process courses with `isAssigned` property
      const updatedCourses = schemeOfStudy.courses.map((courseId) => {
        const course = dbData.courses.find((crc) => crc.id === courseId);

        const isAssigned = studentsWithDetails.some((student) =>
          dbData.results
            ?.find((res) => res.regNo === student.regNo)
            ?.resultCard.some((semester) =>
              semester.courses.some(
                (semCourse) => semCourse.courseCode === course.id
              )
            )
        );

        return {
          ...course,
          isAssigned, // Add the `isAssigned` property to the course
        };
      });

      const finalData = {
        className: assignedClass.classname,
        isFirstSemester, // Add this to the class object
        students: studentsWithDetails.filter(Boolean),
        schemeOfStudy: {
          ...schemeOfStudy,
          courses: updatedCourses.filter(Boolean),
        },
      };

      setData(finalData);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("DataforAdvisorPage", JSON.stringify(finalData));
      }
    } catch (error) {
      console.error("Error fetching advisor data:", error);
      setData(null);
    }
  }, [session, dbData]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = sessionStorage.getItem("DataforAdvisorPage");
      if (storedData) {
        setData(JSON.parse(storedData));
      } else {
        getData();
      }
    }
  }, [getData]);

  const filterStudents = () => {
    if (!data || !data.students) return [];

    const students = data.students;

    switch (studentType) {
      case "all":
        return students;

      case "regular":
        return students.filter(
          (student) =>
            (!student.failedCourses || student.failedCourses.length === 0) &&
            student.cgpa >= lowCgpaThreshold
        );

      case "repeaters":
        return students.filter(
          (student) => student.failedCourses && student.failedCourses.length > 0
        );

      case "lowCgpa":
        return students.filter((student) => student.cgpa < lowCgpaThreshold);

      default:
        return students;
    }
  };

  const filterCoursesByStudentType = () => {
    if (!data) return [];

    const courses = data?.schemeOfStudy?.courses;

    if (studentType === "regular") {
      if (data?.isFirstSemester) {
        return courses?.filter(
          (course) =>
            !course.pre_requisites || course.pre_requisites.length === 0
        );
      }

      return courses?.filter(
        (course) =>
          course.isOffered &&
          !course.isEnrolled &&
          course.pre_requisites?.every((prerequisite) =>
            data.students.some((student) =>
              student.enrolledCourses.includes(prerequisite)
            )
          )
      );
    }

    if (studentType === "repeaters") {
      return courses?.filter(
        (course) =>
          course.isAssigned && // Show only assigned courses
          !course.isEnrolled && // Filter out already enrolled courses
          course.isFailed &&
          course.pre_requisites?.every((prerequisite) =>
            data.students.some((student) =>
              student.enrolledCourses.includes(prerequisite)
            )
          )
      );
    }

    if (studentType === "lowCgpa") {
      return courses?.filter(
        (course) =>
          (course.courseType === "Core" || course.courseType === "Mandatory") &&
          course.isAssigned && // Only show assigned courses
          !course.isEnrolled &&
          course.pre_requisites?.every((prerequisite) =>
            data.students.some((student) =>
              student.enrolledCourses.includes(prerequisite)
            )
          )
      );
    }

    return [];
  };

  return (
    <PreLayout>
      <WelcomeComponent username={session.name} />

      {/* Student Type Filter - Radio Buttons */}
      <div className="flex gap-4 mb-4 items-center">
        <label className="flex items-center">
          <input
            type="radio"
            name="studentType"
            value="all"
            checked={studentType === "all"}
            onChange={() => setStudentType("all")}
            className="cursor-pointer"
          />
          All
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="studentType"
            value="regular"
            checked={studentType === "regular"}
            onChange={() => setStudentType("regular")}
            className="cursor-pointer"
          />
          Regular Students
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="studentType"
            value="repeaters"
            checked={studentType === "repeaters"}
            onChange={() => setStudentType("repeaters")}
            className="cursor-pointer"
          />
          Repeaters
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="studentType"
            value="lowCgpa"
            checked={studentType === "lowCgpa"}
            onChange={() => setStudentType("lowCgpa")}
            className="cursor-pointer"
          />
          Low CGPA Students
        </label>
      </div>

      {data ? (
        filterStudents().length > 0 ? (
          <TableComponent
            data={filterStudents()}
            title={data?.className}
            key={data?.className}
            actionBtns={
              <MagicButton title="View SOS" handleClick={togglePopup} />
            }
            excludeColumns={["enrolledCourses"]}
          />
        ) : (
          <p>No students found matching the selected filter.</p>
        )
      ) : (
        <p>No assigned class found for this advisor.</p>
      )}

      {showPopup && (
        <Overlay>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white z-50 p-2 rounded-lg w-[90%] max-h-[90vh] overflow-auto ">
            {filterCoursesByStudentType()?.length > 0 ? (
              <TableComponent
                data={filterCoursesByStudentType()}
                title={`${studentType} Students`}
                actionBtns={<MagicButton title="Assign Courses" />}
                excludeColumns={["isOffered", "isAssigned", "failedByStudents"]}
                checkBoxOption={true}
              />
            ) : (
              <p>No courses found for the selected filter.</p>
            )}
          </div>
        </Overlay>
      )}
    </PreLayout>
  );
};

export default AdvisorPage;
