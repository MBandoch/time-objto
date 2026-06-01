import { useState, useEffect } from 'react';
import { fmt } from '../data.js';

const PHASE_META = {
  focus: { label: 'Focus', color: 'var(--accent)', sub: 'Deep work' },
  short: { label: 'Short break', color: 'var(--obj-success)', sub: 'Stretch' },
  long:  { label: 'Long break', color: 'var(--obj-success)', sub: 'Step away' },
};

export function PomodoroTimer({ config }) {
  const lenFor = (ph) => (ph === 'focus' ? config.focus : ph === 'long' ? config.longBreak : config.shortBreak) * 60;

  const [phase, setPhase] = useState('focus');
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(config.focus * 60);
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (!running) setRemaining(lenFor(phase));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.focus, config.shortBreak, config.longBreak, phase]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining !== 0 || !running) return;
    let nextDone = done, nextPhase;
    if (phase === 'focus') {
      nextDone = done + 1;
      nextPhase = nextDone % config.cycles === 0 ? 'long' : 'short';
    } else {
      nextPhase = 'focus';
    }
    setDone(nextDone);
    setPhase(nextPhase);
    setRemaining(lenFor(nextPhase));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running]);

  const skip = () => {
    let nextDone = done, nextPhase;
    if (phase === 'focus') {
      nextDone = done + 1;
      nextPhase = nextDone % config.cycles === 0 ? 'long' : 'short';
    } else {
      nextPhase = 'focus';
    }
    setDone(nextDone);
    setPhase(nextPhase);
    setRemaining(lenFor(nextPhase));
  };

  const reset = () => { setRunning(false); setPhase('focus'); setDone(0); setRemaining(config.focus * 60); };

  const meta = PHASE_META[phase];
  const total = lenFor(phase);
  const frac = total ? 1 - remaining / total : 0;
  const mm = Math.floor(remaining / 60), ss = remaining % 60;

  const size = 122, stroke = 7, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const filledDots = phase === 'long' ? config.cycles : done % config.cycles;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={meta.color} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)}
            style={{ transition: 'stroke-dashoffset 480ms linear, stroke 200ms ease-out' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <span className="eyebrow" style={{ fontSize: 9, color: meta.color }}>{meta.label}</span>
          <span className="mono" style={{ fontSize: 27, fontWeight: 700, color: 'var(--fg-1)', lineHeight: 1, letterSpacing: '0.01em' }}>{fmt.pad(mm)}:{fmt.pad(ss)}</span>
          <span style={{ fontSize: 10, color: 'var(--fg-3)' }}>{meta.sub}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '11px 0 12px' }}>
        {Array.from({ length: config.cycles }).map((_, i) => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: '50%', flex: 'none',
            background: i < filledDots ? 'var(--accent)' : 'var(--line-2)',
            transition: '200ms ease-out',
          }} />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%' }}>
        <button className="btn-icon" title="Reset" onClick={reset} style={{ flex: 'none', border: '1px solid var(--line-1)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
        </button>
        <button onClick={() => setRunning((r2) => !r2)} className={'btn ' + (running ? 'btn-ghost' : 'btn-primary')} style={{ flex: 1, justifyContent: 'center' }}>
          {running ? '❚❚ Pause' : (frac > 0 ? '▶ Resume' : '▶ Start')}
        </button>
        <button className="btn-icon" title="Skip to next" onClick={skip} style={{ flex: 'none', border: '1px solid var(--line-1)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>
        </button>
      </div>

      <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 9, textAlign: 'center' }}>
        {config.focus}m focus · {config.shortBreak}m break · {config.longBreak}m long
      </div>
    </div>
  );
}
