"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EditIcon, EyeIcon, SearchIcon, TextIcon, TrashIcon } from "@/components/Icons";
import type { ContentAnalytics } from "@/lib/analytics";
import type { TextEntry } from "@/lib/db";
import { formatDate } from "@/lib/format";

export function AdminTextList({
  analyticsById,
  deleteAction,
  entries
}: {
  analyticsById: Record<string, ContentAnalytics>;
  deleteAction: (formData: FormData) => void;
  entries: TextEntry[];
}) {
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
    <section className="management-section">
      <div className="section-title">
        <div>
          <p className="kicker">Content</p>
          <h3>Manage Texts</h3>
        </div>
        <span className="count-badge">{entries.length} saved</span>
      </div>

      {entries.length > 0 ? (
        <label className="search-field shelf-search">
          <SearchIcon />
          <span className="sr-only">Search text entries</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by headline or content"
            type="search"
            value={query}
          />
        </label>
      ) : null}

      <div className="pdf-list">
        {filtered.length ? (
          filtered.map((entry) => (
            <article className="card content-card" key={entry.id}>
              <div className="resource-icon text-icon">
                <TextIcon />
              </div>
              <div className="card-copy">
                <h4>{entry.title}</h4>
                <p>
                  {entry.contentPreview.slice(0, 110)}
                  {entry.characterCount > 110 ? "..." : ""}
                </p>
                <div className="meta-row">
                  <span>{entry.characterCount} characters</span>
                  <span>Saved {formatDate(entry.createdAt)}</span>
                  <span>
                    <EyeIcon /> {analyticsById[entry.id]?.totalViews ?? 0} views
                  </span>
                </div>
              </div>
              <div className="card-actions">
                <Link className="icon-btn" href={`/texts/${entry.id}`} title="View text">
                  <EyeIcon />
                </Link>
                <Link className="icon-btn" href={`/admin/texts/${entry.id}/edit`} title="Edit text">
                  <EditIcon />
                </Link>
                <form action={deleteAction}>
                  <input name="id" type="hidden" value={entry.id} />
                  <button className="icon-btn danger" title="Delete text" type="submit">
                    <TrashIcon />
                  </button>
                </form>
              </div>
            </article>
          ))
        ) : (
          <div className="empty">
            <TextIcon className="empty-icon" />
            <strong>{entries.length === 0 ? "No text entries yet" : "No matches found"}</strong>
            <span>
              {entries.length === 0
                ? "Saved entries will appear here."
                : "Try another headline or phrase."}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
