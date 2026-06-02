import { useState } from 'react';
import { fmt } from '../data.js';
import { ProjectPicker } from '../components/ui.jsx';

const HOUR_PX = 80;

const APP_LABELS = {
  figma: 'Figma', sketchup: 'SketchUp', vscode: 'VS Code', photoshop: 'Photoshop',
  blender: 'Blender', chrome: 'Chrome', slack: 'Slack', excel: 'Excel',
  keynote: 'Keynote', zoom: 'Zoom', autocad: 'AutoCAD', revit: 'Revit',
  word: 'Word', powerpoint: 'PowerPoint', notion: 'Notion', arc: 'Arc',
  safari: 'Safari', teams: 'Teams', outlook: 'Outlook',
};
const APP_ABBR = {
  figma: 'FIG', sketchup: 'SKP', vscode: 'VSC', photoshop: 'PS ',
  blender: 'BLD', chrome: 'CHR', slack: 'SLK', excel: 'XLS',
  keynote: 'KEY', zoom: 'ZOM', autocad: 'CAD', revit: 'RVT',
  word: 'DOC', powerpoint: 'PPT', notion: 'NOT', arc: 'ARC',
  safari: 'SAF', teams: 'TMS', outlook: 'OLK',
};

function appLabel(app) { return APP_LABELS[app?.toLowerCase()] || app || '?'; }
function appAbbr(app)  { return (APP_ABBR[app?.toLowerCase()] || (app || '?').slice(0, 3)).toUpperCase(); }

function toTimeInput(min) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}
function parseClock(str) {
  const [h, m] = (str || '').split(':').map(Number);
  return (isNaN(h) || isNaN(m)) ? null : h * 60 + m;
}

function AppBadge({ app }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 800, letterSpacing: '0.05em',
      background: 'var(--bg-sunken)', border: '1px solid var(--line-2)',
      padding: '2px 4px', borderRadius: 3, color: 'var(--fg-3)',
      flex: 'none', userSelect: 'none',
    }}>
      {appAbbr(app)}
    </span>
  );
}

function StatusPip({ status }) {
  const color = status === 'confirmed' ? 'var(--obj-success)'
    : status === 'suggested' ? 'var(--accent)' : 'var(--obj-amber)';
  const label = status === 'confirmed' ? 'Classificado'
    : status === 'suggested' ? 'Sugerido' : 'Revisar';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flex: 'none' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flex: 'none' }} />
      <span style={{ fontSize: 10, color, fontWeight: 700 }}>{label}</span>
    </span>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ ev, projects, actions, onClose }) {
  const endMin = ev.end || ev.start + ev.dur;
  const [startVal, setStartVal] = useState(toTimeInput(ev.start));
  const [endVal,   setEndVal]   = useState(toTimeInput(endMin));
  const [title,    setTitle]    = useState(ev.doc || ev.title || '');
  const [picking,  setPicking]  = useState(false);

  const save = () => {
    const s = parseClock(startVal);
    const e = parseClock(endVal);
    if (s !== null && e !== null && e > s) {
      actions.editEvent(ev.id, { start: s, end: e, dur: e - s, doc: title, title });
    }
    onClose();
  };

  const p = projects.find(pr => pr.id === ev.project);
  const inputStyle = {
    fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--fg-1)',
    background: 'var(--bg)', border: '1px solid var(--line-2)',
    borderRadius: 'var(--r-sm)', padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  const labelStyle = {
    fontSize: 10.5, fontWeight: 700, color: 'var(--fg-3)',
    textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5,
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'absolute', inset: 0, zIndex: 80,
        background: 'rgba(20,20,19,0.44)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 120ms ease-out',
      }}
    >
      <div className="card" style={{
        width: 'min(92vw, 420px)', boxShadow: 'var(--shadow-3)',
        borderRadius: 'var(--r-lg)', animation: 'popIn 140ms ease-out',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px', borderBottom: '1px solid var(--line-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppBadge app={ev.app} />
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-1)' }}>Editar entrada</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Fields */}
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Time range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Início</label>
              <input type="time" value={startVal} onChange={e => setStartVal(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Fim</label>
              <input type="time" value={endVal} onChange={e => setEndVal(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Title / description */}
          <div>
            <label style={labelStyle}>Descrição</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder={appLabel(ev.app)}
              style={inputStyle}
            />
          </div>

          {/* Project */}
          <div>
            <label style={labelStyle}>Projeto</label>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setPicking(v => !v)}
                style={{
                  width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--bg)', border: '1px solid var(--line-2)',
                  borderRadius: 'var(--r-sm)', padding: '7px 10px', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: 13, color: p ? 'var(--fg-1)' : 'var(--fg-3)',
                }}
              >
                {p
                  ? <><span style={{ width: 9, height: 9, borderRadius: '50%', background: p.color, flex: 'none' }} />{p.name}</>
                  : 'Não classificado'
                }
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: 'auto' }}><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {picking && (
                <ProjectPicker
                  value={ev.project} projects={projects} align="left"
                  onChange={(id) => { actions.assign(ev.id, id); setPicking(false); }}
                  onClose={() => setPicking(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid var(--line-1)' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { actions.deleteEvent(ev.id); onClose(); }}
            style={{ color: 'var(--obj-danger)', borderColor: 'var(--obj-danger)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" /></svg>
            Excluir
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary btn-sm" onClick={save}>Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────
function EventCard({ ev, projects, actions, toY, onEdit }) {
  const [picking,  setPicking]  = useState(false);
  const [hovered,  setHovered]  = useState(false);
  const [deleting, setDeleting] = useState(false);

  const top    = toY(ev.start);
  const rawH   = toY(ev.start + ev.dur) - top;
  const height = Math.max(38, rawH);
  const compact  = height < 54;
  const spacious = height > 92;

  const p        = projects.find(pr => pr.id === ev.project);
  const barColor = ev.status === 'unsorted' ? 'var(--obj-amber)'
    : ev.status === 'suggested' ? 'var(--accent)'
    : (p?.color || 'var(--obj-success)');
  const bgColor  = ev.status === 'confirmed' ? 'var(--bg-elev)'
    : ev.status === 'suggested' ? 'color-mix(in srgb, var(--accent) 5%, var(--bg-elev))'
    : 'color-mix(in srgb, var(--obj-amber) 5%, var(--bg-elev))';

  const docName = ev.doc || ev.title || '';
  const label   = appLabel(ev.app);
  const endMin  = ev.end || ev.start + ev.dur;

  return (
    <div
      style={{
        position: 'absolute', top, left: 0, right: 0, height,
        background: bgColor, border: '1px solid var(--line-1)',
        borderLeft: `3px solid ${barColor}`, borderRadius: 'var(--r-sm)',
        padding: compact ? '3px 8px 3px 8px' : '6px 10px 5px 9px',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', transition: 'box-shadow 100ms ease-out', cursor: 'default',
      }}
      onMouseEnter={(e) => { setHovered(true); e.currentTarget.style.boxShadow = 'var(--shadow-2)'; e.currentTarget.style.zIndex = 10; }}
      onMouseLeave={(e) => { setHovered(false); setDeleting(false); e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.zIndex = 1; }}
    >
      {/* ── Hover toolbar (top-right) ── */}
      {hovered && !picking && (
        <div style={{
          position: 'absolute', top: 4, right: 6,
          display: 'flex', alignItems: 'center', gap: 3, zIndex: 20,
        }}>
          {deleting ? (
            <>
              <span style={{ fontSize: 10.5, color: 'var(--obj-danger)', fontWeight: 700, marginRight: 4 }}>Excluir?</span>
              <button
                onClick={() => actions.deleteEvent(ev.id)}
                style={{ fontSize: 10, padding: '1px 7px', cursor: 'pointer', borderRadius: 'var(--r-sm)', border: '1px solid var(--obj-danger)', background: 'var(--obj-danger)', color: '#fff', fontFamily: 'var(--font-sans)', fontWeight: 700 }}
              >Sim</button>
              <button
                onClick={() => setDeleting(false)}
                style={{ fontSize: 10, padding: '1px 7px', cursor: 'pointer', borderRadius: 'var(--r-sm)', border: '1px solid var(--line-2)', background: 'var(--bg-elev)', color: 'var(--fg-2)', fontFamily: 'var(--font-sans)' }}
              >Não</button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(ev)}
                title="Editar"
                style={{ display: 'grid', placeItems: 'center', width: 22, height: 22, border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', background: 'var(--bg-elev)', cursor: 'pointer', color: 'var(--fg-2)' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              </button>
              <button
                onClick={() => setDeleting(true)}
                title="Excluir"
                style={{ display: 'grid', placeItems: 'center', width: 22, height: 22, border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', background: 'var(--bg-elev)', cursor: 'pointer', color: 'var(--obj-danger)' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" /></svg>
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Primary row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        <AppBadge app={ev.app} />

        <span style={{
          fontSize: compact ? 11 : 12.5, fontWeight: 700, color: 'var(--fg-1)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0,
        }}>
          {docName || label}
        </span>

        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', flex: 'none', whiteSpace: 'nowrap' }}>
          {fmt.clock(ev.start)}
          <span style={{ margin: '0 3px', opacity: 0.4 }}>→</span>
          {fmt.clock(endMin)}
        </span>

        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)', fontWeight: 700, flex: 'none', minWidth: 26, textAlign: 'right' }}>
          {fmt.dur(ev.dur)}
        </span>

        {/* Project picker */}
        <div style={{ position: 'relative', flex: 'none' }}>
          <button
            onClick={() => setPicking(v => !v)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '2px 5px', borderRadius: 'var(--r-sm)',
              color: p ? 'var(--fg-1)' : (ev.status === 'unsorted' ? 'var(--obj-amber)' : 'var(--fg-3)'),
              fontSize: 11, fontWeight: 700,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-sunken)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {p
              ? <><span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flex: 'none' }} />{p.name}</>
              : ev.status === 'unsorted'
                ? <span style={{ borderBottom: '1.5px dashed var(--obj-amber)' }}>revisar</span>
                : label
            }
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {picking && (
            <ProjectPicker
              value={ev.project} projects={projects} align="right"
              onChange={(id) => { actions.assign(ev.id, id); setPicking(false); }}
              onClose={() => setPicking(false)}
            />
          )}
        </div>
      </div>

      {/* ── Secondary row (non-compact) ── */}
      {!compact && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, minWidth: 0 }}>
          <span style={{ fontSize: 11, color: 'var(--fg-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
            {label}
          </span>
          {spacious && <StatusPip status={ev.status} />}
          {ev.status === 'suggested' && (
            <button onClick={() => actions.confirm(ev.id)} className="btn btn-ghost btn-sm" style={{
              flex: 'none', fontSize: 10, padding: '2px 7px',
              color: 'var(--obj-success)', borderColor: 'var(--obj-success)',
            }}>✓ confirmar</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onStartTracking }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 48 }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'var(--bg-sunken)', border: '1px solid var(--line-1)',
        display: 'grid', placeItems: 'center',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-1)', marginBottom: 6 }}>Nenhuma sessão hoje</div>
        <div style={{ fontSize: 13, color: 'var(--fg-3)', maxWidth: 300, lineHeight: 1.6 }}>
          Inicie o rastreamento para registrar automaticamente os programas e arquivos que você usar.
        </div>
      </div>
      {onStartTracking && (
        <button className="btn btn-primary" onClick={onStartTracking} style={{ gap: 8, padding: '10px 22px', fontSize: 14 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          Iniciar dia de trabalho
        </button>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function MainTimeline({ events, actions, projects = [], onStartTracking }) {
  const [filter,       setFilter]       = useState('all'); // 'all' | 'review'
  const [editingEvent, setEditingEvent] = useState(null);

  if (!events.length) return <EmptyState onStartTracking={onStartTracking} />;

  const needReview = events.filter(e => e.status !== 'confirmed').length;
  const visible    = filter === 'review'
    ? events.filter(e => e.status !== 'confirmed')
    : events;

  const starts   = visible.length ? visible.map(e => e.start) : events.map(e => e.start);
  const ends     = visible.length ? visible.map(e => e.end || (e.start + e.dur)) : events.map(e => e.end || (e.start + e.dur));
  const startHour = Math.max(0, Math.floor(Math.min(...starts) / 60) - 1);
  const endHour   = Math.min(24, Math.ceil(Math.max(...ends) / 60) + 1);
  const totalPx   = (endHour - startHour) * HOUR_PX;
  const hours     = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const toY       = (min) => (min - startHour * 60) / 60 * HOUR_PX;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* ── Filter bar ── */}
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px 4px 66px', borderBottom: '1px solid var(--line-1)' }}>
        {['all', 'review'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 'var(--r-pill)',
              fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 700,
              background: filter === f ? 'var(--bg-sunken)' : 'transparent',
              color: filter === f ? 'var(--fg-1)' : 'var(--fg-3)',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}
          >
            {f === 'review' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--obj-amber)', flex: 'none' }} />}
            {f === 'all' ? 'Todos' : `Revisar${needReview ? ` (${needReview})` : ''}`}
          </button>
        ))}
      </div>

      {/* ── Timeline scroll ── */}
      <div className="scroll tl-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 840, margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'relative', height: totalPx + HOUR_PX }}>

            {hours.map(h => (
              <div key={h} style={{
                position: 'absolute', top: toY(h * 60), left: 0, right: 0,
                display: 'flex', alignItems: 'flex-start',
                pointerEvents: 'none', zIndex: 0,
              }}>
                <span className="mono" style={{
                  width: 48, textAlign: 'right', fontSize: 11, color: 'var(--fg-3)',
                  paddingRight: 10, paddingTop: 2, flex: 'none', lineHeight: 1,
                }}>
                  {fmt.clock(h * 60)}
                </span>
                <span style={{ flex: 1, height: 1, background: 'var(--line-1)', marginTop: 6 }} />
              </div>
            ))}

            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 58, right: 0 }}>
              {visible.map(ev => (
                <EventCard
                  key={ev.id} ev={ev} projects={projects} actions={actions}
                  toY={toY} onEdit={setEditingEvent}
                />
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ── Edit modal ── */}
      {editingEvent && (
        <EditModal
          ev={editingEvent} projects={projects} actions={actions}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
}
