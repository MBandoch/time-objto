import { useState } from 'react';
import { projById, APPS, fmt } from '../data.js';
import { AppTile, Dot, ProjectPicker } from '../components/ui.jsx';

function patOf(ev) {
  const m = ev.title.match(/\.([a-z0-9]+)$/i);
  if (m) return '*.' + m[1].toLowerCase();
  if (/^localhost/i.test(ev.title)) return 'localhost';
  return APPS[ev.app]?.name || ev.app;
}

function GroupCard({ group, actions }) {
  const [open, setOpen] = useState(false);
  const [rule, setRule] = useState(true);
  const sugg = group.project ? projById[group.project] : null;
  const total = group.items.reduce((a, e) => a + e.dur, 0);

  const assignAll = (pid) => group.items.forEach((e) => actions.assign(e.id, pid));

  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 13 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <AppTile app={group.items[0].app} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>{group.key}</span>
            <span className="chip" style={{ cursor: 'default', background: 'var(--bg-sunken)', borderColor: 'var(--line-1)', color: 'var(--fg-2)', fontSize: 10.5 }}>{group.items.length} {group.items.length > 1 ? 'sessions' : 'session'}</span>
          </div>
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 2 }}>{fmt.dur(total)} total · detected signal</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 2 }}>
        {group.items.map((e) => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-2)' }}>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', width: 38, flex: 'none' }}>{fmt.clock(e.start)}</span>
            <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</span>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{fmt.dur(e.dur)}</span>
          </div>
        ))}
      </div>

      {sugg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--fg-3)' }}>
          <span className="eyebrow" style={{ fontSize: 9 }}>Suggests</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--fg-1)' }}><Dot color={sugg.color} /> {sugg.name}</span>
        </div>
      )}

      {sugg && rule !== null && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-2)', cursor: 'pointer' }}>
          <input type="checkbox" checked={rule} onChange={(e) => setRule(e.target.checked)} style={{ accentColor: 'var(--accent)', width: 14, height: 14 }} />
          Make a rule: <span className="mono" style={{ fontWeight: 700, color: 'var(--fg-1)' }}>{group.key}</span> → {sugg.name}
        </label>
      )}

      <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
        {sugg ? (
          <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => assignAll(group.project)}>
            Confirm all → {sugg.name}
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setOpen(true)}>Assign group…</button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>Change</button>
        {open && <ProjectPicker value={group.project} align="right" width={260} onChange={(pid) => assignAll(pid)} onClose={() => setOpen(false)} />}
      </div>
    </div>
  );
}

export function Review({ events, actions }) {
  const queue = events.filter((e) => e.status !== 'confirmed');
  const map = new Map();
  queue.forEach((e) => {
    const k = patOf(e);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(e);
  });
  const groups = [...map.entries()].map(([key, items]) => {
    const counts = {};
    items.forEach((e) => { if (e.project) counts[e.project] = (counts[e.project] || 0) + 1; });
    const project = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || null;
    return { key, items, project };
  }).sort((a, b) => (a.project ? 0 : 1) - (b.project ? 0 : 1));

  return (
    <div className="scroll" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="screen-inner" style={{ maxWidth: 920, margin: '0 auto', padding: '24px 26px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 6, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="eyebrow">Batch review · grouped by detected signal</div>
            <h1 className="disp" style={{ fontSize: 40, margin: '4px 0 0' }}>Review</h1>
          </div>
          {queue.length > 0 && <button className="btn btn-ghost" onClick={actions.confirmAll}>Accept every suggestion</button>}
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--fg-2)', maxWidth: 560, margin: '8px 0 22px' }}>
          {queue.length > 0
            ? `${queue.length} blocks across ${groups.length} signals. Confirm a whole group at once — and turn it into a rule so the same files sort themselves next time.`
            : 'Nothing to review. Every tracked block is matched to a project.'}
        </p>

        {queue.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--fg-2)' }}>
            <div className="disp" style={{ fontSize: 46, color: 'var(--obj-success)', lineHeight: 1 }}>✓</div>
            <div style={{ fontSize: 15, marginTop: 8 }}>Inbox zero</div>
          </div>
        ) : (
          <div className="col-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, alignItems: 'start' }}>
            {groups.map((g) => <GroupCard key={g.key} group={g} actions={actions} />)}
          </div>
        )}
      </div>
    </div>
  );
}
