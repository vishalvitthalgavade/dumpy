import Link from "next/link";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { PublicShelf } from "@/components/PublicShelf";
import { TextShelf } from "@/components/TextShelf";
import { DataNotice } from "@/components/DataNotice";
import { SetupNotice } from "@/components/SetupNotice";
import { getMissingConfig } from "@/lib/config";
import { getFiles, getTextEntries } from "@/lib/db";
import { getFileAnalyticsMap, getTextAnalyticsMap } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function Home() {
  const missingConfig = getMissingConfig();
  if (missingConfig.length) return <SetupNotice missing={missingConfig} />;

  let files;
  let texts;
  let fileAnalytics;
  let textAnalytics;
  try {
    [files, texts, fileAnalytics, textAnalytics] = await Promise.all([
      getFiles(), getTextEntries(), getFileAnalyticsMap(), getTextAnalyticsMap()
    ]);
  } catch (error) {
    console.error("[home] failed to load shelf", error);
    return <DataNotice />;
  }

  return (
    <main className="shell">
      <AnalyticsTracker path="/" />
      <header className="topbar">
        <div className="brand"><div className="mark">D</div><div><h1>Dumpyard</h1><p>Your shared files and notes</p></div></div>
        <nav aria-label="Main navigation" className="nav public-nav">
          <a className="nav-link" href="#files">Files</a>
          <a className="nav-link" href="#texts">Notes</a>
          <Link className="btn compact" href="/admin/login">Admin</Link>
        </nav>
      </header>
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">A simple, shared library</div>
          <h2>Your resources, ready when you need them.</h2>
          <p>Browse a thoughtfully organized collection of shared files and notes. Search, sort, preview, and download from any device.</p>
          <div className="hero-actions"><a className="btn primary" href="#files">Browse files</a><a className="btn" href="#texts">Read notes</a></div>
        </div>
        <div className="hero-panel"><div className="stat-card"><strong>{files.length}</strong><span>Files available</span></div><div className="stat-card"><strong>{texts.length}</strong><span>Saved notes</span></div></div>
      </section>
      <div className="grid">
        <div id="files"><PublicShelf analyticsById={fileAnalytics} pdfs={files} /></div>
        <div id="texts"><TextShelf analyticsById={textAnalytics} entries={texts} /></div>
      </div>
    </main>
  );
}
