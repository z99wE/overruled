import { useEffect, useState } from 'react';
import type { CitationIndex } from './core/searchIndex';
import { loadAllScenarios, loadLibrary, loadScenario } from './core/dataLoader';
import { createKeyManager } from './core/storage';
import { initHaptics } from './core/haptics';
import type { ScenarioBundle } from './types/legal';
import { CaseSelect } from './components/CaseSelect';
import { CourtroomChamber } from './components/CourtroomChamber';
import { KeySettings } from './components/KeySettings';

type Screen = 'loading' | 'home' | 'trial';

export function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [scenarios, setScenarios] = useState<ScenarioBundle[]>([]);
  const [index, setIndex] = useState<CitationIndex | null>(null);
  const [active, setActive] = useState<ScenarioBundle | null>(null);
  const [keysOpen, setKeysOpen] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshKeyState = async () => {
    const km = createKeyManager();
    const cfg = await km.loadConfig();
    setHasKey(!!cfg);
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const { index: idx } = await loadLibrary();
        const all = await loadAllScenarios();
        if (!mounted) return;
        setIndex(idx);
        setScenarios(all);
        setScreen('home');
      } catch (err) {
        if (mounted) setLoadError(err instanceof Error ? err.message : String(err));
      }
    })();
    void initHaptics();
    void refreshKeyState().catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const openTrial = async (id: string) => {
    try {
      const bundle = await loadScenario(id);
      if (!bundle) return;
      setActive(bundle);
      setScreen('trial');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
      setScreen('home');
    }
  };

  const handleExitTrial = () => {
    setActive(null);
    setScreen('home');
  };

  if (screen === 'loading') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-noir-950">
        <div className="flex h-16 w-16 animate-[pulse_1.5s_ease-in-out_infinite] items-center justify-center rounded-2xl border border-gold/40 bg-gold/10 font-serif text-3xl font-bold text-gold">
          §
        </div>
        <p className="font-serif text-sm italic text-cream/60">Compiling the public record…</p>
        {loadError && <p className="max-w-sm px-6 text-center text-[12px] text-crimson">{loadError}</p>}
      </div>
    );
  }

  return (
    <div className="h-full bg-noir-950">
      {screen === 'home' && (
        <CaseSelect
          scenarios={scenarios}
          hasKey={hasKey}
          onSelect={(id) => void openTrial(id)}
          onOpenKeys={() => setKeysOpen(true)}
        />
      )}
      {screen === 'trial' && active && index && (
        <CourtroomChamber
          scenario={active}
          index={index}
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
    </div>
  );
}