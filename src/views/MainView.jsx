import { fmt } from '../data.js';
import { MainTimeline } from './MainTimeline.jsx';
import { MainCalendar } from './MainCalendar.jsx';
import { MainTriage } from './MainTriage.jsx';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTHS   = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function todayLabel() {
  const d = new Date();
  return `${WEEKDAYS[d.getDay()]} · ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function TrackingButton({ monitorAll, onToggle, liveTracking }) {
  const { running, app, doc } = liveTracking || {};
  const active = monitorAll;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {active && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ position: 'relative', width: 8, height: 8, flex: 'none' }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--obj-success)' }} />
            {running && <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1px solid var(--obj-success)', animation: 'ping 1.6s ease-out infinite' }} />}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--obj-success)', fontWeight: 700 }}>
            {running ? (doc || app || 'Rastreando') : 'Aguardando atividade'}
          </span>
        </div>
      )}
      <button
        onClick={onToggle}
        className={active ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}
        style={active ? { color: 'var(--obj-danger)', borderColor: 'var(--obj-danger)' } : {}}
      >
        {active ? '■ Finalizar dia' : '▶ Iniciar dia'}
      </button>
    </div>
  );
}

function DayHeader({ stats, mode, setMode, onConfirmAll, monitorAll, onToggleMonitor, liveTracking }) {
  const modes = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'calendar', label: 'Calendar + Inbox' },
    { id: 'triage',   label: 'Triage' },
  ];
  return (
    <div className="day-header" style={{ borderBottom: '1px solid var(--line-1)', flex: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="eyebrow">{todayLabel()}</div>
          <h1 className="disp" style={{ margin: '2px 0 4px', fontSize: 40, color: 'var(--fg-1)', lineHeight: 1 }}>Hoje</h1>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="mono" style={{ fontSize: 14, color: 'var(--fg-1)', fontWeight: 700 }}>{fmt.hrs(stats.total)}</span>
            <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>rastreado</span>
            <span style={{ color: 'var(--line-strong)' }}>·</span>
            <span className="mono" style={{ fontSize: 14, color: 'var(--obj-success)', fontWeight: 700 }}>{fmt.hrs(stats.billable)}</span>
            <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>faturável</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {stats.review > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={onConfirmAll} style={{ borderColor: 'var(--obj-amber)', color: 'var(--fg-1)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--obj-amber)' }} />
              {stats.review} para revisar · aceitar tudo
            </button>
          )}
          <TrackingButton monitorAll={monitorAll} onToggle={onToggleMonitor} liveTracking={liveTracking} />
          <div style={{ display: 'inline-flex', background: 'var(--bg-sunken)', borderRadius: 'var(--r-sm)', padding: 3, gap: 2 }}>
            {modes.map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)} style={{
                border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 'var(--r-xs)',
                fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, letterSpacing: '0.03em',
                background: mode === m.id ? 'var(--bg-elev)' : 'transparent',
                color: mode === m.id ? 'var(--fg-1)' : 'var(--fg-3)',
                boxShadow: mode === m.id ? 'var(--shadow-1)' : 'none', transition: '120ms ease-out',
              }}>{m.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MainView({ mode, setMode, events, actions, stats, projects = [], monitorAll, onToggleMonitor, liveTracking }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <DayHeader
        stats={stats} mode={mode} setMode={setMode} onConfirmAll={actions.confirmAll}
        monitorAll={monitorAll} onToggleMonitor={onToggleMonitor} liveTracking={liveTracking}
      />
      <div className="main-body" style={{ flex: 1, minHeight: 0 }}>
        {mode === 'timeline' && <MainTimeline events={events} actions={actions} projects={projects} onStartTracking={!monitorAll ? onToggleMonitor : null} />}
        {mode === 'calendar' && <MainCalendar events={events} actions={actions} />}
        {mode === 'triage'   && <MainTriage   events={events} actions={actions} />}
      </div>
    </div>
  );
}

