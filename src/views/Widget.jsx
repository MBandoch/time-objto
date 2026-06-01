import { useState, useEffect } from 'react';
import { PROJECTS, projById, fmt } from '../data.js';
import { Dot } from '../components/ui.jsx';

function FloatingWidget({ expanded, setExpanded }) {
  const [sec, setSec] = useState(43 * 60 + 12);
  const [running, setRunning] = useState(true);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const p = projById['paulista'];
  const hh = Math.floor(sec / 3600), mm = Math.floor((sec % 3600) / 60), ss = sec % 60;
  const others = PROJECTS.filter((x) => x.id !== 'paulista').slice(0, 3);

  return (
    <div style={{
      width: expanded ? 300 : 232, background: 'var(--bg-elev)', borderRadius: 'var(--r-card)',
      border: '1px solid var(--line-2)', boxShadow: 'var(--shadow-3)', overflow: 'hidden', transition: 'width 160ms ease-out',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', borderBottom: '1px solid var(--line-1)', cursor: 'grab' }}>
        <span style={{ display: 'inline-flex', gap: 3 }}>
          {[0,1,2].map((i) => <span key={i} style={{ width: 3, height: 3, borderRadius: 9, background: 'var(--line-strong)' }} />)}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em' }}>OBJ<span style={{ color: 'var(--accent)' }}>_</span>TO</span>
        <button onClick={() => setExpanded((v) => !v)} className="btn-icon" style={{ marginLeft: 'auto', padding: 4 }} title={expanded ? 'Collapse' : 'Expand'}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {expanded ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
          </svg>
        </button>
      </div>

      <div style={{ padding: expanded ? '14px 14px 10px' : '11px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ position: 'relative', width: 9, height: 9, flex: 'none' }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: running ? 'var(--obj-success)' : 'var(--fg-3)' }} />
            {running && <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1px solid var(--obj-success)', animation: 'ping 1.6s ease-out infinite' }} />}
          </span>
          <span className="mono" style={{ fontSize: 21, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '0.01em' }}>{fmt.pad(hh)}:{fmt.pad(mm)}:{fmt.pad(ss)}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button onClick={() => setRunning((r) => !r)} className="btn-icon" title={running ? 'Pause' : 'Resume'} style={{ background: 'var(--bg-sunken)' }}>
              {running
                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z" /></svg>}
            </button>
            <button className="btn-icon" title="Stop" style={{ background: 'var(--bg-sunken)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 9 }}>
          <Dot color={p.color} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
          <span className="chip" style={{ marginLeft: 'auto', cursor: 'default', fontSize: 10, padding: '2px 8px', background: 'var(--bg-sunken)', borderColor: 'var(--line-1)', color: 'var(--fg-3)' }}>auto</span>
        </div>
        {expanded && <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>SketchUp · Paulista1306_facade_v4.skp</div>}
      </div>

      {expanded && (
        <div style={{ padding: '4px 14px 14px' }}>
          <div className="eyebrow" style={{ fontSize: 9, marginBottom: 8 }}>Switch project</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {others.map((x) => (
              <button key={x.id} className="chip" style={{ background: 'transparent', borderColor: 'var(--line-1)', color: 'var(--fg-2)', fontSize: 11 }}>
                <span className="dot" style={{ background: x.color }} /> {x.name}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 13, paddingTop: 11, borderTop: '1px solid var(--line-1)' }}>
            <span style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>Today</span>
            <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-1)' }}>8.1h</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function Widget() {
  const [expanded, setExpanded] = useState(true);
  return (
    <div style={{ height: '100%', position: 'relative', overflow: 'hidden', background: 'repeating-linear-gradient(135deg, var(--bg-sunken) 0 2px, var(--bg) 2px 22px)' }}>
      <div style={{ position: 'absolute', top: 22, left: 26, right: 26, zIndex: 2 }}>
        <div className="eyebrow">Always-on-top companion</div>
        <h1 className="disp" style={{ fontSize: 36, margin: '4px 0 6px' }}>Mini widget</h1>
        <p style={{ fontSize: 13.5, color: 'var(--fg-2)', maxWidth: 440, lineHeight: 1.5 }}>
          A small floating window that stays above your work. It shows what's being tracked right now, lets you pause or switch project, and collapses to a slim bar when you need the space.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setExpanded((v) => !v)}>{expanded ? 'Show collapsed' : 'Show expanded'}</button>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 38, background: 'var(--bg-inverse)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', opacity: 0.92 }}>
        {[0, 1, 2, 3].map((i) => <span key={i} style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(255,255,255,0.14)' }} />)}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>16:48 · Fri 31 May</span>
      </div>

      <div style={{ position: 'absolute', right: 34, bottom: 64 }}>
        <FloatingWidget expanded={expanded} setExpanded={setExpanded} />
      </div>
    </div>
  );
}
