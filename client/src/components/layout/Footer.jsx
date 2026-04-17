import { Link } from 'react-router-dom';
import { Github, Shield, Code2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-deadlock-border bg-deadlock-surface/30 py-8 mt-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Branding */}
          <div className="text-center sm:text-left">
            <p className="text-sm text-deadlock-text-dim font-medium mb-1">
              Deadlock Match Analyzer
            </p>
            <p className="text-xs text-deadlock-muted">
              Not affiliated with Valve Corporation. Data sourced from{' '}
              <a
                href="https://deadlock-api.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-deadlock-accent hover:underline"
              >
                deadlock-api.com
              </a>
              .
            </p>
          </div>

          {/* Center: Links */}
          <div className="flex items-center gap-4 text-sm">
            <Link to="/about" className="inline-flex items-center gap-1.5 text-deadlock-text-dim hover:text-deadlock-accent transition-colors">
              <Code2 className="w-4 h-4" /> Open Source
            </Link>
            <Link to="/privacy" className="inline-flex items-center gap-1.5 text-deadlock-text-dim hover:text-deadlock-accent transition-colors">
              <Shield className="w-4 h-4" /> Privacy
            </Link>
            <a
              href="https://github.com/Parmasanandgarlic/deadlockmatchtutor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-deadlock-text-dim hover:text-deadlock-accent transition-colors"
            >
              <Github className="w-4 h-4" /> Contribute
            </a>
          </div>

          {/* Right: Open source badge */}
          <div className="text-center sm:text-right">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-deadlock-accent/10 border border-deadlock-accent/20 text-xs text-deadlock-accent font-medium">
              <Code2 className="w-3 h-3" /> MIT Licensed
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
