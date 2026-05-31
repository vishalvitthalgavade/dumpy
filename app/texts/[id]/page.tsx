import Link from "next/link";
import { notFound } from "next/navigation";
import { updateTextAction } from "@/app/actions";
import { CopyTextButton } from "@/components/CopyTextButton";
import { DataNotice } from "@/components/DataNotice";
import { SetupNotice } from "@/components/SetupNotice";
import { isAdmin } from "@/lib/auth";
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

  const admin = await isAdmin();

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="mark">D</div>
          <div>
            <h1>Dumpyard</h1>
            <p>
              Created {formatDate(entry.createdAt)}
              {entry.updatedAt !== entry.createdAt
                ? ` - Updated ${formatDate(entry.updatedAt)}`
                : ""}
            </p>
          </div>
        </div>
        <nav className="nav">
          <CopyTextButton content={entry.content} />
          <Link className="btn" href={admin ? "/admin" : "/"}>
            Back
          </Link>
          {admin ? null : (
            <Link className="btn" href="/admin">
              Admin
            </Link>
          )}
        </nav>
      </header>

      <article className="text-document">
        {admin ? (
          <form action={updateTextAction} className="form">
            <input name="id" type="hidden" value={entry.id} />
            <label className="field">
              <span>Headline</span>
              <input
                className="input"
                defaultValue={entry.title}
                name="title"
                required
              />
            </label>
            <label className="field">
              <span>Text</span>
              <textarea
                className="textarea"
                defaultValue={entry.content}
                name="content"
                required
              />
            </label>
            <div className="card-actions">
              <CopyTextButton content={entry.content} />
              <button className="btn primary" type="submit">
                Save changes
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="text-document-heading">
              <h2>{entry.title}</h2>
              <CopyTextButton content={entry.content} />
            </div>
            <div className="note-body">{entry.content}</div>
          </>
        )}
      </article>
    </main>
  );
}
