import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { DataNotice } from "@/components/DataNotice";
import { TextIcon } from "@/components/Icons";
import { SetupNotice } from "@/components/SetupNotice";
import { getMissingConfig } from "@/lib/config";
import { getTextEntry } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TextView({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const missingConfig = getMissingConfig();
  if (missingConfig.length > 0) {
    return <SetupNotice missing={missingConfig} />;
  }

  const { id } = await params;
  const entry = await getTextEntry(id).catch(() => undefined);

  if (entry === undefined) {
    return <DataNotice />;
  }

  if (!entry) {
    notFound();
  }

  return (
    <main className="shell">
      <AnalyticsTracker path={`/texts/${entry.id}`} />
      <header className="topbar">
        <div className="brand">
          <div className="mark">D</div>
          <div>
            <h1>Dumpyard</h1>
            <p>{formatDate(entry.createdAt)}</p>
          </div>
        </div>
        <nav className="nav">
          <Link className="btn" href="/">
            Back
          </Link>
          <Link className="btn" href="/admin">
            Admin
          </Link>
        </nav>
      </header>

      <article className="text-document">
        <div className="document-meta">
          <div className="resource-icon text-icon">
            <TextIcon />
          </div>
          <span>Saved {formatDate(entry.createdAt)}</span>
        </div>
        <h2>{entry.title}</h2>
        <div className="note-body">{entry.content}</div>
      </article>
    </main>
  );
}
