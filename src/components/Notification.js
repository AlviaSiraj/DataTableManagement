import React, { useEffect } from "react";

const Notification = ({ title, message, onClose }) => {
  // Handle the Enter key press
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      onClose(); // Trigger onClose when Enter key is pressed
    }
  };

  // Add event listener when the component is mounted
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!message) return null; // Render nothing if there's no message

  return (
    <div className="notification" onKeyDown={handleKeyDown} tabIndex="0">
      <div className="notificationModal">
        <p className="NotificationTitle">{title}</p>
        <p className="modalMessage">{message}</p>
        <div className="notificationButton">
          <button onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
};
const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="notification">
      <div className="modal-content">
        <p>{message}</p>
        <div className="notificationButton">
          <button onClick={onConfirm}>Yes</button>
          <button onClick={onCancel}>No</button>
        </div>
      </div>
    </div>
  );
};
export { Notification, ConfirmationModal };
