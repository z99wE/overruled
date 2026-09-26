interface CommunitySectionProps {
  onOpenRules: () => void;
}

export function CommunitySection({ onOpenRules }: CommunitySectionProps) {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#60a5fa] via-[#38bdf8] to-[#0284c7] pt-14 pb-0 text-white select-none">
      {/* ── Background Pixel Clouds & Watermark ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Pixel Cloud Left */}
        <div className="absolute top-8 left-[6%] opacity-90">
          <svg className="w-32 h-16 text-white/90 drop-shadow-sm" viewBox="0 0 64 32" fill="currentColor">
            <rect x="12" y="12" width="40" height="12" rx="4" />
            <rect x="20" y="4" width="24" height="16" rx="4" />
            <rect x="8" y="16" width="48" height="8" rx="2" />
          </svg>
        </div>

        {/* Pixel Cloud Right */}
        <div className="absolute top-12 right-[12%] opacity-80">
          <svg className="w-28 h-14 text-white/80 drop-shadow-sm" viewBox="0 0 64 32" fill="currentColor">
            <rect x="12" y="12" width="40" height="12" rx="4" />
            <rect x="24" y="6" width="20" height="14" rx="4" />
          </svg>
        </div>

        {/* Giant Faint Background Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-sans text-8xl sm:text-9xl md:text-[14rem] font-black tracking-widest text-white/10 pointer-events-none whitespace-nowrap">
          OVERROOL
        </div>
      </div>

      {/* ── Top Right Rules Pill Button ── */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={onOpenRules}
          className="flex items-center gap-1.5 rounded-full bg-white/95 border border-amber-300 px-3.5 py-1.5 font-sans text-xs font-bold text-amber-950 shadow-md hover:bg-white transition-all cursor-pointer"
        >
          <span>📖</span>
          <span>Event Rules</span>
        </button>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* ── Left Column: Headline & Pixel Arrow ── */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
              Join the Overrool Advocate Community
              <br />
              <span className="text-white font-black drop-shadow-sm">
                Get the latest updates and connect with creators around the world.
              </span>
            </h2>

            {/* Pixel Blue Arrow ---> */}
            <div className="pt-2">
              <svg className="w-16 h-8 text-blue-900 drop-shadow-sm anim-float" viewBox="0 0 64 24" fill="currentColor">
                <rect x="0" y="9" width="44" height="6" />
                <polygon points="44,2 64,12 44,22" />
              </svg>
            </div>
          </div>

          {/* ── Right Column: Retro Arcade Monitor Boxes ── */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Top Row: Yellow & Blue Arcade Monitor Cabinets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Yellow Cabinet: Discord / Chamber */}
              <div className="relative rounded-2xl bg-amber-400 border-4 border-slate-950 p-4 shadow-xl flex flex-col items-center text-center">
                {/* Red Joystick on Top */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-slate-950 shadow"></div>
                  <div className="w-1.5 h-2.5 bg-slate-900"></div>
                </div>

                <div className="font-sans text-xs font-black text-slate-950 mt-1 mb-0.5">
                  Discord Community
                </div>
                <div className="text-[10px] font-bold text-slate-800 mb-3">
                  Scan to join
                </div>

                {/* Pixel QR Code Frame */}
                <div className="w-32 h-32 rounded-xl bg-white border-3 border-slate-950 p-2 flex items-center justify-center shadow-inner">
                  <svg className="w-full h-full text-slate-950" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h4v2h-4v-2zm0 4h4v2h-4v-2zm-4-4h2v4h-2v-4zm0 4h2v2h-2v-2zm-4-4h2v2h-2v-2zm4-4h2v2h-2v-2zm-4 0h2v2h-2v-2z" />
                  </svg>
                </div>
              </div>

              {/* Blue Cabinet: Global Advocate Community */}
              <div className="relative rounded-2xl bg-sky-400 border-4 border-slate-950 p-4 shadow-xl flex flex-col items-center text-center">
                {/* Red Joystick on Top */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-slate-950 shadow"></div>
                  <div className="w-1.5 h-2.5 bg-slate-900"></div>
                </div>

                <div className="font-sans text-xs font-black text-slate-950 mt-1 mb-0.5">
                  Global Advocate Hub
                </div>
                <div className="text-[10px] font-bold text-slate-800 mb-3">
                  Scan to join
                </div>

                {/* Pixel QR Code Frame */}
                <div className="w-32 h-32 rounded-xl bg-white border-3 border-slate-950 p-2 flex items-center justify-center shadow-inner">
                  <svg className="w-full h-full text-slate-950" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h4v2h-4v-2zm0 4h4v2h-4v-2zm-4-4h2v4h-2v-4zm0 4h2v2h-2v-2zm-4-4h2v2h-2v-2zm4-4h2v2h-2v-2zm-4 0h2v2h-2v-2z" />
                  </svg>
                </div>
              </div>

            </div>

            {/* Orange Console Box: Community Exclusive Benefits */}
            <div className="rounded-2xl bg-orange-500 border-4 border-slate-950 p-4 shadow-xl text-center">
              <div className="font-sans text-xs font-black text-white uppercase tracking-wider mb-3">
                Community Exclusive Benefits
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Benefit 1 */}
                <div className="rounded-xl bg-amber-300 border-2 border-slate-950 p-2.5 flex flex-col items-center justify-between text-center min-h-[90px] shadow-sm">
                  <span className="text-xl">🎁</span>
                  <div className="font-sans text-[10px] font-bold text-slate-950 leading-tight">
                    Weekly bench chip bounties
                  </div>
                </div>

                {/* Benefit 2 */}
                <div className="rounded-xl bg-amber-300 border-2 border-slate-950 p-2.5 flex flex-col items-center justify-between text-center min-h-[90px] shadow-sm">
                  <span className="text-xl">⚖️</span>
                  <div className="font-sans text-[10px] font-bold text-slate-950 leading-tight">
                    Priority Legal Desk audits
                  </div>
                </div>

                {/* Benefit 3 */}
                <div className="rounded-xl bg-amber-300 border-2 border-slate-950 p-2.5 flex flex-col items-center justify-between text-center min-h-[90px] shadow-sm">
                  <span className="text-xl">🎮</span>
                  <div className="font-sans text-[10px] font-bold text-slate-950 leading-tight">
                    Early access trial matters
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ── 8-Bit Mario Platform Grass Ground Bar at Bottom ── */}
      <div className="relative w-full">
        {/* Pixel Character on the ground */}
        <div className="absolute -top-10 left-[8%] sm:left-[12%] z-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-slate-950 shadow-md">
            <svg className="w-9 h-9" viewBox="0 0 32 32" fill="none">
              <rect x="8" y="4" width="16" height="8" rx="2" fill="#78350f" />
              <rect x="8" y="10" width="16" height="10" fill="#fde047" />
              <rect x="11" y="13" width="2" height="3" fill="#1e293b" />
              <rect x="19" y="13" width="2" height="3" fill="#1e293b" />
              <rect x="9" y="20" width="14" height="8" fill="#475569" />
              <rect x="12" y="20" width="8" height="8" fill="#f8fafc" />
            </svg>
          </div>
        </div>

        {/* Green Pixel Grass Top */}
        <div className="w-full h-4 bg-emerald-500 border-t-2 border-slate-950"></div>
        {/* Brown Dirt Brick Pattern Bottom */}
        <div className="w-full h-8 bg-amber-900 border-t-2 border-amber-950 shadow-inner"></div>
      </div>
    </section>
  );
}
