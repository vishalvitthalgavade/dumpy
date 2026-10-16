import Link from "next/link";
import { ArrowIcon, SparkIcon } from "@/components/Icons";

export default function NotFound() {
  return (
    <main className="login">
      <section className="panel auth-card" style={{ textAlign: "center" }}>
        <div className="brand auth-brand" style={{ justifyContent: "center" }}>
          <div className="mark">D</div>
          <div style={{ textAlign: "left" }}>
            <h1>Dumpyard</h1>
            <p>Page not found</p>
          </div>
        </div>
        <div className="eyebrow" style={{ margin: "0 auto 12px" }}>
          <SparkIcon />
          404
        </div>
        <p className="muted" style={{ margin: "0 0 22px" }}>
          The page you&apos;re looking for doesn&apos;t exist, may have been moved, or
          was deleted from the shelf.
        </p>
        <Link className="btn primary" href="/" style={{ justifyContent: "center" }}>
          Back to the shelf
          <ArrowIcon />
        </Link>
      </section>
    </main>
  );
}
