// ============================================================
// Motor de detecção de atividade — portado da versão Python (v4)
// Detecta o projeto a partir do título da janela ativa.
// ============================================================

// Extensões reconhecidas no título da janela (modelagem, design, office, dev)
export const TRACKED_EXTENSIONS = [
  // CAD / Modelagem 3D
  'blend', 'sldprt', 'sldasm', 'slddrw', 'f3d', 'f3z', '3dm', 'max', 'ma', 'mb',
  'skp', 'step', 'stp', 'iges', 'igs', 'dwg', 'dxf', 'ipt', 'iam', 'prt', 'asm',
  'catpart', 'catproduct', 'par', 'psm', 'stl', 'obj', 'fbx', 'c4d', 'ztl', 'zpr', 'fcstd',
  // Design
  'fig', 'psd', 'ai', 'xd', 'sketch', 'indd', 'afdesign', 'afphoto', 'svg',
  // Office / Documentos
  'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'pdf', 'key', 'pages', 'numbers',
  // Desenvolvimento
  'tsx', 'ts', 'jsx', 'js', 'py', 'rs', 'go', 'java', 'cpp', 'css', 'html', 'json', 'md', 'sql',
];

const _exts = TRACKED_EXTENSIONS.map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
// captura "nome.ext" seguido de fim/limite — equivalente ao _EXT_PATTERN do Python
const FILE_RE = new RegExp(
  '([^\\\\/:*?"<>|\\[\\]\\r\\n]+\\.(?:' + _exts + '))(?=$|[\\s"\\]\\)>])',
  'i'
);

// Separadores comuns de título de janela: "arquivo — App", "doc - Word", "página | Site"
const TITLE_SEP_RE = /\s[—–|·]\s|\s-\s/;

// Extrai o nome do arquivo (sem extensão) do título da janela.
export function extractFileName(title) {
  if (!title) return null;
  const m = title.match(FILE_RE);
  if (!m) return null;
  const base = m[1].split(/[\\/]/).pop();
  const name = base.replace(/\.[^.]+$/, '').replace(/[[\](){}]/g, '').trim();
  return name || null;
}

// Extrai o nome do aplicativo do título (geralmente o último segmento no Windows).
export function extractAppName(title) {
  if (!title) return '';
  const parts = title.split(TITLE_SEP_RE).map((s) => s.trim()).filter(Boolean);
  return (parts.length ? parts[parts.length - 1] : title).trim();
}

// Cruza o título com as regras dos projetos cadastrados. Retorna o id do projeto ou null.
export function matchTitleToProject(title, projects) {
  if (!title) return null;
  for (const p of projects) {
    for (const rule of (p.rules || [])) {
      let match = false;
      if (rule.type === 'exact') match = title === rule.pattern;
      else if (rule.type === 'contains') match = title.toLowerCase().includes(rule.pattern.toLowerCase());
      else if (rule.type === 'starts_with') match = title.toLowerCase().startsWith(rule.pattern.toLowerCase());
      else if (rule.type === 'ends_with') match = title.toLowerCase().endsWith(rule.pattern.toLowerCase());
      else if (rule.type === 'glob') {
        const re = new RegExp('^' + rule.pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$', 'i');
        match = re.test(title) || title.toLowerCase().includes(rule.pattern.replace(/\*/g, '').toLowerCase());
      } else if (rule.type === 'regex') {
        try { match = new RegExp(rule.pattern, 'i').test(title); } catch { /* ignora */ }
      }
      if (match) return p.id;
    }
  }
  return null;
}

// Detecta a atividade atual a partir do título da janela ativa.
// Espelha detect_current + resolve_project do Python:
//   1) tenta casar com uma regra de projeto cadastrado;
//   2) senão, extrai o nome do arquivo para virar uma sessão não classificada;
//   3) senão, usa o nome do app. Sempre retorna algo rastreável (nunca null se houver título).
export function detectActivity(title, projects) {
  if (!title) return null;
  const app = extractAppName(title);

  const pid = matchTitleToProject(title, projects);
  if (pid) return { project: pid, app, title, label: title };

  const file = extractFileName(title);
  if (file) return { project: null, app, title, label: file };

  // Sem arquivo reconhecido — registra mesmo assim sob o nome do app/janela
  return { project: null, app, title, label: app || title };
}

// Detecta se estamos rodando dentro do Tauri (WebView2), independente de withGlobalTauri.
export function isTauri() {
  return typeof window !== 'undefined' &&
    ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
}

// UUID com fallback para ambientes sem crypto.randomUUID.
export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'ev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}
