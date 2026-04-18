import { useState } from 'react';
import { X, Send, Bug, AlertTriangle } from 'lucide-react';

export default function BugReportForm({ isOpen, onClose }) {
  const [severity, setSeverity] = useState('low');
  const [area, setArea] = useState('general');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    // User will handle email integration
    console.log('Bug report submitted:', { severity, area, title, description, steps });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  }

  function handleReset() {
    setSeverity('low');
    setArea('general');
    setTitle('');
    setDescription('');
    setSteps('');
    setSubmitted(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-deadlock-bg border border-deadlock-border shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-deadlock-border bg-deadlock-surface/30">
          <div className="flex items-center gap-3">
            <Bug className="w-5 h-5 text-deadlock-red" />
            <h2 className="text-xl font-serif tracking-[0.2em] text-white">Bug Report</h2>
          </div>
          <button onClick={onClose} className="p-2 text-deadlock-muted hover:text-deadlock-amber transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-deadlock-green/20 border border-deadlock-green/40 flex items-center justify-center">
                <Send className="w-8 h-8 text-deadlock-green" />
              </div>
              <h3 className="text-lg font-semibold text-deadlock-green mb-2">Report Submitted!</h3>
              <p className="text-deadlock-muted text-sm">Thanks for helping us improve.</p>
              <p className="text-deadlock-muted text-xs mt-4">
                Need immediate help? Contact us at{' '}
                <a href="mailto:contact@aftermath.xyz" className="text-deadlock-accent hover:underline">
                  contact@aftermath.xyz
                </a>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Severity */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-deadlock-muted mb-3">
                  Severity
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'low', label: 'Low', color: 'text-deadlock-green' },
                    { value: 'medium', label: 'Medium', color: 'text-deadlock-amber' },
                    { value: 'high', label: 'High', color: 'text-deadlock-red' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSeverity(option.value)}
                      className={`flex-1 px-3 py-2 border transition-colors ${
                        severity === option.value
                          ? `border-deadlock-border bg-deadlock-surface ${option.color}`
                          : 'border-deadlock-border/30 text-deadlock-muted hover:border-deadlock-border'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-deadlock-muted mb-3">
                  Affected Area
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="input-field w-full"
                  required
                >
                  <option value="general">General</option>
                  <option value="match-analysis">Match Analysis</option>
                  <option value="dashboard">Dashboard</option>
                  <option value="match-list">Match List</option>
                  <option value="data-parsing">Data Parsing</option>
                  <option value="api">API Integration</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-deadlock-muted mb-3">
                  Bug Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of the issue..."
                  className="input-field w-full"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-deadlock-muted mb-3">
                  What Happened?
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the bug in detail..."
                  className="input-field w-full min-h-[120px] resize-y"
                  required
                />
              </div>

              {/* Steps */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-deadlock-muted mb-3">
                  Steps to Reproduce
                </label>
                <textarea
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                  className="input-field w-full min-h-[100px] resize-y"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-secondary flex-1"
                >
                  Reset
                </button>
                <button type="submit" className="btn-primary flex-1">
                  <Send className="w-4 h-4 mr-2" /> Submit Report
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
