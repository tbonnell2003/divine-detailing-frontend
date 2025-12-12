// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Team from './pages/Team';
import Gallery from './pages/Gallery';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import { useAuth } from './context/AuthContext';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  const year = new Date().getFullYear();

  return (
    <div className="app-root d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/team" element={<Team />} />
          <Route path="/gallery" element={<Gallery />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />

          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site-footer text-center py-4">
        <p className="mb-0">
          © {year} Divine Detailing | Team01 – CS3870 Secure Web Development
        </p>
        <p className="mb-0">
          Follow us on Instagram:{' '}
          <a
            href="https://instagram.com/divinedetailing2024"
            target="_blank"
            rel="noopener noreferrer"
          >
            @divinedetailing2024
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
