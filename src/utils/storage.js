const K = {
  projects:   'objto_projects',
  events:     'objto_events',
  pomoConfig: 'objto_pomo_config',
  sync:       'objto_sync',
  monitorAll: 'objto_monitor_all',
  goals:      'objto_goals',
  clients:    'objto_clients',
  tags:       'objto_tags',
};

const DEFAULTS = {
  projects:   [],
  events:     [],
  pomoConfig: { focus: 25, shortBreak: 5, longBreak: 15, cycles: 4 },
  sync:       { enabled: false, url: '', interval: 'realtime' },
  monitorAll: false,
  goals:      [],
  clients:    [],
  tags:       [],
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded — fail silently */ }
}

export const storage = {
  loadProjects:   () => load(K.projects,   DEFAULTS.projects),
  loadEvents:     () => load(K.events,     DEFAULTS.events),
  loadPomoConfig: () => load(K.pomoConfig, DEFAULTS.pomoConfig),
  loadSync:       () => load(K.sync,       DEFAULTS.sync),
  loadMonitorAll: () => load(K.monitorAll, DEFAULTS.monitorAll),

  saveProjects:   (v) => save(K.projects,   v),
  saveEvents:     (v) => save(K.events,     v),
  savePomoConfig: (v) => save(K.pomoConfig, v),
  saveSync:       (v) => save(K.sync,       v),
  saveMonitorAll: (v) => save(K.monitorAll, v),
  loadGoals:      () => load(K.goals,   DEFAULTS.goals),
  saveGoals:      (v) => save(K.goals,   v),
  loadClients:    () => load(K.clients, DEFAULTS.clients),
  saveClients:    (v) => save(K.clients, v),
  loadTags:       () => load(K.tags,    DEFAULTS.tags),
  saveTags:       (v) => save(K.tags,    v),
};
