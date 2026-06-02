import { useMemo } from 'react';
import { WEEK_DAYS, fmt } from '../data.js';
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

export function Dashboard({ projects = [], events = [] }) {
  const projById = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);

  const { total, billable, revenue, review, byProject } = useMemo(() => {
    let total = 0, billable = 0, revenue = 0, review = 0;
    const map = {};
    for (const e of events) {
      total += e.dur;
      const p = e.project ? projById[e.project] : null;
      if (p?.billable) {
        billable += e.dur;
        revenue += (e.dur / 60) * (p.rate || 0);
      }
      if (e.status !== 'confirmed') review += 1;
      const key = e.project || '__unsorted';
      if (!map[key]) map[key] = 0;
      map[key] += e.dur;
    }
    const byProject = Object.entries(map)
      .map(([id, min]) => ({ id, min, p: projById[id] }))
      .sort((a, b) => b.min - a.min);
    return { total, billable, revenue, review, byProject };
  }, [events, projById]);

  // Os eventos guardam apenas minuto-do-dia (sem data), então todo o tempo
  // rastreado pertence ao dia atual. Destacamos hoje no gráfico semanal.
  const todayIdx = (new Date().getDay() + 6) % 7; // 0 = Seg … 6 = Dom
  const perDay = Array(7).fill(0);
  perDay[todayIdx] = total;
  const maxDay = Math.max(...perDay, 1);

  const billablePct = total ? Math.round((billable / total) * 100) : 0;

  return (
    <div className="scroll" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="screen-inner" style={{ maxWidth: 940, margin: '0 auto', padding: '24px 26px 48px' }}>
        <div className="eyebrow">Resumo do dia</div>
        <h1 className="disp" style={{ fontSize: 40, margin: '4px 0 20px' }}>Dashboard</h1>

        {events.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--fg-3)' }}>
            Nenhuma sessão rastreada ainda. Inicie o dia na tela <strong style={{ color: 'var(--fg-2)' }}>Hoje</strong> para ver suas estatísticas aqui.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              <Stat label="Rastreado" value={fmt.hrs(total)} sub={`${events.length} ${events.length === 1 ? 'sessão' : 'sessões'}`} />
              <Stat label="Faturável" value={fmt.hrs(billable)} sub={`${billablePct}% do total`} />
              <Stat label="Receita estimada" value={'R$ ' + revenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sub="nas tarifas dos projetos" accent />
              <Stat label="Para revisar" value={String(review)} sub={review === 1 ? 'sessão pendente' : 'sessões pendentes'} />
            </div>

            <div className="col-2" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16 }}>
              <div className="card" style={{ padding: '18px 20px' }}>
                <div className="eyebrow" style={{ marginBottom: 18 }}>Horas por dia</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 168 }}>
                  {perDay.map((t, i) => {
                    const isToday = i === todayIdx;
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' }}>
                        <span className="mono" style={{ fontSize: 10.5, color: isToday ? 'var(--fg-1)' : 'var(--fg-3)', fontWeight: isToday ? 700 : 400 }}>{t ? (t / 60).toFixed(1) : '—'}</span>
                        <div title={fmt.dur(t)} style={{
                          width: '100%', maxWidth: 34, borderRadius: '3px 3px 0 0',
                          height: `${(t / maxDay) * 120}px`, minHeight: t ? 4 : 0,
                          background: isToday ? 'var(--accent)' : 'var(--line-2)', transition: 'height 300ms ease-out',
                        }} />
                        <span style={{ fontSize: 11, color: isToday ? 'var(--fg-1)' : 'var(--fg-3)', fontWeight: isToday ? 700 : 400 }}>{WEEK_DAYS[i]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card" style={{ padding: '18px 20px' }}>
                <div className="eyebrow" style={{ marginBottom: 16 }}>Por projeto</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {byProject.map((row) => {
                    const p = row.p;
                    const pct = total ? Math.round((row.min / total) * 100) : 0;
                    const color = p?.color || 'var(--obj-amber)';
                    const name = p?.name || 'Não classificado';
                    return (
                      <div key={row.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <Dot color={color} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', flex: 1 }}>{name}</span>
                          <span className="mono" style={{ fontSize: 12, color: 'var(--fg-2)' }}>{fmt.hrs(row.min)}</span>
                          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', width: 32, textAlign: 'right' }}>{pct}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-sunken)', overflow: 'hidden' }}>
                          <div style={{ width: pct + '%', height: '100%', background: color, transition: 'width 400ms ease-out' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '18px 20px', marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                <div className="eyebrow">Faturável vs interno</div>
                <span className="mono" style={{ fontSize: 12, color: 'var(--fg-3)' }}>{fmt.hrs(billable)} / {fmt.hrs(total - billable)}</span>
              </div>
              <div style={{ display: 'flex', height: 14, borderRadius: 'var(--r-pill)', overflow: 'hidden', gap: 2 }}>
                <div style={{ width: `${billablePct}%`, background: 'var(--obj-success)' }} />
                <div style={{ flex: 1, background: 'var(--line-2)' }} />
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--fg-2)' }}><Dot color="var(--obj-success)" /> Faturável · {billablePct}%</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--fg-2)' }}><Dot color="var(--line-strong)" /> Interno · {100 - billablePct}%</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
