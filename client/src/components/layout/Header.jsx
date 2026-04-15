import { Link } from 'react-router-dom';
import { Crosshair } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-deadlock-border bg-deadlock-surface/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Crosshair className="w-5 h-5 text-deadlock-accent group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-bold text-lg tracking-tight">
            <span className="text-deadlock-accent">DEADLOCK</span>{' '}
            <span className="text-deadlock-text-dim">Analyzer</span>
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-deadlock-text-dim">
          <span className="hidden sm:inline">Post-Match Analytics</span>
          <span className="px-2 py-0.5 rounded bg-deadlock-accent/15 text-deadlock-accent text-xs font-medium">
            MVP
          </span>
        </nav>
      </div>
    </header>
  );
}
