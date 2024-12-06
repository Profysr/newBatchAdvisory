import PreLayout from "@/layout/Layout";
import React from "react";
import WelcomeComponent from "../Gen/Welcome";
import { TableGrid } from "../Gen/Table";
import { coursesDataForStudent, coursesHeaderForStudent } from "@/data/users";

const StudentPage = ({ session }) => {
  console.log("Session in StudentPage", session);
  return (
    <PreLayout>
      <WelcomeComponent />
      <TableGrid
        title={"Courses"}
        thead={coursesHeaderForStudent}
        data={coursesDataForStudent}
      />
    </PreLayout>
  );
};

export default StudentPage;
