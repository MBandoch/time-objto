import { useState } from 'react';
import { uid } from '../utils/tracking.js';
import { fmt } from '../data.js';

function ProgressRing({ pct, size = 44, stroke = 4, color = 'var(--accent)' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(1, pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flex: 'none', transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 400ms ease-out' }} />
    </svg>
  );
}

function HoursGoalCard({ goal, progress, onDelete }) {
  const pct = goal.target > 0 ? Math.round((progress / goal.target) * 100) : 0;
  const done = pct >= 100;
  const color = done ? 'var(--obj-success)' : pct >= 75 ? 'var(--accent)' : pct >= 40 ? 'var(--obj-amber)' : 'var(--fg-3)';
  return (
    <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <ProgressRing pct={pct} color={color} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg-1)' }}>{goal.label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
          <span className="mono" style={{ fontSize: 13, fontWeight: 700, color }}>{progress.toFixed(1)}h</span>
          <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>de {goal.target}h</span>
          {done && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--obj-success)', letterSpacing: '0.05em' }}>✓ META</span>}
        </div>
        <div style={{ marginTop: 7, height: 5, borderRadius: 3, background: 'var(--bg-sunken)', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 400ms ease-out' }} />
        </div>
      </div>
      <button onClick={onDelete} className="btn-icon" title="Remover meta" style={{ flex: 'none', opacity: 0.4 }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.4; }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
        </svg>
      </button>
    </div>
  );
}

function TaskCard({ goal, onToggle, onDelete }) {
  return (
    <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onToggle} style={{
        flex: 'none', width: 20, height: 20, borderRadius: 'var(--r-xs)', border: 'none', cursor: 'pointer',
        background: goal.done ? 'var(--obj-success)' : 'var(--bg-sunken)',
        border: `1.5px solid ${goal.done ? 'var(--obj-success)' : 'var(--line-2)'}`,
        display: 'grid', placeItems: 'center', transition: '120ms ease-out',
      }}>
        {goal.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
      </button>
      <span style={{
        flex: 1, fontSize: 13.5, color: goal.done ? 'var(--fg-3)' : 'var(--fg-1)',
        textDecoration: goal.done ? 'line-through' : 'none', transition: '120ms ease-out',
      }}>
        {goal.label}
      </span>
      <button onClick={onDelete} className="btn-icon" title="Remover" style={{ flex: 'none', opacity: 0.35 }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.35; }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function AddRow({ placeholder, onAdd, suffix, type = 'text', defaultNum = '' }) {
  const [val, setVal] = useState('');
  const [num, setNum] = useState(defaultNum);
  const submit = () => {
    if (!val.trim()) return;
    onAdd(val.trim(), num ? Number(num) : undefined);
    setVal('');
    setNum(defaultNum);
  };
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); }}
        placeholder={placeholder} spellCheck={false}
        style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-1)', background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', padding: '8px 11px', outline: 'none' }} />
      {suffix !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', overflow: 'hidden', background: 'var(--bg)', flex: 'none' }}>
          <input type="number" value={num} onChange={e => setNum(e.target.value)} min={1} max={999} placeholder="40"
            style={{ width: 52, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', background: 'transparent', border: 'none', padding: '8px 8px', outline: 'none', textAlign: 'right' }} />
          <span style={{ fontSize: 12, color: 'var(--fg-3)', paddingRight: 9 }}>{suffix}</span>
        </div>
      )}
      <button onClick={submit} disabled={!val.trim()} className="btn btn-ghost btn-sm" style={{ flex: 'none', opacity: val.trim() ? 1 : 0.4 }}>
        + Adicionar
      </button>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

export function Goals({ goals, setGoals, events, projects }) {
  const addGoal = (goal) => setGoals(gs => [...gs, { id: uid(), ...goal }]);
  const delGoal = (id) => setGoals(gs => gs.filter(g => g.id !== id));
  const toggleTask = (id) => setGoals(gs => gs.map(g => g.id === id ? { ...g, done: !g.done } : g));

  const billableGoals = goals.filter(g => g.type === 'billable');
  const projectGoals = goals.filter(g => g.type === 'project');
  const taskGoals = goals.filter(g => g.type === 'task');

  const eventHours = (filterFn) =>
    events.filter(filterFn).reduce((acc, e) => acc + e.dur, 0) / 60;

  const billableHours = eventHours(e => {
    const p = projects.find(pr => pr.id === e.project);
    return p?.billable;
  });

  const projectHoursMap = {};
  events.forEach(e => {
    if (e.project) projectHoursMap[e.project] = (projectHoursMap[e.project] || 0) + e.dur / 60;
  });

  const totalHours = eventHours(() => true);
  const pendingCount = goals.filter(g => g.type === 'task' && !g.done).length;

  return (
    <div className="scroll" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="screen-inner" style={{ maxWidth: 680, margin: '0 auto', padding: '24px 26px 56px' }}>
        <div className="eyebrow">Acompanhamento</div>
        <h1 className="disp" style={{ fontSize: 40, margin: '4px 0 6px' }}>Metas</h1>
        <div style={{ display: 'flex', gap: 20, marginBottom: 28 }}>
          <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>
            <span className="mono" style={{ fontWeight: 700, color: 'var(--fg-2)' }}>{totalHours.toFixed(1)}h</span> rastreadas hoje
          </span>
          <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>
            <span className="mono" style={{ fontWeight: 700, color: 'var(--obj-success)' }}>{billableHours.toFixed(1)}h</span> faturáveis
          </span>
          {pendingCount > 0 && (
            <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>
              <span className="mono" style={{ fontWeight: 700, color: 'var(--obj-amber)' }}>{pendingCount}</span> {pendingCount === 1 ? 'tarefa pendente' : 'tarefas pendentes'}
            </span>
          )}
        </div>

        <Section label="Horas faturáveis">
          {billableGoals.map(g => (
            <HoursGoalCard key={g.id} goal={g} progress={billableHours} onDelete={() => delGoal(g.id)} />
          ))}
          <AddRow
            placeholder="Ex: Meta semanal"
            suffix="h"
            defaultNum="30"
            onAdd={(label, target) => addGoal({ type: 'billable', label, target: target || 30 })}
          />
        </Section>

        <Section label="Por projeto">
          {projectGoals.map(g => {
            const p = projects.find(pr => pr.id === g.projectId);
            const progress = projectHoursMap[g.projectId] || 0;
            return (
              <HoursGoalCard
                key={g.id}
                goal={{ ...g, label: g.label || p?.name || 'Projeto', color: p?.color }}
                progress={progress}
                onDelete={() => delGoal(g.id)}
              />
            );
          })}
          {projects.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.filter(p => !projectGoals.find(g => g.projectId === p.id)).map(p => (
                <button key={p.id} onClick={() => addGoal({ type: 'project', label: p.name, projectId: p.id, target: 8 })}
                  className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start', gap: 9 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flex: 'none' }} />
                  + Meta para {p.name}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--fg-3)', fontStyle: 'italic', padding: '4px 0' }}>
              Crie projetos primeiro para definir metas por projeto.
            </div>
          )}
        </Section>

        <Section label="Tarefas">
          {taskGoals.map(g => (
            <TaskCard key={g.id} goal={g} onToggle={() => toggleTask(g.id)} onDelete={() => delGoal(g.id)} />
          ))}
          <AddRow
            placeholder="Ex: Enviar proposta Paulista 1306"
            onAdd={(label) => addGoal({ type: 'task', label, done: false })}
          />
        </Section>
      </div>
    </div>
  );
}
