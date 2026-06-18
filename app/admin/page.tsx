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
