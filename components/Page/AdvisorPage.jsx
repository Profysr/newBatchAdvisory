"use client";
import { useAppContext } from "@/context/AppContext";
import { useDbContext } from "@/context/dbContext";
import PreLayout from "@/layout/Layout";
import { useCallback, useEffect, useState } from "react";
import WelcomeComponent from "../Gen/Welcome";
import TableComponent from "../Gen/Table";
import MagicButton from "../Gen/Button";
import Overlay from "../Gen/Overlay";

const AdvisorPage = ({ session }) => {
  const { dbData } = useDbContext();
  const { showPopup, togglePopup, selectedRows } = useAppContext();
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

      // Ensure assignedClass and its students are defined before proceeding
      if (!assignedClass || !assignedClass.students) {
        console.error("Assigned class or students data is missing.");
        return;
      }

      // Determine if any student is in their first semester based on resultCard.length
      const isFirstSemester = assignedClass.students.some((regNo) => {
        const student = dbData.students.find((s) => s.regNo === regNo);
        const result = dbData.results.find(
          (res) => res.regNo === student?.regNo
        );
        return result?.resultCard?.length === 0; // If resultCard length is 0, it's their first semester
      });

      const studentsWithDetails = assignedClass.students
        .map((regNo) => {
          const student = dbData.students.find((s) => s.regNo === regNo);
          if (!student) return null; // Check if the student exists

          const result = dbData.results.find((r) => r.regNo === student.regNo);
          if (!result) return null; // Check if result exists for the student

          const mostRecentCgpa =
            result?.resultCard?.[result.resultCard.length - 1]?.cgpa || null;

          // Arrays to hold failed courses
          const failedCourses = result?.resultCard?.reduce(
            (failed, semester) => {
              semester.courses.forEach((course) => {
                if (course.marks < 50) failed.push(course.courseCode);
              });
              return failed;
            },
            []
          );

          const totalPassedCreditHours = result?.resultCard?.reduce(
            (total, semester) => {
              semester.courses.forEach((course) => {
                if (course.marks >= 50) {
                  const courseData = dbData.courses.find(
                    (dbCourse) => dbCourse.id === course.courseCode
                  );
                  if (courseData) {
                    const creditHoursString = courseData.credit_hours;
                    const creditHours = parseInt(
                      creditHoursString.split("(")[0],
                      10
                    );
                    if (!isNaN(creditHours)) {
                      total += creditHours;
                    }
                  }
                }
              });
              return total;
            },
            0
          );

          // Enrolled courses
          const enrolledCourses = result?.resultCard?.reduce(
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

          // Logic for determining the student type (regular, repeaters, lowCgpa)
          let studentType = "regular"; // Default type
          const assignedCourses = data?.schemeOfStudy?.courses
            ?.filter((course) => course.isAssigned)
            .map((course) => course.id);

          if (student.cgpa < lowCgpaThreshold) {
            studentType = "lowCgpa";
          } else if (
            failedCourses.length > 0 ||
            assignedCourses?.some(
              (assigned) => !student.enrolledCourses.includes(assigned)
            )
          ) {
            studentType = "repeaters";
          }

          return {
            id: student.id,
            regNo: student.regNo,
            name: student.name,
            cgpa: mostRecentCgpa,
            failedCourses: failedCourses.length ? failedCourses : [],
            enrolledCourses: enrolledCourses.length ? enrolledCourses : [],
            totalPassedCreditHours: totalPassedCreditHours || 0, // Default to 0 if null
            type: studentType, // Add type property
          };
        })
        .filter(Boolean); // Filter out null students

      const schemeOfStudy = dbData.schemeOfStudy.find(
        (sos) => sos.id === assignedClass.sosId
      );
      if (!schemeOfStudy) return;

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
        students: studentsWithDetails,
        schemeOfStudy: {
          ...schemeOfStudy,
          courses: updatedCourses.filter(Boolean),
        },
      };

      setData(finalData);

      // Store data in sessionStorage only on client-side
      if (typeof window !== "undefined") {
        sessionStorage.setItem("DataforAdvisorPage", JSON.stringify(finalData));
      }
    } catch (error) {
      console.log("Error fetching advisor data:", error);
      setData(null);
    }
  }, [dbData, session]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = sessionStorage.getItem("DataforAdvisorPage");
      if (storedData) {
        setData(JSON.parse(storedData));
        return;
      }
      getData();
    }
  }, [getData]);

  const filterStudents = () => {
    if (!data || !data.students) return [];

    const students = data.students;

    switch (studentType) {
      case "all":
        return students;

      case "regular":
        return students.filter((student) => {
          const assignedCourses = data.schemeOfStudy?.courses
            ?.filter((course) => course.isAssigned)
            .map((course) => course.id); // Get all assigned courses

          return (
            (!student.failedCourses || student.failedCourses.length === 0) && // No failed courses
            student.cgpa >= lowCgpaThreshold && // CGPA should be >= 2.0
            assignedCourses.every(
              (assigned) => student.enrolledCourses.includes(assigned) // All assigned courses must be enrolled
            )
          );
        });

      case "repeaters":
        return students.filter((student) => {
          const assignedCourses = data.schemeOfStudy?.courses
            ?.filter((course) => course.isAssigned)
            .map((course) => course.id);

          return (
            student.cgpa > lowCgpaThreshold &&
            (student.failedCourses?.length > 0 || // Include students who have failed courses
              assignedCourses.some(
                (assigned) => !student.enrolledCourses.includes(assigned) // Include students who haven't enrolled in assigned courses
              ))
          );
        });

      case "lowCgpa":
        return students.filter((student) => {
          const assignedCourses = data.schemeOfStudy?.courses
            ?.filter((course) => course.isAssigned)
            .map((course) => course.id);

          return (
            student.cgpa < lowCgpaThreshold && // CGPA should be less than the threshold
            (student.failedCourses?.length > 0 || // Include students who have failed courses
              assignedCourses.some(
                (assigned) => !student.enrolledCourses.includes(assigned) // Include students who haven't enrolled in assigned courses
              ))
          );
        });

      default:
        return students;
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = sessionStorage.getItem("DataforAdvisorPage");
      if (storedData) {
        setData(JSON.parse(storedData));
        return;
      }
      getData();
    }
  }, [getData]);

  const filterCoursesByStudentType = () => {
    if (!data) return [];

    const courses = data?.schemeOfStudy?.courses;

    if (studentType === "regular") {
      // First Semester: Include all courses except those with pre-requisites
      if (data?.isFirstSemester) {
        return courses?.filter(
          (course) =>
            course.isOffered && // Only offered courses
            (!course.pre_requisites || course.pre_requisites.length === 0) // Exclude courses with pre-requisites
        );
      }

      // Regular Students (Non-First Semester)
      return courses?.filter(
        (course) =>
          course.isOffered && // Only offered courses
          !course.isAssigned && // Exclude already assigned courses
          course.pre_requisites?.every((prerequisite) =>
            data.students.some(
              (student) => student.enrolledCourses.includes(prerequisite) // Confirm all pre-requisites
            )
          )
      );
    }

    if (studentType === "repeaters") {
      return courses?.filter((course) => {
        return (
          // Courses where the student has failed
          data.students.some((student) =>
            student.failedCourses.includes(course.id)
          ) ||
          // Courses that are assigned but not yet enrolled
          (course.isAssigned &&
            !data.students.some((student) =>
              student.enrolledCourses.includes(course.id)
            )) ||
          // Courses that are not assigned yet
          !course.isAssigned
        );
      });
    }
    if (studentType === "lowCgpa") {
      return courses?.filter((course) => {
        return (
          // Courses where the student has failed
          data.students.some((student) =>
            student.failedCourses.includes(course.id)
          ) ||
          // Courses that are assigned but not yet enrolled
          (course.isAssigned &&
            !data.students.some((student) =>
              student.enrolledCourses.includes(course.id)
            )) ||
          // Courses that are not assigned yet
          !course.isAssigned
        );
      });
    }

    return [];
  };

  const handleAssignCourses = () => {
    // Filter the selected courses based on the selected rows
    const selectedCourses = filterCoursesByStudentType().filter((course) =>
      selectedRows.includes(course.id)
    );

    if (selectedCourses.length === 0) {
      alert("Please select at least one course to assign.");
      return;
    }

    // Calculate the total selected credit hours
    const totalSelectedCreditHours = selectedCourses.reduce((total, course) => {
      const creditHoursString = course.credit_hours.split("(")[0].trim();
      const creditHours = parseInt(creditHoursString, 10);
      return total + creditHours;
    }, 0);

    console.log("Selected Courses: ", selectedCourses);
    console.log("Total Selected Credit Hours: ", totalSelectedCreditHours);

    // Set maximum credit hours
    const maxCreditHoursPerStudent = studentType === "lowCgpa" ? 15 : 22;

    // Validate credit hour limits for the selected student type
    const creditHoursExceeded = data.students.some((student) => {
      if (student.type === studentType) {
        const currentTotalCreditHours = student.hasLearnedTotalCreditHours || 0;
        return (
          currentTotalCreditHours + totalSelectedCreditHours >
          maxCreditHoursPerStudent
        );
      }
      return false;
    });

    if (creditHoursExceeded) {
      alert(
        `Total credit hours for ${studentType} students exceed the limit of ${maxCreditHoursPerStudent}.`
      );
      return;
    }

    // Update student data
    const updatedStudents = data.students.map((student) => {
      if (student.type === studentType) {
        // Update only for students of the selected type
        return {
          ...student,
          assignedCourses: [
            ...(student.assignedCourses || []),
            ...selectedCourses.map((course) => course.id),
          ],
          hasLearnedTotalCreditHours:
            (student.hasLearnedTotalCreditHours || 0) +
            totalSelectedCreditHours,
        };
      }
      // Ensure others have an empty `assignedCourses` array
      return {
        ...student,
        assignedCourses: [],
      };
    });

    // Update the `isAssigned` property for courses
    const updatedCourses = data.schemeOfStudy.courses.map((course) => {
      if (selectedRows.includes(course.id)) {
        return { ...course, isAssigned: true }; // Mark as assigned
      }
      return course;
    });

    // Prepare updated data
    const updatedData = {
      ...data,
      students: updatedStudents,
      schemeOfStudy: {
        ...data.schemeOfStudy,
        courses: updatedCourses,
      },
    };

    // Save the updated data
    setData(updatedData);
    console.log("Updated Data:", updatedData);

    // Optionally store in sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.setItem("DataforAdvisorPage", JSON.stringify(updatedData));
    }
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
            excludeColumns={[
              "isFirstSemester",
              "enrolledCourses",
              "type",
              "failedCourses",
            ]}
          />
        ) : (
          <p>No students found matching the selected filter.</p>
        )
      ) : (
        <p>No assigned class found for this advisor.</p>
      )}

      {showPopup && (
        <>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white z-50 p-2 rounded-lg w-[90%] max-h-[90vh] overflow-auto ">
            {filterCoursesByStudentType()?.length > 0 ? (
              <TableComponent
                data={filterCoursesByStudentType()}
                title={`${studentType} Students`}
                actionBtns={
                  <MagicButton
                    title="Assign Courses"
                    handleClick={handleAssignCourses}
                  />
                }
                excludeColumns={["isOffered", "isAssigned", "failedByStudents"]}
                checkBoxOption={true}
              />
            ) : (
              <p>No courses found for the selected filter.</p>
            )}
          </div>
          <Overlay />
        </>
      )}
    </PreLayout>
  );
};

export default AdvisorPage;
