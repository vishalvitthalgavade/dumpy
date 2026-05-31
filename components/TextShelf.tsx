"use client";

import { useMemo, useState } from "react";
import { CopyTextButton } from "@/components/CopyTextButton";
import type { TextEntry } from "@/lib/db";
import { formatDate } from "@/lib/format";

export function TextShelf({ entries }: { entries: TextEntry[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
      return entries;
    }

    return entries.filter((entry) =>
      `${entry.title} ${entry.contentPreview}`.toLowerCase().includes(cleanQuery)
    );
  }, [entries, query]);

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
                <div className="text-preview-row">
                  <p>
                    {entry.contentPreview}
                    {entry.characterCount > entry.contentPreview.length ? "..." : ""} -{" "}
                    {entry.updatedAt !== entry.createdAt ? "Updated " : "Created "}
                    {formatDate(entry.updatedAt ?? entry.createdAt)}
                  </p>
                  <CopyTextButton content={entry.content} />
                </div>
              </div>
              <div className="card-actions">
                <a className="btn primary" href={`/texts/${entry.id}`}>
                  View
                </a>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
