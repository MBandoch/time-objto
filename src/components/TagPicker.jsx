import { useState, useRef, useEffect } from 'react';
import { uid } from '../utils/tracking.js';

const TAG_COLORS = ['#32475D', '#B86A4B', '#d89a3d', '#2F8F6E', '#6C7480', '#7c5cbf', '#c0392b', '#27ae60'];

function TagDot({ color, size = 9 }) {
  return <span style={{ width: size, height: size, borderRadius: '50%', background: color, flex: 'none', display: 'inline-block' }} />;
}

export function TagChips({ tagIds = [], tags = [], max = 3 }) {
  const visible = tagIds.slice(0, max);
  const rest = tagIds.length - max;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap' }}>
      {visible.map(id => {
        const t = tags.find(tg => tg.id === id);
        if (!t) return null;
        return (
          <span key={id} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: `color-mix(in srgb, ${t.color} 14%, transparent)`,
            border: `1px solid color-mix(in srgb, ${t.color} 35%, transparent)`,
            borderRadius: 'var(--r-pill)', padding: '1px 7px 1px 5px',
            fontSize: 10.5, fontWeight: 700, color: 'var(--fg-1)',
          }}>
            <TagDot color={t.color} size={6} />
            {t.name}
          </span>
        );
      })}
      {rest > 0 && <span style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>+{rest}</span>}
    </span>
  );
}

export function TagPicker({ value = [], tags = [], onChange, onCreateTag }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const k = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [open]);

  const toggle = (id) => {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  };

  const filtered = tags.filter(t => t.name.toLowerCase().includes(q.toLowerCase()));
  const canCreate = q.trim() && !tags.find(t => t.name.toLowerCase() === q.trim().toLowerCase());

  const createAndAdd = () => {
    if (!canCreate) return;
    const newTag = { id: uid(), name: q.trim(), color: TAG_COLORS[tags.length % TAG_COLORS.length] };
    onCreateTag?.(newTag);
    onChange([...value, newTag.id]);
    setQ('');
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--bg-sunken)', border: '1px solid var(--line-2)',
          borderRadius: 'var(--r-sm)', padding: '5px 9px',
          fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 700,
          color: 'var(--fg-2)', cursor: 'pointer',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
        {value.length > 0 ? `${value.length} tag${value.length > 1 ? 's' : ''}` : 'Tags'}
      </button>

      {open && (
        <div className="card scroll" style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
          width: 220, maxHeight: 280, overflowY: 'auto',
          boxShadow: 'var(--shadow-3)', padding: 8,
          animation: 'popIn 120ms ease-out',
        }}>
          <input
            autoFocus value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createAndAdd(); }}
            placeholder="Buscar ou criar tag…"
            style={{
              width: '100%', boxSizing: 'border-box', border: 'none',
              borderBottom: '1px solid var(--line-1)', background: 'transparent',
              padding: '5px 6px 8px', fontFamily: 'var(--font-sans)', fontSize: 12.5,
              color: 'var(--fg-1)', outline: 'none', marginBottom: 6,
            }}
          />

          {filtered.map(t => (
            <button key={t.id} onClick={() => toggle(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '7px 8px', border: 'none', background: value.includes(t.id) ? 'var(--bg-sunken)' : 'transparent',
              borderRadius: 'var(--r-sm)', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', color: 'var(--fg-1)',
            }}
              onMouseEnter={e => { if (!value.includes(t.id)) e.currentTarget.style.background = 'var(--bg-sunken)'; }}
              onMouseLeave={e => { if (!value.includes(t.id)) e.currentTarget.style.background = 'transparent'; }}
            >
              <TagDot color={t.color} />
              <span style={{ flex: 1, fontSize: 12.5, textAlign: 'left' }}>{t.name}</span>
              {value.includes(t.id) && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </button>
          ))}

          {canCreate && (
            <button onClick={createAndAdd} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '7px 8px', border: 'none', borderTop: filtered.length ? '1px solid var(--line-1)' : 'none',
              background: 'transparent', borderRadius: 'var(--r-sm)', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--accent)',
              marginTop: filtered.length ? 4 : 0,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Criar "{q.trim()}"
            </button>
          )}

          {filtered.length === 0 && !canCreate && (
            <div style={{ fontSize: 12, color: 'var(--fg-3)', padding: '6px 8px', textAlign: 'center' }}>
              Nenhuma tag encontrada
            </div>
          )}
        </div>
      )}
    </div>
  );
}
