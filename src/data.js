// ============================================================
// OBJ_TO Time Tracker — mock data
// ============================================================

const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const pad = (n) => String(n).padStart(2, '0');
const clock = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
const dur = (min) => {
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h ${pad(m)}` : `${m}m`;
};
const hrs = (min) => (min / 60).toFixed(1) + 'h';

export const fmt = { toMin, clock, dur, hrs, pad };

export const PROJECTS = [
  { id: 'paulista', name: 'Paulista 1306', client: 'Incorporadora Vega', color: 'var(--p-paulista)', rate: 95, billable: true,
    rules: ['SketchUp', '*.skp', 'contains "Paulista"'] },
  { id: 'brand', name: 'Brand Redesign', client: 'Studio Rui', color: 'var(--p-brand)', rate: 80, billable: true,
    rules: ['Figma', '*.fig', 'pinterest.com'] },
  { id: 'site', name: 'OBJ_TO Website', client: 'Internal', color: 'var(--p-site)', rate: 0, billable: false,
    rules: ['VS Code', '*.tsx', 'localhost'] },
  { id: 'vega-deck', name: 'Vega Pitch Deck', client: 'Incorporadora Vega', color: 'var(--p-vega)', rate: 80, billable: true,
    rules: ['Keynote', '*.key', '*.pptx'] },
  { id: 'admin', name: 'Admin & Finance', client: 'OBJ_TO', color: 'var(--p-admin)', rate: 0, billable: false,
    rules: ['*.xlsx', 'Mail', 'QuickBooks'] },
];

export const projById = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));

export const APPS = {
  figma:     { mono: 'Fig', name: 'Figma' },
  sketchup:  { mono: 'SkU', name: 'SketchUp' },
  vscode:    { mono: '</>', name: 'VS Code' },
  keynote:   { mono: 'Key', name: 'Keynote' },
  excel:     { mono: 'Xls', name: 'Excel' },
  chrome:    { mono: 'Web', name: 'Chrome' },
  slack:     { mono: 'Slk', name: 'Slack' },
  mail:      { mono: '@',   name: 'Mail' },
  photoshop: { mono: 'Ps',  name: 'Photoshop' },
  zoom:      { mono: 'Zm',  name: 'Zoom' },
  youtube:   { mono: 'Yt',  name: 'YouTube' },
};

const RAW_EVENTS = [
  ['08:34', '09:12', 'figma',     'brand-redesign-v3.fig',          'brand',     'high', 'suggested'],
  ['09:12', '09:26', 'chrome',    'Pinterest — moodboard',          'brand',     'med',  'suggested'],
  ['09:26', '09:41', 'slack',     '#studio-rui',                    'admin',     'med',  'suggested'],
  ['09:41', '10:38', 'sketchup',  'Paulista1306_facade_v4.skp',     'paulista',  'high', 'confirmed'],
  ['10:52', '11:47', 'sketchup',  'Paulista1306_base.skp',          'paulista',  'high', 'suggested'],
  ['11:47', '12:05', 'chrome',    'Google Maps — Av. Paulista',     'paulista',  'med',  'suggested'],
  ['12:58', '13:40', 'vscode',    'objto-site/Hero.tsx',            'site',      'high', 'suggested'],
  ['13:40', '14:05', 'chrome',    'localhost:5173',                 'site',      'med',  'suggested'],
  ['14:05', '14:18', 'mail',      'Re: contrato Vega',              'admin',     'med',  'suggested'],
  ['14:18', '15:02', 'keynote',   'Vega_pitch_v2.key',              'vega-deck', 'high', 'suggested'],
  ['15:02', '15:20', 'photoshop', 'Untitled-3.psd',                 null,        'low',  'unsorted'],
  ['15:20', '15:31', 'youtube',   'YouTube — break',                null,        'low',  'unsorted'],
  ['15:31', '16:24', 'figma',     'brand-redesign-v3.fig',          'brand',     'high', 'suggested'],
  ['16:24', '16:40', 'excel',     'Precificacao_3D_v10.xlsx',       'admin',     'high', 'suggested'],
  ['16:40', '17:05', 'zoom',      'Vega — alinhamento',             null,        'low',  'unsorted'],
  ['17:05', '17:48', 'sketchup',  'Paulista1306_facade_v4.skp',     'paulista',  'high', 'confirmed'],
];

let _id = 0;
export const EVENTS = RAW_EVENTS.map(([s, e, app, title, proj, conf, status]) => ({
  id: 'ev' + (++_id),
  start: toMin(s), end: toMin(e), dur: toMin(e) - toMin(s),
  app, title, project: proj, confidence: conf, status,
}));

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEK_TOTALS = [451, 388, 502, 470, 419, 96, 0];
export const WEEK_BY_PROJECT = [
  { id: 'paulista',  min: 742 },
  { id: 'brand',     min: 511 },
  { id: 'vega-deck', min: 263 },
  { id: 'site',      min: 405 },
  { id: 'admin',     min: 205 },
];
