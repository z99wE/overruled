import { useState } from 'react';

interface RulesModalProps {
  onClose: () => void;
}

export function RulesModal({ onClose }: RulesModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md font-sans selection:bg-blue-200 selection:text-slate-950">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="font-display text-lg font-extrabold text-slate-900">
            Zero-Leak Audit &amp; Legal Standards
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="my-4 max-h-[60vh] space-y-3.5 overflow-y-auto text-xs sm:text-sm text-slate-600 pr-1">
          <div className="rounded-2xl bg-blue-50/80 p-4 border border-blue-200/80">
            <h4 className="font-bold text-blue-900 mb-1">1. 100% Client-Side Zero Data Leak</h4>
            <p className="leading-relaxed">Your contract drafts and privileged notes are processed entirely in-browser. We never retain, store, or train AI models on your confidential legal documents.</p>
          </div>

          <div className="rounded-2xl bg-amber-50/80 p-4 border border-amber-200/80">
            <h4 className="font-bold text-amber-900 mb-1">2. 59 Verified Common Law Precedents</h4>
            <p className="leading-relaxed">Every citation and legal ratio is certified against official court reports across US, UK, Australia, Canada, European Union, South Africa, and India.</p>
          </div>

          <div className="rounded-2xl bg-emerald-50/80 p-4 border border-emerald-200/80">
            <h4 className="font-bold text-emerald-900 mb-1">3. Deterministic 0-100 Risk Scoring</h4>
            <p className="leading-relaxed">Identifies one-sided indemnities, uncapped consequential liabilities, non-compete overreach, and jurisdiction traps with actionable reciprocal redlines.</p>
          </div>

          <div className="rounded-2xl bg-purple-50/80 p-4 border border-purple-200/80">
            <h4 className="font-bold text-purple-900 mb-1">4. Adversarial Bench Sparring</h4>
            <p className="leading-relaxed">Test litigation arguments and contract defense motions against strict simulated benches to verify enforceability before stepping into court.</p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-blue-600 px-6 py-2.5 font-sans text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}

interface RaffleModalProps {
  onClose: () => void;
}

export function RaffleModal({ onClose }: RaffleModalProps) {
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleDraw = () => {
    setDrawing(true);
    setResult(null);
    setTimeout(() => {
      const precedents = [
        'Hadley v. Baxendale (1854) · Remoteness of Loss & Foreseeability',
        'Mabo v. Queensland (1992) · Proprietary Title & Extinguishment Limits',
        'Donoghue v. Stevenson (1932) · Neighbor Principle & Duty of Care',
        'Schrems II (2020) · Cross-Border Data Transfer Safeguards',
        'Carlill v. Carbolic Smoke Ball (1893) · Unilateral Contracts & Consideration',
      ];
      const pick = precedents[Math.floor(Math.random() * precedents.length)];
      setResult(pick);
      setDrawing(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md font-sans selection:bg-blue-200 selection:text-slate-950">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900 text-center">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-display text-lg font-extrabold text-slate-900">
            Precedent Discovery Vault
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="my-6 flex flex-col items-center">
          <div className="h-32 w-32 rounded-3xl overflow-hidden border-2 border-amber-400 shadow-md">
            <img
              src="/assets/diamond_chest.jpg"
              alt="Precedent Vault"
              className={`w-full h-full object-cover transition-transform ${drawing ? 'scale-110 rotate-6 duration-500' : ''}`}
            />
          </div>

          {result ? (
            <div className="mt-4 rounded-xl bg-blue-50 p-4 border border-blue-200 font-sans text-xs sm:text-sm font-extrabold text-blue-950 text-left anim-pop">
              {result}
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-600 max-w-xs font-sans">
              Draw from 59 certified common law precedents to inspect judicial ratios and defense applications.
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleDraw}
            disabled={drawing}
            className="rounded-full bg-blue-600 hover:bg-blue-700 px-7 py-3 font-sans text-xs font-bold text-white shadow-md transition-all cursor-pointer"
          >
            {drawing ? 'Searching Corpus...' : 'Draw Landmark Precedent'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface EarningsModalProps {
  onClose: () => void;
  chips?: number;
}

export function EarningsModal({ onClose, chips = 0 }: EarningsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md font-sans selection:bg-blue-200 selection:text-slate-950">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-display text-lg font-extrabold text-slate-900">
            Counsel Workspace Ledger
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="my-6 space-y-4 text-center">
          <div className="rounded-3xl border border-amber-300 bg-amber-50/80 p-6">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Active Precedent Chips</span>
            <div className="font-display text-4xl font-extrabold text-amber-950 mt-1">
              {chips}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Earned across adversarial trials and forensic contract audits
            </p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed text-left">
            Chips unlock specialized advocate modifiers in the Chambers Emporium, allowing you to expand card draw limits and withstand judicial objections during trial simulations.
          </p>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-blue-600 px-6 py-2.5 font-sans text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

interface PrivacyModalProps {
  onClose: () => void;
}

export function PrivacyModal({ onClose }: PrivacyModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md font-sans selection:bg-blue-200 selection:text-slate-950">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl text-slate-900">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-display text-lg sm:text-xl font-extrabold text-slate-900">
              Privacy Architecture &amp; Legal Disclaimer
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Client-side zero-leak execution standards
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="my-5 max-h-[60vh] space-y-4 overflow-y-auto text-xs sm:text-sm text-slate-600 pr-2 leading-relaxed">
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1.5">1. Zero Cloud Document Retention</h4>
            <p>
              Uploaded contracts, PDF briefs, and DOCX files are processed in-memory directly in your browser. Document embeddings, text extraction, and clause audits execute strictly on your device. No document text is ever uploaded to a central database or used to train public machine learning models.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1.5">2. Client-Side Cryptographic Vault</h4>
            <p>
              Your custom API keys (OpenAI, Anthropic, Gemini, Groq, OpenRouter) and local account credentials are encrypted in local browser storage using Web Crypto API standards. Keys are dispatched strictly as direct authorization headers to the respective AI provider endpoints.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1.5">3. Statutory &amp; Jurisprudence Notice</h4>
            <p>
              Overrool is an educational legal-strategy simulation and contract forensic workbench built on publicly certified court decisions. The simulation does not provide legal advice, does not establish an attorney-client relationship, and cannot replace a qualified advocate admitted in your jurisdiction.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1.5">4. Secure Privacy Inquiries &amp; Support</h4>
            <p>
              To safeguard confidential client workflows and eliminate data harvesting, support and security inquiries are routed exclusively through our authenticated in-app Key Settings protocol and verified GitHub repository issue tracker.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-blue-600 px-6 py-2.5 font-sans text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          >
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
