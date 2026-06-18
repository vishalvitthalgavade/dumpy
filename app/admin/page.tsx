import { redirect } from "next/navigation";
import Link from "next/link";
import {
  createTextAction,
  deletePdfAction,
  deleteTextAction,
  logoutAction,
  uploadPdfAction
} from "@/app/actions";
import { DataNotice } from "@/components/DataNotice";
import {
  EditIcon,
  EyeIcon,
  FileIcon,
  TextIcon,
  TrashIcon,
  UploadIcon
} from "@/components/Icons";
import { SetupNotice } from "@/components/SetupNotice";
import { SubmitButton } from "@/components/SubmitButton";
import {
  getAnalyticsSummary,
  getPdfAnalyticsMap,
  getTextAnalyticsMap,
  getTopViewedPdfs,
  getTopViewedTexts
} from "@/lib/analytics";
import { isAdmin } from "@/lib/auth";
import { getMissingConfig } from "@/lib/config";
import { getPdfs, getTextEntries } from "@/lib/db";
import { formatBytes, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const missingConfig = getMissingConfig();
  if (missingConfig.length > 0) {
    return <SetupNotice missing={missingConfig} />;
  }

  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const [
    pdfs,
    textEntries,
    analytics,
    pdfAnalytics,
    textAnalytics,
    topPdfs,
    topTexts
  ] = await Promise.all([
    getPdfs(),
    getTextEntries(),
    getAnalyticsSummary(),
    getPdfAnalyticsMap(),
    getTextAnalyticsMap(),
    getTopViewedPdfs(),
    getTopViewedTexts()
  ]).catch(() => [null, null, null, null, null, null, null]);

  if (
    !pdfs ||
    !textEntries ||
    !analytics ||
    !pdfAnalytics ||
    !textAnalytics ||
    !topPdfs ||
    !topTexts
  ) {
    return <DataNotice />;
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="mark">D</div>
          <div>
            <h1>Admin Yard</h1>
            <p>Manage public content</p>
          </div>
        </div>
        <nav className="nav">
          <Link className="btn" href="/">
            Public view
          </Link>
          <form action={logoutAction}>
            <button className="btn" type="submit">
              Log out
            </button>
          </form>
        </nav>
      </header>

      <section className="analytics-grid" aria-label="Visitor analytics">
        <div className="stat-card">
          <span>Total Unique Visitors</span>
          <strong>{analytics.totalVisitors}</strong>
        </div>
        <div className="stat-card">
          <span>Today's Visitors</span>
          <strong>{analytics.todayVisitors}</strong>
        </div>
        <div className="stat-card">
          <span>Unique Content Views</span>
          <strong>{analytics.uniqueContentViews}</strong>
        </div>
        <div className="stat-card">
          <span title="Page Views count page visits after duplicate filtering.">
            Total Page Views
          </span>
          <strong>{analytics.pageViews}</strong>
        </div>
        <div className="stat-card">
          <span>Active Visitors</span>
          <strong>{analytics.activeVisitors}</strong>
        </div>
      </section>

      <div className="admin-grid">
        <section className="panel dashboard-card">
          <div className="section-title">
            <div>
              <p className="kicker">Analytics</p>
              <h3>Top Viewed PDFs</h3>
            </div>
          </div>
          <div className="pdf-list">
            {topPdfs.length === 0 ? (
              <div className="empty">
                <FileIcon className="empty-icon" />
                <strong>No PDF views yet</strong>
                <span>Viewed PDFs will rank here.</span>
              </div>
            ) : (
              topPdfs.map((item) => (
                <article className="card mini-card" key={item.id}>
                  <div className="card-copy">
                    <h4>{item.title}</h4>
                    <div className="meta-row">
                      <span>
                        <EyeIcon /> {item.totalViews} views
                      </span>
                      <span>
                        {item.uniqueViews} unique visitors
                      </span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="panel dashboard-card">
          <div className="section-title">
            <div>
              <p className="kicker">Analytics</p>
              <h3>Top Viewed Text Entries</h3>
            </div>
          </div>
          <div className="pdf-list">
            {topTexts.length === 0 ? (
              <div className="empty">
                <TextIcon className="empty-icon" />
                <strong>No text views yet</strong>
                <span>Viewed text entries will rank here.</span>
              </div>
            ) : (
              topTexts.map((item) => (
                <article className="card mini-card" key={item.id}>
                  <div className="card-copy">
                    <h4>{item.title}</h4>
                    <div className="meta-row">
                      <span>
                        <EyeIcon /> {item.totalViews} views
                      </span>
                      <span>{item.uniqueViews} unique visitors</span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="admin-grid">
        <section className="panel dashboard-card">
          <div className="panel-heading">
            <div className="resource-icon pdf-icon">
              <UploadIcon />
            </div>
            <div>
              <p className="kicker">Files</p>
              <h3>Upload PDF</h3>
            </div>
          </div>
          <form action={uploadPdfAction} className="form">
            <label className="field">
              <span>Title</span>
              <input
                className="input"
                name="title"
                placeholder="Optional title"
                type="text"
              />
            </label>
            <label className="dropzone">
              <UploadIcon />
              <strong>Drop a PDF here or browse</strong>
              <span>Maximum upload size is 10 MB.</span>
              <input
                accept="application/pdf"
                className="file-input"
                name="file"
                required
                type="file"
              />
            </label>
            <SubmitButton pendingLabel="Uploading...">
              Upload PDF
            </SubmitButton>
          </form>
        </section>

        <section className="panel dashboard-card">
          <div className="panel-heading">
            <div className="resource-icon text-icon">
              <TextIcon />
            </div>
            <div>
              <p className="kicker">Notes</p>
              <h3>Save Text</h3>
            </div>
          </div>
          <form action={createTextAction} className="form">
            <label className="field">
              <span>Headline</span>
              <input
                className="input"
                name="title"
                placeholder="Text headline"
                required
                type="text"
              />
            </label>
            <label className="field">
              <span>Text</span>
              <textarea
                className="textarea"
                name="content"
                placeholder="Paste or write the text you want to access later..."
                required
              />
            </label>
            <SubmitButton pendingLabel="Saving...">
              Save Text
            </SubmitButton>
          </form>
        </section>
      </div>

      <section className="management-section">
        <div className="section-title">
          <div>
            <p className="kicker">Content</p>
            <h3>Manage PDFs</h3>
          </div>
          <span className="muted">{pdfs.length} stored</span>
        </div>
        <div className="pdf-list">
          {pdfs.length === 0 ? (
            <div className="empty">
              <FileIcon className="empty-icon" />
              <strong>No PDFs to manage yet</strong>
              <span>New uploads will show here immediately.</span>
            </div>
          ) : (
            pdfs.map((pdf) => (
              <article className="card content-card" key={pdf.id}>
                <div className="resource-icon pdf-icon">
                  <FileIcon />
                </div>
                <div className="card-copy">
                  <h4>{pdf.title}</h4>
                  <div className="meta-row">
                    <span>{formatBytes(pdf.sizeBytes)}</span>
                    <span>Uploaded {formatDate(pdf.createdAt)}</span>
                    <span>
                      <EyeIcon /> {(pdfAnalytics[pdf.id]?.totalViews ?? 0)} views
                    </span>
                    <span>{pdfAnalytics[pdf.id]?.uniqueViews ?? 0} unique visitors</span>
                    <span>
                      Last viewed{" "}
                      {pdfAnalytics[pdf.id]?.lastViewed
                        ? formatDate(pdfAnalytics[pdf.id].lastViewed)
                        : "Never"}
                    </span>
                  </div>
                </div>
                <div className="card-actions">
                  <a className="icon-btn" href={`/api/pdfs/${pdf.id}`} title="View PDF">
                    <EyeIcon />
                  </a>
                  <form action={deletePdfAction}>
                    <input name="id" type="hidden" value={pdf.id} />
                    <button className="icon-btn danger" title="Delete PDF" type="submit">
                      <TrashIcon />
                    </button>
                  </form>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="management-section">
        <div className="section-title">
          <div>
            <p className="kicker">Content</p>
            <h3>Manage Texts</h3>
          </div>
          <span className="muted">{textEntries.length} saved</span>
        </div>
        <div className="pdf-list">
          {textEntries.length === 0 ? (
            <div className="empty">
              <TextIcon className="empty-icon" />
              <strong>No text entries to manage yet</strong>
              <span>Saved entries will appear here for editing and deletion.</span>
            </div>
          ) : (
            textEntries.map((entry) => (
              <article className="card content-card" key={entry.id}>
                <div className="resource-icon text-icon">
                  <TextIcon />
                </div>
                <div className="card-copy">
                  <h4>{entry.title}</h4>
                  <p>
                    {entry.contentPreview.slice(0, 110)}
                    {entry.characterCount > 110 ? "..." : ""}
                  </p>
                  <div className="meta-row">
                    <span>{entry.characterCount} characters</span>
                    <span>Saved {formatDate(entry.createdAt)}</span>
                    <span>
                      <EyeIcon /> {(textAnalytics[entry.id]?.totalViews ?? 0)} views
                    </span>
                    <span>{textAnalytics[entry.id]?.uniqueViews ?? 0} unique visitors</span>
                    <span>
                      Last viewed{" "}
                      {textAnalytics[entry.id]?.lastViewed
                        ? formatDate(textAnalytics[entry.id].lastViewed)
                        : "Never"}
                    </span>
                  </div>
                </div>
                <div className="card-actions">
                  <Link className="icon-btn" href={`/texts/${entry.id}`} title="View text">
                    <EyeIcon />
                  </Link>
                  <Link
                    className="icon-btn"
                    href={`/admin/texts/${entry.id}/edit`}
                    title="Edit text"
                  >
                    <EditIcon />
                  </Link>
                  <form action={deleteTextAction}>
                    <input name="id" type="hidden" value={entry.id} />
                    <button className="icon-btn danger" title="Delete text" type="submit">
                      <TrashIcon />
                    </button>
                  </form>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
