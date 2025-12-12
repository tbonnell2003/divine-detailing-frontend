// src/components/ToastContainer.jsx
import React from "react";
import Toast from "./Toast";

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <Toast
          key={t.id}
          id={t.id}
          type={t.type}
          message={t.message}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}

export default ToastContainer;
