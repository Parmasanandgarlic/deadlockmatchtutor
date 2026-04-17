import { Link } from 'react-router-dom';
import { Crosshair, Github, Shield, Code2 } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-deadlock-border bg-deadlock-bg/90 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <Crosshair className="w-6 h-6 text-deadlock-amber group-hover:rotate-180 transition-transform duration-700" />
            <div className="absolute inset-0 bg-deadlock-amber/20 blur-md rounded-full animate-pulse-slow" />
          </div>
          <span className="font-serif text-xl tracking-[0.2em] uppercase">
            <span className="text-deadlock-amber">Deadlock</span>{' '}
            <span className="text-white/60">AfterMatch</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm text-deadlock-text-dim">
          <Link to="/about" className="hidden sm:inline-flex items-center gap-1.5 hover:text-deadlock-accent transition-colors">
            <Code2 className="w-4 h-4" /> Open Source
          </Link>
          <Link to="/privacy" className="hidden sm:inline-flex items-center gap-1.5 hover:text-deadlock-accent transition-colors">
            <Shield className="w-4 h-4" /> Privacy
          </Link>
          <a
            href="https://github.com/Parmasanandgarlic/deadlockmatchtutor"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-deadlock-accent transition-colors"
          >
            <Github className="w-4 h-4" /> <span className="hidden sm:inline">GitHub</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
