// src/components/Navbar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark">
      <div className="container">
        <NavLink className="navbar-brand" to="/">
          Divine Detailing
        </NavLink>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navMenu"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <NavLink to="/" end className="nav-link">
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/gallery" className="nav-link">
                Gallery
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/team" className="nav-link">
                Team
              </NavLink>
            </li>

            {user && (
              <li className="nav-item">
                <NavLink to="/dashboard" className="nav-link">
                  My Garage
                </NavLink>
              </li>
            )}

            {user?.role === 'admin' && (
              <li className="nav-item">
                <NavLink to="/admin" className="nav-link">
                  Admin
                </NavLink>
              </li>
            )}

            {!user && (
              <>
                <li className="nav-item">
                  <NavLink to="/login" className="nav-link">
                    Login
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/signup" className="nav-link">
                    Sign Up
                  </NavLink>
                </li>
              </>
            )}

            {user && (
              <li className="nav-item">
                <button
                  className="btn btn-link nav-link"
                  type="button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
