import PreLayout from "@/layout/Layout";

const AssignCoursesPage = async ({ searchParams }) => {
  const classId = await searchParams.classId; // Retrieve the classId from the query string

  return (
    <PreLayout>
      <h1>Assign Courses</h1>
      {classId ? (
        <p>Class ID: {classId}</p>
      ) : (
        <p>No class selected. Please provide a valid class ID.</p>
      )}
    </PreLayout>
  );
};

export default AssignCoursesPage;
