import React, { useState } from "react";
import "./Components.css";
import { Notification } from "./Notification.js";
const { ipcRenderer } = window.require("electron");

const Upload = ({ onFileUpload }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileDate, setFileDate] = useState("");
  const [notification, setNotification] = useState({ title: "", message: "" });

  const handleFile = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setFileName(selectedFile.name);
    const date = new Date(selectedFile.lastModifiedDate);
    setFileDate(
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    );
  };

  const handleUpload = async () => {
    if (!file) {
      setNotification({
        title: "Upload Modal",
        message: "Please select a file first!",
      });
      return;
    }
    try {
      const XLSX = require("xlsx");
      const reader = new FileReader();
      reader.onload = async (e) => {
        const binaryString = e.target.result;
        const workbook = XLSX.read(binaryString, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Save the data persistently using Electron
        const response = await ipcRenderer.invoke(
          "save-data",
          fileName,
          jsonData,
          fileDate
        );

        if (response.success) {
          onFileUpload(); // Trigger the callback only if saving is successful
          setNotification({
            title: "Upload Modal",
            message: "File uploaded successfully!",
          });
        } else {
          setNotification({
            title: "Upload Modal",
            message: "Failed to upload the file.",
          });
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      setNotification({
        title: "Upload Modal",
        message: "An error occurred while uploading the file.",
      });
    }
  };

  return (
    <div className="upload">
      {/* Pass title and message separately */}
      <Notification
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ title: "", message: "" })}
      />
      <h5>Upload Excel File</h5>
      <input
        type="file"
        id="fileInput"
        accept=".xlsx, .csv, .xls"
        onChange={handleFile}
      />
      <div>
        <button className="uploadButton" onClick={handleUpload}>
          Upload
        </button>
      </div>
    </div>
  );
};

export default Upload;
