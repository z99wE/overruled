let ctx: AudioContext | null = null;
let muted = false;

const MUTE_KEY = 'overrool.sfx.muted';

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx.state === 'closed' ? null : ctx;
  } catch {
    return null;
  }
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function toggleMute(): boolean {
  muted = !muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* noop */
  }
  return muted;
}

interface ToneOpts {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  slideTo?: number;
  delay?: number;
}

function tone({ freq, dur, type = 'square', gain = 0.05, slideTo, delay = 0 }: ToneOpts): void {
  const c = ac();
  if (!c || muted) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  const t0 = c.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur: number, gain = 0.04): void {
  const c = ac();
  if (!c || muted) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  const g = c.createGain();
  g.gain.value = gain;
  src.buffer = buf;
  src.connect(g).connect(c.destination);
  src.start();
}

export const sfx = {
  tap() {
    tone({ freq: 320, dur: 0.05, gain: 0.03 });
  },
  deal() {
    noise(0.12);
    tone({ freq: 520, dur: 0.07, type: 'triangle', gain: 0.04, delay: 0.03 });
  },
  chips() {
    tone({ freq: 880, dur: 0.06, type: 'triangle', gain: 0.05 });
    tone({ freq: 1320, dur: 0.08, type: 'triangle', gain: 0.04, delay: 0.05 });
  },
  gavel() {
    tone({ freq: 140, dur: 0.18, type: 'square', gain: 0.07, slideTo: 70 });
    noise(0.1, 0.05);
  },
  win() {
    tone({ freq: 523, dur: 0.09, type: 'square', gain: 0.05 });
    tone({ freq: 659, dur: 0.09, type: 'square', gain: 0.05, delay: 0.09 });
    tone({ freq: 784, dur: 0.14, type: 'square', gain: 0.05, delay: 0.18 });
    tone({ freq: 1047, dur: 0.2, type: 'square', gain: 0.06, delay: 0.27 });
  },
  lose() {
    tone({ freq: 220, dur: 0.25, type: 'sawtooth', gain: 0.05, slideTo: 90 });
  },
  levelUp() {
    tone({ freq: 392, dur: 0.08, type: 'square', gain: 0.05 });
    tone({ freq: 523, dur: 0.08, type: 'square', gain: 0.05, delay: 0.08 });
    tone({ freq: 659, dur: 0.08, type: 'square', gain: 0.05, delay: 0.16 });
    tone({ freq: 784, dur: 0.22, type: 'square', gain: 0.06, delay: 0.24 });
  },
  shop() {
    tone({ freq: 660, dur: 0.06, type: 'triangle', gain: 0.04 });
    tone({ freq: 440, dur: 0.09, type: 'triangle', gain: 0.04, delay: 0.06 });
  },
};

export function notifyVerdictSfx(tag: string): void {
  if (tag === 'SUSTAINED') sfx.win();
  else if (tag === 'OVERRULED') sfx.lose();
  else sfx.gavel();
}
