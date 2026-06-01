import { useState, useRef, useEffect } from 'react';
import { APPS, fmt } from '../data.js';
import { Dot } from './ui.jsx';

const APP_OPTIONS = Object.entries(APPS).map(([id, a]) => ({ id, name: a.name }));

function timeToMin(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return isNaN(h) || isNaN(m) ? null : h * 60 + m;
}

export function ManualEntryModal({ projects, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [from, setFrom] = useState('09:00');
  const [to, setTo] = useState('10:00');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [appId, setAppId] = useState('sketchup');
  const [title, setTitle] = useState('');

  const backdropRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const fromMin = timeToMin(from);
  const toMin = timeToMin(to);
  const durMin = fromMin !== null && toMin !== null && toMin > fromMin ? toMin - fromMin : null;

  const valid = durMin !== null && projectId && title.trim();

  const save = () => {
    if (!valid) return;
    const [y, mo, d] = date.split('-').map(Number);
    const label = new Date(y, mo - 1, d).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
    onSave({
      id: 'ev' + Date.now(),
      start: fromMin,
      end: toMin,
      dur: durMin,
      app: appId,
      title: title.trim(),
      project: projectId,
      confidence: 'high',
      status: 'confirmed',
      manual: true,
      dateLabel: label,
    });
    onClose();
  };

  const inp = (props) => ({
    style: {
      fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fg-1)',
      background: 'var(--bg)', border: '1px solid var(--line-2)',
      borderRadius: 'var(--r-sm)', padding: '9px 11px', outline: 'none',
      width: '100%', boxSizing: 'border-box',
    },
    ...props,
  });

  const field = (label, children, hint) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--fg-2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{hint}</span>}
    </div>
  );

  return (
    <div ref={backdropRef} onClick={(e) => { if (e.target === backdropRef.current) onClose(); }} style={{
      position: 'absolute', inset: 0, zIndex: 80,
      background: 'rgba(20,20,19,0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 120ms ease-out',
    }}>
      <div className="card" style={{
        width: 'min(92vw, 500px)', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-3)', borderRadius: 'var(--r-lg)', animation: 'popIn 140ms ease-out',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: '1px solid var(--line-1)' }}>
          <div>
            <div className="eyebrow" style={{ fontSize: 9.5, marginBottom: 2 }}>Today</div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--fg-1)' }}>Add manual entry</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {field('Date',
            <input {...inp({ type: 'date', value: date, onChange: (e) => setDate(e.target.value) })} />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
            {field('From',
              <input {...inp({ type: 'time', value: from, onChange: (e) => setFrom(e.target.value) })} />
            )}
            {field('To',
              <input {...inp({ type: 'time', value: to, onChange: (e) => setTo(e.target.value) })} />
            )}
            <div style={{ paddingBottom: 2 }}>
              {durMin !== null
                ? <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)', whiteSpace: 'nowrap' }}>{fmt.dur(durMin)}</span>
                : <span style={{ fontSize: 12, color: 'var(--obj-danger)' }}>invalid</span>}
            </div>
          </div>

          {field('Project',
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{
              fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fg-1)',
              background: 'var(--bg)', border: '1px solid var(--line-2)',
              borderRadius: 'var(--r-sm)', padding: '9px 11px', outline: 'none', width: '100%', cursor: 'pointer',
            }}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.client}</option>)}
            </select>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {field('App',
              <select value={appId} onChange={(e) => setAppId(e.target.value)} style={{
                fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fg-1)',
                background: 'var(--bg)', border: '1px solid var(--line-2)',
                borderRadius: 'var(--r-sm)', padding: '9px 11px', outline: 'none', cursor: 'pointer',
              }}>
                {APP_OPTIONS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            )}
            {field('Title / description',
              <input {...inp({ value: title, onChange: (e) => setTitle(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter' && valid) save(); }, placeholder: 'Ex: Paulista1306_facade.skp', autoFocus: true })} />
            )}
          </div>

          {projectId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'var(--bg-sunken)', borderRadius: 'var(--r-sm)', border: '1px solid var(--line-1)' }}>
              <Dot color={projects.find((p) => p.id === projectId)?.color} />
              <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>
                {durMin ? fmt.dur(durMin) : '—'} will be added to <strong style={{ color: 'var(--fg-1)' }}>{projects.find((p) => p.id === projectId)?.name}</strong> as confirmed
              </span>
            </div>
          )}
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={!valid} style={{ opacity: valid ? 1 : 0.45 }}>Add entry</button>
        </div>
      </div>
    </div>
  );
}
