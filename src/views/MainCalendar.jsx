import { useState } from 'react';
import { projById, APPS, fmt } from '../data.js';
import { AppTile, Confidence, ProjectChip, ProjectPicker } from '../components/ui.jsx';

const CAL_START = 480, CAL_END = 1080, PPM = 1.55;

function CalBlock({ ev, hi, setHi }) {
  const p = ev.project ? projById[ev.project] : null;
  const top = (ev.start - CAL_START) * PPM;
  const height = Math.max(ev.dur * PPM - 3, 16);
  const isConf = ev.status === 'confirmed';
  const isUnsorted = ev.status === 'unsorted';
  const col = isUnsorted ? 'var(--obj-amber)' : (p ? p.color : 'var(--line-strong)');
  const showText = height >= 30;
  return (
    <div
      onMouseEnter={() => setHi(ev.id)} onMouseLeave={() => setHi(null)}
      style={{
        position: 'absolute', top, height, left: 8, right: 10,
        borderRadius: 'var(--r-sm)', padding: showText ? '5px 9px' : '0 9px',
        background: isConf ? `color-mix(in srgb, ${col} 16%, transparent)` : (isUnsorted ? 'transparent' : `color-mix(in srgb, ${col} 9%, transparent)`),
        borderLeft: `3px solid ${col}`,
        border: isConf ? `1px solid color-mix(in srgb, ${col} 42%, transparent)` : `1px dashed color-mix(in srgb, ${col} 55%, transparent)`,
        borderLeftWidth: 3, overflow: 'hidden', cursor: 'default',
        outline: hi === ev.id ? '2px solid var(--accent)' : 'none', outlineOffset: 1,
        transition: 'outline 100ms', backgroundImage: isUnsorted
          ? `repeating-linear-gradient(45deg, color-mix(in srgb, ${col} 9%, transparent) 0 6px, transparent 6px 12px)` : 'none',
      }}>
      {showText && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)', flex: 'none' }}>{fmt.clock(ev.start)}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</span>
          </div>
          {height >= 48 && <div style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 1 }}>{APPS[ev.app]?.name} · {fmt.dur(ev.dur)}{isConf ? '' : ' · suggested'}</div>}
        </>
      )}
    </div>
  );
}

function DayCalendar({ events, hi, setHi }) {
  const hours = [];
  for (let m = CAL_START; m <= CAL_END; m += 60) hours.push(m);
  return (
    <div className="scroll" style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ position: 'relative', margin: '12px 16px 28px', height: (CAL_END - CAL_START) * PPM + 20 }}>
        {hours.map((m) => (
          <div key={m} style={{ position: 'absolute', top: (m - CAL_START) * PPM, left: 0, right: 0, height: 1, display: 'flex', alignItems: 'center' }}>
            <span className="mono" style={{ width: 44, fontSize: 10.5, color: 'var(--fg-3)', flex: 'none' }}>{fmt.clock(m)}</span>
            <span style={{ flex: 1, height: 1, background: 'var(--line-1)' }} />
          </div>
        ))}
        <div style={{ position: 'absolute', left: 44, right: 0, top: 0, bottom: 0 }}>
          {events.map((ev) => <CalBlock key={ev.id} ev={ev} hi={hi} setHi={setHi} />)}
        </div>
      </div>
    </div>
  );
}

function InboxCard({ ev, actions, hi, setHi }) {
  const [open, setOpen] = useState(false);
  return (
    <div onMouseEnter={() => setHi(ev.id)} onMouseLeave={() => setHi(null)}
      className="card" style={{
        padding: 11, display: 'flex', flexDirection: 'column', gap: 9,
        outline: hi === ev.id ? '2px solid var(--accent)' : 'none', outlineOffset: -1,
        position: 'relative',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <AppTile app={ev.app} size={28} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{fmt.clock(ev.start)}–{fmt.clock(ev.end)} · {fmt.dur(ev.dur)}</div>
        </div>
        <Confidence level={ev.confidence} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, position: 'relative' }}>
        {ev.project ? (
          <>
            <ProjectChip projectId={ev.project} suggested onClick={() => setOpen(true)} />
            <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto', padding: '6px 10px' }} onClick={() => actions.confirm(ev.id)}>Accept</button>
          </>
        ) : (
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed', borderColor: 'var(--obj-amber)' }} onClick={() => setOpen(true)}>Assign project</button>
        )}
        {open && <ProjectPicker value={ev.project} align="left" width={260} onChange={(id) => actions.assign(ev.id, id)} onClose={() => setOpen(false)} />}
      </div>
    </div>
  );
}

export function MainCalendar({ events, actions }) {
  const [hi, setHi] = useState(null);
  const inbox = events.filter((e) => e.status !== 'confirmed');
  return (
    <div className="split-pane" style={{ display: 'grid', gridTemplateColumns: '1fr 348px', height: '100%', minHeight: 0 }}>
      <DayCalendar events={events} hi={hi} setHi={setHi} />
      <div style={{ borderLeft: '1px solid var(--line-1)', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg-elev)' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line-1)', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="eyebrow">Caixa de revisão</div>
            <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 2 }}>{inbox.length ? `${inbox.length} blocos para classificar` : 'Tudo classificado'}</div>
          </div>
          {inbox.length > 0 && <button className="btn btn-ghost btn-sm" onClick={actions.confirmAll}>Aceitar tudo</button>}
        </div>
        <div className="scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {inbox.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--fg-3)', padding: 24 }}>
              <div style={{ fontSize: 34, marginBottom: 8 }} className="disp">✓</div>
              <div style={{ fontSize: 13 }}>Caixa vazia. Todos os blocos estão classificados.</div>
            </div>
          ) : inbox.map((ev) => <InboxCard key={ev.id} ev={ev} actions={actions} hi={hi} setHi={setHi} />)}
        </div>
      </div>
    </div>
  );
}
