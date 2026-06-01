import { useState, useEffect, useRef, useMemo } from 'react';
import { PROJECTS, projById, APPS, fmt } from '../data.js';
import { AppTile, Confidence, ProjectPicker, Dot } from '../components/ui.jsx';

const kbdStyle = {
  fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 700, color: 'var(--fg-3)',
  border: '1px solid var(--line-2)', borderRadius: 3, padding: '1px 5px', minWidth: 16, textAlign: 'center',
  background: 'var(--bg-elev)', lineHeight: 1.4,
};

function patternOf(ev) {
  const m = ev.title.match(/\.([a-z0-9]+)$/i);
  if (m) return { kind: 'ext', label: '*.' + m[1].toLowerCase() };
  if (/^localhost/i.test(ev.title)) return { kind: 'host', label: 'localhost' };
  return { kind: 'app', label: APPS[ev.app]?.name || ev.app };
}

export function MainTriage({ events, actions }) {
  const queue = useMemo(() => events.filter((e) => e.status !== 'confirmed'), [events]);
  const [idx, setIdx] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [makeRule, setMakeRule] = useState(true);
  const [rules, setRules] = useState(() => PROJECTS.flatMap((p) => p.rules.slice(0, 1).map((r) => ({ pattern: r, project: p.id, seed: true }))));
  const [flash, setFlash] = useState(null);

  const total = events.length;
  const done = total - queue.length;
  const cur = queue.length ? queue[Math.min(idx, queue.length - 1)] : null;

  const suggestions = useMemo(() => {
    if (!cur) return [];
    const ids = [];
    if (cur.project) ids.push(cur.project);
    for (const p of ['paulista', 'brand', 'site', 'vega-deck', 'admin']) if (!ids.includes(p)) ids.push(p);
    return ids.slice(0, 3).map((id) => projById[id]);
  }, [cur]);

  const pat = cur ? patternOf(cur) : null;
  const offerRule = cur && cur.confidence === 'high' && cur.project && pat;
  const moreInQueue = (cur && offerRule)
    ? queue.filter((e) => e !== cur && e.project === cur.project && patternOf(e).label === pat.label).length : 0;

  const accept = (projectId) => {
    if (!cur) return;
    const pid = projectId !== undefined ? projectId : cur.project;
    actions.assign(cur.id, pid);
    if (offerRule && makeRule && pid === cur.project) {
      setRules((rs) => rs.find((r) => r.pattern === pat.label && r.project === pid) ? rs : [{ pattern: pat.label, project: pid, fresh: true }, ...rs]);
      queue.forEach((e) => { if (e !== cur && e.project === pid && patternOf(e).label === pat.label) actions.confirm(e.id); });
      setFlash(pat.label);
      setTimeout(() => setFlash(null), 1400);
    }
    setIdx((i) => Math.max(0, Math.min(i, queue.length - 2)));
  };
  const skip = () => setIdx((i) => (i + 1) % Math.max(queue.length, 1));

  const accRef = useRef({});
  accRef.current = { accept, skip, suggestions, pickerOpen };
  useEffect(() => {
    const onKey = (e) => {
      const a = accRef.current;
      if (a.pickerOpen) return;
      if (e.key === 'Enter') { e.preventDefault(); a.accept(); }
      else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 's') { e.preventDefault(); a.skip(); }
      else if (['1', '2', '3'].includes(e.key)) { const p = a.suggestions[+e.key - 1]; if (p) a.accept(p.id); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="split-pane" style={{ display: 'grid', gridTemplateColumns: '1fr 296px', height: '100%', minHeight: 0 }}>
      <div className="scroll" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '26px 24px 40px' }}>
        <div style={{ width: '100%', maxWidth: 520, marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
            <span className="eyebrow">Review queue</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--fg-2)' }}>{done} / {total} sorted</span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: 'var(--bg-sunken)', overflow: 'hidden' }}>
            <div style={{ width: `${(done / total) * 100}%`, height: '100%', background: 'var(--accent)', transition: 'width 200ms ease-out' }} />
          </div>
        </div>

        {!cur ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--fg-2)' }}>
            <div className="disp" style={{ fontSize: 60, color: 'var(--obj-success)', lineHeight: 1 }}>✓</div>
            <h2 className="disp" style={{ fontSize: 30, margin: '10px 0 4px', color: 'var(--fg-1)' }}>Queue cleared</h2>
            <p style={{ fontSize: 13.5, maxWidth: 320 }}>Every tracked block is matched to a project. New activity is sorted automatically by your rules.</p>
          </div>
        ) : (
          <div className="card" style={{ width: '100%', maxWidth: 520, padding: 24, boxShadow: 'var(--shadow-2)', position: 'relative' }} key={cur.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 16 }}>
              <AppTile app={cur.app} size={46} radius={8} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cur.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 3 }}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--fg-3)' }}>{APPS[cur.app]?.name} · {fmt.clock(cur.start)}–{fmt.clock(cur.end)} · {fmt.dur(cur.dur)}</span>
                  <Confidence level={cur.confidence} />
                </div>
              </div>
            </div>

            <div className="eyebrow" style={{ marginBottom: 9 }}>{cur.project ? 'Detected match — confirm or change' : 'No match — assign a project'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggestions.map((p, i) => {
                const detected = p.id === cur.project;
                return (
                  <button key={p.id} onClick={() => accept(p.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', cursor: 'pointer',
                    borderRadius: 'var(--r-sm)', textAlign: 'left', fontFamily: 'var(--font-sans)',
                    border: detected ? '1.5px solid var(--accent)' : '1px solid var(--line-1)',
                    background: 'var(--bg-elev)', transition: '120ms ease-out',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-sunken)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-elev)'}>
                    <Dot color={p.color} size={11} />
                    <span style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)', display: 'block' }}>{p.name}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{p.client}</span>
                    </span>
                    {detected && <span className="eyebrow" style={{ color: 'var(--accent)', fontSize: 9 }}>Detected</span>}
                    <kbd style={kbdStyle}>{i + 1}</kbd>
                  </button>
                );
              })}
              <div style={{ position: 'relative' }}>
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setPickerOpen(true)}>Another project…</button>
                {pickerOpen && <ProjectPicker value={cur.project} onChange={(id) => accept(id)} onClose={() => setPickerOpen(false)} />}
              </div>
            </div>

            {offerRule && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 16, padding: '10px 12px', borderRadius: 'var(--r-sm)', background: 'var(--bg-sunken)', cursor: 'pointer' }}>
                <input type="checkbox" checked={makeRule} onChange={(e) => setMakeRule(e.target.checked)} style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
                <span style={{ fontSize: 12.5, color: 'var(--fg-2)', lineHeight: 1.4 }}>
                  Always map <span className="mono" style={{ color: 'var(--fg-1)', fontWeight: 700 }}>{pat.label}</span> → {projById[cur.project].name}
                  {moreInQueue > 0 && <span style={{ color: 'var(--accent)', fontWeight: 700 }}> · sorts {moreInQueue} more now</span>}
                </span>
              </label>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={skip}>Skip <kbd style={kbdStyle}>→</kbd></button>
              <button className="btn btn-primary" onClick={() => accept()} disabled={!cur.project}
                style={{ opacity: cur.project ? 1 : 0.4 }}>Accept <kbd style={{ ...kbdStyle, background: 'rgba(255,255,255,0.18)', color: 'inherit', borderColor: 'rgba(255,255,255,0.3)' }}>↵</kbd></button>
            </div>
          </div>
        )}
      </div>

      <div style={{ borderLeft: '1px solid var(--line-1)', background: 'var(--bg-elev)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line-1)', flex: 'none' }}>
          <div className="eyebrow">Smart rules</div>
          <div style={{ fontSize: 12.5, color: 'var(--fg-3)', marginTop: 3, lineHeight: 1.4 }}>Files matching a rule are sorted automatically — no review needed.</div>
        </div>
        <div className="scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {rules.map((r, i) => {
            const p = projById[r.project];
            const isFlash = flash === r.pattern && r.fresh;
            return (
              <div key={r.pattern + r.project + i} style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 'var(--r-sm)',
                border: '1px solid', borderColor: isFlash ? 'var(--accent)' : 'var(--line-1)',
                background: isFlash ? 'var(--bg-sunken)' : 'transparent', transition: '300ms ease-out',
              }}>
                <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--fg-1)', flex: 'none' }}>{r.pattern}</span>
                <span style={{ color: 'var(--fg-3)', flex: 'none' }}>→</span>
                <Dot color={p.color} size={8} />
                <span style={{ fontSize: 12, color: 'var(--fg-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                {r.fresh && <span className="eyebrow" style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 8.5 }}>New</span>}
              </div>
            );
          })}
        </div>
        <div style={{ padding: '11px 16px', borderTop: '1px solid var(--line-1)', flex: 'none', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-3)' }}>
          <kbd style={kbdStyle}>1</kbd><kbd style={kbdStyle}>2</kbd><kbd style={kbdStyle}>3</kbd>
          <span style={{ fontSize: 11 }}>assign</span>
          <kbd style={kbdStyle}>↵</kbd><span style={{ fontSize: 11 }}>accept</span>
          <kbd style={kbdStyle}>→</kbd><span style={{ fontSize: 11 }}>skip</span>
        </div>
      </div>
    </div>
  );
}
