import { Hammer, Clock, ListOrdered } from 'lucide-react';

const SLOT_COLORS = {
  weapon:   'bg-deadlock-red/30 text-deadlock-red',
  vitality: 'bg-deadlock-green/30 text-deadlock-green',
  spirit:   'bg-deadlock-purple/30 text-deadlock-purple',
  utility:  'bg-deadlock-blue/30 text-deadlock-blue',
  flex:     'bg-deadlock-muted/30 text-deadlock-muted',
};

function formatTime(seconds) {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function BuildPathModule({ data }) {
  if (!data) return null;
  const {
    score,
    slotShares = {},
    expectedSlotBalance = {},
    tierProgression = [],
    firstT3Item,
    firstT4Item,
    underutilizedSlots = [],
    overusedSlots = [],
    missingKeyItems = [],
    nextPurchases = [],
    timingScore,
    balanceScore,
    completenessScore,
    summary,
  } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Hammer className="w-8 h-8 text-deadlock-accent" />
          <div>
            <p className="text-xs uppercase tracking-widest text-deadlock-muted">Build Path Optimization</p>
            <p className="font-semibold">{summary || 'Your build breakdown'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-deadlock-muted">Build Score</p>
          <p className="font-mono text-2xl font-bold text-deadlock-accent">{score}/100</p>
        </div>
      </div>

      {/* Sub-scores */}
      <div className="grid grid-cols-3 gap-3">
        <SubScore label="Timing" value={timingScore} />
        <SubScore label="Balance" value={balanceScore} />
        <SubScore label="Completeness" value={completenessScore} />
      </div>

      {/* Slot balance */}
      <div>
        <p className="text-xs uppercase tracking-widest text-deadlock-muted mb-2">Slot Balance (by souls spent)</p>
        <div className="space-y-2">
          {['weapon', 'vitality', 'spirit', 'utility'].map((slot) => {
            const actual = slotShares[slot] || 0;
            const expected = Math.round((expectedSlotBalance[slot] || 0) * 100);
            return (
              <div key={slot} className="flex items-center gap-3">
                <span className={`w-20 text-xs px-2 py-0.5 rounded uppercase text-center ${SLOT_COLORS[slot]}`}>{slot}</span>
                <div className="flex-1 h-3 bg-deadlock-border rounded-full overflow-hidden relative">
                  <div className="h-full bg-deadlock-accent" style={{ width: `${actual}%` }} />
                  <div className="absolute top-0 h-full border-l border-dashed border-deadlock-muted" style={{ left: `${expected}%` }} />
                </div>
                <span className="font-mono text-xs w-16 text-right">
                  {actual}% <span className="text-deadlock-muted">/{expected}%</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier progression + spikes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-deadlock-bg rounded-lg p-3">
          <p className="text-xs uppercase tracking-widest text-deadlock-muted mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Power Spike Timing
          </p>
          <div className="space-y-1 text-sm">
            <Row label="First Tier-3 item" value={firstT3Item ? `${firstT3Item.name} at ${formatTime(firstT3Item.timeSeconds)}` : 'Not reached'} />
            <Row label="First Tier-4 item" value={firstT4Item ? `${firstT4Item.name} at ${formatTime(firstT4Item.timeSeconds)}` : 'Not reached'} />
          </div>
        </div>
        <div className="bg-deadlock-bg rounded-lg p-3">
          <p className="text-xs uppercase tracking-widest text-deadlock-muted mb-2 flex items-center gap-1.5">
            <ListOrdered className="w-3.5 h-3.5" /> Tier Progression
          </p>
          <div className="space-y-1 text-sm">
            {tierProgression.length === 0 ? (
              <p className="text-deadlock-muted">No tiered items detected.</p>
            ) : (
              tierProgression.map((t) => (
                <Row
                  key={t.tier}
                  label={`T${t.tier} items`}
                  value={`${t.count} ${t.count === 1 ? 'item' : 'items'}${t.avgTimeSeconds ? ` · avg ${formatTime(t.avgTimeSeconds)}` : ''}`}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {(underutilizedSlots.length > 0 || missingKeyItems.length > 0 || nextPurchases.length > 0) && (
        <div>
          <p className="text-xs uppercase tracking-widest text-deadlock-muted mb-2">Optimization Suggestions</p>
          <ul className="space-y-2">
            {nextPurchases.map((n, i) => (
              <li key={`np-${i}`} className="text-sm bg-deadlock-bg p-2 rounded-lg">
                <span className="text-xs font-bold uppercase text-deadlock-accent mr-2">{n.slot}</span>
                {n.reason}
              </li>
            ))}
            {overusedSlots.length > 0 && (
              <li className="text-sm text-deadlock-muted">
                Over-invested in: {overusedSlots.join(', ')}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function SubScore({ label, value }) {
  return (
    <div className="bg-deadlock-bg rounded-lg p-3 text-center">
      <p className="text-xs text-deadlock-muted uppercase">{label}</p>
      <p className="font-mono text-xl font-semibold">{value != null ? value : '—'}</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-deadlock-muted text-xs">{label}</span>
      <span className="font-mono text-xs text-right">{value}</span>
    </div>
  );
}
