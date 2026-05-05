import { useEffect, useState } from 'react';
import { Box } from 'lucide-react';

/**
 * Deadlock in-game tier color mapping.
 * Matches the shop category colors exactly.
 */
const TIER_COLORS = {
  1: { border: 'border-green-500/60', bg: 'bg-green-500/10', ring: 'ring-green-500/30', text: 'text-green-400' },
  2: { border: 'border-blue-400/60', bg: 'bg-blue-400/10', ring: 'ring-blue-400/30', text: 'text-blue-400' },
  3: { border: 'border-purple-400/60', bg: 'bg-purple-400/10', ring: 'ring-purple-400/30', text: 'text-purple-400' },
  4: { border: 'border-amber-400/60', bg: 'bg-amber-400/10', ring: 'ring-amber-400/30', text: 'text-amber-400' },
};

/**
 * Slot-based accent colors for item categories.
 * Matches Deadlock's weapon (orange), spirit (purple), vitality (green) scheme.
 */
const SLOT_COLORS = {
  weapon: { accent: 'border-l-orange-400/70' },
  spirit: { accent: 'border-l-purple-400/70' },
  tech: { accent: 'border-l-purple-400/70' },
  vitality: { accent: 'border-l-green-400/70' },
  armor: { accent: 'border-l-green-400/70' },
};

function getSlotKey(slot) {
  if (!slot) return null;
  const s = String(slot).toLowerCase();
  if (s.includes('weapon')) return 'weapon';
  if (s.includes('spirit') || s.includes('tech')) return 'spirit';
  if (s.includes('vital') || s.includes('armor')) return 'vitality';
  return null;
}

export { TIER_COLORS, SLOT_COLORS, getSlotKey };

export default function ItemIcon({ src, alt, className = '', imageClassName = '', width = 64, height = 64, tier, slot }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const tierStyle = tier ? TIER_COLORS[tier] : null;
  const slotKey = getSlotKey(slot);
  const slotStyle = slotKey ? SLOT_COLORS[slotKey] : null;

  const borderClass = tierStyle
    ? `${tierStyle.border} ${tierStyle.bg}`
    : 'border-white/5 bg-black/40';
  const leftAccent = slotStyle ? `border-l-2 ${slotStyle.accent}` : '';

  return (
    <div
      className={`shrink-0 overflow-hidden border ${borderClass} ${leftAccent} flex items-center justify-center text-deadlock-muted ${className}`}
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
