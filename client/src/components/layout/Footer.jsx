import { Link } from 'react-router-dom';
import { Github, Shield, Code2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-deadlock-border bg-black/40 py-12 mt-20 relative overflow-hidden">
      {/* Decorative Brand Accent */}
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-deadlock-amber/5 rounded-full blur-[80px] -z-10" />
      
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start justify-between gap-12">
          {/* Left: Branding */}
          <div className="max-w-sm">
            <h3 className="font-serif text-lg tracking-[0.2em] uppercase text-deadlock-amber mb-4">
              Deadlock AfterMatch
            </h3>
            <p className="text-xs text-deadlock-text-dim leading-relaxed mb-4">
              A community-driven analytics project for Deadlock. 
              We extract and interpret the occult-steam signals to help you evolve.
            </p>
            <p className="text-[10px] text-deadlock-muted uppercase tracking-[0.1em]">
              Not affiliated with Valve Corporation. Data sourced via{' '}
              <a
                href="https://deadlock-api.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-deadlock-blue hover:text-deadlock-amber transition-colors"
              >
                deadlock-api.com
              </a>
            </p>
          </div>

          {/* Right: Navigation & Status */}
          <div className="flex flex-wrap gap-16">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-deadlock-muted mb-2">Navigation</span>
              <Link to="/about" className="text-xs font-bold uppercase tracking-widest text-deadlock-text-dim hover:text-deadlock-amber transition-colors">About</Link>
              <Link to="/privacy" className="text-xs font-bold uppercase tracking-widest text-deadlock-text-dim hover:text-deadlock-amber transition-colors">Privacy</Link>
              <a href="https://github.com/Parmasanandgarlic/deadlockmatchtutor" target="_blank" className="text-xs font-bold uppercase tracking-widest text-deadlock-text-dim hover:text-deadlock-amber transition-colors flex items-center gap-2">
                <Github className="w-3 h-3" /> GitHub
              </a>
            </div>

            <div className="flex flex-col items-start gap-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-deadlock-muted mb-2">Status</span>
              <div className="px-3 py-1 bg-deadlock-blue/10 border border-deadlock-blue/30 text-[10px] font-bold uppercase tracking-widest text-deadlock-blue">
                SYSTEMS OPERATIONAL
              </div>
              <div className="px-3 py-1 bg-deadlock-amber/10 border border-deadlock-amber/30 text-[10px] font-bold uppercase tracking-widest text-deadlock-amber flex items-center gap-2">
                <Code2 className="w-3 h-3" /> MIT LICENSED
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-deadlock-border/30 flex justify-between items-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-deadlock-muted">
            © {new Date().getFullYear()} DEADLOCK AFTERMATCH. ENCODE. EXECUTE.
          </p>
        </div>
      </div>
    </footer>
  );
}
