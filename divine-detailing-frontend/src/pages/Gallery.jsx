// src/pages/Gallery.jsx
import React, { useEffect, useMemo, useState } from 'react';

const BASE_URL = import.meta.env.BASE_URL || '/';
const BATCH_SIZE = 8;
const ROTATE_DELAY = 8000; // ms
const STEP_MS = 100;       // progress update step

function Gallery() {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('All');
  const [currentBatch, setCurrentBatch] = useState(0);
  const [progress, setProgress] = useState(0); // 0–100
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);

  // Load gallery items from data.json
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BASE_URL}data.json`);
        if (!res.ok) throw new Error('Failed to load data.json');
        const json = await res.json();
        setItems(json.gallery || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // All categories
  const categories = useMemo(() => {
    const set = new Set();
    items.forEach(item => {
      (item.categories || []).forEach(c => set.add(c));
    });
    return ['All', ...Array.from(set)];
  }, [items]);

  // Filtered items by current category
  const filteredItems = useMemo(() => {
    if (category === 'All') return items;
    return items.filter(item => (item.categories || []).includes(category));
  }, [items, category]);

  const totalBatches = Math.max(
    1,
    Math.ceil((filteredItems.length || 0) / BATCH_SIZE)
  );

  // Reset rotation when category or list size changes
  useEffect(() => {
    setCurrentBatch(0);
    setProgress(0);
  }, [category, filteredItems.length]);

  // Rotation + progress bar with setInterval
  useEffect(() => {
    // If there is only one batch, no need to rotate
    if (filteredItems.length <= BATCH_SIZE) {
      setProgress(0);
      return;
    }

    if (paused) {
      return; // do nothing while paused
    }

    const stepsPerCycle = ROTATE_DELAY / STEP_MS;  // 8000 / 100 = 80 steps
    const increment = 100 / stepsPerCycle;         // 1.25% per step

    const id = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          setCurrentBatch(prevBatch => (prevBatch + 1) % totalBatches);
          return 0;
        }
        return next;
      });
    }, STEP_MS);

    return () => clearInterval(id);
  }, [paused, filteredItems.length, totalBatches]);

  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);

  // Compute visible items for this batch
  const visibleItems = useMemo(() => {
    if (filteredItems.length === 0) return [];
    const start = currentBatch * BATCH_SIZE;
    const end = start + BATCH_SIZE;
    return filteredItems.slice(start, end);
  }, [filteredItems, currentBatch]);

  const progressPercent = Math.min(100, Math.max(0, progress));

  if (loading) {
    return (
      <section className="py-5 gallery-page">
        <div className="container text-center">
          <div className="spinner-border" role="status" />
          <p className="mt-3">Loading gallery...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-5 gallery-page">
      <div className="container">
        <h1 className="mb-4 text-center">Gallery</h1>
        <p className="text-center mb-4">
          Real vehicles detailed by Divine Detailing. Hover over the gallery to
          pause the automatic rotation. Use the filters to explore different
          types of work.
        </p>

        {/* Filter buttons */}
        <div className="filter-bar mb-4 text-center">
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-btn me-2 mb-2 ${
                category === cat ? 'active' : ''
              }`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Progress bar */}
        {filteredItems.length > BATCH_SIZE && (
          <div className="mb-3">
            <div className="progress" style={{ height: '6px' }}>
              <div
                id="progressBar"
                className="progress-bar"
                style={{ width: `${progressPercent}%` }}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
            <small className="text-muted">
              Rotating through {totalBatches} batches of photos every 8 seconds.
            </small>
          </div>
        )}

        {/* Gallery grid */}
        <div
  id="galleryContainer"
  onMouseEnter={handleMouseEnter}
  onMouseLeave={handleMouseLeave}
>
  {visibleItems.map(item => (
    <div
      key={item.title + (item.image || item.video || '')}
      className="gallery-card card h-100 shadow-sm"
    >
      {item.video ? (
        <video
          src={`${BASE_URL}${item.video.replace('./', '')}`}
          className="card-img-top"
          autoPlay
          muted
          loop
        />
      ) : (
        <img
          src={`${BASE_URL}${(item.image || '').replace('./', '')}`}
          className="card-img-top"
          alt={item.alt || item.title || 'Detailing work'}
        />
      )}
      <div className="card-body">
        <p className="card-text fw-semibold mb-1">{item.title}</p>
        <p className="card-text small mb-1">
          {item.city}, {item.state} ({item.year})
        </p>
        <p className="card-text small mb-1">{item.blurb}</p>
        {item.categories && (
          <small className="text-muted">
            {item.categories.join(' • ')}
          </small>
        )}
      </div>
    </div>
  ))}

  {visibleItems.length === 0 && (
    <p className="text-center mt-4">
      No items for this category yet. Try a different filter.
    </p>
  )}
</div>

      </div>
    </section>
  );
}

export default Gallery;
