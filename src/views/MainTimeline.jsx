import { useState } from 'react';
import { projById, APPS, fmt } from '../data.js';
import { AppTile, Confidence, ProjectChip, ProjectPicker } from '../components/ui.jsx';

function Check({ on }) {
  return (
    <span style={{
      width: 18, height: 18, flex: 'none', borderRadius: 'var(--r-xs)', display: 'grid', placeItems: 'center',
      border: '1.5px solid ' + (on ? 'var(--accent)' : 'var(--line-2)'),
      background: on ? 'var(--accent)' : 'transparent', transition: '120ms ease-out',
    }}>
      {on && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-on)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
    </span>
  );
}

function RowActions({ ev, actions }) {
  const [open, setOpen] = useState(false);

  if (ev.status === 'confirmed') {
    return (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
        <ProjectChip projectId={ev.project} onClick={() => setOpen(true)} />
        {open && <ProjectPicker value={ev.project} align="right" onChange={(id) => actions.assign(ev.id, id)} onClose={() => setOpen(false)} />}
      </div>
    );
  }
  if (ev.status === 'suggested') {
    return (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="eyebrow row-actions-label" style={{ fontSize: 9.5, color: 'var(--fg-3)' }}>Suggested</span>
        <ProjectChip projectId={ev.project} suggested onClick={() => setOpen(true)} />
        <button className="btn-icon" title="Confirm" onClick={() => actions.confirm(ev.id)} style={{
          background: 'var(--accent)', color: 'var(--accent-on)', borderRadius: 'var(--r-sm)', padding: '6px 8px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </button>
        {open && <ProjectPicker value={ev.project} align="right" onChange={(id) => actions.assign(ev.id, id)} onClose={() => setOpen(false)} />}
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="chip" style={{ background: 'transparent', borderColor: 'var(--obj-amber)', borderStyle: 'dashed', color: 'var(--obj-amber)' }}>
        <span className="dot" style={{ background: 'var(--obj-amber)' }} /> Needs review
      </span>
      <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>Assign</button>
      {open && <ProjectPicker value={null} align="right" onChange={(id) => actions.assign(ev.id, id)} onClose={() => setOpen(false)} />}
    </div>
  );
}

function TimelineRow({ ev, selected, onToggle, actions }) {
  const p = ev.project ? projById[ev.project] : null;
  const bar = ev.status === 'unsorted' ? 'var(--obj-amber)' : (p ? p.color : 'var(--line-2)');
  const barOpacity = ev.status === 'confirmed' ? 1 : ev.status === 'suggested' ? 0.5 : 0.85;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'auto 92px 1fr auto', alignItems: 'center', gap: 16,
      padding: '12px 16px 12px 14px', background: selected ? 'color-mix(in srgb, var(--accent) 7%, var(--bg-elev))' : 'var(--bg-elev)',
      border: '1px solid ' + (selected ? 'color-mix(in srgb, var(--accent) 45%, transparent)' : 'var(--line-1)'),
      borderLeft: 'none', borderRadius: 'var(--r-md)', position: 'relative', overflow: 'visible', transition: 'background 120ms ease-out, border-color 120ms ease-out',
    }}>
      <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, background: bar, opacity: barOpacity }} />
      <button onClick={() => onToggle(ev.id)} title={selected ? 'Deselect' : 'Select'} style={{
        background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 2, display: 'grid', placeItems: 'center',
      }}>
        <Check on={selected} />
      </button>
      <div onClick={() => onToggle(ev.id)} style={{ cursor: 'pointer' }}>
        <div className="mono" style={{ fontSize: 12.5, color: 'var(--fg-1)', fontWeight: 700 }}>{fmt.clock(ev.start)}</div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{fmt.dur(ev.dur)}</div>
      </div>
      <div onClick={() => onToggle(ev.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, cursor: 'pointer' }}>
        <AppTile app={ev.app} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: 11.5, color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>{APPS[ev.app]?.name}</span>
            <Confidence level={ev.confidence} />
          </div>
        </div>
      </div>
      <RowActions ev={ev} actions={actions} />
    </div>
  );
}

function BulkBar({ count, onClear, onConfirm, onAssign }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bulk-bar" style={{
      position: 'absolute', left: '50%', bottom: 20, transform: 'translateX(-50%)', zIndex: 40,
      display: 'flex', alignItems: 'center', gap: 12, padding: '9px 10px 9px 16px', flexWrap: 'wrap', justifyContent: 'center', rowGap: 8,
      background: 'var(--bg-inverse)', color: 'var(--fg-on-accent)', borderRadius: 'var(--r-md)',
      boxShadow: 'var(--shadow-3)', animation: 'fadeUp 140ms ease-out',
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <span className="mono" style={{ fontWeight: 700, fontSize: 13.5 }}>{count}</span>
        <span style={{ opacity: 0.7 }}>selected</span>
      </span>
      <span style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.18)' }} />
      <button onClick={onConfirm} style={{
        background: 'transparent', border: 'none', color: 'var(--fg-on-accent)', cursor: 'pointer',
        fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
        padding: '8px 10px', borderRadius: 'var(--r-sm)', display: 'inline-flex', alignItems: 'center', gap: 6,
      }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        Confirm
      </button>
      <div style={{ position: 'relative' }}>
        <button onClick={() => setOpen(true)} className="btn btn-primary btn-sm" style={{ padding: '8px 12px' }}>
          Assign to project ▾
        </button>
        {open && <ProjectPicker value={null} align="right" dir="up" width={250} onChange={(id) => { onAssign(id); setOpen(false); }} onClose={() => setOpen(false)} />}
      </div>
      <button onClick={onClear} title="Clear selection" style={{
        background: 'transparent', border: 'none', color: 'var(--fg-on-accent)', opacity: 0.7, cursor: 'pointer',
        padding: 7, borderRadius: 'var(--r-sm)', display: 'inline-flex',
      }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.7; e.currentTarget.style.background = 'transparent'; }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

export function MainTimeline({ events, actions }) {
  const [sel, setSel] = useState(() => new Set());
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const clear = () => setSel(new Set());
  const allIds = events.map((e) => e.id);
  const allSelected = sel.size === allIds.length && allIds.length > 0;
  const selectAll = () => setSel(allSelected ? new Set() : new Set(allIds));
  const ids = [...sel];

  const doAssign = (project) => { actions.bulkAssign(ids, project); clear(); };
  const doConfirm = () => { actions.bulkConfirm(ids); clear(); };

  const rows = [];
  events.forEach((ev, i) => {
    if (i > 0) {
      const gap = ev.start - events[i - 1].end;
      if (gap >= 6) rows.push({ idle: gap, key: 'gap' + i });
    }
    rows.push({ ev, key: ev.id });
  });

  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 0 }}>
      <div className="scroll tl-scroll" style={{ height: '100%', overflowY: 'auto' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 16px 10px', color: 'var(--fg-3)' }}>
            <button onClick={selectAll} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 9 }}>
              <Check on={allSelected} />
              <span style={{ fontSize: 12.5, color: 'var(--fg-2)', fontWeight: 700 }}>{sel.size > 0 ? `${sel.size} selected` : 'Select all'}</span>
            </button>
            <span style={{ marginLeft: 'auto', fontSize: 11.5 }}>{events.length} entries · tap a row to select</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map((r) => r.idle ? (
              <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 14px', color: 'var(--fg-3)' }}>
                <span style={{ flex: 1, height: 1, background: 'var(--line-1)' }} />
                <span className="mono" style={{ fontSize: 11 }}>{fmt.dur(r.idle)} idle</span>
                <span style={{ flex: 1, height: 1, background: 'var(--line-1)' }} />
              </div>
            ) : (
              <div key={r.key}><TimelineRow ev={r.ev} selected={sel.has(r.ev.id)} onToggle={toggle} actions={actions} /></div>
            ))}
          </div>
        </div>
      </div>
      {sel.size > 0 && <BulkBar count={sel.size} onClear={clear} onConfirm={doConfirm} onAssign={doAssign} />}
    </div>
  );
}
