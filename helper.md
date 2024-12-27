responsive karna hai layout ko ak dafah dobara

context add kar rhaa hun

"{
"advisors":[],
"students":[],
"admins":[],
"courses":[],
"classes":[],
"results":[],
"schemeOfStudy":[]
}"

https://chatgpt.com/c/67514230-d48c-8004-9ad4-ef208ffb2e90

validations of json files

https://chatgpt.com/c/6751fd47-879c-8004-8f38-05fc4ab88218

For Regular Students:
First Semester:

Show all courses that are offered by the university.
Exclude courses that have pre-requisites.
Non-First Semester:

Include courses that are offered.
Exclude courses that are already assigned.
Include courses where all pre-requisites are satisfied by the students.
For Repeaters:
Include courses where:
The student has failed the course.
The course is assigned but the student has not enrolled in it.
The course is not assigned yet.

const handleAssignCourses = () => {
console.log("Starting handleAssignCourses");

    // Filter the selected courses based on the selected rows
    const selectedCourses = filterCoursesByStudentType().filter(
      (course) => selectedRows.includes(course.id) // Check if the course ID is selected
    );

    console.log("Selected Courses: ", selectedCourses);

    if (selectedCourses.length === 0) {
      alert("Please select at least one course to assign.");
      return;
    }

    // Calculate the total selected credit hours
    const totalSelectedCreditHours = selectedCourses.reduce((total, course) => {
      const creditHoursString = course.credit_hours.split("(")[0].trim(); // Extract the total credit hours
      const creditHours = parseInt(creditHoursString, 10); // Convert it to integer
      return total + creditHours;
    }, 0);

    console.log("Total Selected Credit Hours: ", totalSelectedCreditHours);

    // 1. Check if the total credit hours exceed the limit (considering only selected students)
    let creditHoursExceeded = false;

    const updatedStudents = data.students.map((student) => {
      // Apply the update only for the students selected by the studentType filter
      if (
        (studentType === "regular" &&
          selectedRows.some((courseId) => student.regNo === courseId)) ||
        studentType !== "regular"
      ) {
        const currentTotalCreditHours = student.hasLearnedTotalCreditHours || 0;

        if (currentTotalCreditHours + totalSelectedCreditHours > 133) {
          creditHoursExceeded = true;
        }

        return {
          ...student,
          hasLearnedTotalCreditHours:
            currentTotalCreditHours + totalSelectedCreditHours,
          assignedCourses:
            studentType === "regular"
              ? [
                  ...(student.assignedCourses || []),
                  ...selectedCourses.map((course) => course.id),
                ]
              : student.assignedCourses || [],
        };
      }
      return student;
    });

    if (creditHoursExceeded) {
      alert("Total credit hours for this student exceed the limit of 133.");
      return;
    }

    // 2. If Low CGPA student, ensure they are assigned a maximum of 15 credit hours
    if (studentType === "lowCgpa") {
      const lowCgpaTotalCreditHours = data.students
        .filter((student) => student.cgpa < lowCgpaThreshold) // Check for Low CGPA students
        .reduce(
          (total, student) => total + student.hasLearnedTotalCreditHours,
          0
        );

      console.log(
        "Low CGPA Total Credit Hours (Before Assigning): ",
        lowCgpaTotalCreditHours
      );

      if (lowCgpaTotalCreditHours + totalSelectedCreditHours > 15) {
        console.log("Low CGPA credit hour limit exceeded.");
        alert(
          "Low CGPA students cannot be assigned more than 15 credit hours."
        );
        return;
      }
    }

    // 3. Repeaters must be assigned failed courses or courses not enrolled yet
    if (studentType === "repeaters") {
      const failedCourses = selectedCourses.filter((course) =>
        data.students.some(
          (student) =>
            student.failedCourses.includes(course.id) ||
            (course.isAssigned && !student.enrolledCourses.includes(course.id))
        )
      );

      if (failedCourses.length === 0) {
        alert(
          "Repeaters must be assigned failed or previously assigned but unenrolled courses."
        );
        return;
      }
    }

    // 4. For regular students, ensure that the selected courses are all available and assigned
    if (studentType === "regular") {
      const regularCourses = selectedCourses.filter(
        (course) =>
          course.isOffered &&
          !course.isAssigned &&
          course.pre_requisites.every((prerequisite) =>
            data.students.some((student) =>
              student.enrolledCourses.includes(prerequisite)
            )
          )
      );

      if (regularCourses.length === 0) {
        alert("No eligible courses to assign to regular students.");
        return;
      }
    }

    // 5. Check for semester-wise credit hour limits (e.g., max 21 credit hours per semester)
    const maxCreditHoursPerSemester = 21;
    if (totalSelectedCreditHours > maxCreditHoursPerSemester) {
      console.log("Credit hour limit per semester exceeded.");
      alert(
        `You cannot assign more than ${maxCreditHoursPerSemester} credit hours per semester.`
      );
      return;
    }

    // Update the isAssigned property for selected courses and store the assigned courses
    const updatedCourses = data.schemeOfStudy.courses.map((course) => {
      if (selectedRows.includes(course.id)) {
        return { ...course, isAssigned: true }; // Mark as assigned
      }
      return course;
    });

    // Store the assigned courses for each student
    const finalUpdatedStudents = updatedStudents.map((student) => {
      const assignedCourses = selectedCourses.map((course) => course.id);

      // Add the selected courses to the student's assignedCourses field
      return {
        ...student,
        assignedCourses: [
          ...(student.assignedCourses || []), // Ensure previous assigned courses are preserved
          ...assignedCourses,
        ],
      };
    });

    const updatedData = {
      ...data,
      schemeOfStudy: {
        ...data.schemeOfStudy,
        courses: updatedCourses,
      },
      students: finalUpdatedStudents, // Update the students with the assigned courses
    };

    // setData(updatedData);
    console.log("Updated Data:", updatedData);

    // Store updated data to sessionStorage
    // if (typeof window !== "undefined") {
    //   sessionStorage.setItem("DataforAdvisorPage", JSON.stringify(updatedData));
    // }

    console.log("Course assignment completed successfully.");

};

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

      // Determine if any student is in their first semester based on resultCard.length
      const isFirstSemester = assignedClass.students.some((regNo) => {
        const student = dbData.students.find((s) => s.regNo === regNo);
        const result = dbData.results.find(
          (res) => res.regNo === student.regNo
        );
        return result?.resultCard?.length === 0; // If resultCard length is 0, it's their first semester
      });

      const studentsInClass = assignedClass.students.map((regNo) =>
        dbData.students.find((student) => student.regNo === regNo)
      );

      const studentsWithDetails = studentsInClass.map((student) => {
        const result = dbData.results.find(
          (res) => res.regNo === student.regNo
        );

        // Find the most recent CGPA
        const mostRecentCgpa =
          result?.resultCard?.[result.resultCard.length - 1]?.cgpa || null;

        // Arrays to hold failed courses
        const failedCourses = result?.resultCard?.reduce((failed, semester) => {
          semester.courses.forEach((course) => {
            if (course.marks < 50) failed.push(course.courseCode);
          });
          return failed;
        }, []);

        // Calculate total passed credit hours
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

        // Add 'type' based on student type logic (e.g., regular, repeaters, lowCgpa)
        let studentType = "regular"; // Default type
        if (student.cgpa < lowCgpaThreshold) {
          studentType = "lowCgpa";
        } else if (failedCourses.length > 0) {
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
      });

      const schemeOfStudy = dbData.schemeOfStudy.find(
        (sos) => sos.id === assignedClass.sosId
      );

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

      // Store data in sessionStorage only on client-side
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
        return students.filter((student) => {
          // Get all assigned courses for the regular student
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
          // Get all assigned courses for repeaters
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
          // Get all assigned courses for low CGPA students
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
            excludeColumns={["isFirstSemester", "enrolledCourses"]}
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
