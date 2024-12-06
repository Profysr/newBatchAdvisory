"use client";
import React, { useEffect, useState } from "react";
import PreLayout from "@/layout/Layout";
import TableGrid from "@/components/Gen/Table"; // Import your TableComponent

const StudentPage = ({ session }) => {
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    // Simulate fetching data for the logged-in student
    const fetchAssignedCourses = async () => {
      const dbData = JSON.parse(sessionStorage.getItem("DataforAdvisorPage"));

      if (!dbData) {
        console.error("No data found in session storage.");
        return;
      }

      // Find the student based on session ID
      const student = dbData.students.find((s) => s.id === session.id);

      if (!student) {
        console.error("No student found for the given session ID.");
        return;
      }

      setStudentName(student.name); // Set the student name
      setAssignedCourses(student.assignedCourses || []); // Set assigned courses
    };

    fetchAssignedCourses();
  }, [session]);

  return (
    <PreLayout>
      <h1>Welcome, {studentName || "Student"}!</h1>

      {/* Pass data to TableGrid */}
      {assignedCourses.length > 0 ? (
        <TableGrid
          title="Assigned Courses"
          data={assignedCourses.map((course, index) => ({
            id: index + 1,
            courseCode: course,
          }))}
        />
      ) : (
        <p>No courses have been assigned to you yet.</p>
      )}
    </PreLayout>
  );
};

export default StudentPage;
