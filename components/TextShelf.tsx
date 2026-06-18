"use client";

import { useMemo, useState } from "react";
import { CopyIcon, EyeIcon, SearchIcon, TextIcon } from "@/components/Icons";
import type { ContentAnalytics } from "@/lib/analytics";
import type { TextEntry } from "@/lib/db";
import { formatShortDate } from "@/lib/format";

export function TextShelf({
  analyticsById = {},
  entries
}: {
  analyticsById?: Record<string, ContentAnalytics>;
  entries: TextEntry[];
}) {
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
      return entries;
    }

    return entries.filter((entry) =>
      `${entry.title} ${entry.contentPreview}`.toLowerCase().includes(cleanQuery)
    );
  }, [entries, query]);

  async function copyText(entry: TextEntry) {
    await navigator.clipboard.writeText(entry.content);
    setCopiedId(entry.id);
    window.setTimeout(() => setCopiedId(null), 1400);
  }

  return (
    <section className="shelf-section">
      <div className="section-title">
        <div>
          <p className="kicker">Notes</p>
          <h3>Text Shelf</h3>
        </div>
        <span className="muted">{filtered.length} saved</span>
      </div>

      <label className="search-field shelf-search">
        <SearchIcon />
        <span className="sr-only">Search text</span>
        <input
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a headline or phrase"
          type="search"
          value={query}
        />
      </label>

      <div className="pdf-list">
        {filtered.length === 0 ? (
          <div className="empty">
            <TextIcon className="empty-icon" />
            <strong>
              {entries.length === 0 ? "No text entries yet" : "No matches found"}
            </strong>
            <span>
              {entries.length === 0
                ? "Saved text will appear here with a readable preview."
                : "Try another headline or phrase."}
            </span>
          </div>
        ) : (
          filtered.map((entry) => {
            const analytics = analyticsById[entry.id] ?? {
              totalViews: 0,
              uniqueViews: 0,
              lastViewed: null
            };

            return (
              <article className="card content-card" key={entry.id}>
                <div className="resource-icon text-icon">
                  <TextIcon />
                </div>
                <div className="card-copy">
                  <h4>{entry.title}</h4>
                  <p>
                    {entry.contentPreview}
                    {entry.characterCount > entry.contentPreview.length ? "..." : ""}
                  </p>
                  <div className="public-meta-row">
                    <span>
                      <EyeIcon /> {analytics.totalViews} views
                    </span>
                    <span aria-hidden="true">•</span>
                    <span>Saved {formatShortDate(entry.createdAt)}</span>
                  </div>
                </div>
                <div className="card-actions">
                  <a className="icon-btn primary" href={`/texts/${entry.id}`} title="View text">
                    <EyeIcon />
                  </a>
                  <button
                    className="icon-btn"
                    onClick={() => copyText(entry)}
                    title="Copy text"
                    type="button"
                  >
                    <CopyIcon />
                    <span className="sr-only">
                      {copiedId === entry.id ? "Copied" : "Copy text"}
                    </span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
