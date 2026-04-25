/**
 * Compass medallion SVG inline — the iconic Deadlock floor emblem.
 * Used as the favicon and branding asset.
 */
export default function CompassMedallion({ className = '' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="24" cy="24" r="19" stroke="currentColor" strokeWidth="0.75" opacity="0.3" />

      {/* Cardinal spokes */}
      <line x1="24" y1="2" x2="24" y2="10" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <line x1="24" y1="38" x2="24" y2="46" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <line x1="2" y1="24" x2="10" y2="24" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <line x1="38" y1="24" x2="46" y2="24" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />

      {/* Compass diamond */}
      <polygon
        points="24,8 30,24 24,40 18,24"
        stroke="currentColor"
        strokeWidth="1"
        fill="currentColor"
        fillOpacity="0.08"
        opacity="0.7"
      />

      {/* Inner cross lines */}
      <line x1="16" y1="16" x2="32" y2="32" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />
      <line x1="32" y1="16" x2="16" y2="32" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />

      {/* Center dot */}
      <circle cx="24" cy="24" r="2.5" fill="currentColor" opacity="0.5" />
      <circle cx="24" cy="24" r="1" fill="currentColor" opacity="0.9" />
    </svg>
  );
}
