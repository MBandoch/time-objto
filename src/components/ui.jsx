import { useState, useRef, useEffect } from 'react';
import { PROJECTS, projById, APPS } from '../data.js';

export function AppTile({ app, size = 30, radius = 6 }) {
  const a = APPS[app] || { mono: '?' };
  const fs = a.mono.length > 2 ? size * 0.34 : size * 0.4;
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flex: 'none',
      display: 'grid', placeItems: 'center',
      background: 'var(--bg-sunken)', border: '1px solid var(--line-1)',
      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: fs,
      color: 'var(--fg-2)', letterSpacing: '-0.02em',
    }}>{a.mono}</div>
  );
}

export function Confidence({ level }) {
  const n = level === 'high' ? 3 : level === 'med' ? 2 : 1;
  const col = level === 'high' ? 'var(--obj-success)' : level === 'med' ? 'var(--obj-amber)' : 'var(--obj-gray)';
  return (
    <span title={`${level} confidence`} style={{ display: 'inline-flex', gap: 2, alignItems: 'flex-end', height: 11 }}>
      {[5, 8, 11].map((h, i) => (
        <span key={i} style={{ width: 3, height: h, borderRadius: 1, background: i < n ? col : 'var(--line-2)' }} />
      ))}
    </span>
  );
}

export function Dot({ color, size = 9 }) {
  return <span style={{ width: size, height: size, borderRadius: '50%', background: color, flex: 'none', display: 'inline-block' }} />;
}

export function ProjectChip({ projectId, project, onClick, suggested }) {
  const p = project || projById[projectId];
  if (!p) return null;
  return (
    <button className="chip" onClick={onClick} style={{
      background: suggested ? 'transparent' : `color-mix(in srgb, ${p.color} 13%, transparent)`,
      borderColor: suggested ? 'var(--line-2)' : `color-mix(in srgb, ${p.color} 42%, transparent)`,
      color: 'var(--fg-1)',
      borderStyle: suggested ? 'dashed' : 'solid',
    }}>
      <span className="dot" style={{ background: p.color }} />
      {p.name}
    </button>
  );
}

export function ProjectPicker({ value, onChange, onClose, align = 'left', width = 240, dir = 'down', projects = PROJECTS }) {
  const ref = useRef(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose && onClose(); };
    const k = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [onClose]);
  const ql = q.toLowerCase();
  const list = projects.filter((p) => (p.name || '').toLowerCase().includes(ql) || (p.client || '').toLowerCase().includes(ql));
  const vpos = dir === 'up' ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' };
  return (
    <div ref={ref} className="card scroll" style={{
      position: 'absolute', ...vpos, [align]: 0, zIndex: 50, width,
      boxShadow: 'var(--shadow-3)', padding: 6, maxHeight: 300, overflowY: 'auto',
      animation: 'popIn 120ms ease-out',
    }}>
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Assign to project…"
        style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--line-1)', background: 'transparent',
          padding: '6px 6px 9px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-1)', outline: 'none', marginBottom: 4 }} />
      {list.map((p) => (
        <button key={p.id} onClick={() => { onChange(p.id); onClose && onClose(); }} style={{
          display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left',
          padding: '8px 8px', border: 'none', background: value === p.id ? 'var(--bg-sunken)' : 'transparent',
          borderRadius: 'var(--r-sm)', cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--fg-1)',
        }}
          onMouseEnter={(e) => { if (value !== p.id) e.currentTarget.style.background = 'var(--bg-sunken)'; }}
          onMouseLeave={(e) => { if (value !== p.id) e.currentTarget.style.background = 'transparent'; }}>
          <Dot color={p.color} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>{p.name}</span>
            <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{p.client}</span>
          </span>
          {value === p.id && <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>}
        </button>
      ))}
      <button onClick={() => { onChange(null); onClose && onClose(); }} style={{
        display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', marginTop: 4,
        padding: '8px', border: 'none', borderTop: '1px solid var(--line-1)', background: 'transparent',
        borderRadius: 0, cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--fg-3)', fontSize: 12.5 }}>
        <span style={{ width: 9, textAlign: 'center' }}>＋</span> New project · leave unsorted
      </button>
    </div>
  );
}
