"use client";

import { useMemo, useState } from "react";
import type { TextEntry } from "@/lib/db";
import { formatDate } from "@/lib/format";

export function TextShelf({ entries }: { entries: TextEntry[] }) {
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
        <h3>
          <span>Text</span> Shelf
        </h3>
        <span className="muted">{filtered.length} saved</span>
      </div>

      <label className="field shelf-search">
        <span>Search text</span>
        <input
          className="input"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a headline or phrase"
          type="search"
          value={query}
        />
      </label>

      <div className="pdf-list">
        {filtered.length === 0 ? (
          <div className="empty">
            {entries.length === 0
              ? "No text entries have been saved yet."
              : "No text entries match that search."}
          </div>
        ) : (
          filtered.map((entry) => (
            <article className="card" key={entry.id}>
              <div className="text-icon">TXT</div>
              <div>
                <h4>{entry.title}</h4>
                <p>
                  {entry.contentPreview}
                  {entry.characterCount > entry.contentPreview.length ? "..." : ""} -{" "}
                  {formatDate(entry.createdAt)}
                </p>
              </div>
              <div className="card-actions">
                <a className="btn primary" href={`/texts/${entry.id}`}>
                  View
                </a>
                <button
                  className="btn"
                  onClick={() => copyText(entry)}
                  type="button"
                >
                  {copiedId === entry.id ? "Copied" : "Copy"}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
