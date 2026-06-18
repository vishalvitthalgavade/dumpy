"use client";

import { useMemo, useState } from "react";
import {
  CopyIcon,
  EyeIcon,
  FileIcon,
  SearchIcon
} from "@/components/Icons";
import { MotionCard, MotionList, MotionPress } from "@/components/MotionPrimitives";
import type { ContentAnalytics } from "@/lib/analytics";
import type { PdfItem } from "@/lib/db";
import { formatShortDate } from "@/lib/format";

export function PublicShelf({
  analyticsById = {},
  pdfs
}: {
  analyticsById?: Record<string, ContentAnalytics>;
  pdfs: PdfItem[];
}) {
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
          <MotionList>
            {filtered.map((pdf, index) => {
              const analytics = analyticsById[pdf.id] ?? {
                totalViews: 0,
                uniqueViews: 0,
                lastViewed: null
              };

              return (
                <MotionCard
                  className="card content-card"
                  delay={Math.min(index * 0.05, 0.25)}
                  key={pdf.id}
                >
                  <div className="resource-icon pdf-icon">
                    <FileIcon />
                  </div>
                  <div className="card-copy">
                    <h4>{pdf.title}</h4>
                    <p>{pdf.fileName}</p>
                    <div className="public-meta-row">
                      <span>
                        <EyeIcon /> {analytics.totalViews} views
                      </span>
                      <span aria-hidden="true">•</span>
                      <span>Saved {formatShortDate(pdf.createdAt)}</span>
                    </div>
                  </div>
                  <div className="card-actions">
                    <MotionPress>
                      <a
                        className="icon-btn primary"
                        href={`/api/pdfs/${pdf.id}`}
                        title="View PDF"
                      >
                        <EyeIcon />
                      </a>
                    </MotionPress>
                    <MotionPress>
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
                    </MotionPress>
                    <MotionPress>
                      <a className="btn compact" href={`/api/pdfs/${pdf.id}?download=1`}>
                        Download
                      </a>
                    </MotionPress>
                  </div>
                </MotionCard>
              );
            })}
          </MotionList>
        )}
      </div>
    </section>
  );
}
