import { useState } from 'react';
import type { CaseFile, Library, LibraryDoc } from '../core/library';
import { addDoc, createCaseFile, deleteCaseFile, docsInFile, removeDoc, renameCaseFile, renameDoc } from '../core/library';
import { DocChip } from './DocumentIngest';

interface DocumentLibraryProps {
  library: Library;
  persist: (next: Library) => void;
  onPick: (doc: LibraryDoc) => void;
  /** Which slot the chosen document fills, for the compare flow. */
  target?: 'A' | 'B';
  pickedId?: string | null;
}

export function DocumentLibraryPanel({ library, persist, onPick, target = 'A', pickedId }: DocumentLibraryProps) {
  const [openId, setOpenId] = useState<string | null>(library.files[0]?.id ?? null);
  const [busy, setBusy] = useState(false);

  const newFile = () => persist(createCaseFile('New case file', library));

  const uploadInto = async (fileId: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const { ingestFile } = await import('../core/documentIngest');
      const doc = await ingestFile(file);
      const next = addDoc(fileId, { name: doc.name, kind: doc.kind, text: doc.text, bytes: doc.bytes }, library);
      persist(next);
      setOpenId(fileId);
      const added = next.docs[next.docs.length - 1];
      if (added) onPick(added);
    } finally {
      setBusy(false);
    }
  };

  if (library.files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-center">
        <p className="text-[13px] text-slate-300">
          No case files yet. Group a contract with its amendments and come back to it later.
        </p>
        <button onClick={newFile} className="m3-btn m3-btn-primary px-4 py-1.5 text-xs font-semibold">
          Create Case File
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/60 p-2">
      {library.files.map((f: CaseFile) => {
        const docs = docsInFile(f.id, library);
        const open = openId === f.id;
        return (
          <div key={f.id} className="rounded-xl border border-white/10 bg-slate-950/60">
            <div className="flex items-center gap-1 p-1.5">
              <button
                onClick={() => setOpenId(open ? null : f.id)}
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                aria-expanded={open}
              >
                <span className="font-mono text-xs text-slate-400">{open ? '▼' : '▶'}</span>
                <span className="truncate text-[13px] font-medium text-white">{f.name}</span>
                <span className="shrink-0 font-mono text-[10px] text-slate-400">({docs.length})</span>
              </button>
              <label
                className="cursor-pointer rounded px-2 py-0.5 text-xs font-mono text-slate-400 hover:text-amber-300"
                title="Add a document to this case file"
              >
                {busy ? '…' : '+ Add'}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt,.md,.text,application/pdf,text/plain"
                  disabled={busy}
                  onChange={(e) => {
                    void uploadInto(f.id, e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
              <button
                onClick={() => {
                  const name = window.prompt('Rename case file', f.name);
                  if (name) persist(renameCaseFile(f.id, name, library));
                }}
                className="rounded px-1.5 py-1 font-mono text-[10px] text-slate-400 transition hover:text-white"
                title="Rename"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${f.name}" and its ${docs.length} document(s)? This cannot be undone.`)) {
                    persist(deleteCaseFile(f.id, library));
                  }
                }}
                className="rounded px-1.5 py-1 font-mono text-[10px] text-slate-400 transition hover:text-rose-300"
                title="Delete case file"
              >
                Del
              </button>
            </div>

            {open && (
              <div className="space-y-1 border-t border-white/10 p-1.5">
                {docs.length === 0 && <p className="px-1 py-1 text-[12px] text-slate-500">No documents yet — use + to add one.</p>}
                {docs.map((d) => (
                  <div
                    key={d.id}
                    className={`flex items-center gap-1.5 rounded-xl px-1.5 py-1 transition ${
                      pickedId === d.id ? 'bg-amber-400/15' : 'hover:bg-slate-800'
                    }`}
                  >
                    <button onClick={() => onPick(d)} className="min-w-0 flex-1 text-left" title={`Load into slot ${target}`}>
                      <DocChip name={d.name} kind={d.kind} />
                    </button>
                    <span className="shrink-0 font-mono text-[9px] text-slate-500">{(d.text.length / 1000).toFixed(1)}k ch</span>
                    <button
                      onClick={() => {
                        const name = window.prompt('Rename document', d.name);
                        if (name) persist(renameDoc(d.id, name, library));
                      }}
                      className="rounded px-1 font-mono text-[10px] text-slate-400 transition hover:text-white"
                      title="Rename"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => persist(removeDoc(d.id, library))}
                      className="rounded px-1 font-mono text-[10px] text-slate-400 transition hover:text-rose-300"
                      title="Remove document"
                    >
                      Del
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <button
        onClick={newFile}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 py-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400 transition hover:border-amber-400/40 hover:text-white"
      >
        + New case file
      </button>
    </div>
  );
}
