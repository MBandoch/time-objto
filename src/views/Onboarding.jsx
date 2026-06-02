import { useState } from 'react';
import { RULE_TYPES, PROJECT_COLORS } from '../data.js';

export function Onboarding({ onClose, initialUsername = '' }) {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState(initialUsername);
  const [proj, setProj] = useState({
    name: '', client: '', billable: true, rate: 95,
    ruleType: 'glob', rulePattern: '', colorIdx: 0,
  });

  const steps = ['Bem-vindo', 'Como funciona', 'Primeiro projeto', 'Pronto'];
  const canAdvance0 = username.trim().length >= 2;
  const canAdvance2 = proj.name.trim().length >= 2;

  const canAdvance = () => {
    if (step === 0) return canAdvance0;
    if (step === 2) return canAdvance2;
    return true;
  };

  const finish = () => {
    let newProject = null;
    if (proj.name.trim()) {
      const slug = proj.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      newProject = {
        id: 'p-' + Date.now() + '-' + slug,
        name: proj.name.trim(),
        client: proj.client.trim(),
        color: PROJECT_COLORS[proj.colorIdx].value,
        rate: proj.billable ? Number(proj.rate) || 0 : 0,
        billable: proj.billable,
        rules: proj.rulePattern.trim() ? [{ type: proj.ruleType, pattern: proj.rulePattern.trim() }] : [],
      };
    }
    onClose(username.trim(), newProject);
  };

  const Body = () => {
    // Step 0: Welcome + username
    if (step === 0) return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'baseline', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 30, letterSpacing: '0.02em', color: 'var(--fg-1)', marginBottom: 16 }}>
          OBJ<span style={{ color: 'var(--accent)', margin: '0 2px' }}>_</span>TO
        </div>
        <h2 className="disp" style={{ fontSize: 34, margin: '0 0 10px', color: 'var(--fg-1)' }}>Rastreamento sem cronômetro</h2>
        <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto 22px' }}>
          O OBJ_TO detecta quais programas e arquivos você usa e organiza seu dia nos projetos certos automaticamente.
        </p>
        <div style={{ maxWidth: 320, margin: '0 auto', textAlign: 'left' }}>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--fg-2)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Seu nome de usuário
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && canAdvance0) setStep(1); }}
            placeholder="Ex: marco"
            autoFocus spellCheck={false}
            style={{
              width: '100%', boxSizing: 'border-box',
              fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--fg-1)',
              background: 'var(--bg)', borderRadius: 'var(--r-sm)', padding: '10px 13px', outline: 'none',
              border: '1.5px solid ' + (username.trim().length > 0 && username.trim().length < 2 ? 'var(--obj-danger)' : username.trim().length >= 2 ? 'var(--accent)' : 'var(--line-2)'),
              letterSpacing: '0.03em',
            }}
          />
          <p style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 7, lineHeight: 1.5 }}>
            Usado para sincronizar sessões entre computadores via servidor. Não precisa de senha.
          </p>
        </div>
      </div>
    );

    // Step 1: How it works
    if (step === 1) return (
      <div>
        <h2 className="disp" style={{ fontSize: 28, margin: '0 0 6px', color: 'var(--fg-1)' }}>Ele lê o programa, não o relógio</h2>
        <p style={{ fontSize: 13.5, color: 'var(--fg-2)', lineHeight: 1.55, margin: '0 0 22px' }}>
          O OBJ_TO detecta qual janela está em primeiro plano e associa o tempo ao projeto correspondente, sem que você precise iniciar nenhum cronômetro.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['Paulista1306_facade.skp', 'Projeto de arquitetura', 'var(--p-paulista)'],
            ['brand-redesign-v3.fig',   'Identidade visual',      'var(--p-brand)'],
            ['relatorio.xlsx',          'Admin & Financeiro',     'var(--p-admin)'],
          ].map(([file, project, color]) => (
            <div key={file} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-1)', background: 'var(--bg-sunken)', border: '1px solid var(--line-1)', borderRadius: 'var(--r-sm)', padding: '7px 11px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file}</span>
              <span style={{ color: 'var(--accent)', fontSize: 17, flex: 'none' }}>→</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', flex: 'none', width: 160 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flex: 'none' }} />
                {project}
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.55, marginTop: 18 }}>
          Você define as regras — padrões de nome de arquivo, títulos de janela ou expressões — e o app categoriza o tempo sozinho.
        </p>
      </div>
    );

    // Step 2: Create first project
    if (step === 2) {
      const selColor = PROJECT_COLORS[proj.colorIdx];
      return (
        <div>
          <h2 className="disp" style={{ fontSize: 28, margin: '0 0 6px', color: 'var(--fg-1)' }}>Seu primeiro projeto</h2>
          <p style={{ fontSize: 13.5, color: 'var(--fg-2)', lineHeight: 1.55, margin: '0 0 18px' }}>
            Crie um projeto e defina uma regra para detectar automaticamente quando você está trabalhando nele.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Name + color */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-3)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Nome do projeto *</label>
                <input value={proj.name} onChange={e => setProj(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Paulista 1306" autoFocus spellCheck={false}
                  style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: 'var(--fg-1)', background: 'var(--bg)', border: '1.5px solid ' + (proj.name.length > 0 && proj.name.length < 2 ? 'var(--obj-danger)' : proj.name.length >= 2 ? 'var(--accent)' : 'var(--line-2)'), borderRadius: 'var(--r-sm)', padding: '9px 12px', outline: 'none' }} />
              </div>
              <div style={{ flex: 'none' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-3)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Cor</label>
                <div style={{ display: 'flex', gap: 5, paddingTop: 6 }}>
                  {PROJECT_COLORS.map((c, i) => (
                    <button key={i} onClick={() => setProj(p => ({ ...p, colorIdx: i }))} style={{
                      width: 26, height: 26, borderRadius: '50%', border: '2px solid ' + (proj.colorIdx === i ? 'var(--fg-1)' : 'transparent'),
                      background: c.value, cursor: 'pointer', padding: 0, outline: 'none', transition: '120ms ease-out',
                    }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Client */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-3)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Cliente <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 10.5, opacity: 0.7 }}>(opcional)</span></label>
              <input value={proj.client} onChange={e => setProj(p => ({ ...p, client: e.target.value }))}
                placeholder="Ex: Incorporadora Vega" spellCheck={false}
                style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-1)', background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', padding: '8px 12px', outline: 'none' }} />
            </div>

            {/* Billable + rate */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>
                <input type="checkbox" checked={proj.billable} onChange={e => setProj(p => ({ ...p, billable: e.target.checked }))}
                  style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
                Faturável
              </label>
              {proj.billable && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-3)' }}>R$</span>
                  <input type="number" value={proj.rate} onChange={e => setProj(p => ({ ...p, rate: e.target.value }))}
                    min={0} max={9999} step={5}
                    style={{ width: 80, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', padding: '6px 10px', outline: 'none' }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-3)' }}>/h</span>
                </div>
              )}
            </div>

            {/* Detection rule */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-3)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Regra de detecção</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={proj.ruleType} onChange={e => setProj(p => ({ ...p, ruleType: e.target.value }))}
                  style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: 'var(--fg-1)', background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', padding: '8px 10px', outline: 'none', cursor: 'pointer' }}>
                  {RULE_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                </select>
                <input value={proj.rulePattern} onChange={e => setProj(p => ({ ...p, rulePattern: e.target.value }))}
                  placeholder={RULE_TYPES.find(r => r.value === proj.ruleType)?.example || '*.ext'} spellCheck={false}
                  style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-1)', background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', padding: '8px 12px', outline: 'none' }} />
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 6, lineHeight: 1.5 }}>
                Quando o título da janela corresponder a este padrão, o tempo será registrado neste projeto.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Step 3: Done
    return (
      <div style={{ textAlign: 'center' }}>
        <div className="disp" style={{ fontSize: 56, color: 'var(--obj-success)', lineHeight: 1, marginBottom: 12 }}>✓</div>
        <h2 className="disp" style={{ fontSize: 30, margin: '0 0 8px', color: 'var(--fg-1)' }}>Pronto, {username.trim() || 'você'}!</h2>
        <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6, maxWidth: 380, margin: '0 auto 16px' }}>
          {proj.name.trim()
            ? `Projeto "${proj.name.trim()}" criado. Comece a trabalhar — seu dia vai se registrar sozinho.`
            : 'Você pode criar projetos a qualquer momento na tela Projetos.'}
        </p>
        {username.trim() && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--bg-sunken)', borderRadius: 'var(--r-pill)', border: '1px solid var(--line-1)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flex: 'none' }} />
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>{username.trim()}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'grid', placeItems: 'center', background: 'color-mix(in srgb, var(--bg-inverse) 55%, transparent)', backdropFilter: 'blur(3px)', animation: 'fadeIn 160ms ease-out' }}>
      <div className="card" style={{ width: 560, maxWidth: '94%', padding: 32, boxShadow: 'var(--shadow-3)', background: 'var(--bg-elev)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 26 }}>
          {steps.map((s, i) => (
            <span key={s} style={{ height: 4, borderRadius: 2, flex: i === step ? '0 0 26px' : '0 0 12px', background: i <= step ? 'var(--accent)' : 'var(--line-2)', transition: '200ms ease-out' }} />
          ))}
          <span className="eyebrow" style={{ marginLeft: 'auto', fontSize: 9.5 }}>{step + 1} / {steps.length}</span>
        </div>

        <div style={{ minHeight: step === 2 ? 340 : 246, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Body />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 26 }}>
          {step === 0
            ? <button className="btn btn-ghost btn-sm" onClick={() => onClose(username.trim(), null)}>Pular</button>
            : <button className="btn btn-ghost btn-sm" onClick={() => setStep(s => s - 1)}>Voltar</button>}

          {step === 2 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setStep(3)} style={{ marginRight: 'auto', marginLeft: 8 }}>
              Pular este passo
            </button>
          )}

          {step < steps.length - 1
            ? <button className="btn btn-primary" onClick={() => setStep(s => s + 1)} disabled={!canAdvance()} style={{ opacity: canAdvance() ? 1 : 0.4 }}>
                Continuar
              </button>
            : <button className="btn btn-primary" onClick={finish}>
                Começar a rastrear
              </button>}
        </div>
      </div>
    </div>
  );
}
