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

export function Onboarding({ onClose }) {
  const [step, setStep] = useState(0);
  const [rules, setRules] = useState({ skp: true, fig: true, tsx: true, xlsx: true });
  const steps = ['Welcome', 'How it works', 'Starter rules', 'Done'];

  const Body = () => {
    if (step === 0) return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'baseline', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 30, letterSpacing: '0.02em', color: 'var(--fg-1)', marginBottom: 18 }}>
          OBJ<span style={{ color: 'var(--accent)', margin: '0 2px' }}>_</span>TO
        </div>
        <h2 className="disp" style={{ fontSize: 34, margin: '0 0 12px', color: 'var(--fg-1)' }}>Time tracking without a timer</h2>
        <p style={{ fontSize: 14.5, color: 'var(--fg-2)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
          OBJ_TO watches which files and apps you work in, and sorts your day into the right projects automatically. You just confirm — or adjust.
        </p>
      </div>
    );
    if (step === 1) return (
      <div>
        <h2 className="disp" style={{ fontSize: 28, margin: '0 0 6px', color: 'var(--fg-1)' }}>It reads the file, not your clock</h2>
        <p style={{ fontSize: 13.5, color: 'var(--fg-2)', lineHeight: 1.55, margin: '0 0 22px' }}>
          Open <span className="mono" style={{ color: 'var(--fg-1)' }}>Paulista1306_facade.skp</span> and that hour lands on Paulista 1306. The name of the open file is the signal.
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
        <h2 className="disp" style={{ fontSize: 28, margin: '0 0 6px', color: 'var(--fg-1)' }}>We found these patterns</h2>
        <p style={{ fontSize: 13.5, color: 'var(--fg-2)', lineHeight: 1.55, margin: '0 0 20px' }}>
          Based on your recent files. Keep the ones that look right — they'll sort future activity with no review.
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
        <h2 className="disp" style={{ fontSize: 30, margin: '0 0 12px', color: 'var(--fg-1)' }}>You're set</h2>
        <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>
          {Object.values(rules).filter(Boolean).length} rules active. Start working — your day will fill itself in, and anything unmatched waits for you in Review.
        </p>
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

        <div style={{ minHeight: 246, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><Body /></div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 26 }}>
          {step === 0
            ? <button className="btn btn-ghost btn-sm" onClick={onClose}>Skip</button>
            : <button className="btn btn-ghost btn-sm" onClick={() => setStep((s) => s - 1)}>Back</button>}
          {step < steps.length - 1
            ? <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>Continue</button>
            : <button className="btn btn-primary" onClick={onClose}>Start tracking</button>}
        </div>
      </div>
    </div>
  );
}
