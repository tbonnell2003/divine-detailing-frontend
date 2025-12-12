// src/pages/Admin.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function Admin() {
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [appointments, setAppointments] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const minDate = new Date().toISOString().split('T')[0];

  const authHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const apptsRes = await fetch(`${API_BASE_URL}/api/appointments`, {
        headers: authHeaders
      });
      const apptsJson = await apptsRes.json();

      const blockedRes = await fetch(
        `${API_BASE_URL}/api/availability/blocked-dates`,
        { headers: authHeaders }
      );
      const blockedJson = await blockedRes.json();

      if (!apptsRes.ok) {
        throw new Error(apptsJson.error || 'Failed to load appointments.');
      }
      if (!blockedRes.ok) {
        throw new Error(blockedJson.error || 'Failed to load blocked dates.');
      }

      setAppointments(apptsJson || []);
      setBlockedDates(blockedJson.blockedDates || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load admin data.');
      showToast('danger', 'Failed to load admin data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const handleBlockDate = async e => {
    e.preventDefault();
    if (!newBlockDate) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/availability/block-day`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          date: newBlockDate,
          reason: newBlockReason || 'Unavailable'
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Could not block date.');
      }

      setNewBlockDate('');
      setNewBlockReason('');
      await loadData();
      showToast('success', `Blocked ${json.date || newBlockDate} for bookings.`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not block date.');
      showToast('danger', 'Could not block that date. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnblockDate = async date => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/availability/block-day/${date}`,
        {
          method: 'DELETE',
          headers: authHeaders
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Could not unblock date.');
      }

      await loadData();
      showToast('success', `Unblocked ${date}.`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not unblock date.');
      showToast('danger', 'Could not unblock that date. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, action) => {
    setSaving(true);
    setError('');
    try {
      let url = '';
      let options = {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: null
      };

      if (action === 'approve') {
        url = `${API_BASE_URL}/api/appointments/${id}/approve`;
      } else if (action === 'complete') {
        url = `${API_BASE_URL}/api/appointments/${id}/complete`;
      } else if (action === 'decline') {
        url = `${API_BASE_URL}/api/appointments/${id}/decline`;
        const reason = window.prompt(
          'Optional: Enter a reason for declining this appointment:',
          ''
        );
        options.body = JSON.stringify({ reason: reason || '' });
      }

      const res = await fetch(url, options);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Could not update status.');
      }

      await loadData();

      if (action === 'approve') {
        showToast('success', 'Appointment approved.');
      } else if (action === 'complete') {
        showToast('success', 'Appointment marked as completed.');
      } else if (action === 'decline') {
        showToast('warning', 'Appointment declined.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not update appointment status.');
      showToast('danger', 'Could not update appointment status.');
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

  if (!user || user.role !== 'admin') {
    return (
      <section className="py-5">
        <div className="container">
          <h1 className="mb-4">Admin</h1>
          <div className="alert alert-warning">
            You must be logged in as an admin to view this page.
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="py-5">
        <div className="container text-center">
          <div className="spinner-border" role="status" />
          <p className="mt-3">Loading admin data...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-5">
      <div className="container">
        <h1 className="mb-4">Admin Dashboard</h1>
        <p className="mb-4">
          Logged in as <strong>{user.email}</strong>
        </p>

        {error && <div className="alert alert-danger mb-3">{error}</div>}

        <div className="row g-4">
          {/* Blocked dates management */}
          <div className="col-md-5">
            <h2 className="h5 mb-3">Block / Unblock Days</h2>

            <form onSubmit={handleBlockDate} className="mb-3">
              <div className="mb-2">
                <label className="form-label">
                  Date to Block <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  min={minDate}
                  value={newBlockDate}
                  onChange={e => setNewBlockDate(e.target.value)}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="form-label">Reason (optional)</label>
                <input
                  type="text"
                  className="form-control"
                  value={newBlockReason}
                  onChange={e => setNewBlockReason(e.target.value)}
                  placeholder="Vacation, busy, weather, etc."
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Block Day'}
              </button>
            </form>

            <h3 className="h6 mt-4">Currently Blocked / Fully Booked Dates</h3>
            {blockedDates.length === 0 ? (
              <p className="text-muted">No fully blocked days.</p>
            ) : (
              <ul className="list-group">
                {blockedDates.map(date => (
                  <li
                    key={date}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <span>{date}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleUnblockDate(date)}
                      disabled={saving}
                    >
                      Unblock
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Appointments table */}
          <div className="col-md-7">
            <h2 className="h5 mb-3">All Appointments</h2>
            {appointments.length === 0 ? (
              <p className="text-muted">No appointments yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped align-middle">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Name</th>
                      <th>Vehicle</th>
                      <th>Service</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Actions</th>
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
                          <td>{a.name}</td>
                          <td>{a.vehicle}</td>
                          <td>{a.service}</td>
                          <td>${a.total}</td>
                          <td>{renderStatusBadge(a.status)}</td>
                          <td>
                            {a.status === 'Pending' && (
                              <>
                                <button
                                  className="btn btn-sm btn-success me-1"
                                  disabled={saving}
                                  onClick={() =>
                                    updateStatus(a._id, 'approve')
                                  }
                                >
                                  Approve
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  disabled={saving}
                                  onClick={() =>
                                    updateStatus(a._id, 'decline')
                                  }
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            {a.status === 'Approved' && (
                              <>
                                <button
                                  className="btn btn-sm btn-primary me-1"
                                  disabled={saving}
                                  onClick={() =>
                                    updateStatus(a._id, 'complete')
                                  }
                                >
                                  Complete
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  disabled={saving}
                                  onClick={() =>
                                    updateStatus(a._id, 'decline')
                                  }
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            {a.status === 'Declined' && a.declineReason && (
                              <small className="text-muted d-block mt-1">
                                Reason: {a.declineReason}
                              </small>
                            )}
                          </td>
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

export default Admin;
