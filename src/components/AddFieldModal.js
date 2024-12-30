import React, { useState } from "react";

const AddEntryModal = ({ headers, closeModal, onSave }) => {
  const [newEntry, setNewEntry] = useState({});
  const [uniqueFields, setUniqueFields] = useState([]);

  const handleInputChange = (header, value) => {
    setNewEntry((prev) => ({ ...prev, [header]: value }));
  };

  const handleUniqueFieldChange = (header) => {
    setUniqueFields((prev) =>
      prev.includes(header)
        ? prev.filter((field) => field !== header)
        : [...prev, header]
    );
  };

  const handleSave = () => {
    onSave(newEntry, uniqueFields);
    closeModal();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Add New Entry</h3>
        <form onSubmit={handleSave}>
          {headers.map((header, index) => (
            <div key={index} className="form-group">
              <label>{header}</label>
              <div className="input-group">
                <input
                  type="text"
                  value={newEntry[header]}
                  onChange={(e) => handleInputChange(header, e.target.value)}
                  placeholder={`Enter ${header}`}
                />
                <label>
                  <input
                    type="checkbox"
                    onChange={() => handleUniqueFieldChange(header)}
                  />
                  Unique
                </label>
              </div>
            </div>
          ))}
          <div className="modal-actions">
            <button type="submit" className="submitButton">
              Submit
            </button>
            <button type="button" onClick={closeModal} className="cancelButton">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEntryModal;
