import Link from "next/link";
import { ArrowIcon, FileIcon, SparkIcon, TextIcon } from "@/components/Icons";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { DataNotice } from "@/components/DataNotice";
import { PublicShelf } from "@/components/PublicShelf";
import { SetupNotice } from "@/components/SetupNotice";
import { TextShelf } from "@/components/TextShelf";
import { getMissingConfig } from "@/lib/config";
import { getPdfs, getTextEntries } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const missingConfig = getMissingConfig();
  if (missingConfig.length > 0) {
    return <SetupNotice missing={missingConfig} />;
  }

  const [pdfs, textEntries] = await Promise.all([
    getPdfs(),
    getTextEntries()
  ]).catch(() => [null, null]);

  if (!pdfs || !textEntries) {
    return <DataNotice />;
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
            Browse uploaded PDFs and saved text entries with crisp metadata,
            fast search, and a calm interface built for reading.
          </p>
          <div className="hero-actions">
            <a className="btn primary" href="#content">
              Explore content
              <ArrowIcon />
            </a>
            <Link className="btn ghost" href="/admin">
              Admin
            </Link>
          </div>
        </div>
        <div className="hero-panel" aria-label="Repository stats">
          <div className="stat-card">
            <div className="resource-icon pdf-icon">
              <FileIcon />
            </div>
            <span>PDF Library</span>
            <strong>{pdfs.length}</strong>
          </div>
          <div className="stat-card">
            <div className="resource-icon text-icon">
              <TextIcon />
            </div>
            <span>Saved Texts</span>
            <strong>{textEntries.length}</strong>
          </div>
        </div>
      </section>

      <div className="grid" id="content">
        <PublicShelf pdfs={pdfs} />
        <TextShelf entries={textEntries} />
      </div>
    </main>
  );
}
