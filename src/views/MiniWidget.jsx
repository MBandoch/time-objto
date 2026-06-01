import { useState, useEffect } from 'react';
import { fmt } from '../data.js';
import { isTauri } from '../utils/tracking.js';

// Janela flutuante always-on-top. Roda em uma WebviewWindow separada
// (label "widget"). Recebe o estado de rastreamento da janela principal
// via eventos do Tauri e apenas exibe — sem gravar sessões.
export function MiniWidget() {
  const [state, setState] = useState({ running: false, elapsed: 0, doc: '', app: '', projectName: '', projectColor: '' });

  useEffect(() => {
    let unlisten = null;
    let alive = true;
    (async () => {
      try {
        const { listen, emit } = await import('@tauri-apps/api/event');
        unlisten = await listen('tracking', (e) => { if (alive && e?.payload) setState(e.payload); });
        // pede o estado atual à janela principal
        await emit('widget-ready', {});
      } catch { /* fora do Tauri */ }
    })();
    return () => { alive = false; if (unlisten) unlisten(); };
  }, []);

  const { running, elapsed, doc, app, projectName, projectColor } = state;
  const hh = Math.floor(elapsed / 3600), mm = Math.floor((elapsed % 3600) / 60), ss = elapsed % 60;

  const close = async () => {
    try { const { invoke } = await import('@tauri-apps/api/core'); await invoke('close_mini_widget'); }
    catch { /* ignore */ }
  };

  return (
    <div className="app" data-accent="navy" style={{
      width: '100vw', height: '100vh', background: 'var(--bg-elev)', color: 'var(--fg-1)',
      fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      border: '1px solid var(--line-2)', borderRadius: 8,
    }}>
      {/* barra superior arrastável */}
      <div data-tauri-drag-region style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px 6px 11px',
        borderBottom: '1px solid var(--line-1)', cursor: 'grab', flex: 'none',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em', pointerEvents: 'none' }}>
          OBJ<span style={{ color: 'var(--accent)' }}>_</span>TO
        </span>
        <button onClick={close} title="Fechar janela flutuante" style={{
          marginLeft: 'auto', width: 22, height: 22, border: 'none', borderRadius: 4, cursor: 'pointer',
          background: 'transparent', color: 'var(--fg-3)', display: 'grid', placeItems: 'center',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#e54b4b'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fg-3)'; }}>
          <svg width="11" height="11" viewBox="0 0 11 11"><line x1="1" y1="1" x2="10" y2="10" stroke="currentColor" strokeWidth="1.4" /><line x1="10" y1="1" x2="1" y2="10" stroke="currentColor" strokeWidth="1.4" /></svg>
        </button>
      </div>

      {/* corpo */}
      <div style={{ flex: 1, padding: '11px 13px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ position: 'relative', width: 9, height: 9, flex: 'none' }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: running ? 'var(--obj-success)' : 'var(--fg-3)' }} />
            {running && <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1px solid var(--obj-success)', animation: 'ping 1.6s ease-out infinite' }} />}
          </span>
          <span className="mono" style={{ fontSize: 21, fontWeight: 700, color: 'var(--fg-1)', letterSpacing: '0.01em' }}>
            {fmt.pad(hh)}:{fmt.pad(mm)}:{fmt.pad(ss)}
          </span>
          <span className="eyebrow" style={{ marginLeft: 'auto', fontSize: 8.5, color: running ? 'var(--obj-success)' : 'var(--fg-3)' }}>
            {running ? 'Rastreando' : 'Parado'}
          </span>
        </div>

        {projectName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 9 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: projectColor || 'var(--accent)', flex: 'none' }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{projectName}</span>
          </div>
        ) : (doc || app) ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 9 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--obj-amber)', flex: 'none' }} />
            <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>Não classificado</span>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 9 }}>
            {isTauri() ? 'Aguardando atividade…' : 'Pré-visualização'}
          </div>
        )}

        {(doc || app) && (
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {[doc, app].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
}
