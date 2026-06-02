import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { fmt } from './data.js';
import { detectActivity, isTauri, uid } from './utils/tracking.js';
import { storage } from './utils/storage.js';
import { isWebMode, loadData, pushData } from './utils/api.js';
import { PomodoroBar } from './components/PomodoroTimer.jsx';
import { useTweaks, TweaksPanel, TweakSection, TweakToggle, TweakRadio } from './components/TweaksPanel.jsx';
import { MainView } from './views/MainView.jsx';

const Dashboard        = lazy(() => import('./views/Dashboard.jsx').then(m => ({ default: m.Dashboard })));
const Projects         = lazy(() => import('./views/Projects.jsx').then(m => ({ default: m.Projects })));
const Review           = lazy(() => import('./views/Review.jsx').then(m => ({ default: m.Review })));
const Settings         = lazy(() => import('./views/Settings.jsx').then(m => ({ default: m.Settings })));
const Goals            = lazy(() => import('./views/Goals.jsx').then(m => ({ default: m.Goals })));
const Clients          = lazy(() => import('./views/Clients.jsx').then(m => ({ default: m.Clients })));
const Reports          = lazy(() => import('./views/Reports.jsx').then(m => ({ default: m.Reports })));
const Widget           = lazy(() => import('./views/Widget.jsx').then(m => ({ default: m.Widget })));
const Onboarding       = lazy(() => import('./views/Onboarding.jsx').then(m => ({ default: m.Onboarding })));
const ManualEntryModal = lazy(() => import('./components/ManualEntryModal.jsx').then(m => ({ default: m.ManualEntryModal })));

// ---- icons ----
const Ico = ({ d, size = 19 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const icons = {
  today:     <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /><circle cx="12" cy="15" r="2.5" /></>,
  review:    <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>,
  dashboard: <><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" /><rect x="13" y="7" width="3" height="10" /></>,
  projects:  <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" /></>,
  goals:     <><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></>,
  clients:   <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  reports:   <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>,
  settings:<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
};

function Wordmark({ tone = 'ink' }) {
  const fg = tone === 'bone' ? 'var(--fg-on-accent, #f0efec)' : 'var(--fg-1)';
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, letterSpacing: '0.02em', color: fg, display: 'inline-flex', alignItems: 'baseline' }}>
      OBJ<span style={{ color: 'var(--accent)', margin: '0 1px' }}>_</span>TO
    </span>
  );
}


// ---- Live tracking sidebar card ----
const LIVE_INIT = { running: false, startedAt: null, elapsed: 0, app: '', title: '', project: null };

function ActivityBody({ liveTracking, projects, onToggle, onDiscard }) {
  const { running, elapsed, app, title, doc, project: projectId } = liveTracking;
  const p = projects.find(pr => pr.id === projectId);
  const docLabel = doc || title;

  if (!running && elapsed === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4px 0' }}>
        <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 10 }}>Nenhum rastreamento ativo</div>
        <button onClick={onToggle} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
          ▶ Iniciar
        </button>
      </div>
    );
  }

  return (
    <>
      {p ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flex: 'none' }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--obj-amber)', flex: 'none' }} />
          <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>Não classificado</span>
        </div>
      )}

      {docLabel && (
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-1)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {docLabel}
        </div>
      )}
      {app && (
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginBottom: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {app}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onToggle} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
          {running ? '❚❚ Pausar' : '▶ Retomar'}
        </button>
        <button onClick={onDiscard} className="btn btn-ghost btn-sm" title="Parar e descartar"
          style={{ flex: 'none', color: 'var(--obj-danger)', borderColor: 'var(--obj-danger)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
          </svg>
        </button>
      </div>
    </>
  );
}

function NowTracking({ onPopOut, pomo, onPomoToggle, onPomoStartStop, onPomoSkip, onPomoReset, pomoConfig, liveTracking, projects, onToggleTracking, onDiscardTracking, collapsed, onExpand }) {
  const { running, elapsed } = liveTracking;
  const hh = Math.floor(elapsed / 3600), mm = Math.floor((elapsed % 3600) / 60), ss = elapsed % 60;
  const isIdle = !running && elapsed === 0;

  const timerColor = !running
    ? 'var(--fg-3)'
    : pomo.active
      ? (pomo.phase === 'focus' ? 'var(--obj-clay)' : 'var(--accent)')
      : 'var(--obj-success)';

  const statusLabel = pomo.active && running
    ? (pomo.phase === 'focus' ? 'Foco' : pomo.phase === 'short' ? 'Pausa curta' : 'Pausa longa')
    : running ? 'Rastreando' : 'Pausado';

  if (collapsed) {
    return (
      <div style={{ margin: '10px 0 12px', display: 'flex', justifyContent: 'center' }}>
        <button onClick={onExpand} title="Rastreamento — expandir barra lateral" style={{
          position: 'relative', width: 44, height: 44, display: 'grid', placeItems: 'center', cursor: 'pointer',
          background: 'var(--bg-sunken)', border: '1px solid var(--line-1)', borderRadius: 'var(--r-md)', color: 'var(--fg-2)',
        }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          {running && (
            <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: timerColor }} />
              <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: `1px solid ${timerColor}`, animation: 'ping 1.6s ease-out infinite' }} />
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div style={{ margin: 12, borderRadius: 'var(--r-md)', background: 'var(--bg-sunken)', border: '1px solid var(--line-1)', overflow: 'hidden' }}>

      {/* ── Timer principal ── */}
      {!isIdle && (
        <div style={{ padding: '14px 12px 13px', borderBottom: '1px solid var(--line-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ position: 'relative', width: 8, height: 8, flex: 'none' }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: timerColor }} />
                {running && <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: `1px solid ${timerColor}`, animation: 'ping 1.6s ease-out infinite' }} />}
              </span>
              <span className="eyebrow" style={{ fontSize: 9.5, color: timerColor }}>{statusLabel}</span>
            </div>
            <button className="btn-icon" onClick={onPopOut} title="Abrir mini widget" style={{ padding: 4 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
            </button>
          </div>
          <span className="mono" style={{
            display: 'block', textAlign: 'center',
            fontSize: 38, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em',
            color: timerColor, transition: 'color 350ms ease-out',
          }}>
            {fmt.pad(hh)}:{fmt.pad(mm)}:{fmt.pad(ss)}
          </span>
        </div>
      )}

      {/* ── Pomodoro ── */}
      <PomodoroBar
        config={pomoConfig}
        active={pomo.active} phase={pomo.phase} secondsLeft={pomo.secondsLeft}
        done={pomo.done} running={pomo.running}
        onToggle={onPomoToggle} onStartStop={onPomoStartStop} onSkip={onPomoSkip} onReset={onPomoReset}
      />

      {/* ── Informações de atividade ── */}
      <div style={{ padding: 12 }}>
        <ActivityBody
          liveTracking={liveTracking}
          projects={projects}
          onToggle={onToggleTracking}
          onDiscard={onDiscardTracking}
        />
      </div>
    </div>
  );
}

function Sidebar({ nav, view, onNavigate, collapsed, onToggleCollapse, pomoConfig, pomo, onPomoToggle, onPomoStartStop, onPomoSkip, onPomoReset, liveTracking, projects, onToggleTracking, onDiscardTracking, onPopOut, isMobile, onCloseDrawer }) {
  return (
    <>
      <div style={{
        flex: 'none', display: 'flex', alignItems: 'center', gap: 8,
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '14px 0 4px' : '14px 14px 4px',
      }}>
        {!collapsed && <Wordmark />}
        {isMobile ? (
          <button className="btn-icon" title="Fechar menu" onClick={onCloseDrawer}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        ) : (
          <button className="btn-icon" title={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'} onClick={onToggleCollapse} style={{ border: '1px solid var(--line-1)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? 'scaleX(-1)' : 'none', transition: 'transform 180ms ease-out' }}>
              <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /><path d="M15.5 9.5 13 12l2.5 2.5" />
            </svg>
          </button>
        )}
      </div>

      <div style={{ padding: collapsed ? '8px 10px' : '8px 12px 14px', display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {nav.map((n) => {
          const active = view === n.id;
          return (
            <button key={n.id} onClick={() => onNavigate(n.id)} title={collapsed ? n.label : undefined} style={{
              display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 11, justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '11px 0' : '10px 12px', borderRadius: 'var(--r-sm)',
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: active ? 700 : 400,
              color: active ? 'var(--accent)' : 'var(--fg-2)', background: active ? 'var(--bg-sunken)' : 'transparent',
              textAlign: 'left', transition: '120ms ease-out', position: 'relative',
            }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-sunken)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
              {active && <span style={{ position: 'absolute', left: 0, top: 9, bottom: 9, width: 3, borderRadius: 2, background: 'var(--accent)' }} />}
              <span style={{ position: 'relative', display: 'inline-flex', flex: 'none' }}>
                <Ico d={icons[n.icon]} />
                {collapsed && n.badge > 0 && <span style={{ position: 'absolute', top: -4, right: -5, minWidth: 9, height: 9, borderRadius: 9, background: 'var(--obj-amber)', border: '1.5px solid var(--bg-elev)' }} />}
              </span>
              {!collapsed && n.label}
              {!collapsed && n.badge > 0 && <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 700, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: 'var(--obj-amber)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{n.badge}</span>}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 'none' }}>
        <NowTracking
          onPopOut={onPopOut}
          pomo={pomo} onPomoToggle={onPomoToggle} onPomoStartStop={onPomoStartStop}
          onPomoSkip={onPomoSkip} onPomoReset={onPomoReset} pomoConfig={pomoConfig}
          liveTracking={liveTracking} projects={projects}
          onToggleTracking={onToggleTracking} onDiscardTracking={onDiscardTracking}
          collapsed={collapsed} onExpand={onToggleCollapse}
        />
      </div>
    </>
  );
}

function MobileBar({ onMenu, title }) {
  return (
    <div style={{ height: 50, flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', background: 'var(--bg-elev)', borderBottom: '1px solid var(--line-1)' }}>
      <button className="btn-icon" title="Menu" onClick={onMenu} style={{ padding: 6 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
      </button>
      <Wordmark />
      <span style={{ width: 1, height: 14, background: 'var(--line-2)' }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-2)', textTransform: 'capitalize' }}>{title}</span>
    </div>
  );
}

function PomoPrompt({ onStart, onDismiss }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,20,19,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, animation: 'fadeIn 200ms ease-out' }}>
      <div className="card" style={{ padding: '28px 32px', maxWidth: 320, width: '90%', textAlign: 'center', animation: 'popIn 180ms ease-out', background: 'var(--bg-elev)' }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Pomodoro</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-1)', marginBottom: 8 }}>Intervalo concluído</div>
        <div style={{ fontSize: 13, color: 'var(--fg-2)', marginBottom: 24, lineHeight: 1.5 }}>
          Deseja iniciar uma nova sessão de foco?
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={onDismiss}>Encerrar</button>
          <button className="btn btn-primary btn-sm" onClick={onStart}>Iniciar sessão</button>
        </div>
      </div>
    </div>
  );
}


// First run: show onboarding if setup hasn't been completed
const isFirstRun = !localStorage.getItem('objto_setup_done');

const TWEAK_DEFAULTS = {
  brand: 'objto',
  dark: false,
  accent: 'navy',
  mode: 'timeline',
  onboarding: isFirstRun,
};

const POMO_INIT = { active: false, running: false, phase: 'focus', secondsLeft: 25 * 60, done: 0, bgFlash: false, showPrompt: false };

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useState('today');
  const setMode = (m) => setTweak('mode', m);

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    const mqMobile = window.matchMedia('(max-width: 760px)');
    const mqNarrow = window.matchMedia('(max-width: 1024px)');
    const onMobile = () => setIsMobile(mqMobile.matches);
    const onNarrow = () => setIsNarrow(mqNarrow.matches);
    onMobile(); onNarrow();
    mqMobile.addEventListener('change', onMobile);
    mqNarrow.addEventListener('change', onNarrow);
    return () => {
      mqMobile.removeEventListener('change', onMobile);
      mqNarrow.removeEventListener('change', onNarrow);
    };
  }, []);

  const [username, setUsername] = useState(() => localStorage.getItem('objto_username') || '');
  const saveUsername = (u) => { setUsername(u); localStorage.setItem('objto_username', u); };

  const [projects, setProjects] = useState(() => storage.loadProjects());
  const [events, setEvents] = useState(() => storage.loadEvents());
  const [pomoConfig, setPomoConfig] = useState(() => storage.loadPomoConfig());
  const [pomo, setPomo] = useState(POMO_INIT);
  const [sync, setSync] = useState(() => storage.loadSync());
  const [syncStatus, setSyncStatus] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [monitorAll, setMonitorAll] = useState(() => storage.loadMonitorAll());
  const [goals, setGoals] = useState(() => storage.loadGoals());
  const [clients, setClients] = useState(() => storage.loadClients());
  const [tags, setTags] = useState(() => storage.loadTags());
  // Comportamento ao fechar a janela: 'tray' (minimizar para bandeja) ou 'quit'
  const [closeBehavior, setCloseBehavior] = useState(() => localStorage.getItem('objto_close_behavior') || 'tray');

  // Persistência local
  useEffect(() => { storage.saveProjects(projects); }, [projects]);
  useEffect(() => { storage.saveEvents(events); }, [events]);
  useEffect(() => { storage.savePomoConfig(pomoConfig); }, [pomoConfig]);
  useEffect(() => { storage.saveSync(sync); }, [sync]);
  useEffect(() => { storage.saveMonitorAll(monitorAll); }, [monitorAll]);
  useEffect(() => { storage.saveGoals(goals); }, [goals]);
  useEffect(() => { storage.saveClients(clients); }, [clients]);
  useEffect(() => { storage.saveTags(tags); }, [tags]);

  // Live tracking state — paused by default (item 5)
  const [liveTracking, setLiveTracking] = useState(LIVE_INIT);
  const liveTrackingRef = useRef(liveTracking);
  liveTrackingRef.current = liveTracking;

  // Tracking tick
  useEffect(() => {
    if (!liveTracking.running) return;
    const id = setInterval(() => setLiveTracking(lt => ({ ...lt, elapsed: lt.elapsed + 1 })), 1000);
    return () => clearInterval(id);
  }, [liveTracking.running]);

  // Persiste e informa o Rust sobre o comportamento ao fechar
  const saveCloseBehavior = (mode) => {
    setCloseBehavior(mode);
    localStorage.setItem('objto_close_behavior', mode);
  };
  useEffect(() => {
    if (!isTauri()) return;
    import('@tauri-apps/api/core').then(({ invoke }) => invoke('set_close_behavior', { mode: closeBehavior })).catch(() => {});
  }, [closeBehavior]);

  // Web mode: load full state from server on mount
  useEffect(() => {
    if (!isWebMode || !username) return;
    loadData(username).then(data => {
      if (data.sessions?.length)  setEvents(data.sessions);
      if (data.projects?.length)  setProjects(data.projects);
      if (data.clients?.length)   setClients(data.clients);
      if (data.tags?.length)      setTags(data.tags);
      if (data.goals?.length)     setGoals(data.goals);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once on mount

  // Web mode: debounced push to server after any state change
  const pushTimerRef = useRef(null);
  useEffect(() => {
    if (!isWebMode || !username) return;
    clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      pushData(username, { sessions: events, projects, clients, tags, goals }).catch(() => {});
    }, 3000);
    return () => clearTimeout(pushTimerRef.current);
  }, [events, projects, clients, tags, goals, username]);

  // Abre a janela flutuante real (Tauri); fora do Tauri, mostra a pré-visualização interna
  const openMiniWindow = useCallback(async () => {
    if (!isTauri()) { setView('widget'); return; }
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_mini_widget');
    } catch {
      setView('widget'); // fallback: nunca deixa o botão sem efeito
    }
  }, []);

  const toggleTracking = () => setLiveTracking(lt => ({
    ...lt, running: !lt.running, startedAt: lt.startedAt ?? Date.now(),
  }));

  const discardTracking = () => setLiveTracking(LIVE_INIT);

  // Pomodoro config sync
  useEffect(() => {
    setPomo(p => (!p.active && !p.running) ? { ...p, secondsLeft: pomoConfig.focus * 60 } : p);
  }, [pomoConfig.focus]);

  // Pomodoro countdown
  useEffect(() => {
    if (!pomo.active || !pomo.running) return;
    const id = setInterval(() => {
      setPomo(p => {
        if (p.secondsLeft > 1) return { ...p, secondsLeft: p.secondsLeft - 1 };
        if (p.phase === 'focus') {
          const nextDone = p.done + 1;
          const nextPhase = nextDone % pomoConfig.cycles === 0 ? 'long' : 'short';
          const nextSec = (nextPhase === 'long' ? pomoConfig.longBreak : pomoConfig.shortBreak) * 60;
          return { ...p, running: false, bgFlash: true, phase: nextPhase, secondsLeft: nextSec, done: nextDone };
        }
        return { ...p, running: false, secondsLeft: 0, showPrompt: true };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [pomo.active, pomo.running, pomoConfig]);

  useEffect(() => {
    if (!pomo.bgFlash) return;
    const tid = setTimeout(() => setPomo(p => ({ ...p, bgFlash: false, running: true })), 1500);
    return () => clearTimeout(tid);
  }, [pomo.bgFlash]);

  const pomoToggle    = () => setPomo(p => p.active ? { ...POMO_INIT, secondsLeft: pomoConfig.focus * 60 } : { ...p, active: true });
  const pomoStartStop = () => setPomo(p => ({ ...p, running: !p.running }));
  const pomoSkip      = () => setPomo(p => {
    let nextDone = p.done, nextPhase;
    if (p.phase === 'focus') { nextDone = p.done + 1; nextPhase = nextDone % pomoConfig.cycles === 0 ? 'long' : 'short'; }
    else { nextPhase = 'focus'; }
    const nextSec = (nextPhase === 'focus' ? pomoConfig.focus : nextPhase === 'long' ? pomoConfig.longBreak : pomoConfig.shortBreak) * 60;
    return { ...p, phase: nextPhase, secondsLeft: nextSec, done: nextDone, running: false, bgFlash: false, showPrompt: false };
  });
  const pomoReset      = () => setPomo({ active: true, running: false, phase: 'focus', secondsLeft: pomoConfig.focus * 60, done: 0, bgFlash: false, showPrompt: false });
  const pomoNewSession = () => setPomo({ active: true, running: true, phase: 'focus', secondsLeft: pomoConfig.focus * 60, done: 0, bgFlash: false, showPrompt: false });
  const pomoEndSession = () => setPomo({ ...POMO_INIT, secondsLeft: pomoConfig.focus * 60 });

  // Refs for polling closures
  const projectsRef   = useRef(projects);
  projectsRef.current = projects;
  // Segmento de atividade em andamento: { project, app, title, doc, startMs }
  const segmentRef    = useRef(null);

  // Estado de rastreamento pronto para exibição na janela flutuante
  const trackingPayload = useCallback(() => {
    const lt = liveTrackingRef.current;
    const p = projectsRef.current.find(pr => pr.id === lt.project);
    return {
      running: lt.running, elapsed: lt.elapsed,
      doc: lt.doc || lt.title || '', app: lt.app || '',
      projectName: p?.name || '', projectColor: p?.color || '',
    };
  }, []);

  // Emite o estado para a janela flutuante sempre que muda + responde ao pedido inicial dela
  useEffect(() => {
    if (!isTauri()) return;
    import('@tauri-apps/api/event').then(({ emit }) => emit('tracking', trackingPayload())).catch(() => {});
  }, [liveTracking, projects, trackingPayload]);

  useEffect(() => {
    if (!isTauri()) return;
    let unlisten = null, alive = true;
    import('@tauri-apps/api/event').then(async ({ listen, emit }) => {
      unlisten = await listen('widget-ready', () => emit('tracking', trackingPayload()));
      if (!alive && unlisten) unlisten();
    }).catch(() => {});
    return () => { alive = false; if (unlisten) unlisten(); };
  }, [trackingPayload]);

  // Mantém o Rust sincronizado com o estado do timer (necessário para auto-abrir widget)
  useEffect(() => {
    if (!isTauri()) return;
    import('@tauri-apps/api/core')
      .then(({ invoke }) => invoke('set_tracking_active', { active: liveTracking.running }))
      .catch(() => {});
  }, [liveTracking.running]);

  // Auto-abre o mini widget ao minimizar a janela principal com timer ativo
  useEffect(() => {
    if (!isTauri()) return;
    let unlisten = null, alive = true;
    (async () => {
      try {
        const [{ getCurrentWindow }, { invoke }] = await Promise.all([
          import('@tauri-apps/api/window'),
          import('@tauri-apps/api/core'),
        ]);
        const win = getCurrentWindow();
        unlisten = await win.listen('tauri://resize', async () => {
          if (!alive) return;
          const minimized = await invoke('is_main_minimized').catch(() => false);
          if (minimized && liveTrackingRef.current.running) {
            invoke('open_mini_widget').catch(() => {});
          }
        });
      } catch { /* fora do Tauri */ }
    })();
    return () => { alive = false; if (unlisten) unlisten(); };
  }, []); // usa liveTrackingRef para evitar re-registro

  const POLL_MS = 4000;     // intervalo de verificação (igual ao Python: 4s)
  const IDLE_LIMIT = 120;   // segundos ociosos antes de pausar (igual ao Python)
  const MIN_COMMIT_SEC = 30; // descarta janelas com menos de 30s de uso

  // Lê janela ativa + processo. Tenta o comando novo (get_window_info) e cai
  // para o antigo (get_active_window) caso o binário ainda não tenha sido recompilado.
  const readWindow = async (invoke) => {
    try {
      const info = await invoke('get_window_info');
      if (info && typeof info === 'object') return { title: info.title || '', process: info.process || '' };
    } catch { /* comando ausente — usa fallback */ }
    const title = await invoke('get_active_window');
    return { title: title || '', process: '' };
  };

  // Native window tracking via Tauri (motor portado da versão Python v4).
  // Ativo quando "Monitorar todos os programas" está ligado: detecta a janela
  // em primeiro plano, acumula tempo e grava uma sessão a cada troca de janela.
  useEffect(() => {
    if (!isTauri() || !monitorAll) return;
    let cancelled = false;
    let invoke = null;

    // minutos desde a meia-noite (mesma unidade dos eventos das views)
    const minOfDay = (ms) => { const d = new Date(ms); return d.getHours() * 60 + d.getMinutes(); };

    const commitSegment = (endMs) => {
      const seg = segmentRef.current;
      segmentRef.current = null;
      if (!seg) return;
      const sec = Math.round((endMs - seg.startMs) / 1000);
      if (sec < MIN_COMMIT_SEC) return;
      setEvents(es => [...es, {
        id: uid(),
        start: minOfDay(seg.startMs),
        end: minOfDay(endMs),
        dur: Math.max(1, Math.round(sec / 60)),
        app: seg.app,
        title: seg.doc || seg.title,   // nome do documento (legível na Revisão)
        windowTitle: seg.title,        // título bruto da janela, para referência
        project: seg.project,
        confidence: seg.project ? 'high' : 'low',
        status: seg.project ? 'suggested' : 'unsorted',
        auto: true,
      }]);
    };

    const poll = async () => {
      try {
        if (!invoke) ({ invoke } = await import('@tauri-apps/api/core'));
        const [{ title, process }, idle] = await Promise.all([readWindow(invoke), invoke('get_idle_seconds')]);
        if (cancelled) return;
        const now = Date.now();

        // Ocioso ou sem janela → fecha o segmento atual e pausa o contador
        if (!title || idle >= IDLE_LIMIT) {
          commitSegment(now);
          setLiveTracking(lt => (lt.running ? { ...lt, running: false } : lt));
          return;
        }

        const det = detectActivity(title, projectsRef.current, process);
        const seg = segmentRef.current;
        const changed = !seg || seg.title !== det.title || seg.project !== det.project;
        if (changed) {
          commitSegment(now);              // grava a janela anterior como sessão
          segmentRef.current = { project: det.project, app: det.app, title: det.title, doc: det.doc, startMs: now };
        }
        const elapsed = Math.round((now - segmentRef.current.startMs) / 1000);
        setLiveTracking({ running: true, startedAt: segmentRef.current.startMs, elapsed, app: det.app, title: det.title, doc: det.doc, project: det.project });
      } catch { /* não está no Tauri */ }
    };

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
      commitSegment(Date.now());           // grava o último segmento ao desligar
    };
  }, [monitorAll]);

  // Server sync
  const syncRef      = useRef(sync);
  syncRef.current    = sync;
  const usernameRef  = useRef(username);
  usernameRef.current = username;
  const eventsRef    = useRef(events);
  eventsRef.current  = events;

  const normalizeServerSession = (row) => ({
    id: row.id, start: row.start, end: row.end, dur: row.dur,
    app: row.app || 'chrome', title: row.title || '',
    project: row.project_id || null, confidence: 'high',
    status: row.status || 'confirmed', manual: !!row.manual, fromServer: true,
  });

  const syncWithServer = useCallback(async (localSessions) => {
    const s = syncRef.current;
    const user = usernameRef.current;
    if (!s.enabled || !s.url || !user) return;
    const base = s.url.replace(/\/(sessions|sync)\/?$/, '');
    const payload = (localSessions || eventsRef.current.filter(e => e.status === 'confirmed'))
      .map(ev => {
        const p = projectsRef.current.find(pr => pr.id === ev.project);
        return { ...ev, projectName: p?.name || '', client: p?.client || '', billable: p?.billable || false, rate: p?.rate || 0 };
      });
    setSyncStatus('syncing');
    try {
      const res = await fetch(`${base}/sync`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, sessions: payload }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.sessions) && data.sessions.length) {
        setEvents(prev => {
          const localIds = new Set(prev.map(e => e.id));
          const incoming = data.sessions.filter(row => !localIds.has(row.id)).map(normalizeServerSession);
          return incoming.length ? [...prev, ...incoming] : prev;
        });
      }
      setSyncStatus('ok');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(null), 4000);
    }
  }, []);

  const maybeSync = (sessions) => {
    if (syncRef.current.interval === 'realtime') syncWithServer(sessions);
  };

  const assign = (id, project) => setEvents(es => {
    const next = es.map(e => e.id === id ? { ...e, project, status: project ? 'confirmed' : 'unsorted', confidence: project ? 'high' : e.confidence } : e);
    const ev = next.find(e => e.id === id);
    if (ev?.status === 'confirmed') maybeSync([ev]);
    return next;
  });
  const confirm    = (id) => setEvents(es => { const next = es.map(e => e.id === id ? { ...e, status: 'confirmed' } : e); const ev = next.find(e => e.id === id); if (ev) maybeSync([ev]); return next; });
  const confirmAll = () => setEvents(es => { const next = es.map(e => e.status === 'suggested' ? { ...e, status: 'confirmed' } : e); maybeSync(next.filter(e => e.status === 'confirmed')); return next; });
  const bulkAssign = (ids, project) => setEvents(es => es.map(e => ids.includes(e.id) ? { ...e, project, status: project ? 'confirmed' : 'unsorted', confidence: project ? 'high' : e.confidence } : e));
  const bulkConfirm = (ids) => setEvents(es => { const next = es.map(e => ids.includes(e.id) ? { ...e, status: 'confirmed' } : e); maybeSync(next.filter(e => ids.includes(e.id))); return next; });
  const addManualEntry = (ev) => { setEvents(es => [...es, ev]); maybeSync([ev]); };
  const deleteEvent    = (id) => setEvents(es => es.filter(e => e.id !== id));
  const editEvent      = (id, patch) => setEvents(es => es.map(e => e.id === id ? { ...e, ...patch } : e));
  const actions = { assign, confirm, confirmAll, bulkAssign, bulkConfirm, addManualEntry, deleteEvent, editEvent, openManualEntry: () => setShowManualEntry(true) };

  const projByIdMap = useMemo(() => Object.fromEntries(projects.map(p => [p.id, p])), [projects]);

  const stats = useMemo(() => {
    let total = 0, billable = 0, review = 0;
    for (const e of events) {
      total += e.dur;
      if (e.project && projByIdMap[e.project]?.billable) billable += e.dur;
      if (e.status !== 'confirmed') review += 1;
    }
    return { total, billable, review };
  }, [events, projByIdMap]);

  const nav = [
    { id: 'today',     label: 'Hoje',          icon: 'today' },
    { id: 'review',    label: 'Revisão',       icon: 'review',    badge: stats.review },
    { id: 'dashboard', label: 'Dashboard',     icon: 'dashboard' },
    { id: 'projects',  label: 'Projetos',      icon: 'projects' },
    { id: 'clients',   label: 'Clientes',      icon: 'clients' },
    { id: 'reports',   label: 'Relatórios',    icon: 'reports' },
    { id: 'goals',     label: 'Metas',         icon: 'goals' },
    { id: 'settings',  label: 'Configurações', icon: 'settings' },
  ];

  // Onboarding: on close, persist username + optional new project + mark setup done
  const handleOnboardingClose = (newUsername, newProject) => {
    if (newUsername) saveUsername(newUsername);
    if (newProject) setProjects(ps => [...ps, newProject]);
    localStorage.setItem('objto_setup_done', '1');
    setTweak('onboarding', false);
  };

  const brandClass = t.brand && t.brand !== 'objto' ? ' brand-' + t.brand : '';
  const sidebarCollapsed = !isMobile && (collapsed || isNarrow);
  const currentLabel = (nav.find(n => n.id === view) || {}).label || '';

  const pomoFocusBg = pomo.active && pomo.phase === 'focus' && !pomo.bgFlash;
  const pomoBreakBg = pomo.active && !pomo.bgFlash && (pomo.phase === 'short' || pomo.phase === 'long');

  return (
    <div className={'app' + (t.dark ? ' dark' : '') + brandClass} data-accent={t.accent} style={{
      width: '100vw', height: '100dvh', margin: 0, borderRadius: 0, border: 'none', boxShadow: 'none',
      overflow: 'hidden', background: 'var(--bg)', color: 'var(--fg-1)',
      display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)', position: 'relative',
    }}>
      {isMobile && <MobileBar onMenu={() => setDrawerOpen(true)} title={currentLabel} />}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', position: 'relative' }}>
        {isMobile && drawerOpen && (
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 55, background: 'rgba(20,20,19,0.42)', animation: 'fadeIn 160ms ease-out' }} />
        )}

        <nav style={{
          ...(isMobile
            ? { position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 60, width: 232, transform: drawerOpen ? 'none' : 'translateX(-100%)', transition: 'transform 220ms ease-out', boxShadow: drawerOpen ? 'var(--shadow-3)' : 'none' }
            : { width: sidebarCollapsed ? 64 : 222, transition: 'width 180ms ease-out' }),
          flex: 'none', borderRight: '1px solid var(--line-1)', background: 'var(--bg-elev)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <Sidebar
            nav={nav} view={view}
            onNavigate={(id) => { setView(id); if (isMobile) setDrawerOpen(false); }}
            collapsed={sidebarCollapsed} onToggleCollapse={() => setCollapsed(c => !c)}
            pomoConfig={pomoConfig} pomo={pomo}
            onPomoToggle={pomoToggle} onPomoStartStop={pomoStartStop} onPomoSkip={pomoSkip} onPomoReset={pomoReset}
            liveTracking={liveTracking} projects={projects}
            onToggleTracking={toggleTracking} onDiscardTracking={discardTracking}
            onPopOut={openMiniWindow}
            isMobile={isMobile} onCloseDrawer={() => setDrawerOpen(false)}
          />
        </nav>

        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
          {pomo.active && (
            <>
              <div className="pomo-bg-overlay" style={{ background: 'rgba(184,106,75,0.07)', opacity: pomoFocusBg ? 1 : 0 }} />
              {pomo.bgFlash && <div className="pomo-bg-overlay" style={{ background: 'rgba(50,71,93,0.09)', opacity: 1 }} />}
              {pomoBreakBg && <div className="pomo-bg-overlay pomo-bg-break" style={{ background: 'rgba(50,71,93,0.09)' }} />}
            </>
          )}

          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
            <Suspense fallback={null}>
              {view === 'today'     && <MainView mode={t.mode} setMode={setMode} events={events} actions={actions} stats={stats} projects={projects} monitorAll={monitorAll} onToggleMonitor={() => setMonitorAll(v => !v)} liveTracking={liveTracking} tags={tags} setTags={setTags} />}
              {view === 'review'    && <Review events={events} actions={actions} projects={projects} tags={tags} setTags={setTags} />}
              {view === 'dashboard' && <Dashboard projects={projects} events={events} />}
              {view === 'projects'  && <Projects projects={projects} setProjects={setProjects} clients={clients} tags={tags} setTags={setTags} events={events} />}
              {view === 'clients'   && <Clients clients={clients} setClients={setClients} projects={projects} />}
              {view === 'reports'   && <Reports events={events} projects={projects} clients={clients} />}
              {view === 'goals'     && <Goals goals={goals} setGoals={setGoals} events={events} projects={projects} />}
              {view === 'settings'  && <Settings t={t} setTweak={setTweak} onReplayOnboarding={() => setTweak('onboarding', true)} onAddManual={() => setShowManualEntry(true)} pomoConfig={pomoConfig} setPomoConfig={setPomoConfig} sync={sync} setSync={setSync} events={events} projects={projects} username={username} setUsername={saveUsername} syncStatus={syncStatus} onSyncNow={() => syncWithServer()} monitorAll={monitorAll} setMonitorAll={setMonitorAll} closeBehavior={closeBehavior} setCloseBehavior={saveCloseBehavior} onOpenMiniWindow={openMiniWindow} />}
              {view === 'widget'    && <Widget liveTracking={liveTracking} projects={projects} onOpenWindow={openMiniWindow} />}
            </Suspense>
          </div>
        </main>
      </div>

      <Suspense fallback={null}>
        {t.onboarding && <Onboarding initialUsername={username} onClose={handleOnboardingClose} />}
        {showManualEntry && <ManualEntryModal projects={projects} onClose={() => setShowManualEntry(false)} onSave={addManualEntry} />}
      </Suspense>
      {pomo.showPrompt && <PomoPrompt onStart={pomoNewSession} onDismiss={pomoEndSession} />}

      <TweaksPanel>
        <TweakSection label="Visual" />
        <TweakRadio label="Design system" value={t.brand} options={['objto', 'cursor', 'nike']} onChange={(v) => setTweak('brand', v)} />
        <TweakSection label="Tema" />
        <TweakToggle label="Modo escuro" value={t.dark} onChange={(v) => setTweak('dark', v)} />
        <TweakRadio label="Destaque (OBJ_TO)" value={t.accent} options={['navy', 'clay', 'charcoal']} onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Hoje" />
        <TweakRadio label="Modo de visualização" value={t.mode} options={['timeline', 'calendar', 'triage']} onChange={(v) => setTweak('mode', v)} />
        <TweakSection label="Telas" />
        <TweakToggle label="Onboarding" value={t.onboarding} onChange={(v) => setTweak('onboarding', v)} />
      </TweaksPanel>
    </div>
  );
}
