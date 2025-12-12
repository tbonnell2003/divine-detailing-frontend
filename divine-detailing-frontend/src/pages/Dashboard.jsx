// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function Dashboard() {
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [newVehicle, setNewVehicle] = useState({
    nickname: '',
    year: '',
    make: '',
    model: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, apptRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/api/auth/me/appointments`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (meRes.ok) {
          const me = await meRes.json();
          setVehicles(me.vehicles || []);
        } else {
          showToast('danger', 'Could not load your profile.');
        }

        if (apptRes.ok) {
          const appts = await apptRes.json();
          setAppointments(appts);
        } else {
          showToast('danger', 'Could not load your appointment history.');
        }
      } catch (err) {
        console.error(err);
        setError('Could not load your data.');
        showToast('danger', 'Could not load your data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      load();
    }
  }, [token, showToast]);

  const handleVehicleChange = e => {
    const { name, value } = e.target;
    setNewVehicle(prev => ({ ...prev, [name]: value }));
  };

  const addVehicle = async e => {
    e.preventDefault();
    const trimmed = {
      nickname: newVehicle.nickname.trim(),
      year: newVehicle.year.trim(),
      make: newVehicle.make.trim(),
      model: newVehicle.model.trim()
    };
    if (!trimmed.year || !trimmed.make || !trimmed.model) return;

    const updated = [...vehicles, trimmed];
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me/vehicles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ vehicles: updated })
      });
      if (res.ok) {
        const me = await res.json();
        setVehicles(me.vehicles || []);
        setNewVehicle({ nickname: '', year: '', make: '', model: '' });
        showToast('success', 'Vehicle saved to your garage.');
      } else {
        showToast('danger', 'Could not save vehicle. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not save vehicles.');
      showToast('danger', 'Could not save vehicles. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const removeVehicle = async index => {
    const updated = vehicles.filter((_, i) => i !== index);
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me/vehicles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ vehicles: updated })
      });
      if (res.ok) {
        const me = await res.json();
        setVehicles(me.vehicles || []);
        showToast('success', 'Vehicle removed from your garage.');
      } else {
        showToast('danger', 'Could not remove vehicle. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not update vehicles.');
      showToast('danger', 'Could not update vehicles. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderStatusBadge = status => {
    let color = 'secondary';
    if (status === 'Pending') color = 'warning';
    else if (status === 'Approved') color = 'primary';
    else if (status === 'Completed') color = 'success';
    else if (status === 'Declined') color = 'danger';

    return <span className={`badge bg-${color}`}>{status}</span>;
  };

  if (loading) {
    return (
      <section className="py-5">
        <div className="container text-center">
          <div className="spinner-border" role="status" />
          <p className="mt-3">Loading your dashboard...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-5">
      <div className="container">
        <h1 className="mb-4">My Garage</h1>
        <p className="mb-4">
          Logged in as <strong>{user.email}</strong>
        </p>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-4">
          {/* Vehicles */}
          <div className="col-md-5">
            <h2 className="h5 mb-3">Saved Vehicles</h2>
            {vehicles.length === 0 && (
              <p className="text-muted">You have not saved any vehicles yet.</p>
            )}
            <ul className="list-group mb-3">
              {vehicles.map((v, idx) => (
                <li
                  key={idx}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>
                    {v.nickname && <strong>{v.nickname}</strong>}{' '}
                    {v.year} {v.make} {v.model}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeVehicle(idx)}
                    disabled={saving}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <form onSubmit={addVehicle}>
              <h3 className="h6 mb-2">Add a Vehicle</h3>
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nickname (optional)"
                  name="nickname"
                  value={newVehicle.nickname}
                  onChange={handleVehicleChange}
                />
              </div>
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Year"
                  name="year"
                  value={newVehicle.year}
                  onChange={handleVehicleChange}
                  required
                />
              </div>
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Make"
                  name="make"
                  value={newVehicle.make}
                  onChange={handleVehicleChange}
                  required
                />
              </div>
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Model"
                  name="model"
                  value={newVehicle.model}
                  onChange={handleVehicleChange}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Vehicle'}
              </button>
            </form>
          </div>

          {/* Appointment history */}
          <div className="col-md-7">
            <h2 className="h5 mb-3">Past & Upcoming Details</h2>
            {appointments.length === 0 ? (
              <p className="text-muted">
                You have not scheduled any appointments while logged in yet.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped align-middle">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Vehicle</th>
                      <th>Service</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(a => {
                      const slotLabel =
                        a.slot === 'AM' ? '7am–12pm' : '12pm–5pm';
                      return (
                        <tr key={a._id}>
                          <td>{a.date}</td>
                          <td>{slotLabel}</td>
                          <td>{a.vehicle}</td>
                          <td>{a.service}</td>
                          <td>${a.total}</td>
                          <td>{renderStatusBadge(a.status)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
