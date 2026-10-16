import Link from "next/link";
import { redirect } from "next/navigation";
import { createTextAction, deleteFileAction, deleteTextAction, logoutAction, uploadFileAction } from "@/app/actions";
import { AdminFileList } from "@/components/AdminFileList";
import { AdminTextList } from "@/components/AdminTextList";
import { SubmitButton } from "@/components/SubmitButton";
import { SetupNotice } from "@/components/SetupNotice";
import { getMissingConfig } from "@/lib/config";
import { isAdmin } from "@/lib/auth";
import { getFiles, getTextEntries, getTotalStorageBytes } from "@/lib/db";
import { getAnalyticsSummary, getFileAnalyticsMap, getTextAnalyticsMap } from "@/lib/analytics";
import { formatBytes } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const missing = getMissingConfig();
  if (missing.length) return <SetupNotice missing={missing} />;
  if (!(await isAdmin())) redirect("/admin/login");

  let files; let texts; let storage; let summary; let fileAnalytics; let textAnalytics;
  try {
    [files, texts, storage, summary, fileAnalytics, textAnalytics] = await Promise.all([
      getFiles(), getTextEntries(), getTotalStorageBytes(), getAnalyticsSummary(), getFileAnalyticsMap(), getTextAnalyticsMap()
    ]);
  } catch (error) {
    console.error("[admin] failed to load dashboard", error);
    return <main className="shell"><section className="panel"><h2>Dashboard temporarily unavailable</h2><p className="muted">The database could not be reached. Check DATABASE_URL and try again.</p></section></main>;
  }

  return <main className="shell admin-shell">
    <header className="topbar admin-topbar"><div className="brand"><div className="mark">D</div><div><h1>Dumpyard</h1><p>Admin workspace</p></div></div><nav className="nav"><Link className="btn" href="/">View public shelf</Link><form action={logoutAction}><button className="btn" type="submit">Sign out</button></form></nav></header>
    <section className="admin-hero"><div><p className="kicker">Control room</p><h2>Manage your shelf</h2><p className="muted">Add files and notes, and keep the public library up to date.</p></div><div className="admin-hero-badge"><strong>{formatBytes(storage)}</strong><span>File storage used</span></div></section>
    <section className="analytics-grid">
      {[ ["Visitors", summary.totalVisitors], ["Today", summary.todayVisitors], ["Active now", summary.activeVisitors], ["Content views", summary.uniqueContentViews], ["Page views", summary.pageViews] ].map(([label, value]) => <div className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}
    </section>
    <div className="admin-grid admin-compose">
      <section className="panel upload-panel"><div className="panel-heading"><div><p className="kicker">Upload</p><h3>Add a file</h3></div></div>
        <form action={uploadFileAction} className="form">
          <label className="field"><span>Title <em>(optional)</em></span><input className="input" name="title" placeholder="Use the filename by default" /></label>
          <label className="dropzone"><strong>Choose a file to add</strong><span>Documents, images, audio, video, archives, and code files up to 10 MB</span><input className="file-input" name="file" required type="file" /></label>
          <SubmitButton pendingLabel="Uploading...">Upload file</SubmitButton>
        </form>
      </section>
      <section className="panel"><div className="panel-heading"><div><p className="kicker">Compose</p><h3>Save a text note</h3></div></div>
        <form action={createTextAction} className="form"><label className="field"><span>Headline</span><input className="input" name="title" required /></label><label className="field"><span>Text</span><textarea className="textarea" name="content" required /></label><SubmitButton pendingLabel="Saving...">Save note</SubmitButton></form>
      </section>
    </div>
    <AdminFileList analyticsById={fileAnalytics} deleteAction={deleteFileAction} files={files} />
    <AdminTextList analyticsById={textAnalytics} deleteAction={deleteTextAction} entries={texts} />
  </main>;
}
