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

// Extrai o nome do DOCUMENTO do título, mesmo sem extensão reconhecível.
// 1) prefere um arquivo com extensão conhecida (extractFileName);
// 2) senão, usa o primeiro segmento do título — convenção do Windows é
//    "NomeDoArquivo - NomeDoApp" (ex.: "Paulista1306_facade_v4 - SketchUp Pro").
//    Muitos apps (SketchUp, Word, Fusion antigo) omitem a extensão no título.
export function extractDocName(title) {
  if (!title) return null;
  const withExt = extractFileName(title);
  if (withExt) return withExt;

  const parts = title.split(TITLE_SEP_RE).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    // primeiro segmento costuma ser o documento; último é o app
    const first = parts[0].replace(/^[*•\s]+/, '').replace(/\s*[-—–]\s*$/, '').trim();
    // ignora se o primeiro segmento é claramente só o nome do app
    if (first && first.length >= 2) return first;
  }
  return null;
}

// Normaliza o nome do processo (ex.: "SketchUp.exe" → "SketchUp").
export function appLabel(process) {
  if (!process) return '';
  return process.replace(/\.exe$/i, '').trim();
}

// Extrai o nome do aplicativo do título (geralmente o último segmento no Windows).
export function extractAppName(title) {
  if (!title) return '';
  const parts = title.split(TITLE_SEP_RE).map((s) => s.trim()).filter(Boolean);
  return (parts.length ? parts[parts.length - 1] : title).trim();
}

// Cruza título E processo com as regras dos projetos cadastrados.
// Retorna o id do projeto ou null. As regras podem casar tanto o título
// da janela quanto o nome do executável (ex.: regra "sketchup.exe").
export function matchToProject(title, process, projects) {
  const haystacks = [title, process].filter(Boolean);
  if (!haystacks.length) return null;
  for (const p of projects) {
    for (const rule of (p.rules || [])) {
      for (const text of haystacks) {
        if (ruleMatches(rule, text)) return p.id;
      }
    }
  }
  return null;
}

function ruleMatches(rule, text) {
  const low = text.toLowerCase();
  const pat = (rule.pattern || '');
  const plow = pat.toLowerCase();
  if (rule.type === 'exact') return low === plow; // case-insensitive, igual ao Python original
  if (rule.type === 'contains') return low.includes(plow);
  if (rule.type === 'starts_with') return low.startsWith(plow);
  if (rule.type === 'ends_with') return low.endsWith(plow);
  if (rule.type === 'glob') {
    const re = new RegExp('^' + pat.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$', 'i');
    return re.test(text) || low.includes(plow.replace(/\*/g, ''));
  }
  if (rule.type === 'regex') {
    try { return new RegExp(pat, 'i').test(text); } catch { return false; }
  }
  return false;
}

// Compat: mantém a assinatura antiga (só título).
export function matchTitleToProject(title, projects) {
  return matchToProject(title, '', projects);
}

// Detecta a atividade atual a partir do título da janela ativa e do processo.
// Espelha detect_current + resolve_project do Python:
//   1) tenta casar título/processo com uma regra de projeto cadastrado;
//   2) senão, extrai o nome do documento (com ou sem extensão) para a sessão;
//   3) sempre retorna algo rastreável quando há título.
export function detectActivity(title, projects, process = '') {
  if (!title && !process) return null;
  const app = appLabel(process) || extractAppName(title);

  const pid = matchToProject(title, process, projects);
  const doc = extractDocName(title);

  if (pid) return { project: pid, app, title, doc: doc || app, label: doc || title };
  return { project: null, app, title, doc: doc || app, label: doc || app };
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
