import { useAppContext } from "@/context/AppContext";
import Loader from "./Loader";
import * as XLSX from "xlsx";

const PopComponent = ({ handleFileUpload, inputField }) => {
  const {
    isLoading,
    setIsLoading,
    isDragging,
    setIsDragging,

    togglePopup,

    handleDragOver,
    handleDragLeave,
    handleDivClick,
  } = useAppContext();

  const handleFileDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    processFile(file);
  };

  const handleFileInput = (event) => {
    const file = event.target.files[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (
      file &&
      (file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel")
    ) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const data = e.target.result;

        try {
          setIsLoading(true);
          // Read the Excel data using XLSX library
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0]; // Get the first sheet
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet); // Convert sheet to JSON

          handleFileUpload(jsonData); // Pass the parsed JSON data to handleFileUpload
        } catch (err) {
          console.log("Invalid Excel file!");
        } finally {
          setIsLoading(false); // Stop loading animation after 2 seconds
          togglePopup(); // Toggle popup visibility after delay
        }
      };

      reader.readAsArrayBuffer(file); // Use readAsArrayBuffer for better Excel file handling
    } else {
      console.log("Please upload a valid Excel file!");
    }
  };

  return (
    <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-96 min-h-48 grid place-items-center">
      {isLoading ? (
        <Loader />
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Add New Class</h2>
          {inputField && <div className="w-full">{inputField}</div>}
          <div
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleDivClick}
            className={`p-4 text-sm text-center w-full h-32 border-2 border-dashed ${
              isDragging ? "border-blue-400 bg-blue-100" : "border-gray-400"
            } flex items-center justify-center rounded-md cursor-pointer`}
          >
            <span className="text-gray-600">
              Drag and drop a Excel file here or click to choose
            </span>
          </div>

          {/* Hidden File Input */}
          <input
            id="fileInput"
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};

export default PopComponent;
