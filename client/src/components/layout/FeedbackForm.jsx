import { useState } from 'react';
import { X, Send, MessageSquare, Star } from 'lucide-react';

export default function FeedbackForm({ isOpen, onClose }) {
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    // User will handle email integration
    console.log('Feedback submitted:', { rating, category, message });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  }

  function handleReset() {
    setRating(0);
    setCategory('general');
    setMessage('');
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
            <MessageSquare className="w-5 h-5 text-deadlock-accent" />
            <h2 className="text-xl font-serif tracking-[0.2em] text-white">Feedback</h2>
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
              <h3 className="text-lg font-semibold text-deadlock-green mb-2">Thank You!</h3>
              <p className="text-deadlock-muted text-sm">Your feedback helps us improve.</p>
              <p className="text-deadlock-muted text-xs mt-4">
                Need immediate help? Contact us at{' '}
                <a href="mailto:contact@aftermath.xyz" className="text-deadlock-accent hover:underline">
                  contact@aftermath.xyz
                </a>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-deadlock-muted mb-3">
                  Overall Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-2 transition-colors ${
                        star <= rating ? 'text-deadlock-amber' : 'text-deadlock-border'
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-deadlock-muted mb-3">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field w-full"
                  required
                >
                  <option value="general">General Feedback</option>
                  <option value="ux">User Experience</option>
                  <option value="analytics">Analytics & Data</option>
                  <option value="performance">Performance</option>
                  <option value="feature">Feature Request</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-deadlock-muted mb-3">
                  Your Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you think..."
                  className="input-field w-full min-h-[150px] resize-y"
                  required
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
                  <Send className="w-4 h-4 mr-2" /> Submit
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
