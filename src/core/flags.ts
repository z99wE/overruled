import flagsData from '../../flags.json';

export type FeatureFlag = keyof typeof flagsData.flags;

export interface FlagEntry {
  enabled: boolean;
  description?: string;
}

const OVERRIDES_BY_ENV: Partial<Record<FeatureFlag, boolean>> = {
  freeformMotion: import.meta.env.VITE_FLAG_FREEFORM_MOTION === 'true',
  bossBounties: import.meta.env.VITE_FLAG_BOSS_BOUNTIES === 'true',
  sparringBench: import.meta.env.VITE_FLAG_SPARRING_BENCH === 'true',
};

export function isFlagEnabled(flag: FeatureFlag): boolean {
  const override = OVERRIDES_BY_ENV[flag];
  if (typeof override === 'boolean') return override;
  const entry: FlagEntry | undefined = flagsData.flags[flag];
  return entry?.enabled ?? false;
}

export function listEnabledFlags(): FeatureFlag[] {
  return (Object.keys(flagsData.flags) as FeatureFlag[]).filter(isFlagEnabled);
}