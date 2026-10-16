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
        <nav className="nav"><Link className="btn" href="/admin/login">Admin</Link></nav>
      </header>
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">A simple, shared library</div>
          <h2>Files and notes, all in one place.</h2>
          <p>Browse, search, and download the resources saved to this shelf.</p>
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
