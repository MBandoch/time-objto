import { useState, useMemo } from 'react';
import { fmt } from '../data.js';

const PERIODS = [
  { id: 'week',       label: 'Esta semana' },
  { id: 'month',      label: 'Este mês' },
  { id: 'last_month', label: 'Mês passado' },
  { id: 'custom',     label: 'Personalizado' },
];

function periodRange(period, customFrom, customTo) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'week') {
    const day = today.getDay() || 7;
    const mon = new Date(today); mon.setDate(today.getDate() - day + 1);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return [mon, sun];
  }
  if (period === 'month') {
    return [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0)];
  }
  if (period === 'last_month') {
    const m = now.getMonth() - 1;
    const y = m < 0 ? now.getFullYear() - 1 : now.getFullYear();
    const mm = ((m % 12) + 12) % 12;
    return [new Date(y, mm, 1), new Date(y, mm + 1, 0)];
  }
  return [customFrom ? new Date(customFrom) : today, customTo ? new Date(customTo) : today];
}

function minToDate(min) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), Math.floor(min / 60), min % 60);
}

export function Reports({ events, projects, clients }) {
  const [period, setPeriod] = useState('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterProject, setFilterProject] = useState('all');

  const [from, to] = periodRange(period, customFrom, customTo);
  const fromDay = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toDay = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59);

  const projById = useMemo(() => Object.fromEntries(projects.map(p => [p.id, p])), [projects]);
  const clientById = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c])), [clients]);

  const filtered = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayMin = todayStart.getHours() * 60;
    return events.filter(ev => {
      const evDate = minToDate(ev.start);
      if (evDate < fromDay || evDate > toDay) return false;
      if (filterClient !== 'all') {
        const p = projById[ev.project];
        if (!p || p.clientId !== filterClient) return false;
      }
      if (filterProject !== 'all' && ev.project !== filterProject) return false;
      return true;
    });
  }, [events, fromDay, toDay, filterClient, filterProject, projById]);

  const byProject = useMemo(() => {
    const map = {};
    filtered.forEach(ev => {
      const key = ev.project || '__unsorted';
      if (!map[key]) map[key] = { dur: 0, events: [] };
      map[key].dur += ev.dur;
      map[key].events.push(ev);
    });
    return map;
  }, [filtered]);

  const totalDur = filtered.reduce((a, e) => a + e.dur, 0);
  const billableDur = filtered.filter(e => projById[e.project]?.billable).reduce((a, e) => a + e.dur, 0);
  const revenue = filtered.reduce((a, e) => {
    const p = projById[e.project];
    return a + (p?.billable ? (e.dur / 60) * (p.rate || 0) : 0);
  }, 0);

  const exportPDF = async () => {
    const { exportPDF: gen } = await import('../utils/exportPdf.js');
    gen(projects, filtered);
  };

  const exportCSV = async () => {
    const { exportCSV: gen } = await import('../utils/exportPdf.js');
    gen(projects, filtered);
  };

  return (
    <div className="scroll" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="screen-inner" style={{ maxWidth: 840, margin: '0 auto', padding: '24px 26px 56px' }}>
        <div className="eyebrow">Análise</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <h1 className="disp" style={{ fontSize: 40, margin: '4px 0 0' }}>Relatórios</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={exportCSV}>CSV</button>
            <button className="btn btn-primary btn-sm" onClick={exportPDF}>↓ PDF / Fatura</button>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ padding: '14px 16px', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--fg-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Período</label>
            <div style={{ display: 'inline-flex', background: 'var(--bg-sunken)', borderRadius: 'var(--r-sm)', padding: 3, gap: 2 }}>
              {PERIODS.map(p => (
                <button key={p.id} onClick={() => setPeriod(p.id)} style={{
                  border: 'none', cursor: 'pointer', padding: '5px 11px', borderRadius: 'var(--r-xs)',
                  fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 700,
                  background: period === p.id ? 'var(--bg-elev)' : 'transparent',
                  color: period === p.id ? 'var(--fg-1)' : 'var(--fg-3)',
                  boxShadow: period === p.id ? 'var(--shadow-1)' : 'none',
                }}>{p.label}</button>
              ))}
            </div>
          </div>

          {period === 'custom' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--fg-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>De</label>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-1)', background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', padding: '6px 10px', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--fg-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Até</label>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                  style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-1)', background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', padding: '6px 10px', outline: 'none' }} />
              </div>
            </>
          )}

          {clients.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--fg-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Cliente</label>
              <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
                style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-1)', background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', padding: '6px 10px', outline: 'none', cursor: 'pointer' }}>
                <option value="all">Todos</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Summary cards */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          {[
            { label: 'Total rastreado', value: fmt.hrs(totalDur), sub: `${filtered.length} sessões` },
            { label: 'Faturável', value: fmt.hrs(billableDur), sub: `${totalDur ? Math.round((billableDur / totalDur) * 100) : 0}% do total`, accent: true },
            { label: 'Receita estimada', value: `R$ ${revenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, sub: 'nas tarifas dos projetos' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '14px 18px', flex: 1, minWidth: 140 }}>
              <div className="eyebrow">{s.label}</div>
              <div className="disp" style={{ fontSize: 32, color: s.accent ? 'var(--accent)' : 'var(--fg-1)', lineHeight: 1.1, marginTop: 5 }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 2 }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* By project breakdown */}
        {filtered.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--fg-3)' }}>
            Nenhuma sessão encontrada no período selecionado.
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--line-1)' }}>
              <div className="eyebrow">Por projeto</div>
            </div>
            {Object.entries(byProject).map(([projId, { dur, events: evs }]) => {
              const p = projById[projId];
              const client = p?.clientId ? clientById[p.clientId] : null;
              const rev = evs.reduce((a, e) => a + (p?.billable ? (e.dur / 60) * (p.rate || 0) : 0), 0);
              const pct = totalDur ? Math.round((dur / totalDur) * 100) : 0;
              return (
                <div key={projId} style={{ padding: '12px 18px', borderBottom: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: p?.color || 'var(--obj-amber)', flex: 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>
                      {p?.name || 'Não classificado'}
                    </div>
                    {client && <div style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{client.name}</div>}
                  </div>
                  <div style={{ textAlign: 'right', flex: 'none' }}>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>{fmt.hrs(dur)}</div>
                    {rev > 0 && <div style={{ fontSize: 11, color: 'var(--obj-success)' }}>R$ {rev.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>}
                  </div>
                  <div style={{ width: 60, textAlign: 'right', fontSize: 11.5, color: 'var(--fg-3)', flex: 'none' }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
