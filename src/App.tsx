import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CitationIndex } from './core/searchIndex';
import type { LibraryPayload, ScenarioBundle } from './types/legal';
import { loadAllScenarios, loadLibrary, loadScenario } from './core/dataLoader';
import { generateScenario, randomSeed } from './core/caseGenerator';
import { createKeyManager } from './core/storage';
import { initHaptics } from './core/haptics';
import { bootHealth } from './core/health';
import { initErrorTracking } from './core/telemetry';
import { useAuth, pullRemoteRun, enqueueRemoteSave } from './core/auth';
import { CaseSelect } from './components/CaseSelect';
import { CourtroomChamber } from './components/CourtroomChamber';
import { KeySettings } from './components/KeySettings';
import { LegalDesk } from './components/LegalDesk';
import { Landing } from './components/Landing';
import { AuthModal } from './components/AuthModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { ensureCaseOfDay, loadRun, normalizeRun, saveRun, type RunState } from './game/runStore';
import { ShopModal } from './game/ShopModal';
import { DuelMode } from './game/DuelMode';
import type { JokerId } from './game/jokers';

// The six shipped matters are the boss benches of the run; generated
// matters are free sparring. Prefixing keeps game logic (boss targets,
// bounties, case-of-the-day) keyed to the static set.
const STATIC_IDS = [
  'india-midnight-sweep',
  'us-interrogation-room',
  'eu-frozen-transfers',
  'canada-thirty-month-trial',
  'uk-bottle-on-the-shelf',
  'australia-lands-that-never-emptied',
] as const;

type Screen = 'loading' | 'landing' | 'home' | 'desk' | 'trial';

export function App() {
  const { user } = useAuth();
  const [screen, setScreen] = useState<Screen>('loading');
  const [scenarios, setScenarios] = useState<ScenarioBundle[]>([]);
  const [index, setIndex] = useState<CitationIndex | null>(null);
  const [active, setActive] = useState<ScenarioBundle | null>(null);
  const [keysOpen, setKeysOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [run, setRun] = useState<RunState>(() => loadRun());
  const [shopOpen, setShopOpen] = useState(false);
  const [duelOpen, setDuelOpen] = useState(false);
  const [deskReturn, setDeskReturn] = useState<Screen>('landing');
  const openDesk = () => {
    setDeskReturn(screen);
    setScreen('desk');
  };
  const libraryRef = useRef<{ payload: LibraryPayload; index: CitationIndex } | null>(null);
  const runRef = useRef(run);
  const pulledAccount = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const refreshKeyState = async () => {
    const km = createKeyManager();
    const cfg = await km.loadConfig();
    setHasKey(!!cfg);
  };

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const lib = await loadLibrary();
      const all = await loadAllScenarios();
      if (!mountedRef.current) return;
      libraryRef.current = lib;
      setIndex(lib.index);
      setScenarios(all);
      setScreen('landing');
    } catch (err) {
      if (mountedRef.current) setLoadError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    initErrorTracking();
    bootHealth();
    void load();
    void initHaptics();
    void refreshKeyState().catch(() => undefined);
    const bootToken = new URLSearchParams(window.location.search).get('reset_token');
    if (bootToken) setResetToken(bootToken);
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const openTrial = async (rawId: string) => {
    // Static ids are game-prefixed ('static-') for boss/scoring logic; the
    // loader knows them by their bare manifest id.
    const bareId = rawId.startsWith('static-') ? rawId.slice('static-'.length) : rawId;
    // Generated matters live only in component state — the corpus on disk
    // doesn't know them. Serve those straight from state.
    const inState = scenarios.find((s) => s.id === bareId || s.id === rawId);
    if (inState) {
      setActive(inState);
      setScreen('trial');
      return;
    }
    try {
      const bundle = await loadScenario(bareId);
      if (!bundle) return;
      setActive(bundle);
      setScreen('trial');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
      setScreen('home');
    }
  };

  // Sync by construction: the home screen only renders after loadLibrary has
  // resolved, so the ref is guaranteed populated when this can be clicked.
  const handleGenerate = (): string | null => {
    const lib = libraryRef.current;
    if (!lib) return null;
    const seed = randomSeed();
    const matter = generateScenario(lib.payload.corpus, seed, {
      extraDeckCards: run.jokers.includes('bar-expansion') ? 2 : 0,
    });
    setIndex(lib.index);
    setScenarios((prev) => [matter, ...prev.filter((s) => s.id !== matter.id)]);
    return matter.id;
  };

  // Run ids the game layer consumes: static matters carry the boss prefix.
  const runScenarioIds = useMemo(
    () => [...STATIC_IDS.map((id) => `static-${id}`), ...scenarios.map((s) => s.id)],
    [scenarios],
  );

  const updateRun = useCallback(
    (next: RunState) => {
      runRef.current = next;
      saveRun(next);
      setRun(next);
      if (user) enqueueRemoteSave(next);
    },
    [user],
  );

  const todayIso = new Date().toISOString().slice(0, 10);
  const caseOfDayId = useMemo(
    () => ensureCaseOfDay(run, todayIso, runScenarioIds),
    [run, runScenarioIds, todayIso],
  );

  // The pick is computed in render (pure) and then persisted here once per
  // date, so case-of-the-day never mutates state mid-render and always
  // survives reload/remote sync.
  useEffect(() => {
    const stored = run.caseOfDay;
    if (stored?.date === todayIso && stored.scenarioId === caseOfDayId) return;
    updateRun({ ...run, caseOfDay: { date: todayIso, scenarioId: caseOfDayId } });
  }, [run, caseOfDayId, todayIso, updateRun]);

  // Account sync: on first sight of a signed-in user, pull the cloud run.
  // Remote wins on a fresh device; a new/sans-save account seeds from local.
  useEffect(() => {
    if (!user) return;
    if (pulledAccount.current === user.email) return;
    pulledAccount.current = user.email;
    void (async () => {
      const remote = await pullRemoteRun();
      if (remote) {
        const normalized = normalizeRun(remote);
        runRef.current = normalized;
        saveRun(normalized);
        setRun(normalized);
      } else {
        enqueueRemoteSave(runRef.current);
      }
    })();
  }, [user]);

  const openAccount = (mode: 'signup' | 'login') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleExitTrial = (nextRun: RunState) => {
    updateRun(nextRun);
    setActive(null);
    setScreen('home');
  };

  if (screen === 'loading') {
    return (
      <div className="felt-bg felt-noise flex h-full flex-col items-center justify-center gap-5">
        <h1
          className="anim-slam font-display text-5xl text-cream"
          style={{ textShadow: '0 4px 0 var(--color-poker-red-deep), 0 6px 0 var(--color-ink)' }}
        >
          OVERROOL
        </h1>
        <p className="anim-float font-mono text-xs uppercase tracking-widest text-cream/60">Shuffling the world's judgments…</p>
        {loadError && (
          <div className="flex flex-col items-center gap-4">
            <p className="max-w-sm px-6 text-center text-[12px] text-poker-red">{loadError}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="btn-gold rounded-xl px-5 py-2.5 font-display text-xs uppercase tracking-wider text-ink"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-full grid-graph-light bg-slate-50 text-slate-900 selection:bg-amber-300 selection:text-slate-950 font-sans">
      {screen === 'landing' && (
        <Landing
          cases={libraryRef.current?.payload.corpus.cases ?? []}
          onPlay={() => setScreen('home')}
          onOpenDesk={openDesk}
          accountEmail={user?.email ?? null}
          onOpenAccount={() => openAccount('signup')}
        />
      )}
      {screen === 'home' && (
        <CaseSelect
          scenarios={scenarios}
          hasKey={hasKey}
          run={run}
          caseOfDayId={caseOfDayId}
          onRunChange={updateRun}
          onOpenShop={() => setShopOpen(true)}
          onOpenDuel={() => setDuelOpen(true)}
          onOpenDesk={openDesk}
          onSelect={(id) => void openTrial(id)}
          onOpenKeys={() => setKeysOpen(true)}
          onOpenAccount={() => openAccount(user ? 'login' : 'signup')}
          accountEmail={user?.email ?? null}
          onGenerate={handleGenerate}
          onOpenHowItWorks={() => setScreen('landing')}
        />
      )}
      {screen === 'trial' && active && index && (
        <CourtroomChamber
          scenario={active}
          index={index}
          gameScenarioId={active.manifesto.id.startsWith('generated-') ? active.manifesto.id : `static-${active.manifesto.id}`}
          onExit={handleExitTrial}
          onOpenKeys={() => setKeysOpen(true)}
        />
      )}
      {keysOpen && (
        <KeySettings
          onClose={() => {
            setKeysOpen(false);
            void refreshKeyState();
          }}
        />
      )}
      {authOpen && <AuthModal mode={authMode} onClose={() => setAuthOpen(false)} />}
      {resetToken && (
        <ResetPasswordModal
          token={resetToken}
          onClose={() => {
            setResetToken(null);
            const url = new URL(window.location.href);
            url.searchParams.delete('reset_token');
            window.history.replaceState({}, '', url);
          }}
        />
      )}
      {shopOpen && (
        <ShopModal
          chips={run.chips}
          owned={run.jokers}
          onBuy={(id, cost) => {
            updateRun({ ...run, chips: run.chips - cost, jokers: [...run.jokers, id as JokerId] });
          }}
          onClose={() => setShopOpen(false)}
        />
      )}
      {duelOpen && libraryRef.current && (
        <DuelMode
          deck={libraryRef.current.payload.corpus.cases.slice(0, 12)}
          onClose={() => setDuelOpen(false)}
        />
      )}
      {screen === 'desk' && (
        <LegalDesk
          page
          onClose={() => setScreen(deskReturn)}
          onOpenKeys={() => setKeysOpen(true)}
        />
      )}
    </div>
  );
}
