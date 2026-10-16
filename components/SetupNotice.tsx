export function SetupNotice({ missing }: { missing: string[] }) {
  return (
    <main className="login">
      <section className="panel">
        <div className="brand" style={{ marginBottom: 22 }}>
          <div className="mark">D</div>
          <div>
            <h1>Dumpyard</h1>
            <p>Configuration needed</p>
          </div>
        </div>
        <p className="notice">
          Add these environment variables before using the live shelf:{" "}
          {missing.join(", ")}.
        </p>
        <p className="muted">
          Copy `.env.example` to `.env.local`, fill the values, run the database
          migration, then restart the app.
        </p>
      </section>
    </main>
  );
}
