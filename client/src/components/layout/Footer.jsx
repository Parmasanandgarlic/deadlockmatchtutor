import { Link } from 'react-router-dom';
import { Github, Shield, Code2, MessageSquare, Bug } from 'lucide-react';
import { useState } from 'react';
import FeedbackForm from './FeedbackForm';
import BugReportForm from './BugReportForm';

export default function Footer() {
  const [activeForm, setActiveForm] = useState(null); // 'feedback' | 'bug' | null

  return (
    <footer className="border-t border-deadlock-border bg-black/40 py-12 mt-20 relative overflow-hidden">
      {/* Decorative Brand Accent */}
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-deadlock-amber/5 rounded-full blur-[80px] -z-10" />
      
      <div className="max-w-6xl mx-auto px-6">
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
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-2">Navigation</span>
              <Link to="/about" className="text-sm font-bold uppercase tracking-widest text-white/80 hover:text-deadlock-amber transition-colors">About</Link>
              <Link to="/privacy" className="text-sm font-bold uppercase tracking-widest text-white/80 hover:text-deadlock-amber transition-colors">Privacy</Link>
              <a href="https://github.com/Parmasanandgarlic/deadlockmatchtutor" target="_blank" className="text-sm font-bold uppercase tracking-widest text-white/80 hover:text-deadlock-amber transition-colors flex items-center gap-2">
                <Github className="w-4 h-4" /> GitHub
              </a>
            </div>

            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-2">Contact</span>
              <a href="mailto:contact@aftermatch.xyz" className="text-sm font-bold uppercase tracking-widest text-white/80 hover:text-deadlock-amber transition-colors">
                contact@aftermatch.xyz
              </a>
            </div>

            <div className="flex flex-col items-start gap-5">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-2">Status</span>
              <div className="px-4 py-1.5 bg-deadlock-blue/20 border border-deadlock-blue/40 text-xs font-bold uppercase tracking-widest text-deadlock-blue">
                SYSTEMS OPERATIONAL
              </div>
              <div className="px-4 py-1.5 bg-deadlock-amber/20 border border-deadlock-amber/40 text-xs font-bold uppercase tracking-widest text-deadlock-amber flex items-center gap-2">
                <Code2 className="w-4 h-4" /> MIT LICENSED
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-2">Help Us Improve</span>
              <button
                type="button"
                onClick={() => setActiveForm('feedback')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-deadlock-accent/10 border border-deadlock-accent/30 text-deadlock-accent text-xs font-bold uppercase tracking-widest hover:bg-deadlock-accent/20 transition-colors"
              >
                <MessageSquare className="w-4 h-4" /> Send Feedback
              </button>
              <button
                type="button"
                onClick={() => setActiveForm('bug')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-deadlock-red/10 border border-deadlock-red/30 text-deadlock-red text-xs font-bold uppercase tracking-widest hover:bg-deadlock-red/20 transition-colors"
              >
                <Bug className="w-4 h-4" /> Report Bug
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-deadlock-border/30 flex justify-between items-center">
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
