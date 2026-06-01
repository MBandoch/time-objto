import { fmt } from '../data.js';
import { isTauri } from '../utils/tracking.js';

// Pré-visualização da janela flutuante dentro do app principal.
// Mostra o estado real de rastreamento; o botão abre a janela always-on-top
// de verdade (no Tauri) via comando no Rust.
function PreviewCard({ liveTracking, projects }) {
  const lt = liveTracking || {};
  const { running = false, elapsed = 0, doc, title, app, project: projectId } = lt;
  const p = projects?.find((x) => x.id === projectId);
  const docLabel = doc || title || '';
  const hh = Math.floor(elapsed / 3600), mm = Math.floor((elapsed % 3600) / 60), ss = elapsed % 60;

  return (
    <div style={{
      width: 260, background: 'var(--bg-elev)', borderRadius: 'var(--r-card)',
      border: '1px solid var(--line-2)', boxShadow: 'var(--shadow-3)', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', borderBottom: '1px solid var(--line-1)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em' }}>OBJ<span style={{ color: 'var(--accent)' }}>_</span>TO</span>
        <span className="eyebrow" style={{ marginLeft: 'auto', fontSize: 8.5, color: running ? 'var(--obj-success)' : 'var(--fg-3)' }}>{running ? 'Rastreando' : 'Parado'}</span>
      </div>
      <div style={{ padding: '11px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ position: 'relative', width: 9, height: 9, flex: 'none' }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: running ? 'var(--obj-success)' : 'var(--fg-3)' }} />
            {running && <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1px solid var(--obj-success)', animation: 'ping 1.6s ease-out infinite' }} />}
          </span>
          <span className="mono" style={{ fontSize: 21, fontWeight: 700, color: 'var(--fg-1)' }}>{fmt.pad(hh)}:{fmt.pad(mm)}:{fmt.pad(ss)}</span>
        </div>
        {p ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 9 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flex: 'none' }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
          </div>
        ) : docLabel ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 9 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--obj-amber)', flex: 'none' }} />
            <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>Não classificado</span>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 9 }}>Nenhum rastreamento ativo</div>
        )}
        {(docLabel || app) && (
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {[docLabel, app].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
}

export function Widget({ liveTracking, projects = [], onOpenWindow }) {
  const tauri = isTauri();
  return (
    <div style={{ height: '100%', position: 'relative', overflow: 'hidden', background: 'repeating-linear-gradient(135deg, var(--bg-sunken) 0 2px, var(--bg) 2px 22px)' }}>
      <div style={{ position: 'absolute', top: 26, left: 26, right: 26, zIndex: 2 }}>
        <div className="eyebrow">Companheiro always-on-top</div>
        <h1 className="disp" style={{ fontSize: 36, margin: '4px 0 6px' }}>Janela flutuante</h1>
        <p style={{ fontSize: 13.5, color: 'var(--fg-2)', maxWidth: 440, lineHeight: 1.5 }}>
          Uma janela pequena que fica sobre seu trabalho, mostrando o que está sendo rastreado agora.
          {tauri ? ' Clique abaixo para abri-la sobre os outros programas.' : ' Disponível no aplicativo desktop.'}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn btn-primary btn-sm" onClick={onOpenWindow}>
            {tauri ? 'Abrir janela flutuante' : 'Pré-visualizar'}
          </button>
        </div>
      </div>

      <div style={{ position: 'absolute', right: 40, bottom: 56 }}>
        <PreviewCard liveTracking={liveTracking} projects={projects} />
      </div>
    </div>
  );
}
