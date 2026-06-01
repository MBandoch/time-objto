import { fmt } from '../data.js';

const PHASE_LABEL = { focus: 'Foco', short: 'Pausa curta', long: 'Pausa longa' };

export function PomodoroBar({ config, active, phase, secondsLeft, done, running, onToggle, onStartStop, onSkip, onReset }) {
  const mm = Math.floor(secondsLeft / 60), ss = secondsLeft % 60;
  const phaseColor = phase === 'focus' ? 'var(--obj-clay)' : 'var(--accent)';
  const total = (phase === 'focus' ? config.focus : phase === 'long' ? config.longBreak : config.shortBreak) * 60;
  const frac = total ? 1 - secondsLeft / total : 0;
  const isStarted = frac > 0;

  return (
    <div>
      {/* Toggle row — always visible */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: active ? '1px solid var(--line-1)' : 'none' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-2)', flex: 1 }}>Pomodoro</span>
        {active && (
          <span className="eyebrow" style={{ fontSize: 9, color: phaseColor, marginRight: 2 }}>
            {PHASE_LABEL[phase]}
          </span>
        )}
        <button onClick={onToggle} role="switch" aria-checked={active} style={{
          width: 34, height: 19, borderRadius: 999, border: 'none', cursor: 'pointer', flex: 'none',
          background: active ? 'var(--accent)' : 'var(--line-2)', position: 'relative', transition: '140ms ease-out', padding: 0,
        }}>
          <span style={{
            position: 'absolute', top: 2.5, left: active ? 17 : 2.5,
            width: 14, height: 14, borderRadius: '50%', background: '#fff',
            transition: '140ms ease-out', boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
          }} />
        </button>
      </div>

      {/* Expanded countdown — only when active */}
      {active && (
        <div style={{ padding: '14px 12px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, borderBottom: '1px solid var(--line-1)' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="eyebrow" style={{ fontSize: 9, color: phaseColor, marginBottom: 3 }}>{PHASE_LABEL[phase]}</div>
            <span className="mono" style={{ fontSize: 36, fontWeight: 700, color: 'var(--fg-1)', lineHeight: 1, letterSpacing: '-0.01em' }}>
              {fmt.pad(mm)}:{fmt.pad(ss)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {Array.from({ length: config.cycles }).map((_, i) => (
              <span key={i} style={{
                width: 6, height: 6, borderRadius: '50%', flex: 'none',
                background: i < (done % config.cycles) ? phaseColor : 'var(--line-2)',
                transition: '200ms ease-out',
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
            <button className="btn-icon" title="Reiniciar" onClick={onReset} style={{ flex: 'none', border: '1px solid var(--line-1)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
              </svg>
            </button>
            <button onClick={onStartStop} className={'btn btn-sm ' + (running ? 'btn-ghost' : 'btn-primary')} style={{ flex: 1, justifyContent: 'center' }}>
              {running ? '❚❚ Pausar' : isStarted ? '▶ Retomar' : '▶ Iniciar'}
            </button>
            <button className="btn-icon" title="Pular fase" onClick={onSkip} style={{ flex: 'none', border: '1px solid var(--line-1)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" />
              </svg>
            </button>
          </div>

          <div className="mono" style={{ fontSize: 9.5, color: 'var(--fg-3)' }}>
            {config.focus}m foco · {config.shortBreak}m pausa · {config.longBreak}m longa
          </div>
        </div>
      )}
    </div>
  );
}
