import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PROJECTS, EVENTS, projById, RULE_TYPES, fmt } from './data.js';
import { PomodoroTimer } from './components/PomodoroTimer.jsx';
import { ManualEntryModal } from './components/ManualEntryModal.jsx';
import { useTweaks, TweaksPanel, TweakSection, TweakToggle, TweakRadio } from './components/TweaksPanel.jsx';
import { MainView } from './views/MainView.jsx';
import { Dashboard } from './views/Dashboard.jsx';
import { Projects } from './views/Projects.jsx';
import { Review } from './views/Review.jsx';
import { Settings } from './views/Settings.jsx';
import { Onboarding } from './views/Onboarding.jsx';
import { Widget } from './views/Widget.jsx';

// ---- inline icons ----
const Ico = ({ d, size = 19 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const icons = {
  today:     <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /><circle cx="12" cy="15" r="2.5" /></>,
  review:    <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>,
  dashboard: <><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" /><rect x="13" y="7" width="3" height="10" /></>,
  projects:  <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" /></>,
  settings:  <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
};

function Wordmark({ tone = 'ink' }) {
  const fg = tone === 'bone' ? 'var(--fg-on-accent, #f0efec)' : 'var(--fg-1)';
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, letterSpacing: '0.02em', color: fg, display: 'inline-flex', alignItems: 'baseline' }}>
      OBJ<span style={{ color: 'var(--accent)', margin: '0 1px' }}>_</span>TO
    </span>
  );
}

function TitleBar({ chrome }) {
  if (!chrome) return null;
  const ctrl = (label, danger) => (
    <button title={label} style={{
      width: 46, height: 34, border: 'none', background: 'transparent', cursor: 'pointer',
      display: 'grid', placeItems: 'center', color: 'var(--fg-2)', transition: '100ms',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = danger ? '#e54b4b' : 'var(--bg-sunken)'; if (danger) e.currentTarget.style.color = '#fff'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fg-2)'; }}>
      {label === 'min' && <svg width="11" height="11" viewBox="0 0 11 11"><line x1="1" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1" /></svg>}
      {label === 'max' && <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1" /></svg>}
      {label === 'close' && <svg width="11" height="11" viewBox="0 0 11 11"><line x1="1" y1="1" x2="10" y2="10" stroke="currentColor" strokeWidth="1" /><line x1="10" y1="1" x2="1" y2="10" stroke="currentColor" strokeWidth="1" /></svg>}
    </button>
  );
  return (
    <div style={{ height: 34, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elev)', borderBottom: '1px solid var(--line-1)', paddingLeft: 14, userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Wordmark />
        <span style={{ width: 1, height: 14, background: 'var(--line-2)' }} />
        <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Time Tracker</span>
      </div>
      <div style={{ display: 'flex' }}>{ctrl('min')}{ctrl('max')}{ctrl('close', true)}</div>
    </div>
  );
}

function ActivityBody({ onPopOut }) {
  const [sec, setSec] = useState(43 * 60 + 12);
  useEffect(() => { const t = setInterval(() => setSec((s) => s + 1), 1000); return () => clearInterval(t); }, []);
  const [running, setRunning] = useState(true);
  const p = projById['paulista'];
  const hh = Math.floor(sec / 3600), mm = Math.floor((sec % 3600) / 60), ss = sec % 60;
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
        <span style={{ position: 'relative', width: 8, height: 8 }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: running ? 'var(--obj-success)' : 'var(--fg-3)' }} />
          {running && <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1px solid var(--obj-success)', animation: 'ping 1.6s ease-out infinite' }} />}
        </span>
        <span className="eyebrow" style={{ color: running ? 'var(--obj-success)' : 'var(--fg-3)', fontSize: 9.5 }}>{running ? 'Tracking now' : 'Paused'}</span>
        <button className="btn-icon" onClick={onPopOut} title="Pop out mini widget" style={{ marginLeft: 'auto', padding: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
        </button>
        <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>{fmt.pad(hh)}:{fmt.pad(mm)}:{fmt.pad(ss)}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flex: 'none' }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
      </div>
      <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginBottom: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>SketchUp · Paulista1306_facade_v4.skp</div>
      <button onClick={() => setRunning((r) => !r)} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
        {running ? '❚❚ Pause' : '▶ Resume'}
      </button>
    </>
  );
}

function NowTracking({ onPopOut, pomoConfig, collapsed, onExpand }) {
  const [tab, setTab] = useState('activity');
  const tabs = [{ id: 'activity', label: 'Activity' }, { id: 'pomodoro', label: 'Pomodoro' }];

  if (collapsed) {
    return (
      <div style={{ margin: '10px 0 12px', display: 'flex', justifyContent: 'center' }}>
        <button onClick={onExpand} title="Tracking — expand sidebar" style={{
          position: 'relative', width: 44, height: 44, display: 'grid', placeItems: 'center', cursor: 'pointer',
          background: 'var(--bg-sunken)', border: '1px solid var(--line-1)', borderRadius: 'var(--r-md)', color: 'var(--fg-2)',
        }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--obj-success)' }} />
            <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1px solid var(--obj-success)', animation: 'ping 1.6s ease-out infinite' }} />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ margin: 12, padding: 12, borderRadius: 'var(--r-md)', background: 'var(--bg-sunken)', border: '1px solid var(--line-1)' }}>
      <div style={{ display: 'inline-flex', width: '100%', background: 'var(--bg)', borderRadius: 'var(--r-sm)', padding: 3, gap: 2, marginBottom: 11 }}>
        {tabs.map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{
            flex: 1, border: 'none', cursor: 'pointer', padding: '5px 8px', borderRadius: 'var(--r-xs)',
            fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
            background: tab === tb.id ? 'var(--bg-elev)' : 'transparent',
            color: tab === tb.id ? 'var(--fg-1)' : 'var(--fg-3)',
            boxShadow: tab === tb.id ? 'var(--shadow-1)' : 'none', transition: '120ms ease-out',
          }}>{tb.label}</button>
        ))}
      </div>
      {tab === 'activity' ? <ActivityBody onPopOut={onPopOut} /> : <PomodoroTimer config={pomoConfig} />}
    </div>
  );
}

function Sidebar({ nav, view, onNavigate, collapsed, onToggleCollapse, chrome, pomoConfig, onPopOut, isMobile, onCloseDrawer }) {
  return (
    <>
      <div style={{
        flex: 'none', display: 'flex', alignItems: 'center', gap: 8,
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '14px 0 4px' : '14px 14px 4px',
      }}>
        {!collapsed && (!chrome || isMobile) && <Wordmark />}
        {isMobile ? (
          <button className="btn-icon" title="Close menu" onClick={onCloseDrawer}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        ) : (
          <button className="btn-icon" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={onToggleCollapse} style={{ border: '1px solid var(--line-1)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? 'scaleX(-1)' : 'none', transition: 'transform 180ms ease-out' }}>
              <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /><path d="M15.5 9.5 13 12l2.5 2.5" />
            </svg>
          </button>
        )}
      </div>

      <div style={{ padding: collapsed ? '8px 10px' : '8px 12px 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
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

      <div style={{ marginTop: 'auto' }}>
        <NowTracking onPopOut={onPopOut} pomoConfig={pomoConfig} collapsed={collapsed} onExpand={onToggleCollapse} />
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

function matchTitleToProject(title, projects) {
  for (const p of projects) {
    for (const rule of p.rules) {
      let match = false;
      if (rule.type === 'exact') match = title === rule.pattern;
      else if (rule.type === 'contains') match = title.includes(rule.pattern);
      else if (rule.type === 'starts_with') match = title.startsWith(rule.pattern);
      else if (rule.type === 'ends_with') match = title.endsWith(rule.pattern);
      else if (rule.type === 'glob') {
        const re = new RegExp('^' + rule.pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$', 'i');
        match = re.test(title) || title.includes(rule.pattern.replace(/\*/g, ''));
      } else if (rule.type === 'regex') {
        try { match = new RegExp(rule.pattern, 'i').test(title); } catch { /* ignore */ }
      }
      if (match) return p.id;
    }
  }
  return null;
}

const TWEAK_DEFAULTS = {
  brand: 'objto',
  dark: false,
  accent: 'navy',
  mode: 'timeline',
  chrome: true,
  onboarding: false,
};

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useState('today');
  const setMode = (m) => setTweak('mode', m);

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)');
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const [projects, setProjects] = useState(PROJECTS);
  const [events, setEvents] = useState(EVENTS);
  const [pomoConfig, setPomoConfig] = useState({ focus: 25, shortBreak: 5, longBreak: 15, cycles: 4 });
  const [sync, setSync] = useState({ enabled: false, url: '', token: '', interval: 'realtime' });
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Native window tracking (Tauri only — no-op in browser)
  const activeWindowRef = useRef('');
  const idleRef = useRef(0);
  useEffect(() => {
    if (typeof window.__TAURI__ === 'undefined') return;
    const poll = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const [title, idle] = await Promise.all([invoke('get_active_window'), invoke('get_idle_seconds')]);
        activeWindowRef.current = title;
        idleRef.current = idle;
        // Auto-match title against project rules
        if (title && idle < 120) {
          const matched = matchTitleToProject(title, projects);
          if (matched) {
            // Update the live tracking project (used by ActivityBody)
            window.__ACTIVE_PROJECT__ = matched;
          }
        }
      } catch { /* not in Tauri */ }
    };
    poll();
    const t = setInterval(poll, 4000);
    return () => clearInterval(t);
  }, [projects]);

  // Server sync
  const syncRef = useRef(sync);
  syncRef.current = sync;
  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  const pushToServer = useCallback(async (sessions) => {
    const s = syncRef.current;
    if (!s.enabled || !s.url) return;
    const payload = sessions.map((ev) => {
      const p = projectsRef.current.find((pr) => pr.id === ev.project);
      return { ...ev, projectName: p?.name || '', client: p?.client || '', billable: p?.billable || false, rate: p?.rate || 0 };
    });
    try {
      await fetch(s.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(s.token ? { Authorization: `Bearer ${s.token}` } : {}) },
        body: JSON.stringify(payload),
      });
    } catch { /* network error — silently skip, will retry on next confirm */ }
  }, []);

  const assign = (id, project) => setEvents((es) => {
    const next = es.map((e) => e.id === id
      ? { ...e, project, status: project ? 'confirmed' : 'unsorted', confidence: project ? 'high' : e.confidence } : e);
    if (project && syncRef.current.interval === 'realtime') {
      const ev = next.find((e) => e.id === id);
      if (ev?.status === 'confirmed') pushToServer([ev]);
    }
    return next;
  });
  const confirm = (id) => setEvents((es) => {
    const next = es.map((e) => e.id === id ? { ...e, status: 'confirmed' } : e);
    if (syncRef.current.interval === 'realtime') {
      const ev = next.find((e) => e.id === id);
      if (ev) pushToServer([ev]);
    }
    return next;
  });
  const confirmAll = () => setEvents((es) => {
    const next = es.map((e) => e.status === 'suggested' ? { ...e, status: 'confirmed' } : e);
    if (syncRef.current.interval === 'realtime') pushToServer(next.filter((e) => e.status === 'confirmed'));
    return next;
  });
  const bulkAssign = (ids, project) => setEvents((es) => es.map((e) => ids.includes(e.id)
    ? { ...e, project, status: project ? 'confirmed' : 'unsorted', confidence: project ? 'high' : e.confidence } : e));
  const bulkConfirm = (ids) => setEvents((es) => {
    const next = es.map((e) => ids.includes(e.id) ? { ...e, status: 'confirmed' } : e);
    if (syncRef.current.interval === 'realtime') pushToServer(next.filter((e) => ids.includes(e.id)));
    return next;
  });
  const addManualEntry = (ev) => {
    setEvents((es) => [...es, ev]);
    if (syncRef.current.interval === 'realtime') pushToServer([ev]);
  };
  const actions = { assign, confirm, confirmAll, bulkAssign, bulkConfirm, addManualEntry, openManualEntry: () => setShowManualEntry(true) };

  const stats = useMemo(() => {
    let total = 0, billable = 0, review = 0;
    for (const e of events) {
      total += e.dur;
      if (e.project && projById[e.project]?.billable) billable += e.dur;
      if (e.status !== 'confirmed') review += 1;
    }
    return { total, billable, review };
  }, [events]);

  const nav = [
    { id: 'today',     label: 'Today',     icon: 'today' },
    { id: 'review',    label: 'Review',    icon: 'review',    badge: stats.review },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'projects',  label: 'Projects',  icon: 'projects' },
    { id: 'settings',  label: 'Settings',  icon: 'settings' },
  ];

  const brandClass = t.brand && t.brand !== 'objto' ? ' brand-' + t.brand : '';
  const sidebarCollapsed = collapsed && !isMobile;
  const currentLabel = (nav.find((n) => n.id === view) || {}).label || '';

  return (
    <div className={'app' + (t.dark ? ' dark' : '') + brandClass} data-accent={t.accent} style={{
      ...(isMobile
        ? { width: '100vw', height: '100dvh', margin: 0, borderRadius: 0, border: 'none', boxShadow: 'none' }
        : { width: 'min(96vw, 1340px)', height: 'min(94vh, 880px)', margin: '3vh auto', borderRadius: 9, border: '1px solid var(--line-2)', boxShadow: 'var(--shadow-3)' }),
      overflow: 'hidden', background: 'var(--bg)', color: 'var(--fg-1)',
      display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)', position: 'relative',
    }}>
      {isMobile ? <MobileBar onMenu={() => setDrawerOpen(true)} title={currentLabel} /> : <TitleBar chrome={t.chrome} />}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', position: 'relative' }}>
        {isMobile && drawerOpen && (
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 55, background: 'rgba(20,20,19,0.42)', animation: 'fadeIn 160ms ease-out' }} />
        )}

        <nav style={{
          ...(isMobile
            ? { position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 60, width: 232, transform: drawerOpen ? 'none' : 'translateX(-100%)', transition: 'transform 220ms ease-out', boxShadow: drawerOpen ? 'var(--shadow-3)' : 'none' }
            : { width: sidebarCollapsed ? 64 : 222, transition: 'width 180ms ease-out' }),
          flex: 'none', borderRight: '1px solid var(--line-1)', background: 'var(--bg-elev)', display: 'flex', flexDirection: 'column',
        }}>
          <Sidebar
            nav={nav} view={view}
            onNavigate={(id) => { setView(id); if (isMobile) setDrawerOpen(false); }}
            collapsed={sidebarCollapsed} onToggleCollapse={() => setCollapsed((c) => !c)}
            chrome={t.chrome} pomoConfig={pomoConfig} onPopOut={() => setView('widget')}
            isMobile={isMobile} onCloseDrawer={() => setDrawerOpen(false)}
          />
        </nav>

        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
          {view === 'today'     && <MainView mode={t.mode} setMode={setMode} events={events} actions={actions} stats={stats} />}
          {view === 'review'    && <Review events={events} actions={actions} />}
          {view === 'dashboard' && <Dashboard />}
          {view === 'projects'  && <Projects projects={projects} setProjects={setProjects} />}
          {view === 'settings'  && <Settings t={t} setTweak={setTweak} onReplayOnboarding={() => setTweak('onboarding', true)} onAddManual={() => setShowManualEntry(true)} pomoConfig={pomoConfig} setPomoConfig={setPomoConfig} sync={sync} setSync={setSync} events={events} projects={projects} />}
          {view === 'widget'    && <Widget />}
        </main>
      </div>

      {t.onboarding && <Onboarding onClose={() => setTweak('onboarding', false)} />}
      {showManualEntry && <ManualEntryModal projects={projects} onClose={() => setShowManualEntry(false)} onSave={addManualEntry} />}

      <TweaksPanel>
        <TweakSection label="Skin" />
        <TweakRadio label="Design system" value={t.brand} options={['objto', 'cursor', 'nike']} onChange={(v) => setTweak('brand', v)} />
        <TweakSection label="Theme" />
        <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak('dark', v)} />
        <TweakRadio label="Accent (OBJ_TO)" value={t.accent} options={['navy', 'clay', 'charcoal']} onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Categorization UX" />
        <TweakRadio label="Today view" value={t.mode} options={['timeline', 'calendar', 'triage']} onChange={(v) => setTweak('mode', v)} />
        <TweakSection label="Screens" />
        <TweakToggle label="Onboarding" value={t.onboarding} onChange={(v) => setTweak('onboarding', v)} />
        <TweakToggle label="Windows chrome" value={t.chrome} onChange={(v) => setTweak('chrome', v)} />
      </TweaksPanel>
    </div>
  );
}
