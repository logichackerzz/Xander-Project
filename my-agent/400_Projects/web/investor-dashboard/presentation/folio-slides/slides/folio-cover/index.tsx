import { useEffect, useRef } from 'react';
import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';

// ─── Design tokens (Design panel can tweak these) ─────────────────────────────
export const design: DesignSystem = {
  palette: {
    bg:     '#0A0A0F',
    text:   '#FFFFFF',
    accent: '#6366f1',
  },
  fonts: {
    display: '"Dancing Script", "Georgia", cursive',
    body:    '"IBM Plex Mono", "Menlo", monospace',
  },
  typeScale: { hero: 220, body: 28 },
  radius: 12,
};

// ─── Local constants (outside Design panel) ───────────────────────────────────
const indigo     = '#6366f1';
const indigoLt   = '#818cf8';
const indigoGlow = 'rgba(99,102,241,0.22)';
const white20    = 'rgba(255,255,255,0.20)';
const white12    = 'rgba(255,255,255,0.12)';

// ─── Shared keyframes (injected once into this slide) ────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=IBM+Plex+Mono:wght@400;500&display=swap');

  @keyframes fc-reveal-up {
    from { transform: translateY(108%); }
    to   { transform: translateY(0); }
  }
  @keyframes fc-fade-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fc-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes fc-extend {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes fc-blur-clear {
    from { opacity: 0; filter: blur(10px); }
    to   { opacity: 1; filter: blur(0px);  }
  }
  @keyframes fc-glow-bloom {
    from { opacity: 0; transform: translate(-50%,-52%) scale(0.85); }
    to   { opacity: 1; transform: translate(-50%,-52%) scale(1);    }
  }
  @keyframes fc-ticker {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
`;

// ─── Particle canvas ──────────────────────────────────────────────────────────
const ParticleCanvas = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = 1920;
    canvas.height = 1080;

    const N = 60;
    const pts = Array.from({ length: N }, () => ({
      x:  Math.random() * 1920,
      y:  Math.random() * 1080,
      r:  Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      a:  Math.random() * 0.28 + 0.04,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, 1920, 1080);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = 1920; if (p.x > 1920) p.x = 0;
        if (p.y < 0) p.y = 1080; if (p.y > 1080) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${p.a})`;
        ctx.fill();
      });
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.07 * (1 - d / 130)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
};

// ─── Grain texture overlay ────────────────────────────────────────────────────
const Grain = () => (
  <div
    style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.035'/%3E%3C/svg%3E")`,
      opacity: 0.6,
    }}
  />
);

// ─── Radial glow behind wordmark ──────────────────────────────────────────────
const Glow = () => (
  <div
    style={{
      position: 'absolute', zIndex: 1, pointerEvents: 'none',
      width: 900, height: 620,
      borderRadius: '50%',
      background: `radial-gradient(ellipse, ${indigoGlow} 0%, rgba(99,102,241,0.06) 45%, transparent 70%)`,
      top: '50%', left: '50%',
      animation: 'fc-glow-bloom 1.4s cubic-bezier(0.16,1,0.3,1) forwards',
    }}
  />
);

// ─── Stock ticker at the bottom ───────────────────────────────────────────────
const TickerItem = ({ sym, pct, up }: { sym: string; pct: string; up: boolean }) => (
  <span
    style={{
      fontFamily: `"IBM Plex Mono", monospace`,
      fontSize: 22,
      letterSpacing: '0.08em',
      whiteSpace: 'nowrap',
      color: up ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.11)',
    }}
  >
    {sym}&nbsp;{pct}
  </span>
);

const Ticker = () => (
  <div
    style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 44, overflow: 'hidden',
      zIndex: 3, pointerEvents: 'none',
      maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
      WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
      opacity: 0,
      animation: 'fc-fade-in 1.2s ease-out forwards 1.0s',
    }}
  >
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 48,
        width: 'max-content', height: '100%',
        animation: 'fc-ticker 55s linear infinite',
      }}
    >
      <TickerItem sym="AAPL"  pct="+1.24%" up />
      <TickerItem sym="NVDA"  pct="+3.21%" up />
      <TickerItem sym="TSLA"  pct="-0.83%" up={false} />
      <TickerItem sym="MSFT"  pct="+0.52%" up />
      <TickerItem sym="META"  pct="+2.17%" up />
      <TickerItem sym="AMZN"  pct="+0.89%" up />
      <TickerItem sym="AMD"   pct="-1.32%" up={false} />
      <TickerItem sym="台積電" pct="+1.70%" up />
      <TickerItem sym="聯發科" pct="-0.74%" up={false} />
      <TickerItem sym="0050"  pct="+0.72%" up />
      <TickerItem sym="黃金"  pct="+0.82%" up />
      <TickerItem sym="原油"  pct="-0.67%" up={false} />
      {/* duplicate for seamless loop */}
      <TickerItem sym="AAPL"  pct="+1.24%" up />
      <TickerItem sym="NVDA"  pct="+3.21%" up />
      <TickerItem sym="TSLA"  pct="-0.83%" up={false} />
      <TickerItem sym="MSFT"  pct="+0.52%" up />
      <TickerItem sym="META"  pct="+2.17%" up />
      <TickerItem sym="AMZN"  pct="+0.89%" up />
      <TickerItem sym="AMD"   pct="-1.32%" up={false} />
      <TickerItem sym="台積電" pct="+1.70%" up />
      <TickerItem sym="聯發科" pct="-0.74%" up={false} />
      <TickerItem sym="0050"  pct="+0.72%" up />
      <TickerItem sym="黃金"  pct="+0.82%" up />
      <TickerItem sym="原油"  pct="-0.67%" up={false} />
    </div>
  </div>
);

// ─── Cover page ───────────────────────────────────────────────────────────────
const Cover: Page = () => (
  <div
    style={{
      width: '100%', height: '100%',
      background: 'var(--osd-bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', position: 'relative',
    }}
  >
    <style>{STYLES}</style>

    {/* Layers */}
    <ParticleCanvas />
    <Grain />
    <Glow />

    {/* Centre content */}
    <div
      style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 0,
      }}
    >
      {/* Eyebrow */}
      <p
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 24, letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: white20, marginBottom: 32,
          opacity: 0,
          animation: 'fc-fade-up 0.7s cubic-bezier(0.16,1,0.3,1) forwards 0.5s',
        }}
      >
        資料科學系 &nbsp;·&nbsp; Xander &nbsp;·&nbsp; 2026
      </p>

      {/* Wordmark — curtain reveal */}
      <div style={{ overflow: 'hidden', lineHeight: 0.92 }}>
        <h1
          style={{
            fontFamily: '"Dancing Script", cursive',
            fontSize: 220,
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
            display: 'block',
            lineHeight: 0.92,
            animation: 'fc-reveal-up 1.1s cubic-bezier(0.16,1,0.3,1) forwards 0.18s',
          }}
        >
          Folio
        </h1>
      </div>

      {/* Indigo reveal line */}
      <div
        style={{
          width: '100%', height: 2,
          background: indigo,
          marginTop: 16, borderRadius: 1,
          transformOrigin: 'left center',
          animation: 'fc-extend 1.05s cubic-bezier(0.16,1,0.3,1) forwards 0.95s',
        }}
      />

      {/* Tagline */}
      <p
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 28, letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)',
          marginTop: 28,
          animation: 'fc-blur-clear 0.9s cubic-bezier(0.16,1,0.3,1) forwards 1.2s',
        }}
      >
        Markets, made readable.
      </p>
    </div>

    {/* Bottom-left corner */}
    <p
      style={{
        position: 'absolute', bottom: 52, left: 80, zIndex: 3,
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: 22, letterSpacing: '0.12em',
        color: white12,
        opacity: 0,
        animation: 'fc-fade-in 0.6s ease-out forwards 1.45s',
      }}
    >
      Folio · 2026
    </p>

    {/* Bottom-right corner */}
    <p
      style={{
        position: 'absolute', bottom: 52, right: 80, zIndex: 3,
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: 22, letterSpacing: '0.12em',
        color: white12, textAlign: 'right',
        opacity: 0,
        animation: 'fc-fade-in 0.6s ease-out forwards 1.55s',
      }}
    >
      01 · Cover
    </p>

    {/* Ticker */}
    <Ticker />
  </div>
);

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const meta: SlideMeta = {
  title: 'Folio — Cover',
  createdAt: '2026-05-22T16:38:19.381Z',
};

export default [Cover] satisfies Page[];
