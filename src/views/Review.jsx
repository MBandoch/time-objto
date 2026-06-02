import { useState, useMemo } from 'react';
import { APPS, fmt } from '../data.js';
import { AppTile, Dot, ProjectPicker } from '../components/ui.jsx';
import { MainTriage } from './MainTriage.jsx';

function patOf(ev) {
  const title = ev.title || ev.doc || '';
  const m = title.match(/\.([a-z0-9]+)$/i);
  if (m) return '*.' + m[1].toLowerCase();
  if (/^localhost/i.test(title)) return 'localhost';
  return APPS[ev.app]?.name || ev.app || '—';
}

function GroupCard({ group, actions, projects, projById }) {
  const [open, setOpen] = useState(false);
  const [rule, setRule] = useState(true);
  const sugg = group.project ? projById[group.project] : null;
  const total = group.items.reduce((a, e) => a + e.dur, 0);

  const assignAll = (pid) => group.items.forEach((e) => actions.assign(e.id, pid));

  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 13 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <AppTile app={group.items[0].app} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>{group.key}</span>
            <span className="chip" style={{ cursor: 'default', background: 'var(--bg-sunken)', borderColor: 'var(--line-1)', color: 'var(--fg-2)', fontSize: 10.5 }}>{group.items.length} {group.items.length > 1 ? 'sessões' : 'sessão'}</span>
          </div>
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 2 }}>{fmt.dur(total)} total · sinal detectado</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 2 }}>
        {group.items.map((e) => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-2)' }}>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', width: 38, flex: 'none' }}>{fmt.clock(e.start)}</span>
            <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title || e.doc || '—'}</span>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{fmt.dur(e.dur)}</span>
          </div>
        ))}
      </div>

      {sugg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--fg-3)' }}>
          <span className="eyebrow" style={{ fontSize: 9 }}>Sugestão</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--fg-1)' }}><Dot color={sugg.color} /> {sugg.name}</span>
        </div>
      )}

      {sugg && rule !== null && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-2)', cursor: 'pointer' }}>
          <input type="checkbox" checked={rule} onChange={(e) => setRule(e.target.checked)} style={{ accentColor: 'var(--accent)', width: 14, height: 14 }} />
          Criar regra: <span className="mono" style={{ fontWeight: 700, color: 'var(--fg-1)' }}>{group.key}</span> → {sugg.name}
        </label>
      )}

      <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
        {sugg ? (
          <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => assignAll(group.project)}>
            Confirmar tudo → {sugg.name}
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setOpen(true)}>Atribuir grupo…</button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>Alterar</button>
        {open && <ProjectPicker value={group.project} projects={projects} align="right" width={260} onChange={(pid) => assignAll(pid)} onClose={() => setOpen(false)} />}
      </div>
    </div>
  );
}

const TABS = [
  { id: 'lote',    label: 'Revisão em lote' },
  { id: 'triagem', label: 'Triagem' },
];

function TabBar({ tab, setTab }) {
  return (
    <div style={{ flex: 'none', borderBottom: '1px solid var(--line-1)', display: 'flex', alignItems: 'flex-end', padding: '0 26px', background: 'var(--bg-elev)' }}>
      {TABS.map((t) => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          padding: '13px 14px 11px', marginRight: 2,
          fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700,
          color: tab === t.id ? 'var(--fg-1)' : 'var(--fg-3)',
          borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
          transition: '120ms ease-out',
        }}>{t.label}</button>
      ))}
    </div>
  );
}

export function Review({ events, actions, projects = [] }) {
  const [tab, setTab] = useState('lote');
  const projById = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);
  const queue = events.filter((e) => e.status !== 'confirmed');
  const map = new Map();
  queue.forEach((e) => {
    const k = patOf(e);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(e);
  });
  const groups = [...map.entries()].map(([key, items]) => {
    const counts = {};
    items.forEach((e) => { if (e.project) counts[e.project] = (counts[e.project] || 0) + 1; });
    const project = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || null;
    return { key, items, project };
  }).sort((a, b) => (a.project ? 0 : 1) - (b.project ? 0 : 1));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <TabBar tab={tab} setTab={setTab} />

      {tab === 'lote' && (
        <div className="scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <div className="screen-inner" style={{ maxWidth: 920, margin: '0 auto', padding: '24px 26px 48px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 6, gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div className="eyebrow">Revisão em lote · agrupado por sinal detectado</div>
                <h1 className="disp" style={{ fontSize: 40, margin: '4px 0 0' }}>Revisão</h1>
              </div>
              {queue.length > 0 && <button className="btn btn-ghost" onClick={actions.confirmAll}>Aceitar todas as sugestões</button>}
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--fg-2)', maxWidth: 560, margin: '8px 0 22px' }}>
              {queue.length > 0
                ? `${queue.length} blocos em ${groups.length} sinais. Confirme um grupo inteiro de uma vez — e transforme em regra para os mesmos arquivos se classificarem automaticamente.`
                : 'Nada a revisar. Todos os blocos rastreados estão classificados.'}
            </p>

            {queue.length === 0 ? (
              <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--fg-2)' }}>
                <div className="disp" style={{ fontSize: 46, color: 'var(--obj-success)', lineHeight: 1 }}>✓</div>
                <div style={{ fontSize: 15, marginTop: 8 }}>Caixa vazia</div>
              </div>
            ) : (
              <div className="col-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, alignItems: 'start' }}>
                {groups.map((g) => <GroupCard key={g.key} group={g} actions={actions} projects={projects} projById={projById} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'triagem' && (
        <div style={{ flex: 1, minHeight: 0 }}>
          <MainTriage events={events} actions={actions} />
        </div>
      )}
    </div>
  );
}
