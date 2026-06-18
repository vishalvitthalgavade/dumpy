"use client";

import { useMemo, useState } from "react";
import { CopyIcon, EyeIcon, FileIcon, SearchIcon } from "@/components/Icons";
import type { PdfItem } from "@/lib/db";
import { formatBytes, formatDate } from "@/lib/format";

export function PublicShelf({ pdfs }: { pdfs: PdfItem[] }) {
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
      return pdfs;
    }

    return pdfs.filter((pdf) =>
      `${pdf.title} ${pdf.fileName}`.toLowerCase().includes(cleanQuery)
    );
  }, [pdfs, query]);

  async function copyLink(id: string) {
    const link = `${window.location.origin}/api/pdfs/${id}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1400);
  }

  return (
    <section className="shelf-section">
      <div className="section-title">
        <div>
          <p className="kicker">Library</p>
          <h3>PDF Shelf</h3>
        </div>
        <span className="muted">{filtered.length} available</span>
      </div>

      <label className="search-field shelf-search">
        <SearchIcon />
        <span className="sr-only">Search PDFs</span>
        <input
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a title or filename"
          type="search"
          value={query}
        />
      </label>

      <div className="pdf-list">
        {filtered.length === 0 ? (
          <div className="empty">
            <FileIcon className="empty-icon" />
            <strong>{pdfs.length === 0 ? "No PDFs yet" : "No matches found"}</strong>
            <span>
              {pdfs.length === 0
                ? "Uploaded files will appear here with their size and time."
                : "Try a different title or filename."}
            </span>
          </div>
        ) : (
          filtered.map((pdf) => (
            <article className="card content-card" key={pdf.id}>
              <div className="resource-icon pdf-icon">
                <FileIcon />
              </div>
              <div className="card-copy">
                <h4>{pdf.title}</h4>
                <p>{pdf.fileName}</p>
                <div className="meta-row">
                  <span>{formatBytes(pdf.sizeBytes)}</span>
                  <span>Uploaded {formatDate(pdf.createdAt)}</span>
                </div>
              </div>
              <div className="card-actions">
                <a className="icon-btn primary" href={`/api/pdfs/${pdf.id}`} title="View PDF">
                  <EyeIcon />
                </a>
                <button
                  className="icon-btn"
                  onClick={() => copyLink(pdf.id)}
                  title="Copy link"
                  type="button"
                >
                  <CopyIcon />
                  <span className="sr-only">
                    {copiedId === pdf.id ? "Copied" : "Copy link"}
                  </span>
                </button>
                <a className="btn compact" href={`/api/pdfs/${pdf.id}?download=1`}>
                  Download
                </a>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
