// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed.');
        showToast('danger', data.error || 'Login failed. Check your credentials.');
        return;
      }

      login(data.user, data.token);
      showToast('success', `Welcome back, ${data.user.email}!`);

      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('Login error. Please try again.');
      showToast('danger', 'Login error. Please try again.');
    }
  };

  return (
    <section className="py-5">
      <div className="container" style={{ maxWidth: '480px' }}>
        <h1 className="mb-4 text-center">Login</h1>
        {error && <div className="alert alert-danger">{error}</div>}

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
            Login
          </button>
        </form>

        <p className="mt-3 text-center">
          Need an account? <Link to="/signup">Sign up here</Link>.
        </p>
      </div>
    </section>
  );
}

export default Login;
