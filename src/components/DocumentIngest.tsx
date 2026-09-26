import { useRef, useState } from 'react';
import { ACCEPT_ATTR, IngestError, ingestFile } from '../core/documentIngest';
import type { IngestedDoc } from '../core/documentIngest';

interface DocumentIngestProps {
  onLoaded: (doc: IngestedDoc) => void;
  /** Shown under the drop zone, e.g. "Version B". */
  label?: string;
}

const KIND_HINT: Record<string, string> = { pdf: 'PDF', docx: 'DOCX', text: 'Text' };

export function DocumentIngest({ onLoaded, label = 'Upload a document' }: DocumentIngestProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onLoaded(await ingestFile(file));
    } catch (err) {
      setError(err instanceof IngestError ? err.message : 'Could not read that file.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label={label}
        className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center transition ${
          dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50/70 hover:border-blue-500 hover:bg-slate-50'
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-sans font-bold text-sm shadow-2xs">
          DOC
        </div>
        <p className="text-[13px] font-bold text-slate-900">
          {busy ? 'Reading…' : dragging ? 'Drop to read' : label}
        </p>
        <p className="font-mono text-[10px] leading-relaxed text-slate-500">
          Drop a PDF, .docx or .txt here — or click to choose.
          <br />
          Read in your browser. Nothing is uploaded to a server.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-800 font-medium">{error}</p>
      )}
    </div>
  );
}

export function DocChip({ name, kind }: { name: string; kind: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 shadow-2xs">
      <span className="truncate font-medium">{name}</span>
      <span className="shrink-0 font-mono text-[9px] uppercase font-bold text-blue-700">{KIND_HINT[kind] ?? kind}</span>
    </span>
  );
}
