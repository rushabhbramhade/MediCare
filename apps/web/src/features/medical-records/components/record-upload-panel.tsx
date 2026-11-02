"use client";

import { FileCheck2, FileWarning, Upload } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { StatusNote } from "@/components/shared/status-note";
import {
  ALLOWED_RECORD_MIME_TYPES,
  MAX_RECORD_BYTES,
  medicalRecordUploadSchema,
} from "@medicare/validators";
import { formatBytes } from "@/lib/format";

export function RecordUploadPanel() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [valid, setValid] = useState(false);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName(null);
      setValid(false);
      setError(null);
      return;
    }

    setFileName(file.name);
    const parsed = medicalRecordUploadSchema.safeParse({
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });

    if (!parsed.success) {
      setValid(false);
      setError(parsed.error.issues[0]?.message ?? "This file cannot be uploaded.");
      return;
    }

    setValid(true);
    setError(null);
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="font-semibold">Add a document</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF, JPEG, PNG, WebP or HEIC, up to {formatBytes(MAX_RECORD_BYTES)}. Files are checked
          locally before anything is sent.
        </p>
      </div>

      <label
        htmlFor="record-file"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/40 px-4 py-8 text-center hover:bg-muted"
      >
        <Upload aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">Choose a file</span>
        <span className="text-xs text-muted-foreground">Nothing leaves this device</span>
        <input
          id="record-file"
          type="file"
          className="sr-only"
          accept={ALLOWED_RECORD_MIME_TYPES.join(",")}
          onChange={handleFile}
        />
      </label>

      {fileName ? (
        <p className="text-sm text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{fileName}</span>
        </p>
      ) : null}

      {error ? (
        <StatusNote variant="warning" title="This file cannot be used">
          {error}
        </StatusNote>
      ) : null}

      {valid && !error ? (
        <StatusNote variant="success" title="File passes local checks">
          {fileName} is an accepted type and size. It was not uploaded: private document storage is
          not configured in this build.
        </StatusNote>
      ) : null}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <FileCheck2 aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Medical records will live in a private bucket with short-lived signed links and audit
        logging. There is no public record URL.
      </p>
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <FileWarning aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Do not upload records until you have reviewed how they will be stored and who can access
        them.
      </p>
    </div>
  );
}
