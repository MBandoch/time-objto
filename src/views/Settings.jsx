import { useState, useRef } from 'react';

function Switch({ on, onClick }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={on} style={{
      width: 40, height: 23, borderRadius: 999, border: 'none', cursor: 'pointer', flex: 'none',
      background: on ? 'var(--accent)' : 'var(--line-2)', position: 'relative', transition: '140ms ease-out', padding: 0,
    }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 20 : 3, width: 17, height: 17, borderRadius: '50%', background: '#fff', transition: '140ms ease-out', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }} />
    </button>
  );
}

function Row({ title, desc, children, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '15px 0', borderBottom: last ? 'none' : '1px solid var(--line-1)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>{title}</div>
        {desc && <div style={{ fontSize: 12.5, color: 'var(--fg-3)', marginTop: 2, lineHeight: 1.45 }}>{desc}</div>}
      </div>
      <div style={{ flex: 'none' }}>{children}</div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      <div className="card" style={{ padding: '4px 18px' }}>{children}</div>
    </div>
  );
}

function Seg({ value, options, labels, onChange }) {
  return (
    <div style={{ display: 'inline-flex', background: 'var(--bg-sunken)', borderRadius: 'var(--r-sm)', padding: 3, gap: 2 }}>
      {options.map((o, i) => (
        <button key={o} onClick={() => onChange(o)} style={{
          border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 'var(--r-xs)',
          fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700,
          background: value === o ? 'var(--bg-elev)' : 'transparent',
          color: value === o ? 'var(--fg-1)' : 'var(--fg-3)',
          boxShadow: value === o ? 'var(--shadow-1)' : 'none',
        }}>{labels ? labels[i] : o}</button>
      ))}
    </div>
  );
}

function Stepper({ value, onChange, min = 1, max = 120, suffix = 'm' }) {
  const btn = (label, fn, disabled) => (
    <button onClick={fn} disabled={disabled} style={{
      width: 30, height: 30, border: 'none', background: 'transparent', cursor: disabled ? 'default' : 'pointer',
      color: disabled ? 'var(--line-2)' : 'var(--fg-1)', fontSize: 17, fontWeight: 700, display: 'grid', placeItems: 'center',
      fontFamily: 'var(--font-sans)', lineHeight: 1,
    }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = 'var(--bg-sunken)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>{label}</button>
  );
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', overflow: 'hidden', background: 'var(--bg-elev)' }}>
      {btn('−', () => onChange(Math.max(min, value - 1)), value <= min)}
      <span className="mono" style={{ minWidth: 50, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--fg-1)', borderLeft: '1px solid var(--line-1)', borderRight: '1px solid var(--line-1)', padding: '6px 0' }}>{value}{suffix}</span>
      {btn('＋', () => onChange(Math.min(max, value + 1)), value >= max)}
    </div>
  );
}

export function Settings({ t, setTweak, onReplayOnboarding, onAddManual, pomoConfig, setPomoConfig, sync, setSync, events = [], projects = [], username = '', setUsername, syncStatus, onSyncNow, monitorAll, setMonitorAll, closeBehavior = 'tray', setCloseBehavior, blocklist = [], setBlocklist }) {
  const [idle, setIdle] = useState(true);
  const [titles, setTitles] = useState(true);
  const [reminders, setReminders] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [blockInput, setBlockInput] = useState('');
  const blockInputRef = useRef(null);
  const setPomo = (k, v) => setPomoConfig(c => ({ ...c, [k]: v }));
  const setSyncK = (k, v) => setSync(s => ({ ...s, [k]: v }));

  const addToBlocklist = () => {
    const val = blockInput.trim();
    if (!val || blocklist.includes(val)) return;
    setBlocklist(b => [...b, val]);
    setBlockInput('');
    blockInputRef.current?.focus();
  };
  const urlValid = /^https?:\/\/.+/.test(sync.url.trim());

  const testConnection = async () => {
    if (!urlValid) return;
    setTestStatus('testing');
    try {
      const base = sync.url.replace(/\/(sessions|sync)\/?$/, '');
      const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        setTestStatus(data.ok ? 'ok' : 'fail');
      } else { setTestStatus('fail'); }
    } catch { setTestStatus('fail'); }
    setTimeout(() => setTestStatus(null), 3000);
  };

  const syncLabel = syncStatus === 'syncing' ? '↻ Sincronizando…'
    : syncStatus === 'ok'    ? '✓ Sincronizado'
    : syncStatus === 'error' ? '✗ Erro'
    : 'Sincronizar agora';

  return (
    <div className="scroll" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="screen-inner" style={{ maxWidth: 720, margin: '0 auto', padding: '24px 26px 56px' }}>
        <div className="eyebrow">Preferências</div>
        <h1 className="disp" style={{ fontSize: 40, margin: '4px 0 24px' }}>Configurações</h1>

        <Section label="Monitoramento">
          <Row title="Monitorar todos os programas" desc="Rastreia automaticamente cada aplicativo em primeiro plano e gera uma sessão para revisão ao trocar de janela.">
            <Switch on={monitorAll ?? false} onClick={() => setMonitorAll && setMonitorAll(v => !v)} />
          </Row>
          <Row title="Detectar tempo ocioso" desc="Pausa o rastreamento e pergunta o que fazer após 5 minutos sem interação.">
            <Switch on={idle} onClick={() => setIdle(v => !v)} />
          </Row>
          <Row title="Ler títulos de janelas" desc="Necessário para categorização automática por nome de arquivo. Os títulos nunca saem do computador." last>
            <Switch on={titles} onClick={() => setTitles(v => !v)} />
          </Row>
        </Section>

        <Section label="Blocklist">
          <div style={{ padding: '14px 0', borderBottom: '1px solid var(--line-1)' }}>
            <div style={{ fontSize: 12.5, color: 'var(--fg-3)', marginBottom: 10, lineHeight: 1.5 }}>
              Apps e sites ignorados pelo rastreamento automático. Use o nome do processo ou parte do título da janela.
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                ref={blockInputRef}
                value={blockInput}
                onChange={(e) => setBlockInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addToBlocklist()}
                placeholder="ex: Teams, Slack, youtube.com"
                spellCheck={false}
                style={{
                  flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-1)',
                  background: 'var(--bg)', border: '1px solid var(--line-2)',
                  borderRadius: 'var(--r-sm)', padding: '7px 11px', outline: 'none',
                }}
              />
              <button className="btn btn-ghost btn-sm" onClick={addToBlocklist} disabled={!blockInput.trim()}>
                + Adicionar
              </button>
            </div>
            {blocklist.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--fg-3)', fontStyle: 'italic' }}>Nenhum app bloqueado</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {blocklist.map((item) => (
                  <span key={item} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 8px', borderRadius: 'var(--r-sm)',
                    background: 'var(--bg-sunken)', border: '1px solid var(--line-1)',
                    fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-2)',
                  }}>
                    {item}
                    <button
                      onClick={() => setBlocklist(b => b.filter(x => x !== item))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', padding: 0, lineHeight: 1, fontSize: 14 }}
                    >×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Section>

        <Section label="Janela">
          <Row title="Ao fechar a janela" desc="Minimizar para a bandeja mantém o rastreamento rodando em segundo plano. Encerrar fecha o aplicativo por completo." last>
            <Seg value={closeBehavior} options={['tray', 'quit']} labels={['Bandeja', 'Encerrar']} onChange={(v) => setCloseBehavior && setCloseBehavior(v)} />
          </Row>
        </Section>

        <Section label="Aparência">
          <Row title="Visual" desc="Troca o sistema visual completo. OBJ_TO, Cursor (editorial) ou Nike (campanha).">
            <Seg value={t.brand} options={['objto', 'cursor', 'nike']} onChange={(v) => setTweak('brand', v)} />
          </Row>
          <Row title="Tema">
            <Seg value={t.dark ? 'dark' : 'light'} options={['light', 'dark']} labels={['Claro', 'Escuro']} onChange={(v) => setTweak('dark', v === 'dark')} />
          </Row>
          <Row title="Destaque" desc="Apenas no visual OBJ_TO — Cursor e Nike definem seu próprio destaque." last>
            <Seg value={t.accent} options={['navy', 'clay', 'charcoal']} onChange={(v) => setTweak('accent', v)} />
          </Row>
        </Section>

        <Section label="Timer Pomodoro">
          <Row title="Intervalo de foco" desc="Duração de uma sessão de trabalho profundo antes do intervalo.">
            <Stepper value={pomoConfig.focus} onChange={(v) => setPomo('focus', v)} min={5} max={90} />
          </Row>
          <Row title="Pausa curta" desc="Descanso entre as sessões de foco.">
            <Stepper value={pomoConfig.shortBreak} onChange={(v) => setPomo('shortBreak', v)} min={1} max={30} />
          </Row>
          <Row title="Pausa longa" desc="Descanso maior após um ciclo completo de sessões.">
            <Stepper value={pomoConfig.longBreak} onChange={(v) => setPomo('longBreak', v)} min={5} max={60} />
          </Row>
          <Row title="Sessões antes da pausa longa" desc="Quantos intervalos de foco completam um ciclo." last>
            <Stepper value={pomoConfig.cycles} onChange={(v) => setPomo('cycles', v)} min={2} max={8} suffix="" />
          </Row>
        </Section>

        <Section label="Servidor de sincronização">
          <Row title="Usuário" desc="Identifica suas sessões no servidor. Usado para sincronizar entre computadores.">
            <input
              value={username} onChange={(e) => setUsername && setUsername(e.target.value)}
              placeholder="Ex: marco" spellCheck={false}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--fg-1)',
                background: 'var(--bg)', border: '1px solid var(--line-2)',
                borderRadius: 'var(--r-sm)', padding: '7px 11px', outline: 'none', width: 160, textAlign: 'center',
              }} />
          </Row>
          <Row title="Sincronização ativa" desc="Envia sessões confirmadas e recebe do servidor para manter todos os computadores atualizados.">
            <Switch on={sync.enabled} onClick={() => setSyncK('enabled', !sync.enabled)} />
          </Row>
          <div style={{ padding: '15px 0', borderBottom: '1px solid var(--line-1)', opacity: sync.enabled ? 1 : 0.5, pointerEvents: sync.enabled ? 'auto' : 'none', transition: 'opacity 140ms' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-2)', marginBottom: 8 }}>Endereço do servidor</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="url" value={sync.url} onChange={(e) => setSyncK('url', e.target.value)}
                placeholder="http://servidor-vpn:3001" spellCheck={false}
                style={{
                  flex: 1, minWidth: 0, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-1)',
                  background: 'var(--bg)', border: '1px solid ' + (sync.url && !urlValid ? 'var(--obj-danger)' : 'var(--line-2)'),
                  borderRadius: 'var(--r-sm)', padding: '9px 11px', outline: 'none',
                }} />
              <button className="btn btn-ghost btn-sm" onClick={testConnection}
                disabled={!urlValid || testStatus === 'testing'}
                style={{ flex: 'none', opacity: urlValid ? 1 : 0.4, color: testStatus === 'ok' ? 'var(--obj-success)' : testStatus === 'fail' ? 'var(--obj-danger)' : undefined }}>
                {testStatus === 'testing' ? '…' : testStatus === 'ok' ? '✓ OK' : testStatus === 'fail' ? '✗ Falhou' : 'Testar'}
              </button>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 7 }}>
              Sem autenticação — acesso via VPN. Docker: <span className="mono" style={{ fontSize: 10.5 }}>docker compose up -d</span>
            </div>
          </div>
          <Row title="Sincronizar" desc="Automática ao confirmar sessões, ou force agora para buscar atualizações de outros computadores." last>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Seg value={sync.interval} options={['realtime', 'hourly', 'daily']} labels={['Tempo real', 'Por hora', 'Diário']} onChange={(v) => setSyncK('interval', v)} />
              <button className="btn btn-ghost btn-sm" onClick={onSyncNow}
                disabled={!sync.enabled || !urlValid || syncStatus === 'syncing'}
                style={{ flex: 'none', color: syncStatus === 'ok' ? 'var(--obj-success)' : syncStatus === 'error' ? 'var(--obj-danger)' : undefined, opacity: sync.enabled && urlValid ? 1 : 0.4 }}>
                {syncLabel}
              </button>
            </div>
          </Row>
        </Section>

        <Section label="Dados e onboarding">
          <Row title="Lembrete semanal" desc="Uma notificação na sexta-feira para revisar sessões não classificadas antes de faturar.">
            <Switch on={reminders} onClick={() => setReminders(v => !v)} />
          </Row>
          <Row title="Repetir onboarding" desc="Exibir novamente o assistente de configuração inicial.">
            <button className="btn btn-ghost btn-sm" onClick={onReplayOnboarding}>Abrir</button>
          </Row>
          <Row title="Exportar dados de tempo" desc="Baixar todas as sessões rastreadas em CSV ou PDF com valores em R$.">
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => import('../utils/exportPdf.js').then(m => m.exportCSV(projects, events))}>CSV</button>
              <button className="btn btn-ghost btn-sm" onClick={() => import('../utils/exportPdf.js').then(m => m.exportPDF(projects, events))}>PDF</button>
            </div>
          </Row>
          <Row title="Adicionar registro manual" desc="Registrar tempo que não foi capturado automaticamente." last>
            <button className="btn btn-ghost btn-sm" onClick={onAddManual}>Adicionar</button>
          </Row>
        </Section>
      </div>
    </div>
  );
}
