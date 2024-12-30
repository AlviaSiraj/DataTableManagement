import React, { useState, useEffect } from "react";
import "./Components.css";
import { useNavigate } from "react-router-dom";
import Upload from "./upload.js";
import { Notification, ConfirmationModal } from "./Notification.js"; // Import both components
const { ipcRenderer } = window.require("electron");

const DisplayList = () => {
  const [file, setFile] = useState([]);
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ title: "", message: "" });
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const loadSavedData = async () => {
    try {
      const savedData = await ipcRenderer.invoke("get-data"); // Retrieve data
      if (savedData) {
        setFile(savedData.files);
      }
    } catch (error) {
      console.error("Error retrieving saved data:", error);
    }
  };

  const handleClick = (e) => {
    navigate("/display", {
      state: { fileName: e.fileName, fileDate: e.fileDate, fileData: e.data },
    });
  };

  // Handle file deletion
  const handleDeleteRecord = (recordToDelete) => {
    setRecordToDelete(recordToDelete); // Store the record to delete
    setShowConfirmDelete(true); // Show confirmation modal
  };

  const handleConfirmDelete = async () => {
    if (recordToDelete) {
      try {
        // Deleting file from the backend (assuming "delete-data" method handles it)
        const response = await ipcRenderer.invoke(
          "delete-data",
          recordToDelete.fileName
        );
        if (response.success) {
          console.log("File deleted successfully:", recordToDelete.fileName);
          // Remove file from the UI
          setFile((prevFiles) =>
            prevFiles.filter(
              (file) => file.fileName !== recordToDelete.fileName
            )
          );
          setNotification({
            title: "Delete Modal",
            message: `${recordToDelete.fileName} has been deleted.`,
          });
        } else {
          setNotification({
            title: "Delete Modal",
            message: "Failed to delete file.",
          });
        }
      } catch (error) {
        console.error("Error deleting file:", error);
        setNotification({
          title: "Delete Modal",
          message: "An error occurred while deleting the file.",
        });
      }
    }
    setShowConfirmDelete(false); // Close confirmation modal after operation
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false); // Close confirmation modal
  };

  // Update the file list when a new file is uploaded
  const handleFileUpload = () => {
    loadSavedData();
  };

  useEffect(() => {
    loadSavedData();
  }, []);

  return (
    <>
      <Upload onFileUpload={handleFileUpload} />
      <div className="dataList">
        {/* Pass title and message separately */}
        <Notification
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification({ title: "", message: "" })}
        />
        {file.map((file, index) => (
          <div className="card" key={file.fileName}>
            <h4>{file.fileName}</h4>
            <p>{file.fileDate}</p>
            <button onClick={() => handleClick(file)} className="viewButton">
              View
            </button>
            <button
              onClick={() => handleDeleteRecord(file)} // Use handleDeleteRecord with the full record
              className="deleteButton"
            >
              Delete
            </button>
          </div>
        ))}
        {showConfirmDelete && (
          <ConfirmationModal
            message={`Are you sure you want to delete the file ${recordToDelete?.fileName}?`}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />
        )}
      </div>
    </>
  );
};

export default DisplayList;
