export default function AdminLoading() {
  return (
    <main className="shell admin-shell" aria-busy="true" aria-live="polite">
      <div className="topbar admin-topbar" style={{ height: 68 }} />
      <div className="admin-hero" style={{ minHeight: 120 }} />
      <div className="analytics-grid">
        <div className="stat-card" style={{ minHeight: 88 }} />
        <div className="stat-card" style={{ minHeight: 88 }} />
        <div className="stat-card" style={{ minHeight: 88 }} />
        <div className="stat-card" style={{ minHeight: 88 }} />
        <div className="stat-card" style={{ minHeight: 88 }} />
      </div>
      <div className="admin-grid">
        <section className="panel dashboard-card" style={{ minHeight: 220 }} />
        <section className="panel dashboard-card" style={{ minHeight: 220 }} />
      </div>
    </main>
  );
}
