import { useState, useRef, useEffect } from 'react';
import { WEEK_BY_PROJECT, fmt } from '../data.js';

const SWATCH_COLORS = [
  'var(--p-paulista)', 'var(--p-brand)', 'var(--p-site)',
  'var(--p-vega)', 'var(--p-admin)',
  'var(--obj-amber)', 'var(--obj-clay)', 'var(--obj-success)',
];

function RulesEditor({ rules, onChange, allRules }) {
  const [input, setInput] = useState('');
  const [err, setErr] = useState('');
  const inputRef = useRef(null);

  const add = () => {
    const val = input.trim();
    if (!val) return;
    if (rules.includes(val)) { setErr('Already in this project'); return; }
    const clash = allRules.find((r) => r.rule === val);
    if (clash) { setErr(`Already used in "${clash.projectName}"`); return; }
    onChange([...rules, val]);
    setInput('');
    setErr('');
  };

  const remove = (r) => onChange(rules.filter((x) => x !== r));

  const onKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); add(); }
    if (e.key === 'Escape') { setInput(''); setErr(''); }
    if (e.key === 'Backspace' && !input && rules.length) remove(rules[rules.length - 1]);
  };

  const checkLive = (v) => {
    setInput(v);
    const val = v.trim();
    if (!val) { setErr(''); return; }
    if (rules.includes(val)) { setErr('Already in this project'); return; }
    const clash = allRules.find((r) => r.rule === val);
    if (clash) { setErr(`Already used in "${clash.projectName}"`); return; }
    setErr('');
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {rules.map((r) => (
          <span key={r} className="mono" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5,
            background: 'var(--bg)', border: '1px solid var(--line-2)',
            padding: '4px 8px 4px 9px', borderRadius: 'var(--r-pill)', color: 'var(--fg-2)',
          }}>
            {r}
            <button onClick={() => remove(r)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 1px',
              color: 'var(--fg-3)', lineHeight: 1, display: 'grid', placeItems: 'center',
            }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--obj-danger)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--fg-3)'}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </span>
        ))}
        {rules.length === 0 && <span style={{ fontSize: 12, color: 'var(--fg-3)', fontStyle: 'italic' }}>No rules yet — add one below</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <input
            ref={inputRef} value={input} onChange={(e) => checkLive(e.target.value)} onKeyDown={onKey}
            placeholder="app name, *.ext, or keyword"
            spellCheck={false}
            style={{
              width: '100%', boxSizing: 'border-box',
              fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--fg-1)',
              background: 'var(--bg)', border: '1px solid ' + (err ? 'var(--obj-danger)' : 'var(--line-2)'),
              borderRadius: 'var(--r-sm)', padding: '8px 10px', outline: 'none',
            }} />
          {err && <div style={{ fontSize: 11.5, color: 'var(--obj-danger)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            {err}
          </div>}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={add} disabled={!input.trim() || !!err} style={{ flex: 'none', marginTop: 1 }}>Add</button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 6 }}>
        Press <kbd style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-sunken)', border: '1px solid var(--line-2)', padding: '1px 5px', borderRadius: 3 }}>Enter</kbd> to add · <kbd style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-sunken)', border: '1px solid var(--line-2)', padding: '1px 5px', borderRadius: 3 }}>Backspace</kbd> to remove last
      </div>
    </div>
  );
}

function NewProjectModal({ onClose, onSave, allRules }) {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [billable, setBillable] = useState(true);
  const [rate, setRate] = useState(80);
  const [color, setColor] = useState(SWATCH_COLORS[0]);
  const [rules, setRules] = useState([]);
  const backdropRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const valid = name.trim().length > 0 && client.trim().length > 0;

  const save = () => {
    if (!valid) return;
    onSave({ id: 'p' + Date.now(), name: name.trim(), client: client.trim(), billable, rate: billable ? rate : 0, color, rules });
    onClose();
  };

  const field = (label, children) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div ref={backdropRef} onClick={(e) => { if (e.target === backdropRef.current) onClose(); }} style={{
      position: 'absolute', inset: 0, zIndex: 80,
      background: 'rgba(20,20,19,0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 120ms ease-out',
    }}>
      <div className="card" style={{
        width: 'min(92vw, 560px)', maxHeight: '86vh', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-3)', borderRadius: 'var(--r-lg)', animation: 'popIn 140ms ease-out',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: '1px solid var(--line-1)', flex: 'none' }}>
          <div>
            <div className="eyebrow" style={{ fontSize: 9.5, marginBottom: 2 }}>Projects</div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--fg-1)' }}>New project</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="scroll" style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {field('Project name',
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Paulista 1306"
                style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fg-1)', background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', padding: '9px 11px', outline: 'none' }} />
            )}
            {field('Client',
              <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Ex: Incorporadora Vega"
                style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--fg-1)', background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', padding: '9px 11px', outline: 'none' }} />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setBillable((b) => !b)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', background: 'transparent',
              cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--fg-2)', padding: 0,
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: 'var(--r-xs)', border: '1.5px solid ' + (billable ? 'var(--accent)' : 'var(--line-2)'),
                background: billable ? 'var(--accent)' : 'transparent', display: 'grid', placeItems: 'center', flex: 'none',
              }}>
                {billable && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent-on,#fff)" strokeWidth="3.2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
              </span>
              Billable
            </button>
            {billable && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>Rate</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', overflow: 'hidden', background: 'var(--bg)' }}>
                  <span style={{ padding: '7px 10px', fontSize: 13, color: 'var(--fg-3)', borderRight: '1px solid var(--line-1)', background: 'var(--bg-sunken)' }}>$</span>
                  <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} min={1} max={999}
                    style={{ width: 64, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-1)', background: 'transparent', border: 'none', padding: '7px 9px', outline: 'none' }} />
                  <span style={{ padding: '7px 10px', fontSize: 12, color: 'var(--fg-3)', borderLeft: '1px solid var(--line-1)', background: 'var(--bg-sunken)' }}>/h</span>
                </span>
              </div>
            )}
          </div>

          {field('Colour',
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SWATCH_COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 26, height: 26, borderRadius: '50%', border: color === c ? '2.5px solid var(--fg-1)' : '2px solid transparent',
                  outline: color === c ? '2px solid var(--bg)' : 'none', outlineOffset: 1,
                  background: c, cursor: 'pointer', padding: 0, flex: 'none',
                }} />
              ))}
              <input type="color" value={color.startsWith('#') ? color : '#1DADA6'}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: 26, height: 26, border: 'none', borderRadius: '50%', cursor: 'pointer', background: 'transparent', padding: 0 }} />
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Auto-detection rules</label>
              <span style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>optional</span>
            </div>
            <div style={{ padding: 14, background: 'var(--bg-sunken)', borderRadius: 'var(--r-md)', border: '1px solid var(--line-1)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--fg-3)', lineHeight: 1.55 }}>
                Rules match window titles and filenames to auto-categorise tracked time. Examples: <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>Figma</code>, <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>*.skp</code>, <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>localhost</code>. Each rule can only belong to one project.
              </p>
              <RulesEditor rules={rules} onChange={setRules} allRules={allRules} />
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flex: 'none' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={!valid} style={{ opacity: valid ? 1 : 0.45 }}>Create project</button>
        </div>
      </div>
    </div>
  );
}

function ProjectRulesPanel({ project, onChange, allRules }) {
  return (
    <div style={{ borderTop: '1px solid var(--line-1)', paddingTop: 14, marginTop: 4 }}>
      <div className="eyebrow" style={{ fontSize: 9.5, marginBottom: 10 }}>Auto-detection rules</div>
      <RulesEditor
        rules={project.rules}
        onChange={(newRules) => onChange({ ...project, rules: newRules })}
        allRules={allRules}
      />
    </div>
  );
}

export function Projects({ projects, setProjects }) {
  const weekMap = Object.fromEntries(WEEK_BY_PROJECT.map((r) => [r.id, r.min]));
  const [expanded, setExpanded] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const allRulesFor = (excludeId) =>
    projects.filter((p) => p.id !== excludeId)
      .flatMap((p) => p.rules.map((r) => ({ rule: r, projectName: p.name })));

  const updateProject = (updated) =>
    setProjects((ps) => ps.map((p) => p.id === updated.id ? updated : p));

  const addProject = (p) => setProjects((ps) => [...ps, p]);

  return (
    <div className="scroll" style={{ height: '100%', overflowY: 'auto', position: 'relative' }}>
      <div className="screen-inner" style={{ maxWidth: 940, margin: '0 auto', padding: '24px 26px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div className="eyebrow">{projects.length} active · {new Set(projects.map((p) => p.client)).size} clients</div>
            <h1 className="disp" style={{ fontSize: 40, margin: '4px 0 0' }}>Projects</h1>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>＋ New project</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {projects.map((p) => {
            const min = weekMap[p.id] || 0;
            const isOpen = expanded === p.id;
            const otherRules = allRulesFor(p.id);
            return (
              <div key={p.id} className="card" style={{
                padding: '16px 18px', transition: '140ms ease-out',
                boxShadow: isOpen ? 'var(--shadow-2)' : 'none',
                border: isOpen ? '1px solid var(--line-2)' : '1px solid var(--line-1)',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '4px 1fr auto', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 3, background: p.color, margin: '2px 0' }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--fg-1)' }}>{p.name}</h3>
                      <span className="chip" style={{ background: p.billable ? 'transparent' : 'var(--bg-sunken)', borderColor: 'var(--line-2)', color: p.billable ? 'var(--obj-success)' : 'var(--fg-3)', cursor: 'default' }}>
                        {p.billable ? `$${p.rate}/h` : 'Internal'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--fg-3)', margin: '3px 0 10px' }}>{p.client}</div>

                    <button onClick={() => setExpanded(isOpen ? null : p.id)} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', background: 'transparent',
                      cursor: 'pointer', padding: '4px 0', borderRadius: 'var(--r-sm)', color: 'var(--fg-2)',
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--fg-1)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--fg-2)'}>
                      <span className="eyebrow" style={{ fontSize: 9, color: 'var(--fg-3)' }}>Rules</span>
                      {p.rules.length > 0
                        ? p.rules.slice(0, 3).map((r) => (
                          <span key={r} className="mono" style={{ fontSize: 11, color: 'var(--fg-2)', background: 'var(--bg-sunken)', border: '1px solid var(--line-1)', padding: '3px 7px', borderRadius: 'var(--r-pill)' }}>{r}</span>
                        ))
                        : <span style={{ fontSize: 11.5, color: 'var(--fg-3)', fontStyle: 'italic' }}>None</span>}
                      {p.rules.length > 3 && <span style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>+{p.rules.length - 3} more</span>}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '160ms ease-out' }}><polyline points="6 9 12 15 18 9" /></svg>
                    </button>
                  </div>

                  <div style={{ textAlign: 'right', flex: 'none' }}>
                    <div className="disp" style={{ fontSize: 30, color: 'var(--fg-1)', lineHeight: 1 }}>{fmt.hrs(min)}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>this week</div>
                    {p.billable && min > 0 && <div className="mono" style={{ fontSize: 11.5, color: 'var(--obj-success)', marginTop: 4 }}>${Math.round((min / 60) * p.rate).toLocaleString('en-US')}</div>}
                  </div>
                </div>

                {isOpen && (
                  <ProjectRulesPanel project={p} onChange={updateProject} allRules={otherRules} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onSave={addProject}
          allRules={projects.flatMap((p) => p.rules.map((r) => ({ rule: r, projectName: p.name })))}
        />
      )}
    </div>
  );
}
