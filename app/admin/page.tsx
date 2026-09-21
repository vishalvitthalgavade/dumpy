import { redirect } from "next/navigation";
import Link from "next/link";
import { createTextAction, deleteFileAction, deleteTextAction, logoutAction, uploadFileAction } from "@/app/actions";
import { DataNotice } from "@/components/DataNotice";
import { EditIcon, EyeIcon, FileIcon, TextIcon, TrashIcon, UploadIcon } from "@/components/Icons";
import { SetupNotice } from "@/components/SetupNotice";
import { SubmitButton } from "@/components/SubmitButton";
import { getAnalyticsSummary, getFileAnalyticsMap, getTextAnalyticsMap, getTopViewedFiles, getTopViewedTexts } from "@/lib/analytics";
import { isAdmin } from "@/lib/auth";
import { getMissingConfig } from "@/lib/config";
import { getFiles, getTextEntries } from "@/lib/db";
import { formatBytes, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const ACCEPTED = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.md,.rtf,.zip,.rar,.7z,.tar,.gz,.json,.xml,.html,.css,.js,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.h,.hpp,.sql,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp3,.wav,.mp4,.webm,.mov";

function fileKind(name: string) {
  const ext = name.split(".").pop()?.toUpperCase() || "FILE";
  return ext.length > 5 ? "FILE" : ext;
}

export default async function Admin() {
  const missingConfig = getMissingConfig();
  if (missingConfig.length) return <SetupNotice missing={missingConfig} />;
  if (!(await isAdmin())) redirect("/admin/login");

  const [files, textEntries, analytics, fileAnalytics, textAnalytics, topFiles, topTexts] = await Promise.all([
    getFiles(), getTextEntries(), getAnalyticsSummary(), getFileAnalyticsMap(), getTextAnalyticsMap(), getTopViewedFiles(), getTopViewedTexts()
  ]).catch(() => [null, null, null, null, null, null, null] as const);

  if (!files || !textEntries || !analytics || !fileAnalytics || !textAnalytics || !topFiles || !topTexts) return <DataNotice />;

  return (
    <main className="shell admin-shell">
      <header className="topbar admin-topbar">
        <div className="brand"><div className="mark">D</div><div><h1>Admin Yard</h1><p>Manage your library</p></div></div>
        <nav className="nav"><Link className="btn" href="/">Public view</Link><form action={logoutAction}><button className="btn" type="submit">Log out</button></form></nav>
      </header>

      <section className="admin-hero">
        <div><p className="kicker">Control center</p><h2>Everything in your library, at a glance.</h2><p className="muted">Upload files, manage notes, review traffic, and keep your repository organized from one responsive dashboard.</p></div>
        <div className="admin-hero-badge"><UploadIcon /><span><strong>{files.length}</strong> files stored</span></div>
      </section>

      <section className="analytics-grid" aria-label="Visitor analytics">
        <div className="stat-card"><span>Total Unique Visitors</span><strong>{analytics.totalVisitors}</strong></div>
        <div className="stat-card"><span>Today's Visitors</span><strong>{analytics.todayVisitors}</strong></div>
        <div className="stat-card"><span>Unique Content Views</span><strong>{analytics.uniqueContentViews}</strong></div>
        <div className="stat-card"><span>Total Page Views</span><strong>{analytics.pageViews}</strong></div>
        <div className="stat-card"><span>Active Visitors</span><strong>{analytics.activeVisitors}</strong></div>
      </section>

      <div className="admin-grid">
        <section className="panel dashboard-card"><div className="section-title"><div><p className="kicker">Analytics</p><h3>Top Viewed Files</h3></div></div><div className="pdf-list">{topFiles.length ? topFiles.map(item => <article className="card mini-card" key={item.id}><div className="card-copy"><h4>{item.title}</h4><div className="meta-row"><span><EyeIcon /> {item.totalViews} views</span><span>{item.uniqueViews} unique visitors</span></div></div></article>) : <div className="empty"><FileIcon className="empty-icon"/><strong>No file views yet</strong><span>Viewed files will appear here.</span></div>}</div></section>
        <section className="panel dashboard-card"><div className="section-title"><div><p className="kicker">Analytics</p><h3>Top Viewed Texts</h3></div></div><div className="pdf-list">{topTexts.length ? topTexts.map(item => <article className="card mini-card" key={item.id}><div className="card-copy"><h4>{item.title}</h4><div className="meta-row"><span><EyeIcon /> {item.totalViews} views</span><span>{item.uniqueViews} unique visitors</span></div></div></article>) : <div className="empty"><TextIcon className="empty-icon"/><strong>No text views yet</strong><span>Viewed text entries will rank here.</span></div>}</div></section>
      </div>

      <div className="admin-grid admin-compose">
        <section className="panel dashboard-card upload-panel"><div className="panel-heading"><div className="resource-icon upload-icon"><UploadIcon /></div><div><p className="kicker">File vault</p><h3>Upload any supported file</h3><span className="muted">PDF, Word, Excel, PowerPoint, ZIP, images, code, audio, video and more.</span></div></div>
          <form action={uploadFileAction} className="form"><label className="field"><span>Title <em>optional</em></span><input className="input" name="title" placeholder="Leave blank to use filename" type="text" /></label><label className="dropzone"><UploadIcon /><strong>Choose a file</strong><span>Maximum 10 MB per file</span><input accept={ACCEPTED} className="file-input" name="file" required type="file" /></label><SubmitButton pendingLabel="Uploading...">Store File</SubmitButton></form>
        </section>
        <section className="panel dashboard-card"><div className="panel-heading"><div className="resource-icon text-icon"><TextIcon /></div><div><p className="kicker">Notes</p><h3>Save Text</h3></div></div><form action={createTextAction} className="form"><label className="field"><span>Headline</span><input className="input" name="title" placeholder="Text headline" required type="text" /></label><label className="field"><span>Text</span><textarea className="textarea" name="content" placeholder="Paste or write the text you want to access later..." required /></label><SubmitButton pendingLabel="Saving...">Save Text</SubmitButton></form></section>
      </div>

      <section className="management-section"><div className="section-title"><div><p className="kicker">File vault</p><h3>Manage Files</h3></div><span className="count-badge">{files.length} stored</span></div><div className="pdf-list">{files.length ? files.map(file => <article className="card content-card" key={file.id}><div className="resource-icon file-type-icon"><strong>{fileKind(file.fileName)}</strong></div><div className="card-copy"><h4>{file.title}</h4><p>{file.fileName}</p><div className="meta-row"><span>{formatBytes(file.sizeBytes)}</span><span>Uploaded {formatDate(file.createdAt)}</span><span><EyeIcon /> {(fileAnalytics[file.id]?.totalViews ?? 0)} views</span></div></div><div className="card-actions"><a className="icon-btn primary" href={`/api/files/${file.id}`} title="Open file"><EyeIcon /></a><a className="btn compact" href={`/api/files/${file.id}?download=1`}>Download</a><form action={deleteFileAction}><input name="id" type="hidden" value={file.id}/><button className="icon-btn danger" title="Delete file" type="submit"><TrashIcon /></button></form></div></article>) : <div className="empty"><FileIcon className="empty-icon"/><strong>No files stored yet</strong><span>Your uploaded files will appear here.</span></div>}</div></section>

      <section className="management-section"><div className="section-title"><div><p className="kicker">Content</p><h3>Manage Texts</h3></div><span className="count-badge">{textEntries.length} saved</span></div><div className="pdf-list">{textEntries.length ? textEntries.map(entry => <article className="card content-card" key={entry.id}><div className="resource-icon text-icon"><TextIcon /></div><div className="card-copy"><h4>{entry.title}</h4><p>{entry.contentPreview.slice(0,110)}{entry.characterCount > 110 ? "..." : ""}</p><div className="meta-row"><span>{entry.characterCount} characters</span><span>Saved {formatDate(entry.createdAt)}</span><span><EyeIcon /> {(textAnalytics[entry.id]?.totalViews ?? 0)} views</span></div></div><div className="card-actions"><Link className="icon-btn" href={`/texts/${entry.id}`} title="View text"><EyeIcon /></Link><Link className="icon-btn" href={`/admin/texts/${entry.id}/edit`} title="Edit text"><EditIcon /></Link><form action={deleteTextAction}><input name="id" type="hidden" value={entry.id}/><button className="icon-btn danger" title="Delete text" type="submit"><TrashIcon /></button></form></div></article>) : <div className="empty"><TextIcon className="empty-icon"/><strong>No text entries yet</strong><span>Saved entries will appear here.</span></div>}</div></section>
    </main>
  );
}
