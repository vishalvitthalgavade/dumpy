"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const MAX_FILE_SIZE = 200 * 1024 * 1024;

function uploadTitle(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
}

export function FileUploader({ storageReady }: { storageReady: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  function selectFile(nextFile: File | null) {
    setMessage("");
    setError(false);
    if (nextFile && nextFile.size > MAX_FILE_SIZE) {
      window.alert("This file is larger than 200 MB. Choose a smaller file to continue.");
      if (inputRef.current) inputRef.current.value = "";
      setFile(null);
      return;
    }
    setFile(nextFile);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || busy) return;
    if (file.size > MAX_FILE_SIZE) {
      window.alert("This file is larger than 200 MB. Choose a smaller file to continue.");
      return;
    }

    setBusy(true);
    setProgress(0);
    setMessage("Preparing secure upload…");
    setError(false);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        multipart: file.size > 4 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => {
          setProgress(percentage);
          setMessage(`Uploading ${Math.round(percentage)}%`);
        }
      });

      setMessage("Saving file details…");
      const response = await fetch("/api/blob/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: blob.url,
          fileName: file.name,
          title: title.trim() || uploadTitle(file.name)
        })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "The file uploaded but could not be added to the shelf.");

      if (inputRef.current) inputRef.current.value = "";
      setFile(null);
      setTitle("");
      setProgress(null);
      setMessage("Upload complete. Your file is on the shelf.");
      router.refresh();
    } catch (uploadError) {
      setError(true);
      setMessage(uploadError instanceof Error ? uploadError.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="form" onSubmit={submit}>
    <label className="field">
      <span>Title <em>(optional)</em></span>
      <input className="input" onChange={(event) => setTitle(event.target.value)} placeholder="Use the filename by default" value={title} />
    </label>
    <label className="dropzone">
      <strong>{file ? "File ready to upload" : "Choose a file to add"}</strong>
      <span>{file ? file.name : "Documents, images, audio, video, archives, and code files up to 200 MB"}</span>
      <input accept="*/*" className="file-input" disabled={busy} onChange={(event) => selectFile(event.target.files?.[0] ?? null)} ref={inputRef} required={!file} type="file" />
      {file ? <span>{(file.size / (1024 * 1024)).toFixed(1)} MB selected</span> : null}
    </label>
    {!storageReady ? <p className="notice" role="status">Connect a Vercel Blob store to enable uploads up to 200 MB.</p> : null}
    {busy ? <div className="upload-progress" aria-live="polite">
      <div className="upload-progress-label"><span>{message}</span><strong>{Math.round(progress ?? 0)}%</strong></div>
      <progress max="100" value={progress ?? 0} />
    </div> : null}
    {message && !busy ? <p className={error ? "toast error" : "toast"} role={error ? "alert" : "status"}>{message}</p> : null}
    <button className="btn primary" disabled={busy || !file || !storageReady} type="submit">{busy ? "Uploading…" : "Upload file"}</button>
  </form>;
}
