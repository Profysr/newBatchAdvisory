"use client";
import { useAppContext } from "@/context/AppContext";
import PreLayout from "@/layout/Layout";
import TableComponent from "../Gen/Table";
import EmptyPage from "../Gen/EmptyPage";
import MagicButton from "../Gen/Button";
import Overlay from "../Gen/Overlay";
import PopComponent from "../Gen/Popup";
import { v4 as uuidv4 } from "uuid";
import { useDbContext } from "@/context/dbContext";

const ManageAdvisors = () => {
  const { showPopup, togglePopup } = useAppContext();
  const { dbData, setDbData, postData } = useDbContext();

  const handleFileUpload = async (data) => {
    try {
      const parsedData = JSON.parse(data);
      setDbData((prev) => {
        const updatedAdvisors = [...(prev.advisors || [])];

        parsedData.forEach((advisor) => {
          const advisorExists = updatedAdvisors.some(
            (existingAdvisor) => existingAdvisor.email === advisor.email
          );

          if (!advisorExists) {
            updatedAdvisors.push({
              ...advisor,
              assignedClass: advisor.assignedClass || null, // Handle empty assignedClass
              id: `Advisor${uuidv4()}`, // Generate a unique ID
            });
          } else {
            console.warn(`Advisor with email ${advisor.email} already exists.`);
          }
        });

        // Step 3: Return updated state
        return {
          ...prev,
          advisors: updatedAdvisors,
        };
      });

      // const updatedData = {
      //   ...dbData,
      //   advisors: [...dbData.advisors, ...parsedData],
      // };
      // await postData(updatedData);

      // console.log(
      //   "Data successfully posted to db.json and stored in sessionStorage."
      // );
    } catch (error) {
      console.error("Error handling file upload:", error);
    }
  };

  const getClassnameById = (classId) => {
    const classData = dbData?.classes?.find((cls) => cls.id === classId);
    return classData ? classData.classname : null;
  };

  // Map through the advisors and add their class name
  const advisorsWithClassname = dbData?.advisors?.map((advisor) => ({
    ...advisor,
    assignedClass: getClassnameById(advisor.assignedClass),
  }));

  return (
    <PreLayout>
      {advisorsWithClassname?.length > 0 ? (
        <TableComponent
          data={advisorsWithClassname}
          title="Batch Advisors"
          key="Batch Advisors"
        />
      ) : (
        <div className="w-full flex flex-col gap-4 justify-center items-center">
          <EmptyPage />
          <MagicButton title="Add Batch Advisor" handleClick={togglePopup} />

          {showPopup && (
            <>
              <Overlay />
              <PopComponent handleFileUpload={handleFileUpload} />
            </>
          )}
        </div>
      )}
    </PreLayout>
  );
};

export default ManageAdvisors;
