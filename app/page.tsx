import Link from "next/link";
import { ArrowIcon, FileIcon, SparkIcon, TextIcon } from "@/components/Icons";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { PublicShelf } from "@/components/PublicShelf";
import { TextShelf } from "@/components/TextShelf";
import { AnimatedCounter, MotionCard, MotionPress } from "@/components/MotionPrimitives";
import { getFiles, getTextEntries } from "@/lib/db";
import { getFileAnalyticsMap, getTextAnalyticsMap } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function Home() {
  let pdfs = [];
  let textEntries = [];
  let pdfAnalytics = {};
  let textAnalytics = {};

  try {
    [pdfs, textEntries, pdfAnalytics, textAnalytics] = await Promise.all([
      getFiles(),
      getTextEntries(),
      getFileAnalyticsMap(),
      getTextAnalyticsMap()
    ]);
  } catch {
    // The public landing page must remain accessible even when the database
    // or analytics service is temporarily unavailable.
  }

  return (
    <main className="shell">
      <AnalyticsTracker path="/" />
      <header className="topbar">
        <div className="brand">
          <div className="mark">D</div>
          <div>
            <h1>Dumpyard</h1>
            <p>Public knowledge shelf</p>
          </div>
        </div>
        <nav className="nav">
          <Link className="btn" href="/admin">
            Admin
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">
            <SparkIcon />
            Curated repository
          </div>
          <h2>Everything worth keeping, organized in one polished shelf.</h2>
          <p>
            Browse uploaded files and saved text entries with crisp metadata, fast
            search, downloads, and a calm interface built for reading.
          </p>
          <div className="hero-actions">
            <MotionPress>
              <a className="btn primary" href="#content">
                Explore content
                <ArrowIcon />
              </a>
            </MotionPress>
            <MotionPress>
              <Link className="btn ghost" href="/admin">
                Admin
              </Link>
            </MotionPress>
          </div>
        </div>
        <div className="hero-panel" aria-label="Repository stats">
          <MotionCard as="div" className="stat-card">
            <div className="resource-icon pdf-icon">
              <FileIcon />
            </div>
            <span>File Library</span>
            <strong>
              <AnimatedCounter value={pdfs.length} />
            </strong>
          </MotionCard>
          <MotionCard as="div" className="stat-card" delay={0.05}>
            <div className="resource-icon text-icon">
              <TextIcon />
            </div>
            <span>Saved Texts</span>
            <strong>
              <AnimatedCounter value={textEntries.length} />
            </strong>
          </MotionCard>
        </div>
      </section>

      <div className="grid" id="content">
        <PublicShelf analyticsById={pdfAnalytics} pdfs={pdfs} />
        <TextShelf analyticsById={textAnalytics} entries={textEntries} />
      </div>
    </main>
  );
}
