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
import { SetupNotice } from "@/components/SetupNotice";
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
            <p>Upload, write what everyone else can view.</p>
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
        <section className="panel">
          <h3>Upload PDF</h3>
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
            <label className="field">
              <span>PDF file</span>
              <input
                accept="application/pdf"
                className="file-input"
                name="file"
                required
                type="file"
              />
            </label>
            <button className="btn primary" type="submit">
              Upload PDF
            </button>
          </form>
        </section>

        <section className="panel">
          <h3>Save Text</h3>
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
            <button className="btn primary" type="submit">
              Save Text
            </button>
          </form>
        </section>
      </div>

      <section style={{ marginTop: 18 }}>
        <div className="section-title">
          <h3>Manage PDFs</h3>
          <span className="muted">{pdfs.length} stored</span>
        </div>
        <div className="pdf-list">
          {pdfs.length === 0 ? (
            <div className="empty">No PDFs to manage yet.</div>
          ) : (
            pdfs.map((pdf) => (
              <article className="card" key={pdf.id}>
                <div className="pdf-icon">PDF</div>
                <div>
                  <h4>{pdf.title}</h4>
                  <p>
                    {formatBytes(pdf.sizeBytes)} - Uploaded{" "}
                    {formatDate(pdf.createdAt)}
                  </p>
                </div>
                <div className="card-actions">
                  <a className="btn" href={`/api/pdfs/${pdf.id}`}>
                    View
                  </a>
                  <form action={deletePdfAction}>
                    <input name="id" type="hidden" value={pdf.id} />
                    <button className="btn danger" type="submit">
                      Delete
                    </button>
                  </form>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <div className="section-title">
          <h3>Manage Texts</h3>
          <span className="muted">{textEntries.length} saved</span>
        </div>
        <div className="pdf-list">
          {textEntries.length === 0 ? (
            <div className="empty">No text entries to manage yet.</div>
          ) : (
            textEntries.map((entry) => (
              <article className="card" key={entry.id}>
                <div className="text-icon">TXT</div>
                <div>
                  <h4>{entry.title}</h4>
                  <p>
                    {entry.contentPreview.slice(0, 110)}
                    {entry.characterCount > 110 ? "..." : ""} - Saved{" "}
                    {formatDate(entry.createdAt)}
                  </p>
                </div>
                <div className="card-actions">
                  <Link className="btn" href={`/texts/${entry.id}`}>
                    View
                  </Link>
                  <Link className="btn" href={`/admin/texts/${entry.id}/edit`}>
                    Edit
                  </Link>
                  <form action={deleteTextAction}>
                    <input name="id" type="hidden" value={entry.id} />
                    <button className="btn danger" type="submit">
                      Delete
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
