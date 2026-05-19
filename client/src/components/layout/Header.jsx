import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Github, Shield, Code2, Menu, X } from 'lucide-react';
import CompassMedallion from '../ui/CompassMedallion';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

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

        {/* Desktop nav */}
        <nav role="navigation" aria-label="Primary navigation" className="hidden sm:flex items-center gap-3 text-sm text-deadlock-text-dim">
          <Link to="/resources" className="inline-flex items-center gap-1.5 hover:text-deadlock-accent transition-colors duration-300 relative group/nav font-semibold text-deadlock-amber">
            Meta Tier List
            <span className="absolute -bottom-1 left-0 w-full h-px bg-deadlock-amber/50 group-hover/nav:bg-deadlock-amber transition-colors duration-300" />
          </Link>
          <Link to="/about" className="inline-flex items-center gap-1.5 hover:text-deadlock-accent transition-colors duration-300 relative group/nav">
            <Code2 className="w-4 h-4" /> Commission Archives
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-deadlock-amber group-hover/nav:w-full transition-all duration-300" />
          </Link>
          <Link to="/faq" className="hidden md:inline-flex items-center gap-1.5 hover:text-deadlock-accent transition-colors duration-300 relative group/nav">
            Briefing Notes
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-deadlock-amber group-hover/nav:w-full transition-all duration-300" />
          </Link>
          <Link to="/privacy" className="inline-flex items-center gap-1.5 hover:text-deadlock-accent transition-colors duration-300 relative group/nav">
            <Shield className="w-4 h-4" /> Clearance Protocol
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-deadlock-amber group-hover/nav:w-full transition-all duration-300" />
          </Link>
          <a
            href="https://github.com/Parmasanandgarlic/deadlockmatchtutor"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Deadlock AfterMatch on GitHub"
            className="inline-flex items-center gap-1.5 hover:text-deadlock-accent transition-colors duration-300 relative group/nav"
          >
            <Github className="w-4 h-4" /> <span className="hidden sm:inline">GitHub</span>
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-deadlock-amber group-hover/nav:w-full transition-all duration-300" />
          </a>
        </nav>

        {/* Mobile hamburger button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="sm:hidden flex items-center justify-center w-10 h-10 text-deadlock-text-dim hover:text-deadlock-amber transition-colors"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile slide-down drawer */}
      {mobileOpen && (
        <nav
          role="navigation"
          aria-label="Mobile navigation"
          className="sm:hidden absolute top-16 left-0 right-0 bg-deadlock-bg/95 backdrop-blur-xl border-b border-deadlock-border z-40 animate-reveal"
        >
          <div className="flex flex-col px-6 py-4 gap-1">
            <Link
              to="/resources"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 py-3 text-sm font-semibold text-deadlock-amber border-b border-deadlock-border/30"
            >
              Meta Tier List
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 py-3 text-sm text-deadlock-text-dim hover:text-white transition-colors border-b border-deadlock-border/30"
            >
              <Code2 className="w-4 h-4" /> Commission Archives
            </Link>
            <Link
              to="/faq"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 py-3 text-sm text-deadlock-text-dim hover:text-white transition-colors border-b border-deadlock-border/30"
            >
              Briefing Notes
            </Link>
            <Link
              to="/privacy"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 py-3 text-sm text-deadlock-text-dim hover:text-white transition-colors border-b border-deadlock-border/30"
            >
              <Shield className="w-4 h-4" /> Clearance Protocol
            </Link>
            <a
              href="https://github.com/Parmasanandgarlic/deadlockmatchtutor"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 py-3 text-sm text-deadlock-text-dim hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" /> GitHub
            </a>
          </div>
        </nav>
      )}

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
