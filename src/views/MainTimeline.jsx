import { useState } from 'react';
import { fmt } from '../data.js';
import { ProjectPicker } from '../components/ui.jsx';

const HOUR_PX = 80;

function appLabel(app) {
  const known = { figma: 'Figma', sketchup: 'SketchUp', vscode: 'VS Code', photoshop: 'Photoshop', blender: 'Blender', chrome: 'Chrome', slack: 'Slack', excel: 'Excel', keynote: 'Keynote', zoom: 'Zoom' };
  return known[app?.toLowerCase()] || app || '?';
}

function CardMenu({ ev, projects, actions, onClose }) {
  const ref = useState(() => {
    const el = document.createElement('div');
    return el;
  })[0];
  return (
    <ProjectPicker
      value={ev.project}
      projects={projects}
      align="right"
      onChange={(id) => { actions.assign(ev.id, id); onClose(); }}
      onClose={onClose}
    />
  );
}

function EventCard({ ev, projects, actions, toY }) {
  const [picking, setPicking] = useState(false);
  const top = toY(ev.start);
  const rawH = toY(ev.start + ev.dur) - top;
  const height = Math.max(38, rawH);
  const compact = height < 52;

  const p = projects.find(pr => pr.id === ev.project);
  const barColor = ev.status === 'unsorted'
    ? 'var(--obj-amber)'
    : (p?.color || 'var(--line-2)');

  const bgColor = ev.status === 'confirmed'
    ? 'var(--bg-elev)'
    : ev.status === 'suggested'
      ? 'color-mix(in srgb, var(--bg-sunken) 60%, var(--bg-elev))'
      : 'color-mix(in srgb, var(--obj-amber) 6%, var(--bg-elev))';

  return (
    <div style={{
      position: 'absolute', top, left: 0, right: 0, height,
      background: bgColor,
      border: '1px solid var(--line-1)',
      borderLeft: `3px solid ${barColor}`,
      borderRadius: 'var(--r-sm)',
      padding: compact ? '4px 10px 4px 9px' : '7px 10px 6px 9px',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      transition: 'box-shadow 100ms ease-out',
      cursor: 'default',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-2)'; e.currentTarget.style.zIndex = 10; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.zIndex = 1; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span style={{
          fontSize: compact ? 11 : 12.5, fontWeight: 700, color: 'var(--fg-1)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0,
        }}>
          {ev.title || appLabel(ev.app)}
        </span>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', flex: 'none' }}>
          {fmt.clock(ev.start)}–{fmt.clock(ev.end || ev.start + ev.dur)}
        </span>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)', fontWeight: 700, flex: 'none' }}>
          {fmt.dur(ev.dur)}
        </span>
        <div style={{ position: 'relative', flex: 'none' }}>
          <button onClick={() => setPicking(v => !v)} style={{
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
                : appLabel(ev.app)
            }
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {picking && (
            <ProjectPicker
              value={ev.project}
              projects={projects}
              align="right"
              onChange={(id) => { actions.assign(ev.id, id); setPicking(false); }}
              onClose={() => setPicking(false)}
            />
          )}
        </div>
      </div>

      {!compact && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, minWidth: 0 }}>
          <span style={{ fontSize: 11, color: 'var(--fg-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {appLabel(ev.app)}
          </span>
          {ev.status === 'suggested' && (
            <button onClick={() => actions.confirm(ev.id)} className="btn btn-ghost btn-sm" style={{
              marginLeft: 'auto', flex: 'none', fontSize: 10, padding: '2px 7px',
              color: 'var(--obj-success)', borderColor: 'var(--obj-success)',
            }}>✓ confirmar</button>
          )}
        </div>
      )}
    </div>
  );
}

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

export function MainTimeline({ events, actions, projects = [], onStartTracking }) {
  if (!events.length) return <EmptyState onStartTracking={onStartTracking} />;

  const starts = events.map(e => e.start);
  const ends = events.map(e => e.end || (e.start + e.dur));
  const startHour = Math.max(0, Math.floor(Math.min(...starts) / 60) - 1);
  const endHour = Math.min(24, Math.ceil(Math.max(...ends) / 60) + 1);
  const totalPx = (endHour - startHour) * HOUR_PX;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const toY = (min) => (min - startHour * 60) / 60 * HOUR_PX;

  return (
    <div className="scroll tl-scroll" style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 840, margin: '0 auto', position: 'relative' }}>
        <div style={{ position: 'relative', height: totalPx + HOUR_PX }}>

          {/* Hour axis */}
          {hours.map(h => (
            <div key={h} style={{
              position: 'absolute', top: toY(h * 60), left: 0, right: 0,
              display: 'flex', alignItems: 'flex-start', gap: 0,
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

          {/* Event cards column */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 58, right: 0 }}>
            {events.map(ev => (
              <EventCard key={ev.id} ev={ev} projects={projects} actions={actions} toY={toY} />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
