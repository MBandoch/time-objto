import { useState } from 'react';
import { exportPDF, exportCSV } from '../utils/exportPdf.js';

function Switch({ on, onClick }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={on} style={{
      width: 40, height: 23, borderRadius: 999, border: 'none', cursor: 'pointer', flex: 'none',
      background: on ? 'var(--accent)' : 'var(--line-2)', position: 'relative', transition: '140ms ease-out', padding: 0,
    }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 20 : 3, width: 17, height: 17, borderRadius: '50%', background: '#fff', transition: '140ms ease-out', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }} />
    </button>
  );
}

function Row({ title, desc, children, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '15px 0', borderBottom: last ? 'none' : '1px solid var(--line-1)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>{title}</div>
        {desc && <div style={{ fontSize: 12.5, color: 'var(--fg-3)', marginTop: 2, lineHeight: 1.45 }}>{desc}</div>}
      </div>
      <div style={{ flex: 'none' }}>{children}</div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      <div className="card" style={{ padding: '4px 18px' }}>{children}</div>
    </div>
  );
}

function Seg({ value, options, onChange }) {
  return (
    <div style={{ display: 'inline-flex', background: 'var(--bg-sunken)', borderRadius: 'var(--r-sm)', padding: 3, gap: 2 }}>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} style={{
          border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 'var(--r-xs)', textTransform: 'capitalize',
          fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700,
          background: value === o ? 'var(--bg-elev)' : 'transparent', color: value === o ? 'var(--fg-1)' : 'var(--fg-3)',
          boxShadow: value === o ? 'var(--shadow-1)' : 'none',
        }}>{o}</button>
      ))}
    </div>
  );
}

function Stepper({ value, onChange, min = 1, max = 120, suffix = 'm' }) {
  const btn = (label, fn, disabled) => (
    <button onClick={fn} disabled={disabled} style={{
      width: 30, height: 30, border: 'none', background: 'transparent', cursor: disabled ? 'default' : 'pointer',
      color: disabled ? 'var(--line-2)' : 'var(--fg-1)', fontSize: 17, fontWeight: 700, display: 'grid', placeItems: 'center',
      fontFamily: 'var(--font-sans)', lineHeight: 1,
    }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = 'var(--bg-sunken)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>{label}</button>
  );
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', overflow: 'hidden', background: 'var(--bg-elev)' }}>
      {btn('−', () => onChange(Math.max(min, value - 1)), value <= min)}
      <span className="mono" style={{ minWidth: 50, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', borderLeft: '1px solid var(--line-1)', borderRight: '1px solid var(--line-1)', padding: '6px 0' }}>{value}{suffix}</span>
      {btn('＋', () => onChange(Math.min(max, value + 1)), value >= max)}
    </div>
  );
}

export function Settings({ t, setTweak, onReplayOnboarding, onAddManual, pomoConfig, setPomoConfig, sync, setSync, events = [], projects = [] }) {
  const [autostart, setAutostart] = useState(true);
  const [idle, setIdle] = useState(true);
  const [titles, setTitles] = useState(true);
  const [reminders, setReminders] = useState(false);
  const setPomo = (k, v) => setPomoConfig((c) => ({ ...c, [k]: v }));
  const setSyncK = (k, v) => setSync((s) => ({ ...s, [k]: v }));
  const urlValid = /^https?:\/\/.+/.test(sync.url.trim());

  return (
    <div className="scroll" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="screen-inner" style={{ maxWidth: 720, margin: '0 auto', padding: '24px 26px 56px' }}>
        <div className="eyebrow">Preferences</div>
        <h1 className="disp" style={{ fontSize: 40, margin: '4px 0 24px' }}>Settings</h1>

        <Section label="Tracking">
          <Row title="Start tracking on launch" desc="Begin capturing activity automatically when the app opens.">
            <Switch on={autostart} onClick={() => setAutostart((v) => !v)} />
          </Row>
          <Row title="Detect idle time" desc="Pause and ask what to do after 5 minutes of no input.">
            <Switch on={idle} onClick={() => setIdle((v) => !v)} />
          </Row>
          <Row title="Read document & window titles" desc="Needed for filename-based auto-categorization. Titles never leave your machine." last>
            <Switch on={titles} onClick={() => setTitles((v) => !v)} />
          </Row>
        </Section>

        <Section label="Appearance">
          <Row title="Skin" desc="Swap the entire visual system. OBJ_TO, Cursor (editorial) or Nike (campaign).">
            <Seg value={t.brand} options={['objto', 'cursor', 'nike']} onChange={(v) => setTweak('brand', v)} />
          </Row>
          <Row title="Theme">
            <Seg value={t.dark ? 'dark' : 'light'} options={['light', 'dark']} onChange={(v) => setTweak('dark', v === 'dark')} />
          </Row>
          <Row title="Accent" desc="OBJ_TO skin only — Cursor and Nike define their own accent." last>
            <Seg value={t.accent} options={['navy', 'clay', 'charcoal']} onChange={(v) => setTweak('accent', v)} />
          </Row>
        </Section>

        <Section label="Pomodoro timer">
          <Row title="Focus interval" desc="Length of one deep-work session before a break.">
            <Stepper value={pomoConfig.focus} onChange={(v) => setPomo('focus', v)} min={5} max={90} />
          </Row>
          <Row title="Short break" desc="Rest taken between focus sessions.">
            <Stepper value={pomoConfig.shortBreak} onChange={(v) => setPomo('shortBreak', v)} min={1} max={30} />
          </Row>
          <Row title="Long break" desc="Longer rest after a full set of focus sessions.">
            <Stepper value={pomoConfig.longBreak} onChange={(v) => setPomo('longBreak', v)} min={5} max={60} />
          </Row>
          <Row title="Sessions before long break" desc="How many focus intervals complete one set." last>
            <Stepper value={pomoConfig.cycles} onChange={(v) => setPomo('cycles', v)} min={2} max={8} suffix="" />
          </Row>
        </Section>

        <Section label="Server sync">
          <Row title="Sync tracked time to a server" desc="Push confirmed sessions to your own endpoint. Disabled keeps everything local.">
            <Switch on={sync.enabled} onClick={() => setSyncK('enabled', !sync.enabled)} />
          </Row>
          <div style={{ padding: '15px 0', borderBottom: '1px solid var(--line-1)', opacity: sync.enabled ? 1 : 0.5, pointerEvents: sync.enabled ? 'auto' : 'none', transition: 'opacity 140ms' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)', marginBottom: 8 }}>Server endpoint</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="url" value={sync.url} onChange={(e) => setSyncK('url', e.target.value)}
                placeholder="https://api.studio.com/timesheet"
                spellCheck={false}
                style={{
                  flex: 1, minWidth: 0, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-1)',
                  background: 'var(--bg)', border: '1px solid ' + (sync.url && !urlValid ? 'var(--obj-danger)' : 'var(--line-2)'),
                  borderRadius: 'var(--r-sm)', padding: '9px 11px', outline: 'none',
                }} />
              <button className="btn btn-ghost btn-sm" disabled={!urlValid} style={{ opacity: urlValid ? 1 : 0.4, flex: 'none' }}>Test</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 9, fontSize: 12, color: sync.url && !urlValid ? 'var(--obj-danger)' : 'var(--fg-3)' }}>
              {sync.url && !urlValid
                ? <span>Enter a full URL starting with http:// or https://</span>
                : urlValid
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--obj-success)' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--obj-success)' }} /> Endpoint set — paste your sync URL here for now.</span>
                  : <span>Paste the link to your sync endpoint. POST as JSON; auth & format come later.</span>}
            </div>
          </div>
          <Row title="Sync frequency" desc="How often confirmed sessions are pushed upstream." last>
            <Seg value={sync.interval} options={['realtime', 'hourly', 'daily']} onChange={(v) => setSyncK('interval', v)} />
          </Row>
        </Section>

        <Section label="Data & onboarding">
          <Row title="Weekly reminder" desc="A Friday nudge to review unsorted blocks before invoicing.">
            <Switch on={reminders} onClick={() => setReminders((v) => !v)} />
          </Row>
          <Row title="Replay onboarding" desc="See the setup walkthrough again.">
            <button className="btn btn-ghost btn-sm" onClick={onReplayOnboarding}>Open</button>
          </Row>
          <Row title="Export time data" desc="Download all tracked sessions as CSV or PDF with R$ values.">
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(projects, events)}>CSV</button>
              <button className="btn btn-ghost btn-sm" onClick={() => exportPDF(projects, events)}>PDF</button>
            </div>
          </Row>
          <Row title="Add manual entry" desc="Log time that wasn't captured automatically." last>
            <button className="btn btn-ghost btn-sm" onClick={onAddManual}>Add</button>
          </Row>
        </Section>
      </div>
    </div>
  );
}
