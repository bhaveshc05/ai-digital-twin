import React, { useState, useRef, useCallback, useEffect } from "react";
import { FileText, Upload, X, CheckCircle2, AlertCircle, Paperclip } from "lucide-react";
import { uploadPdfDocument, getTaskStatus } from "./services/api";

/**
 * PdfSubmissionUpload
 * A drag-and-drop PDF upload zone styled like a manila folder / paper tray,
 * built for a student assignment-submission page.
 *
 * Props:
 *   - onFilesReady(files: File[])  -> called whenever the accepted file list changes
 *   - maxSizeMB (number)           -> default 25
 *   - multiple (boolean)           -> allow more than one PDF, default true
 *
 * Wire up a real upload by replacing `simulateUpload` with your own
 * fetch/XHR call inside the effect marked "REAL UPLOAD GOES HERE".
 */

const MAX_SIZE_DEFAULT = 25; // MB

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function isPdf(file) {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `file-${idCounter}-${Date.now()}`;
}

export default function PdfSubmissionUpload({
  onFilesReady,
  maxSizeMB = MAX_SIZE_DEFAULT,
  multiple = true,
}) {
  const [items, setItems] = useState([]); // { id, file, status, progress, error }
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const inputRef = useRef(null);

  // ---- REAL UPLOAD & BACKGROUND TASK POLLING ----------------------------
  useEffect(() => {
    const pending = items.filter((it) => it.status === "uploading" && !it.startedUpload);
    if (pending.length === 0) return;

    pending.forEach(async (item) => {
      // Mark as started upload to prevent duplicate dispatches
      setItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, startedUpload: true, progress: 20 } : p))
      );

      try {
        const uploadRes = await uploadPdfDocument(item.file);
        if (uploadRes.status === "queued" || uploadRes.status === "success") {
          const taskId = uploadRes.task_id;
          setItems((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, progress: 60, taskId } : p))
          );

          if (taskId === "inline-complete" || uploadRes.status === "success") {
            setItems((prev) =>
              prev.map((p) => (p.id === item.id ? { ...p, progress: 100, status: "done" } : p))
            );
            return;
          }

          // Poll task status until complete
          const interval = setInterval(async () => {
            const statusRes = await getTaskStatus(taskId);
            if (statusRes.status === "SUCCESS" || statusRes.status === "SUCCESSFUL") {
              clearInterval(interval);
              setItems((prev) =>
                prev.map((p) => (p.id === item.id ? { ...p, progress: 100, status: "done" } : p))
              );
            } else if (statusRes.status === "FAILURE") {
              clearInterval(interval);
              setItems((prev) =>
                prev.map((p) =>
                  p.id === item.id
                    ? { ...p, status: "error", error: statusRes.error || "Background processing failed." }
                    : p
                )
              );
            }
          }, 1500);

        } else {
          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? { ...p, status: "error", error: uploadRes.message || "Failed to upload PDF" }
                : p
            )
          );
        }
      } catch (err) {
        setItems((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, status: "error", error: err.message } : p
          )
        );
      }
    });
  }, [items]);
  // ----------------------------------------------------------------------

  useEffect(() => {
    if (onFilesReady) {
      onFilesReady(items.filter((i) => i.status === "done").map((i) => i.file));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const addFiles = useCallback(
    (fileList) => {
      const incoming = Array.from(fileList);
      const validated = incoming.map((file) => {
        if (!isPdf(file)) {
          return {
            id: nextId(),
            file,
            status: "error",
            progress: 0,
            error: "Only PDF files are accepted.",
          };
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
          return {
            id: nextId(),
            file,
            status: "error",
            progress: 0,
            error: `File is over the ${maxSizeMB} MB limit.`,
          };
        }
        return { id: nextId(), file, status: "uploading", progress: 0, error: null };
      });

      setItems((prev) => {
        const base = multiple ? prev : [];
        return [...base, ...validated];
      });
    },
    [maxSizeMB, multiple]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);
      if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const onDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div style={styles.wrap}>
      <style>{css}</style>

      <div style={styles.header}>
        <span style={styles.eyebrow}>Assignment submission</span>
        <h2 style={styles.title}>Turn in your PDF</h2>
        <p style={styles.sub}>
          Drop your file on the folder below, or click it to browse. We only
          accept PDFs, up to {maxSizeMB} MB each.
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload PDF, drop a file here or press Enter to browse"
        onClick={openPicker}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openPicker())}
        onDrop={onDrop}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        className="dropzone"
        style={{
          ...styles.dropzone,
          ...(isDragging ? styles.dropzoneActive : null),
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple={multiple}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
          style={styles.hiddenInput}
        />

        <div className="folderTab" style={styles.folderTab} aria-hidden="true">
          <Paperclip size={18} color="#7A6A4F" style={{ transform: "rotate(-18deg)" }} />
        </div>

        <div style={styles.dropzoneInner}>
          <div className="uploadIcon" style={styles.uploadIconWrap}>
            <Upload size={28} color={isDragging ? "#0F3D3E" : "#7A6A4F"} />
          </div>
          <p style={styles.dropzoneText}>
            {isDragging ? "Let go to add it to the folder" : "Drag your PDF here"}
          </p>
          <p style={styles.dropzoneSubtext}>or click to choose a file</p>
        </div>
      </div>

      {items.length > 0 && (
        <ul style={styles.list} aria-label="Selected files">
          {items.map((it) => (
            <li key={it.id} className="fileCard" style={styles.fileCard}>
              <div style={styles.fileIcon}>
                <FileText size={20} color="#0F3D3E" />
              </div>

              <div style={styles.fileInfo}>
                <div style={styles.fileNameRow}>
                  <span style={styles.fileName} title={it.file.name}>
                    {it.file.name}
                  </span>
                  <span style={styles.fileSize}>{formatBytes(it.file.size)}</span>
                </div>

                {it.status === "uploading" && (
                  <div style={styles.progressTrack} aria-hidden="true">
                    <div
                      style={{ ...styles.progressFill, width: `${it.progress}%` }}
                    />
                  </div>
                )}

                {it.status === "done" && (
                  <div style={styles.statusRow}>
                    <CheckCircle2 size={14} color="#0F3D3E" />
                    <span style={styles.statusDone}>Received</span>
                  </div>
                )}

                {it.status === "error" && (
                  <div style={styles.statusRow}>
                    <AlertCircle size={14} color="#B3401F" />
                    <span style={styles.statusError}>{it.error}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeItem(it.id)}
                aria-label={`Remove ${it.file.name}`}
                style={styles.removeBtn}
                className="removeBtn"
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const css = `
  .dropzone:focus-visible {
    outline: 3px solid #0F3D3E;
    outline-offset: 3px;
  }
  .removeBtn:focus-visible {
    outline: 2px solid #0F3D3E;
    outline-offset: 2px;
  }
  .fileCard {
    animation: slideIn 0.28s ease-out;
  }
  @media (prefers-reduced-motion: reduce) {
    .fileCard { animation: none; }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(6px) rotate(-1deg); }
    to { opacity: 1; transform: translateY(0) rotate(0deg); }
  }
`;

const styles = {
  wrap: {
    maxWidth: 560,
    margin: "0 auto",
    fontFamily:
      "'Source Sans 3', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#2B2A28",
  },
  header: { marginBottom: 20 },
  eyebrow: {
    display: "block",
    fontSize: 12,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#7A6A4F",
    fontWeight: 600,
    marginBottom: 6,
  },
  title: {
    fontFamily: "'Lora', 'Source Serif 4', Georgia, serif",
    fontSize: 28,
    fontWeight: 600,
    margin: "0 0 6px 0",
    color: "#1B2A26",
  },
  sub: {
    margin: 0,
    fontSize: 14.5,
    lineHeight: 1.5,
    color: "#5C5A52",
    maxWidth: 440,
  },
  dropzone: {
    position: "relative",
    background: "#EFE6D2",
    border: "2px dashed #C7B48C",
    borderRadius: 10,
    padding: "40px 24px 28px",
    textAlign: "center",
    cursor: "pointer",
    transition: "background 0.18s ease, border-color 0.18s ease",
  },
  dropzoneActive: {
    background: "#E4EEE9",
    borderColor: "#0F3D3E",
    borderStyle: "solid",
  },
  hiddenInput: { display: "none" },
  folderTab: {
    position: "absolute",
    top: -14,
    left: 28,
    background: "#E3D3AC",
    borderRadius: "6px 6px 0 0",
    padding: "6px 10px 4px",
    border: "2px solid #C7B48C",
    borderBottom: "none",
  },
  dropzoneInner: { display: "flex", flexDirection: "column", alignItems: "center" },
  uploadIconWrap: { marginBottom: 10 },
  dropzoneText: { fontSize: 16, fontWeight: 600, margin: "0 0 2px", color: "#2B2A28" },
  dropzoneSubtext: { fontSize: 13, margin: 0, color: "#8A7F65" },
  list: { listStyle: "none", margin: "18px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 },
  fileCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#FAF7F0",
    border: "1px solid #E4DCC8",
    borderRadius: 8,
    padding: "10px 12px",
    boxShadow: "0 1px 2px rgba(27,42,38,0.06)",
  },
  fileIcon: {
    flexShrink: 0,
    width: 36,
    height: 36,
    borderRadius: 6,
    background: "#E4EEE9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  fileInfo: { flex: 1, minWidth: 0 },
  fileNameRow: { display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" },
  fileName: {
    fontSize: 13.5,
    fontWeight: 600,
    color: "#2B2A28",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  fileSize: { fontSize: 12, color: "#8A7F65", flexShrink: 0 },
  progressTrack: {
    marginTop: 6,
    height: 5,
    borderRadius: 3,
    background: "#E4DCC8",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#0F3D3E",
    borderRadius: 3,
    transition: "width 0.2s ease",
  },
  statusRow: { display: "flex", alignItems: "center", gap: 5, marginTop: 5 },
  statusDone: { fontSize: 12.5, color: "#0F3D3E", fontWeight: 600 },
  statusError: { fontSize: 12.5, color: "#B3401F", fontWeight: 600 },
  removeBtn: {
    flexShrink: 0,
    border: "none",
    background: "transparent",
    color: "#8A7F65",
    cursor: "pointer",
    padding: 6,
    borderRadius: 6,
    display: "flex",
  },
};
