import { useState } from 'react';
import { ChevronDown, FolderPlus, Loader2, Plus, Trash2 } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-ink bg-felt-800 p-5 text-center">
        <p className="text-[13px] text-cream/70">
          No case files yet. Group a contract with its amendments and come back to it later.
        </p>
        <button onClick={newFile} className="btn-gold flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-ink">
          <FolderPlus className="h-4 w-4" /> Create your first case file
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto rounded-xl border border-ink bg-felt-800 p-2">
      {library.files.map((f: CaseFile) => {
        const docs = docsInFile(f.id, library);
        const open = openId === f.id;
        return (
          <div key={f.id} className="rounded-lg border border-ink bg-ink/25">
            <div className="flex items-center gap-1 p-1.5">
              <button
                onClick={() => setOpenId(open ? null : f.id)}
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                aria-expanded={open}
              >
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-cream/50 transition ${open ? '' : '-rotate-90'}`} />
                <span className="truncate text-[13px] font-medium text-cream">{f.name}</span>
                <span className="shrink-0 font-mono text-[10px] text-cream/40">{docs.length}</span>
              </button>
              <label
                className="cursor-pointer rounded p-1 text-cream/50 transition hover:bg-felt-700 hover:text-dgold"
                title="Add a document to this case file"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
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
                className="rounded px-1.5 py-1 font-mono text-[10px] uppercase text-cream/40 transition hover:text-cream"
                title="Rename"
              >
                ✎
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${f.name}" and its ${docs.length} document(s)? This cannot be undone.`)) {
                    persist(deleteCaseFile(f.id, library));
                  }
                }}
                className="rounded p-1 text-cream/50 transition hover:text-poker-red"
                title="Delete case file"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {open && (
              <div className="space-y-1 border-t border-ink/60 p-1.5">
                {docs.length === 0 && <p className="px-1 py-1 text-[12px] text-cream/35">No documents yet — use + to add one.</p>}
                {docs.map((d) => (
                  <div
                    key={d.id}
                    className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 transition ${
                      pickedId === d.id ? 'bg-dgold/15' : 'hover:bg-felt-700'
                    }`}
                  >
                    <button onClick={() => onPick(d)} className="min-w-0 flex-1 text-left" title={`Load into slot ${target}`}>
                      <DocChip name={d.name} kind={d.kind} />
                    </button>
                    <span className="shrink-0 font-mono text-[9px] text-cream/35">{(d.text.length / 1000).toFixed(1)}k ch</span>
                    <button
                      onClick={() => {
                        const name = window.prompt('Rename document', d.name);
                        if (name) persist(renameDoc(d.id, name, library));
                      }}
                      className="rounded px-1 font-mono text-[10px] text-cream/40 transition hover:text-cream"
                      title="Rename"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => persist(removeDoc(d.id, library))}
                      className="rounded p-0.5 text-cream/50 transition hover:text-poker-red"
                      title="Remove document"
                    >
                      <Trash2 className="h-3 w-3" />
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
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink py-1.5 font-mono text-[10px] uppercase tracking-wider text-cream/50 transition hover:border-cream/40 hover:text-cream"
      >
        <FolderPlus className="h-3.5 w-3.5" /> New case file
      </button>
    </div>
  );
}
