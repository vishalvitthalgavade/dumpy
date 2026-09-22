"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EditIcon, EyeIcon, FileIcon, SearchIcon, TrashIcon } from "@/components/Icons";
import type { ContentAnalytics } from "@/lib/analytics";
import type { StoredFile } from "@/lib/db";
import { formatBytes, formatDate } from "@/lib/format";

function fileKind(name: string) {
  const ext = name.split(".").pop()?.toUpperCase() || "FILE";
  return ext.length > 5 ? "FILE" : ext;
}

export function AdminFileList({
  analyticsById,
  deleteAction,
  files
}: {
  analyticsById: Record<string, ContentAnalytics>;
  deleteAction: (formData: FormData) => void;
  files: StoredFile[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
      return files;
    }
    return files.filter((file) =>
      `${file.title} ${file.fileName}`.toLowerCase().includes(cleanQuery)
    );
  }, [files, query]);

  return (
    <section className="management-section">
      <div className="section-title">
        <div>
          <p className="kicker">File vault</p>
          <h3>Manage Files</h3>
        </div>
        <span className="count-badge">{files.length} stored</span>
      </div>

      {files.length > 0 ? (
        <label className="search-field shelf-search">
          <SearchIcon />
          <span className="sr-only">Search files</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by title or filename"
            type="search"
            value={query}
          />
        </label>
      ) : null}

      <div className="pdf-list">
        {filtered.length ? (
          filtered.map((file) => (
            <article className="card content-card" key={file.id}>
              <div className="resource-icon file-type-icon">
                <strong>{fileKind(file.fileName)}</strong>
              </div>
              <div className="card-copy">
                <h4>{file.title}</h4>
                <p>{file.fileName}</p>
                <div className="meta-row">
                  <span>{formatBytes(file.sizeBytes)}</span>
                  <span>Uploaded {formatDate(file.createdAt)}</span>
                  <span>
                    <EyeIcon /> {analyticsById[file.id]?.totalViews ?? 0} views
                  </span>
                </div>
              </div>
              <div className="card-actions">
                <a aria-label="Open file" className="icon-btn primary" href={`/api/files/${file.id}`} title="Open file">
                  <EyeIcon />
                </a>
                <Link aria-label="Rename file" className="icon-btn" href={`/admin/files/${file.id}/edit`} title="Rename file">
                  <EditIcon />
                </Link>
                <a className="btn compact" href={`/api/files/${file.id}?download=1`}>
                  Download
                </a>
                <form action={deleteAction}>
                  <input name="id" type="hidden" value={file.id} />
                  <button aria-label="Delete file" className="icon-btn danger" title="Delete file" type="submit">
                    <TrashIcon />
                  </button>
                </form>
              </div>
            </article>
          ))
        ) : (
          <div className="empty">
            <FileIcon className="empty-icon" />
            <strong>{files.length === 0 ? "No files stored yet" : "No matches found"}</strong>
            <span>
              {files.length === 0
                ? "Your uploaded files will appear here."
                : "Try a different title or filename."}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
