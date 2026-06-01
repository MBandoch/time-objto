// ============================================================
// OBJ_TO Time Tracker — estrutura de dados
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

export const RULE_TYPES = [
  { value: 'glob',        label: 'Glob',       short: '*',  example: '*.skp',        desc: 'Padrão curinga' },
  { value: 'contains',    label: 'Contém',     short: '⊆',  example: 'Paulista',     desc: 'Título contém texto' },
  { value: 'starts_with', label: 'Inicia',     short: '^',  example: 'Figma —',      desc: 'Título inicia com' },
  { value: 'ends_with',   label: 'Termina',    short: '$',  example: '.blend',       desc: 'Título termina com' },
  { value: 'exact',       label: 'Exato',      short: '=',  example: 'SketchUp',     desc: 'Título exato' },
  { value: 'regex',       label: 'Regex',      short: 'R',  example: 'Paulista\\d+', desc: 'Expressão regular' },
];

export const PROJECT_COLORS = [
  { label: 'Azul',      value: 'var(--p-paulista)' },
  { label: 'Terracota', value: 'var(--p-brand)'    },
  { label: 'Âmbar',    value: 'var(--p-site)'     },
  { label: 'Verde',    value: 'var(--p-vega)'     },
  { label: 'Cinza',   value: 'var(--p-admin)'    },
];

// Começa vazio — usuário cria projetos no onboarding ou na tela Projetos
export const PROJECTS = [];
export const projById  = {};
export const EVENTS    = [];

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

export const WEEK_DAYS   = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const WEEK_TOTALS = [0, 0, 0, 0, 0, 0, 0];
export const WEEK_BY_PROJECT = [];
