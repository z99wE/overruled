import { useRef, useState } from 'react';
import { FileText, Loader2, Upload } from 'lucide-react';
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
        className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition ${
          dragging ? 'border-dgold bg-dgold/10' : 'border-ink bg-felt-800 hover:border-cream/40'
        }`}
      >
        {busy ? (
          <Loader2 className="h-6 w-6 animate-spin text-dgold" />
        ) : (
          <Upload className={`h-6 w-6 ${dragging ? 'text-dgold' : 'text-cream/40'}`} />
        )}
        <p className="text-[13px] font-medium text-cream">
          {busy ? 'Reading…' : dragging ? 'Drop to read' : label}
        </p>
        <p className="font-mono text-[10px] leading-relaxed text-cream/40">
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
        <p className="rounded-lg border border-poker-red/40 bg-poker-red-deep/30 px-3 py-2 text-[12px] text-poker-red">{error}</p>
      )}
    </div>
  );
}

export function DocChip({ name, kind }: { name: string; kind: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 rounded-md bg-ink/40 px-2 py-1 text-[11px] text-cream/80">
      <FileText className="h-3 w-3 shrink-0 text-dgold" />
      <span className="truncate">{name}</span>
      <span className="shrink-0 font-mono text-[9px] uppercase text-cream/40">{KIND_HINT[kind] ?? kind}</span>
    </span>
  );
}
