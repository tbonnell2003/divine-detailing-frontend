// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);
