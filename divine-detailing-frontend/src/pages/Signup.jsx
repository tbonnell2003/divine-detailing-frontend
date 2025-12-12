// src/pages/Signup.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function Signup() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Signup failed.');
        showToast('danger', data.error || 'Signup failed. Please try again.');
        return;
      }

      const msg = 'Account created. You can now log in.';
      setMessage(msg);
      showToast('success', msg);

      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      console.error(err);
      setError('Signup error. Please try again.');
      showToast('danger', 'Signup error. Please try again.');
    }
  };

  return (
    <section className="py-5">
      <div className="container" style={{ maxWidth: '480px' }}>
        <h1 className="mb-4 text-center">Sign Up</h1>
        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">
              Email <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              Password <span className="text-danger">*</span>
            </label>
            <input
              type="password"
              className="form-control"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Sign Up
          </button>
        </form>

        <p className="mt-3 text-center">
          Already have an account? <Link to="/login">Login here</Link>.
        </p>
      </div>
    </section>
  );
}

export default Signup;
