import { Link } from 'react-router-dom';
import { Crosshair, Github, Shield, Code2 } from 'lucide-react';

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
