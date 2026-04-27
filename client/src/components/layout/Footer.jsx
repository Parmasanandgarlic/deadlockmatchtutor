import { Link } from 'react-router-dom';
import { Github, Shield, Code2, MessageSquare, Bug } from 'lucide-react';
import { useState } from 'react';
import FeedbackForm from './FeedbackForm';
import BugReportForm from './BugReportForm';

/**
 * Art-deco horizontal divider with compass-rose center accent.
 * Mirrors the floor medallion patterns from Deadlock's subway stations.
 */
function ArtDecoDivider({ className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-0 w-full ${className}`}>
      {/* Left wing */}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-deadlock-border to-deadlock-amber/30" />
      <div className="flex items-center gap-1 px-3">
        <div className="w-1 h-1 rotate-45 bg-deadlock-amber/40" />
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-deadlock-amber/50" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="12" cy="12" r="8" opacity="0.4" />
          <line x1="12" y1="4" x2="12" y2="8" />
          <line x1="12" y1="16" x2="12" y2="20" />
          <line x1="4" y1="12" x2="8" y2="12" />
          <line x1="16" y1="12" x2="20" y2="12" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.6" />
        </svg>
        <div className="w-1 h-1 rotate-45 bg-deadlock-amber/40" />
      </div>
      {/* Right wing */}
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-deadlock-border to-deadlock-amber/30" />
    </div>
  );
}

export default function Footer() {
  const [activeForm, setActiveForm] = useState(null); // 'feedback' | 'bug' | null

  return (
    <footer className="bg-black/40 py-12 mt-20 relative overflow-hidden">
      {/* Art-deco top border instead of plain border-t */}
      <div className="absolute top-0 left-0 right-0">
        <div className="h-px w-full bg-deadlock-border" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center">
          <div className="w-24 sm:w-48 h-px bg-gradient-to-r from-transparent to-deadlock-amber/40" />
          <div className="w-2 h-2 rotate-45 bg-deadlock-amber/50 shrink-0 -translate-y-[0.5px]" />
          <div className="w-24 sm:w-48 h-px bg-gradient-to-l from-transparent to-deadlock-amber/40" />
        </div>
      </div>

      {/* Decorative Brand Accent */}
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-deadlock-amber/5 rounded-full blur-[80px] -z-10" />
      {/* Subtle hexagonal grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffad1c' fill-opacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="flex flex-col md:flex-row items-start justify-between gap-12">
          {/* Left: Branding */}
          <div className="max-w-md">
            <h3 className="font-serif text-2xl tracking-[0.2em] uppercase text-deadlock-amber mb-6">
              Deadlock AfterMatch
            </h3>
            <p className="text-base text-white leading-relaxed mb-6">
              A community-driven analytics project for Deadlock. 
              We transform match data into actionable insights to help you master your performance.
            </p>
            <p className="text-xs text-white/50 uppercase tracking-[0.1em] leading-loose">
              Not affiliated with Valve Corporation. Data sourced via{' '}
              <a
                href="https://deadlock-api.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-deadlock-blue hover:text-deadlock-amber transition-colors font-bold"
              >
                deadlock-api.com
              </a>
            </p>
          </div>

          {/* Right: Navigation & Status */}
          <div className="flex flex-wrap gap-16">
            <nav role="navigation" aria-label="Footer navigation" className="flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-2 flex items-center gap-2">
                <span className="w-3 h-px bg-deadlock-amber/50" />
                Navigation
              </span>
              <Link to="/about" className="text-sm font-bold uppercase tracking-widest text-white/80 hover:text-deadlock-amber transition-colors">About</Link>
              <Link to="/faq" className="text-sm font-bold uppercase tracking-widest text-white/80 hover:text-deadlock-amber transition-colors">FAQ</Link>

              <Link to="/privacy" className="text-sm font-bold uppercase tracking-widest text-white/80 hover:text-deadlock-amber transition-colors">Privacy</Link>
              <a href="https://github.com/Parmasanandgarlic/deadlockmatchtutor" target="_blank" rel="noopener noreferrer" className="text-sm font-bold uppercase tracking-widest text-white/80 hover:text-deadlock-amber transition-colors flex items-center gap-2">
                <Github className="w-4 h-4" /> GitHub
              </a>
            </nav>

            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-2 flex items-center gap-2">
                <span className="w-3 h-px bg-deadlock-amber/50" />
                Contact
              </span>
              <a href="mailto:contact@aftermatch.xyz" className="text-sm font-bold uppercase tracking-widest text-white/80 hover:text-deadlock-amber transition-colors">
                contact@aftermatch.xyz
              </a>
            </div>

            <div className="flex flex-col items-start gap-5">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-2 flex items-center gap-2">
                <span className="w-3 h-px bg-deadlock-amber/50" />
                Status
              </span>
              <div className="px-4 py-1.5 bg-deadlock-blue/20 border border-deadlock-blue/40 text-xs font-bold uppercase tracking-widest text-deadlock-blue">
                SYSTEMS OPERATIONAL
              </div>
              <div className="px-4 py-1.5 bg-deadlock-amber/20 border border-deadlock-amber/40 text-xs font-bold uppercase tracking-widest text-deadlock-amber flex items-center gap-2">
                <Code2 className="w-4 h-4" /> MIT LICENSED
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-2 flex items-center gap-2">
                <span className="w-3 h-px bg-deadlock-amber/50" />
                Help Us Improve
              </span>
              <button
                type="button"
                onClick={() => setActiveForm('feedback')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-deadlock-accent/10 border border-deadlock-accent/30 text-deadlock-accent text-xs font-bold uppercase tracking-widest hover:bg-deadlock-accent/20 hover:border-deadlock-accent/50 transition-all duration-300"
              >
                <MessageSquare className="w-4 h-4" /> Send Feedback
              </button>
              <button
                type="button"
                onClick={() => setActiveForm('bug')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-deadlock-red/10 border border-deadlock-red/30 text-deadlock-red text-xs font-bold uppercase tracking-widest hover:bg-deadlock-red/20 hover:border-deadlock-red/50 transition-all duration-300"
              >
                <Bug className="w-4 h-4" /> Report Bug
              </button>
            </div>
          </div>
        </div>
        
        {/* Art-deco divider above copyright */}
        <ArtDecoDivider className="mt-16 mb-8" />

        <div className="flex justify-between items-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">
            © {new Date().getFullYear()} DEADLOCK AFTERMATCH. ENCODE. EXECUTE.
          </p>
        </div>
      </div>

      {/* Form Modals */}
      <FeedbackForm isOpen={activeForm === 'feedback'} onClose={() => setActiveForm(null)} />
      <BugReportForm isOpen={activeForm === 'bug'} onClose={() => setActiveForm(null)} />
    </footer>
  );
}
