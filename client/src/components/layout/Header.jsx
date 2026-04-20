import { Link } from 'react-router-dom';
import { Github, Shield, Code2 } from 'lucide-react';

/**
 * Compass medallion SVG inline — the iconic Deadlock floor emblem.
 * Used next to the crosshair wordmark as a brand anchor.
 */
function CompassMedallion({ className = '' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="24" cy="24" r="19" stroke="currentColor" strokeWidth="0.75" opacity="0.3" />

      {/* Cardinal spokes */}
      <line x1="24" y1="2" x2="24" y2="10" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <line x1="24" y1="38" x2="24" y2="46" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <line x1="2" y1="24" x2="10" y2="24" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <line x1="38" y1="24" x2="46" y2="24" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />

      {/* Compass diamond */}
      <polygon
        points="24,8 30,24 24,40 18,24"
        stroke="currentColor"
        strokeWidth="1"
        fill="currentColor"
        fillOpacity="0.08"
        opacity="0.7"
      />

      {/* Inner cross lines */}
      <line x1="16" y1="16" x2="32" y2="32" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />
      <line x1="32" y1="16" x2="16" y2="32" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />

      {/* Center dot */}
      <circle cx="24" cy="24" r="2.5" fill="currentColor" opacity="0.5" />
      <circle cx="24" cy="24" r="1" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

export default function Header() {
  return (
    <header className="bg-deadlock-bg/90 backdrop-blur-xl sticky top-0 z-50 relative">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          {/* Compass medallion emblem */}
          <div className="relative">
            <CompassMedallion className="w-8 h-8 text-deadlock-amber group-hover:rotate-[360deg] transition-transform duration-1000 ease-in-out" />
            <div className="absolute inset-0 bg-deadlock-amber/15 blur-lg rounded-full animate-pulse-slow" />
          </div>
          <span className="font-serif text-xl tracking-[0.2em] uppercase">
            <span className="text-deadlock-amber">Deadlock</span>{' '}
            <span className="text-white/60">AfterMatch</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm text-deadlock-text-dim">
          <Link to="/about" className="hidden sm:inline-flex items-center gap-1.5 hover:text-deadlock-accent transition-colors duration-300 relative group/nav">
            <Code2 className="w-4 h-4" /> Open Source
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-deadlock-amber group-hover/nav:w-full transition-all duration-300" />
          </Link>
          <Link to="/privacy" className="hidden sm:inline-flex items-center gap-1.5 hover:text-deadlock-accent transition-colors duration-300 relative group/nav">
            <Shield className="w-4 h-4" /> Privacy
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-deadlock-amber group-hover/nav:w-full transition-all duration-300" />
          </Link>
          <a
            href="https://github.com/Parmasanandgarlic/deadlockmatchtutor"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-deadlock-accent transition-colors duration-300 relative group/nav"
          >
            <Github className="w-4 h-4" /> <span className="hidden sm:inline">GitHub</span>
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-deadlock-amber group-hover/nav:w-full transition-all duration-300" />
          </a>
        </nav>
      </div>

      {/* Art-deco bottom border — layered line with center diamond accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-deadlock-border" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-0">
        <div className="w-16 sm:w-32 h-px bg-gradient-to-r from-transparent to-deadlock-amber/50" />
        <div className="w-1.5 h-1.5 rotate-45 bg-deadlock-amber/60 shrink-0" />
        <div className="w-16 sm:w-32 h-px bg-gradient-to-l from-transparent to-deadlock-amber/50" />
      </div>
    </header>
  );
}
