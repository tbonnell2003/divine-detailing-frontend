// src/pages/Team.jsx
import React from 'react';

function Team() {
  return (
    <section className="py-5">
      <div className="container">
        <h1 className="mb-4 text-center">Team01 – Divine Detailing</h1>
        <p className="lead text-center mb-5">
          This project was created for CS3870 Secure Web Development at the
          University of Wisconsin–Platteville. It showcases a secure full-stack
          web application with a MongoDB backend and Node/Express API.
        </p>

        <div className="row g-4 mb-5">
          <div className="col-md-6">
            <div className="p-3 bg-white rounded shadow-sm h-100">
              <h3 className="h5">Tyler Bonnell</h3>
              <p className="mb-1">
                Email:{' '}
                <a href="mailto:bonnellt@uwplatt.edu">bonnellt@uwplatt.edu</a>
              </p>
              
            </div>
          </div>

          <div className="col-md-6">
            <div className="p-3 bg-white rounded shadow-sm h-100">
              <h3 className="h5">James Rhodes</h3>
              <p className="mb-1">
                Email:{' '}
                <a href="mailto:rhodesja@uwplatt.edu">rhodesja@uwplatt.edu</a>
              </p>
              
            </div>
          </div>
        </div>

        <h2 className="h4 mb-3">Tech Stack</h2>
        <ul>
          <li>Frontend: React, Vite, Bootstrap 5, EmailJS</li>
          <li>Backend: Node.js, Express, MongoDB (Mongoose)</li>
          <li>Deployment: GitHub, Render</li>
        </ul>
      </div>
    </section>
  );
}

export default Team;
