import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareButton({ matchId, accountId }) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const url = `${window.location.origin}/report/${matchId}/${accountId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button onClick={handleShare} className="btn-secondary flex items-center gap-2 text-sm">
      {copied ? (
        <>
          <Check className="w-4 h-4 text-deadlock-green" />
          Copied!
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
