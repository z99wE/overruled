import { useEffect, useRef } from 'react';
import type { OpponentPlayedCard, PrecedentCard } from '../types/legal';

/**
 * CARD TABLE — a small canvas stage where the player's card and the
 * opponent's counter-card deal onto the felt with spring physics. The
 * winning card glows; a losing card gets tossed off the table.
 * Pure client-side eye-candy: no trial logic lives here.
 */

export interface CardTableProps {
  /** Player's played card, or null for an oral motion. */
  playerCard: PrecedentCard | OpponentPlayedCard | null;
  /** Opponent's counter-card, or null when they played nothing. */
  opponentCard: OpponentPlayedCard | null;
  /** 'player' | 'opponent' | 'none' — whose card carried the point. */
  winner: 'player' | 'opponent' | 'none';
  /** Changing key re-runs the deal animation. */
  dealKey: string | number;
  width?: number;
  height?: number;
}

interface PhysCard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  scale: number;
  glow: number;
  tossed: boolean;
  labelLines: string[];
  sub: string;
  side: 'player' | 'opponent';
  color: string;
  border: string;
  textColor: string;
}

const TAU = Math.PI * 2;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function CardTableCanvas({
  playerCard,
  opponentCard,
  winner,
  dealKey,
  width = 560,
  height = 190,
}: CardTableProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardsRef = useRef<PhysCard[]>([]);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Deal-in: cards fly from opposite sides with overshoot.
    const mk = (side: 'player' | 'opponent', card: PrecedentCard | OpponentPlayedCard | null): PhysCard => {
      const w = width * 0.38;
      const homeX = side === 'player' ? width * 0.28 : width * 0.72;
      const fromX = side === 'player' ? -w : width + w;
      const rot = side === 'player' ? -0.16 : 0.14;
      return {
        x: fromX,
        y: height * 0.5,
        vx: side === 'player' ? (homeX - fromX) * 4.2 : (homeX - fromX) * 4.2,
        vy: 0,
        rot,
        vrot: 0.9 * (side === 'player' ? -1 : 1),
        scale: 1.06,
        glow: 0,
        tossed: false,
        labelLines: card ? wrapText(ctx, card.caseName, w - 24).slice(0, 2) : [],
        sub: card ? card.citation : 'Oral motion',
        side,
        color: side === 'player' ? '#f4efe3' : '#3d1420',
        border: side === 'player' ? '#0a2e1f' : '#e05252',
        textColor: side === 'player' ? '#0a2e1f' : '#f4efe3',
      };
    };

    cardsRef.current = [
      mk('player', playerCard),
      opponentCard ? mk('opponent', opponentCard) : ({} as PhysCard),
    ].filter((c) => c.side);

    const start = performance.now();
    const winnerGlowTarget = (side: 'player' | 'opponent') => (winner === side ? 1 : 0);

    const draw = (t: number) => {
      const elapsed = (t - start) / 1000;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Felt
      const grad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.7);
      grad.addColorStop(0, '#1b6b4a');
      grad.addColorStop(1, '#0a2e1f');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, 14);
      ctx.fill();

      for (const c of cardsRef.current) {
        const targetX = c.side === 'player' ? width * 0.28 : width * 0.72;
        const settled = Math.min(1, elapsed * 3.2);
        // Spring toward home with damping — the card overshoots, wobbles, settles.
        c.x = targetX + (c.x - targetX) * 0.82;
        if (elapsed < 0.05) c.x = c.side === 'player' ? -width * 0.4 : width * 1.4;

        // Settle rotation + scale
        c.rot += (c.side === 'player' ? -0.04 : 0.04) * (settled - 1) * 0.2;
        c.rot += (0 - c.rot) * 0.08;
        c.scale += (1 - c.scale) * 0.12;

        // Glow ramps on winner
        c.glow += (winnerGlowTarget(c.side) - c.glow) * 0.06;

        // Toss the loser after 0.5s
        if (!c.tossed && elapsed > 0.5 && winner !== 'none' && winner !== c.side) {
          c.tossed = true;
          c.vx = c.side === 'player' ? -9 : 9;
          c.vy = -7;
          c.vrot = c.side === 'player' ? -0.35 : 0.35;
        }
        if (c.tossed) {
          c.vy += 0.55;
          c.x += c.vx;
          c.y += c.vy;
          c.rot += c.vrot;
          c.scale = Math.max(0.4, c.scale * 0.985);
        }

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.scale(c.scale, c.scale);

        const w = width * 0.38;
        const h = height * 0.72;
        ctx.shadowColor = c.glow > 0.05 ? (c.side === 'player' ? 'rgba(230,185,92,0.85)' : 'rgba(224,82,82,0.85)') : 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = c.glow * 26 + 8;
        ctx.shadowOffsetY = 5;

        ctx.fillStyle = c.color;
        ctx.strokeStyle = c.border;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 10);
        ctx.fill();
        ctx.stroke();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Text
        ctx.fillStyle = c.side === 'player' ? 'rgba(10,46,31,0.55)' : 'rgba(244,239,227,0.6)';
        ctx.font = '9px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(c.sub.slice(0, 30), 0, -h / 2 + 18);

        ctx.fillStyle = c.textColor;
        ctx.font = 'bold 13px "Archivo Black", "Arial Black", sans-serif';
        const lines = c.labelLines.length ? c.labelLines : ['No card'];
        lines.forEach((ln, i) => ctx.fillText(ln, 0, -h / 2 + 40 + i * 16));

        // Glow ring on winner
        if (c.glow > 0.05) {
          ctx.strokeStyle = c.side === 'player' ? 'rgba(230,185,92,0.9)' : 'rgba(224,82,82,0.9)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 12);
          ctx.stroke();
        }
        ctx.restore();
      }

      // VS chip
      ctx.fillStyle = 'rgba(224,82,82,0.95)';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 15, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#0a2e1f';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = '#f4efe3';
      ctx.font = 'bold 9px "Archivo Black", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VS', width / 2, height / 2 + 1);
      ctx.textBaseline = 'alphabetic';

      ctx.restore();
      if (elapsed < 6) rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [dealKey, playerCard, opponentCard, winner, width, height]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', maxWidth: width }} className="w-full" aria-hidden />;
}
