import { useAppContext } from "@/context/AppContext";
import Loader from "./Loader";

const PopComponent = ({ handleFileUpload }) => {
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
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          setIsLoading(true);
          setTimeout(() => {
            handleFileUpload(e.target.result);
            setIsLoading(false);
            togglePopup();
          }, 2000);
        } catch (err) {
          alert("Invalid JSON file!");
        }
      };
      reader.readAsText(file);
    } else {
      alert("Please upload a valid JSON file!");
    }
  };

  return (
    <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-96 min-h-48 grid place-items-center">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <h2 className="text-sm my-3">Upload JSON File for Students</h2>
          <div
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleDivClick}
            className={`p-4 text-sm text-center w-full h-24 border-2 border-dashed ${
              isDragging ? "border-blue-400 bg-blue-100" : "border-gray-300"
            } flex items-center justify-center rounded-md cursor-pointer`}
          >
            <span className="text-gray-500">
              Drag and drop a JSON file here or click to choose
            </span>
          </div>

          {/* Hidden File Input */}
          <input
            id="fileInput"
            type="file"
            accept="application/json"
            onChange={handleFileInput}
            className="hidden"
          />
        </>
      )}
    </div>
  );
};

export default PopComponent;
