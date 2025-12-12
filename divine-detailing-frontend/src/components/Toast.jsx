// src/components/Toast.jsx
import React, { useEffect } from "react";

function Toast({ id, type = "info", message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 10000); // auto hide after 10s
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div className={`toast-item toast-${type}`}>
      <div className="toast-message">{message}</div>
    </div>
  );
}

export default Toast;
