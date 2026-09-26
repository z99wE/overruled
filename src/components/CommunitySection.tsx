interface CommunitySectionProps {
  onOpenRules: () => void;
  onOpenDesk?: () => void;
}

export function CommunitySection({ onOpenRules, onOpenDesk }: CommunitySectionProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 font-sans" id="community">
      <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-6 sm:p-8 shadow-xs backdrop-blur-md">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-slate-100">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Client-Side Privacy Architecture
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-sans">
              Zero telemetry on uploaded drafts, local WebAssembly rule engines, and encrypted BYOK key vaults
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenRules}
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Security Specifications
          </button>
        </div>

        {/* 3 Architecture Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 flex flex-col justify-between">
            <div>
              <div className="rounded-full bg-blue-100 text-blue-800 px-3 py-0.5 font-mono text-[11px] font-bold inline-block mb-3">
                Zero Cloud Storage
              </div>
              <h3 className="font-display text-base font-extrabold text-slate-900 mb-2">
                100% In-Browser Execution
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Contracts are parsed directly in your browser memory. Documents never pass through intermediate proxy servers or get added to training datasets.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/80 text-[11px] font-bold text-slate-500">
              Web Crypto API Isolated
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 flex flex-col justify-between">
            <div>
              <div className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-0.5 font-mono text-[11px] font-bold inline-block mb-3">
                Direct Client HTTPS
              </div>
              <h3 className="font-display text-base font-extrabold text-slate-900 mb-2">
                Bring Your Own Key (BYOK)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                When using personal Gemini, OpenAI, Claude, or Groq keys, requests travel directly from your browser to the official provider endpoint.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/80 text-[11px] font-bold text-slate-500">
              Zero Intermediary Logging
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 flex flex-col justify-between">
            <div>
              <div className="rounded-full bg-purple-100 text-purple-800 px-3 py-0.5 font-mono text-[11px] font-bold inline-block mb-3">
                Deterministic Audits
              </div>
              <h3 className="font-display text-base font-extrabold text-slate-900 mb-2">
                Certified Legal Corpus
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                59 common law authorities certified against official law reports across US, UK, Australia, Canada, European Union, and India.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/80 text-[11px] font-bold text-slate-500">
              Zero Hallucinated Citations
            </div>
          </div>
        </div>

        {/* Action Footer Bar */}
        <div className="mt-8 rounded-2xl bg-blue-600 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
          <div>
            <h3 className="font-display text-lg font-extrabold">Ready to audit your first agreement?</h3>
            <p className="text-xs text-blue-100 mt-0.5 font-sans">
              Test your contract against the local rule engine without creating an account or entering an API key.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenDesk}
            className="rounded-full bg-white hover:bg-slate-100 px-6 py-2.5 text-xs font-bold text-blue-900 shadow-md transition-all cursor-pointer shrink-0"
          >
            Open Legal Desk
          </button>
        </div>
      </div>
    </section>
  );
}
