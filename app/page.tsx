import Link from "next/link";
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
      <header className="topbar">
        <div className="brand">
          <div className="mark">D</div>
          <div>
            <h1>Dumpyard</h1>
            <p>Public PDFs and saved text.</p>
          </div>
        </div>
        <nav className="nav">
          <Link className="btn" href="/admin">
            Admin
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div className="eyebrow">Dumpyard</div>
        <h2>Read what has been stored.</h2>
        <p>
          Browse the public shelf of uploaded PDFs and saved text entries from
          one quiet place.
        </p>
        <div className="stats">
          <div className="stat">
            <strong>{pdfs.length}</strong>
            <span>PDFs</span>
          </div>
          <div className="stat">
            <strong>{textEntries.length}</strong>
            <span>Texts</span>
          </div>
        </div>
      </section>

      <div className="grid">
        <PublicShelf pdfs={pdfs} />
        <TextShelf entries={textEntries} />
      </div>
    </main>
  );
}
