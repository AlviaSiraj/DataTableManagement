import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx"; // Import the xlsx library
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import AddFieldModal from "./AddFieldModal.js";
import { Notification, ConfirmationModal } from "./Notification.js"; // Import both components
const { ipcRenderer } = window.require("electron");

const DisplayTable = () => {
  const location = useLocation();
  const { fileName, fileDate, fileData } = location.state || {}; //get passed data
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // State for edit modal
  const [data, setData] = useState(fileData || []);
  const [notification, setNotification] = useState({ title: "", message: "" });
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [recordToEdit, setRecordToEdit] = useState(null); // State for the record to edit
  const [fieldToEdit, setFieldToEdit] = useState(null); // State for the specific field to edit
  const [newValue, setNewValue] = useState(""); // New value for the edited field
  const [isDuplicateChecked, setIsDuplicateChecked] = useState(false); // State for duplicate check

  // adding pagination:
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Show 10 entries per page

  useEffect(() => {
    const refreshData = (_, updatedData) => {
      const file = updatedData.files.find((f) => f.fileName === fileName);
      if (file) {
        setData(file.data);
      }
    };

    ipcRenderer.on("refresh-data", refreshData);

    return () => {
      ipcRenderer.removeListener("refresh-data", refreshData);
    };
  }, [fileName]);

  useEffect(() => {
    ipcRenderer.invoke("get-data").then((savedData) => {
      const file = savedData.files.find((f) => f.fileName === fileName);
      if (file) {
        setData(file.data); // Set the data in state after fetching from the store
      }
    });
  }, [fileName]); // Only trigger this effect when `fileName` changes

  const handleBack = () => {
    window.history.back(); // Go back to the previous page
  };

  if (!fileName || !fileData) {
    return <p>No file data available</p>;
  }

  //extract headers from the data
  const headers = fileData?.length ? Object.keys(fileData[0]) : [];

  // Filter rows based on the search query
  const filteredData = data.filter((row) =>
    headers.some((header) =>
      row[header]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Paginate the filtered data
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  //Open Add Entry Modal
  const handleModal = () => {
    setShowModal(true);
    console.log("Add Entry Modal");
  };

  const handleAddEntry = (newEntry, uniqueFields) => {
    if (Object.keys(newEntry).length === 0) {
      setNotification({
        title: "Error Modal",
        message: "Please fill all fields",
      });
      return;
    }

    if (uniqueFields.length) {
      // Check if any unique field matches for any row
      const isDuplicate = data.some((row) =>
        uniqueFields.some((field) => row[field] === newEntry[field])
      );

      if (isDuplicate) {
        setNotification({
          title: "Error Modal",
          message: "Duplicate entry detected!",
        });
      } else {
        const updatedData = [...data, newEntry];
        setData(updatedData);
        saveData(updatedData); // Save the data after adding it
        setShowModal(false);
      }
    } else {
      const updatedData = [...data, newEntry];
      setData(updatedData);
      saveData(updatedData); // Save the data after adding it
      setShowModal(false); // Close the modal
    }
  };

  const saveData = (updatedData) => {
    ipcRenderer
      .invoke("save-data", fileName, updatedData, fileDate)
      .then((response) => {
        if (response.success) {
          // Re-fetch the saved data to ensure it's in sync
          ipcRenderer.invoke("get-data").then((savedData) => {
            const file = savedData.files.find((f) => f.fileName === fileName);
            if (file) {
              setData(file.data); // Update the state with the fresh data
            }
          });
          setNotification({
            title: "Success Modal",
            message: "Saved successfully",
          });
        } else {
          setNotification({
            title: "Error Modal",
            message: "Failed to save data",
          });
        }
      })
      .catch((error) => {
        setNotification({
          title: "Error Modal",
          message: "An error occurred while saving data.",
        });
      });
  };

  // Function to delete a record
  const handleDeleteRecord = (recordToDelete) => {
    setRecordToDelete(recordToDelete); // Store the record to delete
    setShowConfirmDelete(true); // Show confirmation modal
  };

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      const updatedData = data.filter((row) => row !== recordToDelete); // Remove the record
      setData(updatedData); // Update the state
      saveData(updatedData); // Save the updated data to the backend
      setNotification({
        title: "Success Modal",
        message: "Entry Deleted Successfully",
      });
    }
    setShowConfirmDelete(false); // Close confirmation modal
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false); // Close confirmation modal
  };

  // Handle Edit Record (specific field)
  const handleEditField = (record, field) => {
    setRecordToEdit(record); // Store the record to edit
    setFieldToEdit(field); // Store the field to edit
    setNewValue(record[field] || ""); // Pre-fill the input with the current value
    setShowEditModal(true); // Show edit modal
  };

  const handleSaveEdit = () => {
    // Check for duplicates when the checkbox is checked
    if (isDuplicateChecked) {
      const isDuplicate = data.some(
        (row) => row[fieldToEdit] === newValue && row !== recordToEdit
      );
      if (isDuplicate) {
        setShowEditModal(false);
        setNotification({
          title: "Duplicate Entry",
          message: `The value "${newValue}" already exists in the ${fieldToEdit} field.`,
        });
        return; // Exit without saving
      }
    }
    // Update only the field that was edited
    const updatedRecord = { ...recordToEdit, [fieldToEdit]: newValue };
    const updatedData = data.map((row) =>
      row === recordToEdit ? updatedRecord : row
    );
    setData(updatedData);
    saveData(updatedData); // Save the updated data to the backend
    setShowEditModal(false); // Close edit modal
    setRecordToEdit(null); // Reset the record to edit
    setFieldToEdit(null); // Reset the field to edit
  };

  // Pagination controls
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Function to handle exporting data to Excel
  const handleExport = () => {
    // Convert the current data to a worksheet
    const worksheet = XLSX.utils.json_to_sheet(data); // You can also use `filteredData` or `paginatedData` as needed
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Trigger a download
    const excelFileName = `${fileName || "export"}.xlsx`;
    XLSX.writeFile(workbook, excelFileName);
  };

  return (
    <div className="table-container">
      <Notification
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ title: "", message: "" })}
      />
      <button className="backButton" onClick={handleBack}>
        Back
      </button>
      <h4>File Details of {fileName}</h4>
      <p>uploaded: {fileDate}</p>
      <div className="search-container">
        <div className="search-group">
          <label htmlFor="search">Search</label>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery || ""}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-box"
          />{" "}
        </div>
        <button className="addButton" onClick={() => handleModal()}>
          Add Entry
        </button>
      </div>
      <table className="displayTable">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((header, cellIndex) => (
                <td key={cellIndex}>
                  {row[header] || "N/A"}
                  <FontAwesomeIcon
                    icon={faEdit}
                    className="editButton"
                    onClick={() => handleEditField(row, header)}
                  />
                </td>
              ))}
              <td>
                <button
                  className="deleteButton"
                  onClick={() => handleDeleteRecord(row)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && (
        <AddFieldModal
          headers={headers}
          closeModal={() => setShowModal(false)}
          onSave={handleAddEntry}
        />
      )}
      {showEditModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit {fieldToEdit}</h3>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)} // Update new value
            />
            <div className="duplicate-check">
              <input
                type="checkbox"
                id="duplicate-check"
                checked={isDuplicateChecked}
                onChange={(e) => setIsDuplicateChecked(e.target.checked)}
              />
              <label htmlFor="duplicate-check">Check for duplicates</label>
            </div>
            <button onClick={handleSaveEdit}>Save</button>
            <button onClick={() => setShowEditModal(false)}>Cancel</button>
          </div>
        </div>
      )}
      {showConfirmDelete && (
        <ConfirmationModal
          message={`Are you sure you want to delete this record?`}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
      <div className="pagination">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>{`Page ${currentPage} of ${totalPages}`}</span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
        <button className="excelButton" onClick={handleExport}>
          Export
        </button>
      </div>
    </div>
  );
};

export default DisplayTable;
