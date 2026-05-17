import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { createShareLink } from '../../api/client';

export default function ShareButton({ matchId, accountId }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    setLoading(true);
    try {
      const share = await createShareLink(matchId, accountId);
      const url = `${window.location.origin}${share.path}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleShare} disabled={loading} className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-60">
      {copied ? (
        <>
          <Check className="w-4 h-4 text-deadlock-green" />
          Copied!
        </>
      ) : loading ? (
        <>
          <Share2 className="w-4 h-4 animate-pulse" />
          Signing...
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Share Report
        </>
      )}
    </button>
  );
}
