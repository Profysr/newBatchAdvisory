"use client";
import React, { useEffect, useState } from "react";
import PreLayout from "@/layout/Layout";
import TableGrid from "@/components/Gen/Table"; // Import your TableComponent
import WelcomeComponent from "../Gen/Welcome";

const StudentPage = ({ session }) => {
  const [assignedCourses, setAssignedCourses] = useState([]);

  console.log(session);

  return (
    <PreLayout>
      <WelcomeComponent username={session?.name} />

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
