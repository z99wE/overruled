import { useState } from 'react';

interface RulesModalProps {
  onClose: () => void;
}

export function RulesModal({ onClose }: RulesModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="font-display text-xl font-extrabold flex items-center gap-2">
            <span>📖</span>
            <span>Creator & Precedent Event Rules</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="my-4 max-h-[60vh] space-y-4 overflow-y-auto text-xs sm:text-sm text-slate-600 pr-2">
          <div className="rounded-xl bg-amber-50 p-3 border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-1">1. Eligible Submissions</h4>
            <p>Every original 3D model, legal brief analysis, or courtroom citation submitted that passes verification counts toward your monthly milestone tier.</p>
          </div>

          <div className="rounded-xl bg-sky-50 p-3 border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-1">2. Milestone Chest Unlocks</h4>
            <p>Unlock 6 tiered reward chests each calendar month: Starter (1), Bronze (3), Silver (5), Gold (10), Diamond (20), and Master (50). Rewards reset at the end of each monthly period.</p>
          </div>

          <div className="rounded-xl bg-purple-50 p-3 border border-purple-200">
            <h4 className="font-bold text-purple-900 mb-1">3. Monthly Leaderboard</h4>
            <p>Top ranking creators and advocates receive Champion, Star, and Trending Chests plus bonus points distributed directly to their account wallet.</p>
          </div>

          <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200">
            <h4 className="font-bold text-emerald-900 mb-1">4. Referral Program</h4>
            <p>Earn $1 for each friend who signs up via your link and $3 when they complete their first eligible creation or brief submission.</p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-blue-600 px-6 py-2.5 font-sans text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            Got It
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
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSpin = () => {
    setSpinning(true);
    setResult(null);
    setTimeout(() => {
      const prizes = ['🎁 +50 Bench Points', '🏆 Star Chest Badge', '💎 Rare Diamond Shard', '⭐ +25 Creation Energy'];
      const pick = prizes[Math.floor(Math.random() * prizes.length)];
      setResult(pick);
      setSpinning(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900 text-center">
        <div className="flex items-center justify-between pb-3">
          <h3 className="font-display text-xl font-extrabold flex items-center gap-2">
            <span>🎮</span>
            <span>Community Raffle</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="my-6 flex flex-col items-center">
          <div className={`flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-amber-400 bg-amber-50 text-5xl shadow-lg transition-transform ${spinning ? 'rotate-180 scale-110 duration-500' : ''}`}>
            {spinning ? '🎲' : result ? '🎉' : '🎁'}
          </div>

          {result ? (
            <div className="mt-4 rounded-xl bg-emerald-50 p-3 border border-emerald-200 font-sans text-sm font-black text-emerald-800 anim-pop">
              {result}
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-500 max-w-xs font-sans">
              Spend 10 Raffle Tickets to spin the Community Wheel for rare chests and badges!
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleSpin}
            disabled={spinning}
            className="rounded-full bg-indigo-600 hover:bg-indigo-700 px-7 py-3 font-sans text-xs font-bold text-white shadow-md transition-all"
          >
            {spinning ? 'Spinning...' : 'Spin Raffle (Free Daily)'}
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

export function EarningsModal({ onClose, chips = 50 }: EarningsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="font-display text-xl font-extrabold flex items-center gap-2">
            <span>💼</span>
            <span>My Earnings & Wallet</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="my-5 space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 p-5 text-slate-950 shadow-md">
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">Available Bench Favor & Cash</div>
            <div className="font-mono text-3xl font-black mt-1">${chips}.00</div>
            <div className="text-[11px] font-semibold mt-2 opacity-90">Ready for instant withdrawal or Joker upgrades</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Creation Bounties</div>
              <div className="font-sans text-lg font-extrabold text-slate-800 mt-0.5">$35.00</div>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Referral Bonuses</div>
              <div className="font-sans text-lg font-extrabold text-slate-800 mt-0.5">$15.00</div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-blue-600 px-6 py-2.5 font-sans text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
