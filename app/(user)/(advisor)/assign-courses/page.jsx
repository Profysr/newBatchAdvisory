import AssignCoursesPage from "@/components/Page/AssignCoursesPage";

const page = async ({ searchParams }) => {
  const classId = (await searchParams).classId;

  if (!classId) {
    return <div>Loading Assign Courses Page ...!!</div>;
  }
  return <AssignCoursesPage classId={classId} />;
};

export default page;
