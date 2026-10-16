import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateTextAction } from "@/app/actions";
import { DataNotice } from "@/components/DataNotice";
import { EditIcon, EyeIcon, TextIcon } from "@/components/Icons";
import { SetupNotice } from "@/components/SetupNotice";
import { SubmitButton } from "@/components/SubmitButton";
import { isAdmin } from "@/lib/auth";
import { getMissingConfig } from "@/lib/config";
import { getTextEntry } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditText({
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
  const entry = await getTextEntry(id).catch(() => undefined);

  if (entry === undefined) {
    return <DataNotice />;
  }

  if (!entry) {
    notFound();
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="mark">D</div>
          <div>
            <h1>Edit Text</h1>
            <p>Saved {formatDate(entry.createdAt)}</p>
          </div>
        </div>
        <nav className="nav">
          <Link className="btn" href="/admin">
            Admin
          </Link>
          <Link className="btn" href={`/texts/${entry.id}`}>
            <EyeIcon />
            View
          </Link>
        </nav>
      </header>

      <section className="panel edit-panel">
        {updated === "1" ? (
          <div className="toast">Text updated successfully.</div>
        ) : null}
        <div className="panel-heading">
          <div className="resource-icon text-icon">
            <EditIcon />
          </div>
          <div>
            <p className="kicker">Editor</p>
            <h3>Refine saved text</h3>
          </div>
        </div>
        <form action={updateTextAction} className="form">
          <input name="id" type="hidden" value={entry.id} />
          <label className="field">
            <span>Headline</span>
            <input
              className="input"
              defaultValue={entry.title}
              name="title"
              required
              type="text"
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
          <div className="form-actions">
            <SubmitButton pendingLabel="Saving...">
              <TextIcon />
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
