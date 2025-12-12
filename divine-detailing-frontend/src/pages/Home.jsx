// src/pages/Home.jsx
import React, { useEffect, useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const BASE_URL = import.meta.env.BASE_URL || '/';

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function Home() {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [availabilitySummary, setAvailabilitySummary] = useState({}); // dateStr -> { slots, blocked }
  const [availableSlots, setAvailableSlots] = useState({ AM: true, PM: true });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Limit booking to next 60 days
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);
  const maxDateStr = formatDate(maxDate);

  // Calendar month (first of month)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  // Refs for smooth scrolling
  const packagesRef = useRef(null);
  const scheduleRef = useRef(null);

  const scrollToPackages = () =>
    packagesRef.current?.scrollIntoView({ behavior: 'smooth' });

  const scrollToSchedule = () =>
    scheduleRef.current?.scrollIntoView({ behavior: 'smooth' });

  // Form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    vehicle: '',
    condition: 'Daily Driver',
    service: '',
    date: '',
    slot: 'AM',
    addons: []
  });

  // Init EmailJS
  useEffect(() => {
    emailjs.init('kAmeXSNfzH1VLBaHZ');
  }, []);

  // Load data.json
  useEffect(() => {
    const fetchData = async () => {
      try {
        const dataRes = await fetch(`${BASE_URL}data.json`);
        if (!dataRes.ok) throw new Error('Failed to load data.json');
        const json = await dataRes.json();
        setData(json);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Unable to load site data. Please try again later.');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Load availability summary for the current calendar month
  const refreshSummaryForCurrentMonth = async () => {
    try {
      const start = new Date(calendarMonth);
      const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);

      const startStr = formatDate(start);
      const endStr = formatDate(end);

      const res = await fetch(
        `${API_BASE_URL}/api/availability/summary?start=${startStr}&end=${endStr}`
      );
      if (!res.ok) {
        console.warn('Could not load availability summary.');
        return;
      }
      const json = await res.json();
      const map = {};
      (json.days || []).forEach(day => {
        map[day.date] = day;
      });
      setAvailabilitySummary(map);
    } catch (err) {
      console.error('Error loading availability summary:', err);
    }
  };

  useEffect(() => {
    refreshSummaryForCurrentMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarMonth]);

  const packages = data?.packages || [];
  const addons = data?.addons || [];
  const highlights = data?.highlights || [];
  const faqs = data?.faqs || [];

  const selectedPackage = packages.find(p => p.name === form.service);
  const selectedAddons = addons.filter(a => form.addons.includes(a.name));

  const total = (() => {
    let t = selectedPackage ? selectedPackage.price : 0;
    selectedAddons.forEach(a => {
      t += a.price;
    });
    return t;
  })();

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddonToggle = addonName => {
    setForm(prev => {
      const currentAddons = Array.isArray(prev.addons) ? prev.addons : [];
      const exists = currentAddons.includes(addonName);

      return {
        ...prev,
        addons: exists
          ? currentAddons.filter(a => a !== addonName)
          : [...currentAddons, addonName]
      };
    });
  };

  const handleMonthChange = direction => {
    // direction: -1 for previous, +1 for next
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    newMonth.setDate(1);

    // Optional: prevent going far beyond maxDate or before today - 1 month
    const earliest = new Date(today);
    earliest.setMonth(earliest.getMonth() - 1);
    earliest.setDate(1);

    if (newMonth > maxDate) return;
    if (newMonth < earliest) return;

    setCalendarMonth(newMonth);
  };

  const handleDateSelect = dateObj => {
    const dateStr = formatDate(dateObj);

    // Outside allowed range
    if (dateObj < today || dateObj > maxDate) {
      showToast('warning', 'You can only book within the next 60 days.');
      return;
    }

    const dayInfo = availabilitySummary[dateStr];

    if (!dayInfo) {
      // No info → assume both slots free
      setAvailableSlots({ AM: true, PM: true });
      setForm(prev => ({ ...prev, date: dateStr }));
      return;
    }

    const { slots, blocked } = dayInfo;
    const amAvail = slots?.AM ?? true;
    const pmAvail = slots?.PM ?? true;
    const isFullyBooked = !blocked && !amAvail && !pmAvail;
    const isAdminBlocked = blocked && dayInfo?.adminBlocked;


    if (isAdminBlocked || isFullyBooked) {
      showToast(
        'warning',
        'That date is fully booked or blocked. Please choose another day.'
      );
      return;
    }

    setAvailableSlots({ AM: amAvail, PM: pmAvail });

    // If current slot not available, switch to the other one
    let newSlot = form.slot;
    if (!slots[form.slot]) {
      newSlot = amAvail ? 'AM' : 'PM';
    }

    setForm(prev => ({ ...prev, date: dateStr, slot: newSlot }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      service: form.service,
      vehicle: form.vehicle.trim(),
      condition: form.condition,
      date: form.date,
      slot: form.slot,
      addons: form.addons,
      total,
      createdAt: new Date().toISOString()
    };

    try {
      if (!payload.date) {
        showToast('warning', 'Please select a date for your appointment.');
        setSubmitting(false);
        return;
      }

      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Backend error:', text);
        throw new Error('Failed to save appointment.');
      }

      // EmailJS (best effort)
      try {
        await emailjs.send(
          'service_divinedetailing',
          'template_divinedetailing',
          payload
        );
      } catch (emailErr) {
        console.error('EmailJS error:', emailErr);
      }

      const prev = JSON.parse(localStorage.getItem('requests') || '[]');
      localStorage.setItem('requests', JSON.stringify([...prev, payload]));

      const slotLabel =
        payload.slot === 'AM' ? '7am–12pm' : '12pm–5pm';

      showToast(
        'success',
        `Thanks, ${payload.name}! Your ${payload.vehicle} (${payload.condition}) has been scheduled for ${payload.date} (${slotLabel}).`
      );

      setForm({
        name: '',
        email: '',
        vehicle: '',
        condition: 'Daily Driver',
        service: '',
        date: '',
        slot: 'AM',
        addons: []
      });
      setAvailableSlots({ AM: true, PM: true });

      // Refresh calendar availability for the visible month
      await refreshSummaryForCurrentMonth();
    } catch (err) {
      console.error(err);
      setError('We could not submit your appointment. Please try again.');
      showToast(
        'danger',
        'We could not submit your appointment. Please try again or contact me directly.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth(); // 0-based

    const firstOfMonth = new Date(year, month, 1);
    const firstDayIndex = firstOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weeks = [];
    let currentDay = 1 - firstDayIndex; // can be negative for leading blanks

    while (currentDay <= daysInMonth) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const dateObj = new Date(year, month, currentDay);
        const inThisMonth =
          dateObj.getMonth() === month && currentDay >= 1 && currentDay <= daysInMonth;

        let cell = null;

        if (inThisMonth) {
          const dateStr = formatDate(dateObj);
          const dayInfo = availabilitySummary[dateStr];
          const isPast = dateObj < new Date(today.toDateString());
          const isAfterWindow = dateObj > maxDate;

          let amAvail = true;
          let pmAvail = true;
          let blocked = false;

          if (dayInfo) {
            amAvail = dayInfo.slots?.AM ?? true;
            pmAvail = dayInfo.slots?.PM ?? true;
            blocked = dayInfo.blocked;
          }

          const isAdminBlocked = blocked && dayInfo?.adminBlocked === true;
          const isFullyBooked = blocked && !isAdminBlocked;

          const isPartial =
            !blocked &&
            ((amAvail && !pmAvail) || (!amAvail && pmAvail));

          const isSelected = form.date === dateStr;

          const isDisabled = isPast || isAfterWindow || isAdminBlocked || isFullyBooked;

          const classNames = [
            'calendar-day',
            isDisabled ? 'calendar-day-disabled' : '',
            isSelected ? 'calendar-day-selected' : '',
            isPartial ? 'calendar-day-partial' : '',
            isAdminBlocked ? 'calendar-day-admin-blocked' : '',
            isFullyBooked ? 'calendar-day-fully-booked' : ''
          ]
            .filter(Boolean)
            .join(' ');

          cell = (
            <button
              key={dateStr}
              type="button"
              className={classNames}
              onClick={() => !isDisabled && handleDateSelect(dateObj)}
              disabled={isDisabled}
            >
              <div className="calendar-day-number">{dateObj.getDate()}</div>
              {isPartial && <div className="calendar-day-dot">•</div>}
            </button>
          );
        } else {
          // Empty cell
          cell = <div key={`empty-${year}-${month}-${currentDay}-${i}`} className="calendar-day empty" />;
        }

        week.push(cell);
        currentDay++;
      }
      weeks.push(
        <div className="calendar-week" key={`week-${year}-${month}-${currentDay}`}>
          {week}
        </div>
      );
    }

    const monthLabel = calendarMonth.toLocaleString('default', {
      month: 'long',
      year: 'numeric'
    });

    return (
      <div className="booking-calendar">
        <div className="calendar-header">
          <button
            type="button"
            className="btn btn-sm btn-outline-light me-2"
            onClick={() => handleMonthChange(-1)}
          >
            ‹
          </button>
          <span className="calendar-month-label">{monthLabel}</span>
          <button
            type="button"
            className="btn btn-sm btn-outline-light ms-2"
            onClick={() => handleMonthChange(1)}
          >
            ›
          </button>
        </div>
        <div className="calendar-grid">
          <div className="calendar-week calendar-weekdays">
            <div className="calendar-weekday">Sun</div>
            <div className="calendar-weekday">Mon</div>
            <div className="calendar-weekday">Tue</div>
            <div className="calendar-weekday">Wed</div>
            <div className="calendar-weekday">Thu</div>
            <div className="calendar-weekday">Fri</div>
            <div className="calendar-weekday">Sat</div>
          </div>
          {weeks}
        </div>
        <div className="calendar-legend mt-2">
          <span className="legend-item">
            <span className="legend-box available" /> Available (both slots open)
          </span>
          <span className="legend-item">
            <span className="legend-box partial" /> One slot left
          </span>
          <span className="legend-item">
            <span className="legend-box unavailable" /> Not bookable
          </span>
        </div>
        <small className="text-muted d-block mt-1">
          Booking is available up to {maxDateStr}.
        </small>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
        <p className="mt-3">Loading Divine Detailing...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <>
      {/* HERO */}
      <section className="hero d-flex align-items-center">
        <div className="container text-center text-lg-start">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <h1 className="display-4 fw-bold text-white mb-3">
                Divine Detailing
              </h1>
              <p className="lead text-white-50">
                Premium mobile auto detailing for Platteville and the
                surrounding area. We bring the shine to you.
              </p>

              <button
                className="btn btn-primary btn-lg me-2"
                onClick={scrollToSchedule}
              >
                Schedule an Appointment
              </button>

              <button
                className="btn btn-outline-light btn-lg"
                onClick={scrollToPackages}
              >
                View Packages
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PACKAGES */}
      <section id="packages" ref={packagesRef} className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-4">Detailing Packages</h2>
          <div className="row g-4">
            {packages.map(pkg => (
              <div className="col-md-6 col-lg-4" key={pkg.id}>
                <div className="card h-100 shadow-sm service-card">
                  {pkg.image && (
                    <img
                      src={`${BASE_URL}${pkg.image.replace('./', '')}`}
                      className="card-img-top"
                      alt={pkg.name}
                    />
                  )}
                  <div className="card-body d-flex flex-column">
                    <h3 className="h5 card-title">{pkg.name}</h3>
                    <p className="card-text">{pkg.description}</p>
                    <p className="fw-semibold mb-1">${pkg.price}</p>
                    {pkg.attributes && (
                      <small className="text-muted">
                        Protection: {pkg.attributes.protection} | Lasts ~
                        {pkg.attributes.duration_weeks} weeks
                      </small>
                    )}
                    <button
                      type="button"
                      className="btn btn-outline-primary mt-3 mt-auto"
                      onClick={() =>
                        setForm(prev => ({ ...prev, service: pkg.name }))
                      }
                    >
                      Select for Booking
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      {highlights.length > 0 && (
        <section className="py-5">
          <div className="container">
            <h2 className="text-center mb-4">Why Clients Choose Divine</h2>
            <div className="row g-4">
              {highlights.map(h => (
                <div className="col-md-4" key={h.title}>
                  <div className="p-4 bg-white rounded shadow-sm h-100">
                    <h3 className="h5 mb-2">{h.title}</h3>
                    <p className="mb-0">{h.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="py-5 bg-light">
          <div className="container">
            <h2 className="text-center mb-4">Frequently Asked Questions</h2>
            <div className="accordion" id="faqAccordion">
              {faqs.map((faq, idx) => (
                <div className="accordion-item" key={idx}>
                  <h2 className="accordion-header" id={`heading${idx}`}>
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#collapse${idx}`}
                    >
                      {faq.question}
                    </button>
                  </h2>
                  <div
                    id={`collapse${idx}`}
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body">{faq.answer}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SCHEDULE FORM */}
      <section id="schedule" ref={scheduleRef} className="py-5">
        <div className="container">
          <h2 className="text-center mb-4">Schedule an Appointment</h2>

          {error && data && (
            <div className="alert alert-warning mb-3">
              {error} You can also contact me directly via Instagram.
            </div>
          )}

          <form
            className="mx-auto"
            style={{ maxWidth: '900px' }}
            onSubmit={handleSubmit}
          >
            <div className="row g-4">
              {/* Left column: contact & vehicle */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Vehicle (Year, Make, Model){' '}
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    name="vehicle"
                    value={form.vehicle}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Condition <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="condition"
                    value={form.condition}
                    onChange={handleChange}
                  >
                    <option>Daily Driver</option>
                    <option>Well Maintained</option>
                    <option>Needs Extra Love</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Select Service <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    required
                    name="service"
                    value={form.service}
                    onChange={handleChange}
                  >
                    <option value="">Choose a package...</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.name}>
                        {pkg.name} (${pkg.price})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Addons */}
                {addons.length > 0 && (
                  <div className="mb-3">
                    <label className="form-label">Add-Ons (optional)</label>
                    <div className="row g-2">
                      {addons.map(addon => (
                        <div className="col-sm-6" key={addon.name}>
                          <div className="form-check addon-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={addon.name}
                              checked={form.addons.includes(addon.name)}
                              onChange={() => handleAddonToggle(addon.name)}
                            />
                            <label
                              className="form-check-label"
                              htmlFor={addon.name}
                            >
                              {addon.name} (+${addon.price})
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="fw-semibold mb-3">Total: ${total}</p>
              </div>

              {/* Right column: calendar & time window */}
              <div className="col-md-6">
                <label className="form-label d-block">
                  Choose a Date <span className="text-danger">*</span>
                </label>
                {renderCalendar()}

                <div className="mt-3">
                  <label className="form-label">
                    Preferred Time Window <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="slot"
                    value={form.slot}
                    onChange={handleChange}
                    disabled={!form.date}
                  >
                    <option value="AM" disabled={!availableSlots.AM}>
                      Morning (7am-12pm){!availableSlots.AM ? ' — Full' : ''}
                    </option>
                    <option value="PM" disabled={!availableSlots.PM}>
                      Afternoon (12pm-5pm){!availableSlots.PM ? ' — Full' : ''}
                    </option>
                  </select>
                  {!form.date && (
                    <small className="text-muted">
                      Choose a date first to see available time windows.
                    </small>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 mt-4"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

export default Home;
