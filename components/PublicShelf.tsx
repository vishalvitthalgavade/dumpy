"use client";

import { useMemo, useState } from "react";
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
        <h3>
          <span>PDF</span> Shelf
        </h3>
        <span className="muted">{filtered.length} available</span>
      </div>

      <label className="field shelf-search">
        <span>Search PDFs</span>
        <input
          className="input"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a title or filename"
          type="search"
          value={query}
        />
      </label>

      <div className="pdf-list">
        {filtered.length === 0 ? (
          <div className="empty">
            {pdfs.length === 0
              ? "No PDFs have been uploaded yet."
              : "No PDFs match that search."}
          </div>
        ) : (
          filtered.map((pdf) => (
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
                <a className="btn primary" href={`/api/pdfs/${pdf.id}`}>
                  View
                </a>
                <button
                  className="btn"
                  onClick={() => copyLink(pdf.id)}
                  type="button"
                >
                  {copiedId === pdf.id ? "Copied" : "Copy"}
                </button>
                <a className="btn" href={`/api/pdfs/${pdf.id}?download=1`}>
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
