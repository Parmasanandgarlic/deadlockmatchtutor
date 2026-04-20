/**
 * DeadlockSceneBackground
 * ------------------------------------------------------------
 * A composed, code-only ("Broadway subway / Curiosity-shop")
 * background scene used behind the MatchList page.
 *
 * Design language pulled directly from the Deadlock reference
 * art boards:
 *   • Warm sepia brick sidewalls with a yellow horizontal band
 *     and green subway-tile accents (from the Broadway image).
 *   • An art-deco stained-glass archway ceiling with amber +
 *     teal fan panels (from the Curiosity shop window).
 *   • A central compass/wheel medallion on the tile floor.
 *   • Fluorescent overhead wash + a deep darkening gradient so
 *     foreground cards remain legible.
 *
 * The scene is pure inline SVG — no binary asset needed, scales
 * to any viewport, and is heavily darkened so the analytics UI
 * in front of it stays crisp.
 */
export default function DeadlockSceneBackground({ className = '', intensity = 0.22 }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        style={{ opacity: intensity }}
      >
        <defs>
          {/* Warm fluorescent overhead wash */}
          <radialGradient id="ceilingGlow" cx="50%" cy="0%" r="70%">
            <stop offset="0%" stopColor="#f5b455" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#c98748" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1a1008" stopOpacity="0" />
          </radialGradient>

          {/* Deep ambient darkening to preserve foreground contrast */}
          <linearGradient id="depthWash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a1218" stopOpacity="0.1" />
            <stop offset="55%" stopColor="#050506" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#020203" stopOpacity="0.92" />
          </linearGradient>

          {/* Sepia brick gradient (walls) */}
          <linearGradient id="brickWall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6b4b2e" />
            <stop offset="55%" stopColor="#4a3220" />
            <stop offset="100%" stopColor="#2a1d12" />
          </linearGradient>

          {/* Green subway tile gradient */}
          <linearGradient id="tileWall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b5a46" />
            <stop offset="100%" stopColor="#1c2b22" />
          </linearGradient>

          {/* Stained-glass amber panel */}
          <linearGradient id="glassAmber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffd482" />
            <stop offset="100%" stopColor="#b87420" />
          </linearGradient>

          {/* Stained-glass teal panel */}
          <linearGradient id="glassTeal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8fdad0" />
            <stop offset="100%" stopColor="#3a7d7a" />
          </linearGradient>

          {/* Tile grid pattern — Broadway ceramic look */}
          <pattern id="tileGrid" x="0" y="0" width="28" height="14" patternUnits="userSpaceOnUse">
            <rect width="28" height="14" fill="url(#tileWall)" />
            <path d="M0 14 H28 M14 0 V14" stroke="#0f1a14" strokeWidth="0.6" opacity="0.7" />
          </pattern>

          {/* Brick stagger pattern — sepia wall */}
          <pattern id="brickPattern" x="0" y="0" width="64" height="22" patternUnits="userSpaceOnUse">
            <rect width="64" height="22" fill="url(#brickWall)" />
            <path d="M0 22 H64 M0 11 H32 M32 0 V11 M32 22 V11" stroke="#1f140a" strokeWidth="0.7" opacity="0.8" />
          </pattern>

          {/* Hex mesh — Deadlock signature overlay */}
          <pattern id="hexMesh" x="0" y="0" width="50" height="44" patternUnits="userSpaceOnUse">
            <polygon
              points="25,2 46,13 46,32 25,43 4,32 4,13"
              fill="none"
              stroke="#ffad1c"
              strokeWidth="0.5"
              opacity="0.15"
            />
          </pattern>
        </defs>

        {/* ── CEILING: arched stained-glass panels ─────────────── */}
        <g>
          {/* Arched cap */}
          <path
            d="M 0 0 L 1600 0 L 1600 180 Q 800 340 0 180 Z"
            fill="url(#brickPattern)"
          />
          {/* Stained-glass fan — 5 panels */}
          {[0, 1, 2, 3, 4].map((i) => {
            const x = 560 + i * 96;
            return (
              <g key={i}>
                <path
                  d={`M ${x} 60 L ${x + 60} 60 L ${x + 48} 180 L ${x + 12} 180 Z`}
                  fill={i % 2 === 0 ? 'url(#glassAmber)' : 'url(#glassTeal)'}
                  opacity="0.85"
                />
                {/* Leaded divider */}
                <path
                  d={`M ${x} 60 L ${x + 12} 180 M ${x + 60} 60 L ${x + 48} 180`}
                  stroke="#1a1208"
                  strokeWidth="2"
                  opacity="0.9"
                />
              </g>
            );
          })}
          {/* Central radial glass "rose" — echoing the Curiosity window */}
          <circle cx="800" cy="160" r="78" fill="url(#glassAmber)" opacity="0.6" />
          <circle cx="800" cy="160" r="78" fill="none" stroke="#1a1208" strokeWidth="2.5" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = (i * Math.PI) / 4;
            return (
              <line
                key={i}
                x1="800"
                y1="160"
                x2={800 + Math.cos(a) * 78}
                y2={160 + Math.sin(a) * 78}
                stroke="#1a1208"
                strokeWidth="1.8"
              />
            );
          })}
          <circle cx="800" cy="160" r="18" fill="#ffcf70" opacity="0.9" />

          {/* Orange art-deco ceiling stripe — echoes Broadway vaulted ceiling */}
          <rect x="0" y="192" width="1600" height="6" fill="#c86a2b" opacity="0.75" />
          <rect x="0" y="204" width="1600" height="2" fill="#ffb464" opacity="0.5" />
        </g>

        {/* ── WALLS: sidewall perspective ──────────────────────── */}
        {/* Left wall: brick top half, green tile lower half, yellow band */}
        <g>
          <polygon points="0,200 380,260 380,820 0,920" fill="url(#brickPattern)" />
          <polygon points="0,540 380,580 380,820 0,920" fill="url(#tileGrid)" opacity="0.95" />
          {/* Yellow Broadway band */}
          <polygon points="0,520 380,560 380,580 0,540" fill="#d9a12c" opacity="0.75" />
          <polygon points="0,524 380,564 380,570 0,534" fill="#f3c859" opacity="0.6" />
          {/* Subtle graffiti swoosh */}
          <path
            d="M 40 690 Q 120 650 200 690 T 350 700"
            fill="none"
            stroke="#c8442a"
            strokeWidth="5"
            opacity="0.55"
          />
        </g>

        {/* Right wall: mirrored */}
        <g>
          <polygon points="1600,200 1220,260 1220,820 1600,920" fill="url(#brickPattern)" />
          <polygon points="1600,540 1220,580 1220,820 1600,920" fill="url(#tileGrid)" opacity="0.95" />
          <polygon points="1600,520 1220,560 1220,580 1600,540" fill="#d9a12c" opacity="0.75" />
          <polygon points="1600,524 1220,564 1220,570 1600,534" fill="#f3c859" opacity="0.6" />
          {/* Graffiti squiggle */}
          <path
            d="M 1560 680 Q 1480 640 1400 680 T 1250 690"
            fill="none"
            stroke="#e88b1f"
            strokeWidth="4"
            opacity="0.5"
          />
        </g>

        {/* ── BACK WALL: distant vault ─────────────────────────── */}
        <rect x="380" y="260" width="840" height="560" fill="#2b1f12" />
        <rect x="380" y="260" width="840" height="560" fill="url(#hexMesh)" />

        {/* Distant doorway glow (Deadlock vault-end lighting) */}
        <ellipse cx="800" cy="620" rx="180" ry="90" fill="#f5b455" opacity="0.22" />
        <ellipse cx="800" cy="620" rx="90" ry="45" fill="#ffcf70" opacity="0.35" />

        {/* ── FLOOR: compass medallion ─────────────────────────── */}
        <g>
          {/* Floor trapezoid */}
          <polygon
            points="0,920 380,820 1220,820 1600,920 1600,1000 0,1000"
            fill="#20160e"
          />
          {/* Floor tile grid */}
          <polygon
            points="0,920 380,820 1220,820 1600,920 1600,1000 0,1000"
            fill="url(#hexMesh)"
            opacity="0.35"
          />

          {/* Compass medallion — mirrors the subway floor emblem */}
          <g transform="translate(800 925)">
            <circle r="120" fill="none" stroke="#6b5538" strokeWidth="2" opacity="0.7" />
            <circle r="100" fill="none" stroke="#4a3a26" strokeWidth="1.2" opacity="0.7" />
            <circle r="22" fill="#3a2d1c" opacity="0.9" />
            <circle r="22" fill="none" stroke="#d4a853" strokeWidth="1.5" opacity="0.8" />
            {/* 16 compass rays */}
            {Array.from({ length: 16 }).map((_, i) => {
              const a = (i * Math.PI) / 8;
              const short = i % 2 === 0;
              const inner = short ? 24 : 24;
              const outer = short ? 100 : 70;
              return (
                <line
                  key={i}
                  x1={Math.cos(a) * inner}
                  y1={Math.sin(a) * inner * 0.5 /* flatten for perspective */}
                  x2={Math.cos(a) * outer}
                  y2={Math.sin(a) * outer * 0.5}
                  stroke="#6b5538"
                  strokeWidth={short ? 2 : 1}
                  opacity="0.75"
                />
              );
            })}
            {/* Small central pip (like the subway emblem) */}
            <circle r="5" fill="#d4a853" opacity="0.9" />
          </g>
        </g>

        {/* ── LIGHTING PASSES ──────────────────────────────────── */}
        <rect x="0" y="0" width="1600" height="1000" fill="url(#ceilingGlow)" />
        <rect x="0" y="0" width="1600" height="1000" fill="url(#depthWash)" />

        {/* Film grain + hex overlay */}
        <rect x="0" y="0" width="1600" height="1000" fill="url(#hexMesh)" opacity="0.5" />
      </svg>

      {/* Extra vignette for foreground legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 45%, transparent 0%, rgba(5,5,6,0.55) 70%, rgba(5,5,6,0.85) 100%)',
        }}
      />
    </div>
  );
}
