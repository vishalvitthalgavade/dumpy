export default function Loading() {
  return (
    <main className="shell" aria-busy="true" aria-live="polite">
      <div className="topbar" style={{ height: 68 }}>
        <div className="brand">
          <div className="mark">D</div>
          <div>
            <span className="skeleton-line" style={{ display: "block", width: 120, height: 18 }} />
          </div>
        </div>
      </div>

      <div className="hero" style={{ minHeight: 260 }}>
        <div className="hero-content">
          <span className="skeleton-line" style={{ display: "block", width: 160, height: 24, marginBottom: 16 }} />
          <span className="skeleton-line" style={{ display: "block", width: "80%", height: 40, marginBottom: 12 }} />
          <span className="skeleton-line" style={{ display: "block", width: "60%", height: 20 }} />
        </div>
        <div className="hero-panel">
          <div className="stat-card" style={{ minHeight: 96 }} />
          <div className="stat-card" style={{ minHeight: 96 }} />
        </div>
      </div>

      <div className="grid">
        <section className="shelf-section" style={{ minHeight: 320 }}>
          <span className="skeleton-line" style={{ display: "block", width: 140, height: 20, marginBottom: 16 }} />
          <div className="pdf-list">
            <div className="card content-card" style={{ minHeight: 76 }} />
            <div className="card content-card" style={{ minHeight: 76 }} />
            <div className="card content-card" style={{ minHeight: 76 }} />
          </div>
        </section>
        <section className="shelf-section" style={{ minHeight: 320 }}>
          <span className="skeleton-line" style={{ display: "block", width: 140, height: 20, marginBottom: 16 }} />
          <div className="pdf-list">
            <div className="card content-card" style={{ minHeight: 76 }} />
            <div className="card content-card" style={{ minHeight: 76 }} />
            <div className="card content-card" style={{ minHeight: 76 }} />
          </div>
        </section>
      </div>
    </main>
  );
}
