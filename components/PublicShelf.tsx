"use client";

import { useMemo, useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  EyeIcon,
  FileIcon,
  SearchIcon
} from "@/components/Icons";
import { MotionCard, MotionList, MotionPress } from "@/components/MotionPrimitives";
import type { ContentAnalytics } from "@/lib/analytics";
import type { StoredFile } from "@/lib/db";
import { formatShortDate } from "@/lib/format";

type SortOrder = "newest" | "oldest" | "views";

export function PublicShelf({
  analyticsById = {},
  pdfs
}: {
  analyticsById?: Record<string, ContentAnalytics>;
  pdfs: StoredFile[];
}) {
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const filtered = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const matches = !cleanQuery
      ? pdfs
      : pdfs.filter((pdf) =>
          `${pdf.title} ${pdf.fileName}`.toLowerCase().includes(cleanQuery)
        );

    const sorted = [...matches];
    if (sortOrder === "oldest") {
      sorted.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else if (sortOrder === "views") {
      sorted.sort(
        (a, b) =>
          (analyticsById[b.id]?.totalViews ?? 0) -
          (analyticsById[a.id]?.totalViews ?? 0)
      );
    } else {
      sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return sorted;
  }, [pdfs, query, sortOrder, analyticsById]);

  async function copyLink(id: string) {
    const link = `${window.location.origin}/api/files/${id}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1400);
  }

  return (
    <section className="shelf-section">
      <div className="section-title">
        <div>
          <p className="kicker">Library</p>
          <h3>File Shelf</h3>
        </div>
        <span className="muted">{filtered.length} available</span>
      </div>

      <div className="shelf-toolbar">
        <label className="search-field">
          <SearchIcon />
          <span className="sr-only">Search files</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type a title or filename"
            type="search"
            value={query}
          />
        </label>
        <select
          aria-label="Sort files"
          className="sort-select"
          onChange={(event) => setSortOrder(event.target.value as SortOrder)}
          value={sortOrder}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="views">Most viewed</option>
        </select>
      </div>

      <div className="pdf-list">
        {filtered.length === 0 ? (
          <div className="empty">
            <FileIcon className="empty-icon" />
            <strong>{pdfs.length === 0 ? "No files yet" : "No matches found"}</strong>
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
                  <div className="resource-icon file-type-icon"><strong>{pdf.fileName.split(".").pop()?.toUpperCase() || "FILE"}</strong></div>
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
                        href={`/api/files/${pdf.id}`}
                        title="Open file"
                      >
                        <EyeIcon />
                      </a>
                    </MotionPress>
                    <MotionPress>
                      <button
                        className={
                          copiedId === pdf.id ? "icon-btn copied" : "icon-btn"
                        }
                        onClick={() => copyLink(pdf.id)}
                        title={copiedId === pdf.id ? "Copied" : "Copy link"}
                        type="button"
                      >
                        {copiedId === pdf.id ? <CheckIcon /> : <CopyIcon />}
                        <span className="sr-only">
                          {copiedId === pdf.id ? "Copied" : "Copy link"}
                        </span>
                      </button>
                    </MotionPress>
                    <MotionPress>
                      <a className="btn compact" href={`/api/files/${pdf.id}?download=1`}>
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
