import Link from "next/link";

export function DataNotice() {
  return (
    <main className="login">
      <section className="panel">
        <div className="brand" style={{ marginBottom: 22 }}>
          <div className="mark">D</div>
          <div>
            <h1>Dumpyard</h1>
            <p>Database unavailable</p>
          </div>
        </div>
        <p className="notice">
          Dumpyard could not reach the database right now. Check the Neon
          connection string, database password, and whether the Neon project is
          awake.
        </p>
        <Link className="btn primary" href="/">
          Retry
        </Link>
      </section>
    </main>
  );
}
