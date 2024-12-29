"use client";

// Components
import PreLayout from "@/layout/Layout";
import WelcomeComponent from "../Gen/Welcome";
import TableComponent from "../Gen/Table";
import MagicButton from "../Gen/Button";

// States
import { useDbContext } from "@/context/dbContext";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ----------------------------------------
//          Code Starts Here
// ----------------------------------------

const AdvisorPage = ({ session }) => {
  const { dbData } = useDbContext();
  const [data, setData] = useState(null);
  const router = useRouter();

  const handleClick = () => {
    router.push(`/assign-courses?classId=${session.assignedClass}`); // Navigate with query
  };

  const getData = useCallback(() => {
    if (!dbData) return;

    const assignedClassId = session?.assignedClass;
    if (!assignedClassId) {
      console.log("No class assigned to this advisor.");
      setData(null);
      return;
    }

    try {
      const assignedClass = dbData?.classes?.find(
        (cls) => cls.id === assignedClassId
      );

      if (!assignedClass || !assignedClass.students) {
        console.error("Assigned class or students data is missing.");
        return;
      }

      const isFirstSemester = assignedClass?.students?.some((regNo) => {
        const student = dbData?.students?.find((s) => s.regNo === regNo);

        const result = dbData?.results?.find(
          (res) => res.regNo === student?.regNo
        );
        return result?.resultCard?.length === 0 || !result?.resultCard;
      });

      const studentsOftheClass = assignedClass?.students?.map((regNo) => {
        const student = dbData?.students?.find((s) => s.regNo === regNo);
        if (!student) return null; // Check if the student exists

        if (!isFirstSemester) {
          const result = dbData?.results?.find(
            (r) => r.regNo === student.regNo
          );
          if (!result) return null; // Check if result exists for the student

          // Initialize variables
          let failedCourses = [];
          let totalPassedCreditHours = 0;
          let enrolledCourses = [];

          // Process resultCard
          result?.resultCard?.forEach((semester) => {
            semester?.courses?.forEach((course) => {
              const courseData = dbData?.courses?.find(
                (crc) => crc.id === course.courseCode
              );

              if (courseData) {
                const creditHours = parseInt(courseData.creditHours, 10); // Assuming creditHours is a number

                if (course.marks < 50) {
                  failedCourses.push(course.courseCode); // Add to failed courses
                } else if (!isNaN(creditHours)) {
                  totalPassedCreditHours += creditHours; // Accumulate passed credit hours
                }

                // Add course to enrolledCourses if not already included
                if (!enrolledCourses.includes(course.courseCode)) {
                  enrolledCourses.push(course.courseCode);
                }
              }
            });
          });

          return {
            id: student.id,
            regNo: student.regNo,
            name: student.name,
            failedCourses,
            enrolledCourses,
            totalPassedCreditHours,
          };
        }

        return {
          id: student.id,
          regNo: student.regNo,
          name: student.name,
          failedCourses: [],
          enrolledCourses: [],
          totalPassedCreditHours: 0,
        }; // If isFirstSemester, no calculations are performed
      });

      const schemeOfStudy = dbData.schemeOfStudy.find(
        (sos) => sos.id === assignedClass.sosId
      );
      if (!schemeOfStudy) return;

      const updatedCourses = schemeOfStudy?.courses?.map((courseId) => {
        const course = dbData?.courses?.find((crc) => crc.id === courseId);

        let isAssigned = false;

        // Check if it's not the first semester
        if (!isFirstSemester) {
          isAssigned = studentsOftheClass?.some((student) =>
            dbData.results
              ?.find((res) => res.regNo === student.regNo)
              ?.resultCard.some((semester) =>
                semester.courses.some(
                  (semCourse) => semCourse.courseCode === course.id
                )
              )
          );
        }

        return {
          ...course,
          isAssigned,
        };
      });

      const finalData = {
        className: assignedClass.name,
        isFirstSemester, // Add this to the class object
        students: studentsOftheClass,
        schemeOfStudy: {
          ...schemeOfStudy,
          courses: updatedCourses,
        },
      };

      setData(finalData);
      // console.log("Posted on Session");
    } catch (error) {
      console.log("Error fetching advisor data:", error);
      setData(null);
    }
  }, [dbData, session]);

  useEffect(() => {
    getData();
  }, [getData]);

  return (
    <PreLayout>
      <WelcomeComponent username={session?.name} />

      {data ? (
        <TableComponent
          data={data?.students}
          title={data?.className}
          key={data?.className}
          actionBtns={
            <MagicButton title="Go to SOS Page" handleClick={handleClick} />
          }
          excludeColumns={["isFirstSemester", "enrolledCourses"]}
        />
      ) : (
        <p>No assigned class found for this advisor.</p>
      )}
    </PreLayout>
  );
};

export default AdvisorPage;
