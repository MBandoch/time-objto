import { WEEK_DAYS, WEEK_TOTALS, WEEK_BY_PROJECT, projById, fmt } from '../data.js';
import { Dot } from '../components/ui.jsx';

function Stat({ label, value, sub, accent }) {
  return (
    <div className="card" style={{ padding: '16px 18px', flex: 1, minWidth: 150 }}>
      <div className="eyebrow">{label}</div>
      <div className="disp" style={{ fontSize: 38, color: accent ? 'var(--accent)' : 'var(--fg-1)', lineHeight: 1.05, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function Dashboard() {
  const weekTotal = WEEK_TOTALS.reduce((a, b) => a + b, 0);
  const projTotal = WEEK_BY_PROJECT.reduce((a, b) => a + b.min, 0);
  const billable = WEEK_BY_PROJECT.filter((p) => projById[p.id].billable).reduce((a, b) => a + b.min, 0);
  const revenue = WEEK_BY_PROJECT.reduce((a, b) => a + (projById[b.id].billable ? (b.min / 60) * projById[b.id].rate : 0), 0);
  const maxDay = Math.max(...WEEK_TOTALS);
  const workedDays = WEEK_TOTALS.filter((t) => t > 0).length;

  return (
    <div className="scroll" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="screen-inner" style={{ maxWidth: 940, margin: '0 auto', padding: '24px 26px 48px' }}>
        <div className="eyebrow">Week of 25–31 May 2026</div>
        <h1 className="disp" style={{ fontSize: 40, margin: '4px 0 20px' }}>This Week</h1>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <Stat label="Tracked" value={fmt.hrs(weekTotal)} sub={`across ${workedDays} days`} />
          <Stat label="Billable" value={fmt.hrs(billable)} sub={`${Math.round((billable / weekTotal) * 100)}% of tracked`} />
          <Stat label="Est. revenue" value={'$' + revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })} sub="at project rates" accent />
          <Stat label="Daily avg" value={fmt.hrs(Math.round(weekTotal / workedDays))} sub="on working days" />
        </div>

        <div className="col-2" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16 }}>
          <div className="card" style={{ padding: '18px 20px' }}>
            <div className="eyebrow" style={{ marginBottom: 18 }}>Hours per day</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 168 }}>
              {WEEK_TOTALS.map((t, i) => {
                const isToday = i === 4;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' }}>
                    <span className="mono" style={{ fontSize: 10.5, color: isToday ? 'var(--fg-1)' : 'var(--fg-3)', fontWeight: isToday ? 700 : 400 }}>{t ? (t / 60).toFixed(1) : '—'}</span>
                    <div title={fmt.dur(t)} style={{
                      width: '100%', maxWidth: 34, borderRadius: '3px 3px 0 0',
                      height: maxDay ? `${(t / maxDay) * 120}px` : 0, minHeight: t ? 4 : 0,
                      background: isToday ? 'var(--accent)' : 'var(--line-2)', transition: 'height 300ms ease-out',
                    }} />
                    <span style={{ fontSize: 11, color: isToday ? 'var(--fg-1)' : 'var(--fg-3)', fontWeight: isToday ? 700 : 400 }}>{WEEK_DAYS[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px' }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>By project</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {WEEK_BY_PROJECT.map((row) => {
                const p = projById[row.id];
                const pct = Math.round((row.min / projTotal) * 100);
                return (
                  <div key={row.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <Dot color={p.color} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', flex: 1 }}>{p.name}</span>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--fg-2)' }}>{fmt.hrs(row.min)}</span>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', width: 32, textAlign: 'right' }}>{pct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-sunken)', overflow: 'hidden' }}>
                      <div style={{ width: pct + '%', height: '100%', background: p.color, transition: 'width 400ms ease-out' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div className="eyebrow">Billable vs internal</div>
            <span className="mono" style={{ fontSize: 12, color: 'var(--fg-3)' }}>{fmt.hrs(billable)} / {fmt.hrs(weekTotal - billable)}</span>
          </div>
          <div style={{ display: 'flex', height: 14, borderRadius: 'var(--r-pill)', overflow: 'hidden', gap: 2 }}>
            <div style={{ width: `${(billable / weekTotal) * 100}%`, background: 'var(--obj-success)' }} />
            <div style={{ flex: 1, background: 'var(--line-2)' }} />
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--fg-2)' }}><Dot color="var(--obj-success)" /> Billable · {Math.round((billable / weekTotal) * 100)}%</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--fg-2)' }}><Dot color="var(--line-strong)" /> Internal · {Math.round(((weekTotal - billable) / weekTotal) * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
