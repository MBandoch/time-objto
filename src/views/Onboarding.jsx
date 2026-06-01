import { useState } from 'react';
import { projById } from '../data.js';
import { Dot } from '../components/ui.jsx';

function MapRow({ file, projectId }) {
  const p = projById[projectId];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-1)', background: 'var(--bg-sunken)', border: '1px solid var(--line-1)', borderRadius: 'var(--r-sm)', padding: '7px 11px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file}</span>
      <span style={{ color: 'var(--accent)', fontSize: 17, flex: 'none' }}>→</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', flex: 'none', width: 150 }}><Dot color={p.color} /> {p.name}</span>
    </div>
  );
}

export function Onboarding({ onClose, initialUsername = '' }) {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState(initialUsername);
  const [rules, setRules] = useState({ skp: true, fig: true, tsx: true, xlsx: true });
  const steps = ['Bem-vindo', 'Como funciona', 'Regras iniciais', 'Pronto'];

  const canAdvance = step !== 0 || username.trim().length >= 2;

  const Body = () => {
    if (step === 0) return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'baseline', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 30, letterSpacing: '0.02em', color: 'var(--fg-1)', marginBottom: 16 }}>
          OBJ<span style={{ color: 'var(--accent)', margin: '0 2px' }}>_</span>TO
        </div>
        <h2 className="disp" style={{ fontSize: 34, margin: '0 0 10px', color: 'var(--fg-1)' }}>Rastreamento sem cronômetro</h2>
        <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto 22px' }}>
          O OBJ_TO observa quais arquivos e apps você usa e organiza seu dia nos projetos certos automaticamente.
        </p>
        <div style={{ maxWidth: 320, margin: '0 auto', textAlign: 'left' }}>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--fg-2)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Seu nome de usuário
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && canAdvance) setStep(1); }}
            placeholder="Ex: marco"
            autoFocus
            spellCheck={false}
            style={{
              width: '100%', boxSizing: 'border-box',
              fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--fg-1)',
              background: 'var(--bg)', border: '1.5px solid ' + (username.trim().length > 0 && username.trim().length < 2 ? 'var(--obj-danger)' : username.trim().length >= 2 ? 'var(--accent)' : 'var(--line-2)'),
              borderRadius: 'var(--r-sm)', padding: '10px 13px', outline: 'none', letterSpacing: '0.03em',
            }}
          />
          <p style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 7, lineHeight: 1.5 }}>
            Usado para sincronizar sessões entre computadores via servidor. Não precisa de senha.
          </p>
        </div>
      </div>
    );

    if (step === 1) return (
      <div>
        <h2 className="disp" style={{ fontSize: 28, margin: '0 0 6px', color: 'var(--fg-1)' }}>Ele lê o arquivo, não o relógio</h2>
        <p style={{ fontSize: 13.5, color: 'var(--fg-2)', lineHeight: 1.55, margin: '0 0 22px' }}>
          Abra <span className="mono" style={{ color: 'var(--fg-1)' }}>Paulista1306_facade.skp</span> e aquela hora vai para o Paulista 1306. O nome do arquivo aberto é o sinal.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <MapRow file="Paulista1306_facade.skp" projectId="paulista" />
          <MapRow file="brand-redesign-v3.fig" projectId="brand" />
          <MapRow file="Vega_pitch_v2.key" projectId="vega-deck" />
        </div>
      </div>
    );

    if (step === 2) return (
      <div>
        <h2 className="disp" style={{ fontSize: 28, margin: '0 0 6px', color: 'var(--fg-1)' }}>Encontramos esses padrões</h2>
        <p style={{ fontSize: 13.5, color: 'var(--fg-2)', lineHeight: 1.55, margin: '0 0 20px' }}>
          Baseado nos seus arquivos recentes. Mantenha os que fazem sentido — eles vão organizar atividade futura sem revisão.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {[['skp', '*.skp', 'paulista'], ['fig', '*.fig', 'brand'], ['tsx', '*.tsx', 'site'], ['xlsx', '*.xlsx', 'admin']].map(([k, pat, pid]) => {
            const p = projById[pid];
            return (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', border: '1px solid var(--line-1)', borderRadius: 'var(--r-card)', cursor: 'pointer', background: rules[k] ? 'var(--bg-elev)' : 'transparent' }}>
                <input type="checkbox" checked={rules[k]} onChange={() => setRules((r) => ({ ...r, [k]: !r[k] }))} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', flex: 'none' }}>{pat}</span>
                <span style={{ color: 'var(--fg-3)' }}>→</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--fg-1)', fontWeight: 700 }}><Dot color={p.color} /> {p.name}</span>
              </label>
            );
          })}
        </div>
      </div>
    );

    return (
      <div style={{ textAlign: 'center' }}>
        <div className="disp" style={{ fontSize: 56, color: 'var(--obj-success)', lineHeight: 1, marginBottom: 12 }}>✓</div>
        <h2 className="disp" style={{ fontSize: 30, margin: '0 0 8px', color: 'var(--fg-1)' }}>Pronto, {username.trim() || 'você'}!</h2>
        <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6, maxWidth: 380, margin: '0 auto 16px' }}>
          {Object.values(rules).filter(Boolean).length} regras ativas. Comece a trabalhar — seu dia vai se preencher sozinho.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--bg-sunken)', borderRadius: 'var(--r-pill)', border: '1px solid var(--line-1)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flex: 'none' }} />
          <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>{username.trim()}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'grid', placeItems: 'center', background: 'color-mix(in srgb, var(--bg-inverse) 55%, transparent)', backdropFilter: 'blur(3px)', animation: 'fadeIn 160ms ease-out' }}>
      <div className="card" style={{ width: 540, maxWidth: '92%', padding: 32, boxShadow: 'var(--shadow-3)', background: 'var(--bg-elev)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 26 }}>
          {steps.map((s, i) => (
            <span key={s} style={{ height: 4, borderRadius: 2, flex: i === step ? '0 0 26px' : '0 0 12px', background: i <= step ? 'var(--accent)' : 'var(--line-2)', transition: '200ms ease-out' }} />
          ))}
          <span className="eyebrow" style={{ marginLeft: 'auto', fontSize: 9.5 }}>{step + 1} / {steps.length}</span>
        </div>

        <div style={{ minHeight: 246, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Body />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 26 }}>
          {step === 0
            ? <button className="btn btn-ghost btn-sm" onClick={() => onClose(username.trim())}>Pular</button>
            : <button className="btn btn-ghost btn-sm" onClick={() => setStep((s) => s - 1)}>Voltar</button>}
          {step < steps.length - 1
            ? <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance} style={{ opacity: canAdvance ? 1 : 0.4 }}>
                Continuar
              </button>
            : <button className="btn btn-primary" onClick={() => onClose(username.trim())}>
                Começar a rastrear
              </button>}
        </div>
      </div>
    </div>
  );
}
