import { useEffect, useState } from 'react';
import { Box } from 'lucide-react';

export default function ItemIcon({ src, alt, className = '', imageClassName = '', width = 64, height = 64 }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div
      className={`shrink-0 overflow-hidden border border-white/5 bg-black/40 flex items-center justify-center text-deadlock-muted ${className}`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt || 'Deadlock item icon'}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-contain ${imageClassName}`}
          onError={() => setFailed(true)}
        />
      ) : (
        <Box className="w-1/2 h-1/2" aria-hidden="true" />
      )}
    </div>
  );
}
