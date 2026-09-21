import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateFileAction } from "@/app/actions";
import { DataNotice } from "@/components/DataNotice";
import { EditIcon, EyeIcon, FileIcon } from "@/components/Icons";
import { SetupNotice } from "@/components/SetupNotice";
import { SubmitButton } from "@/components/SubmitButton";
import { isAdmin } from "@/lib/auth";
import { getMissingConfig } from "@/lib/config";
import { getFileMeta } from "@/lib/db";
import { formatBytes, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditFile({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const missingConfig = getMissingConfig();
  if (missingConfig.length > 0) {
    return <SetupNotice missing={missingConfig} />;
  }

  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const { updated } = await searchParams;
  const file = await getFileMeta(id).catch(() => undefined);

  if (file === undefined) {
    return <DataNotice />;
  }

  if (!file) {
    notFound();
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="mark">D</div>
          <div>
            <h1>Edit File</h1>
            <p>Uploaded {formatDate(file.createdAt)}</p>
          </div>
        </div>
        <nav className="nav">
          <Link className="btn" href="/admin">
            Admin
          </Link>
          <Link className="btn" href={`/api/files/${file.id}`}>
            <EyeIcon />
            Open
          </Link>
        </nav>
      </header>

      <section className="panel edit-panel">
        {updated === "1" ? (
          <div className="toast">File updated successfully.</div>
        ) : null}
        <div className="panel-heading">
          <div className="resource-icon file-type-icon">
            <FileIcon />
          </div>
          <div>
            <p className="kicker">File vault</p>
            <h3>Rename stored file</h3>
          </div>
        </div>
        <p className="muted">
          {file.fileName} &middot; {formatBytes(file.sizeBytes)}
        </p>
        <form action={updateFileAction} className="form">
          <input name="id" type="hidden" value={file.id} />
          <label className="field">
            <span>Title</span>
            <input
              className="input"
              defaultValue={file.title}
              name="title"
              required
              type="text"
            />
          </label>
          <div className="form-actions">
            <SubmitButton pendingLabel="Saving...">
              <EditIcon />
              Save Changes
            </SubmitButton>
            <Link className="btn" href="/admin">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
