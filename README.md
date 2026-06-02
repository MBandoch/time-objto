# OBJ_TO Time Tracker

Rastreador de tempo para profissionais criativos (arquitetura, design, etc.).
Registra automaticamente os programas e arquivos em uso, classifica as sessões
por projeto via regras, e gera relatórios faturáveis.

Construído como **app desktop** (Tauri + React) com um **servidor opcional**
(Express + SQLite) que também serve uma versão web do cliente.

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Modelo de dados](#modelo-de-dados)
- [Desenvolvimento](#desenvolvimento)
- [Build do desktop](#build-do-desktop-tauri)
- [Servidor e modo web](#servidor-e-modo-web)
- [Implantação](#implantação)

---

## Funcionalidades

| Área | Descrição |
|------|-----------|
| **Rastreamento automático** | No Windows, detecta a janela em primeiro plano (programa + arquivo) a cada 4 s e grava sessões. Pausa após 120 s de ociosidade. |
| **"Iniciar dia"** | Botão único na tela Hoje liga/desliga o rastreamento em segundo plano. |
| **Timeline visual** | Cards posicionados em um eixo de horas, com sigla do app, nome do arquivo, intervalo e duração. |
| **Revisão inline** | Editar horário/descrição/projeto/tags ou excluir uma sessão direto no card; filtro "Revisar" para pendências. |
| **Revisão em lote** | Agrupa sessões por sinal detectado e permite confirmar grupos inteiros + criar regras. |
| **Projetos e regras** | Cada projeto tem cor, tarifa, cliente e regras de auto-detecção (glob, contém, regex, etc.). |
| **Clientes** | Cadastro com contato/CNPJ; projetos referenciam clientes por `clientId`. |
| **Tags** | Marcadores coloridos aplicáveis a sessões e projetos. |
| **Metas** | Metas de horas faturáveis, por projeto e tarefas, com anéis de progresso. |
| **Relatórios** | Filtro por período/cliente/projeto + busca textual; exportação PDF/CSV. |
| **Pomodoro** | Timer de foco integrado à barra lateral. |
| **Mini widget** | Janela flutuante always-on-top com o rastreamento atual (desktop). |
| **3 design systems** | `objto`, `cursor`, `nike` — alternáveis, com modo claro/escuro. |

Interface em **português (PT-BR)**.

---

## Arquitetura

```
┌─────────────────────────────┐         ┌──────────────────────────┐
│   App Desktop (Tauri)       │         │   Navegador (modo web)    │
│  ┌───────────────────────┐  │         │  ┌────────────────────┐   │
│  │  React (Vite build)   │  │         │  │  Mesmo React build │   │
│  │  estado em localStorage│ │         │  │  estado via /api    │   │
│  └───────────┬───────────┘  │         │  └─────────┬──────────┘   │
│              │ invoke()      │         │            │ fetch()      │
│  ┌───────────┴───────────┐  │         └────────────┼──────────────┘
│  │  Rust (lib.rs)        │  │                      │
│  │  Win32: janela ativa, │  │                      ▼
│  │  ociosidade, bandeja  │  │         ┌──────────────────────────┐
│  └───────────────────────┘  │         │  Servidor (Express)       │
└──────────────┬──────────────┘         │  /api/data  /sync  /health│
               │  POST /sync             │  ┌────────────────────┐   │
               └────────────────────────▶│  │  SQLite (WAL)      │   │
                                         │  └────────────────────┘   │
                                         │  serve o SPA de /public   │
                                         └──────────────────────────┘
```

- **Desktop:** o React roda dentro do WebView do Tauri. A camada Rust expõe
  comandos (`get_window_info`, `get_idle_seconds`, `open_mini_widget`, …) via
  `invoke()`. Os dados ficam em `localStorage`; a sincronização com o servidor
  é opcional (endpoint legado `POST /sync`).
- **Web:** o mesmo bundle React é servido pelo Express. Quando detecta que **não**
  está no Tauri e não está na porta do Vite dev, entra em "modo web": carrega o
  estado de `GET /api/data` no início e envia mudanças (debounce de 3 s) para
  `POST /api/data`.

A detecção de ambiente está em [`src/utils/api.js`](src/utils/api.js):

```js
export const isWebMode =
  typeof window !== 'undefined' &&
  !('__TAURI_INTERNALS__' in window) &&
  !['5173', '5174', '5175'].includes(window.location.port);
```

---

## Estrutura do repositório

```
.
├── src/                      # Cliente React (desktop + web)
│   ├── App.jsx               # Hub: estado, ações, roteamento de views
│   ├── data.js               # Constantes (RULE_TYPES, APPS, fmt…)
│   ├── views/                # Telas (Hoje, Revisão, Dashboard, Projetos…)
│   ├── components/           # UI compartilhada (pickers, modais, pomodoro)
│   └── utils/                # storage (localStorage), api (web), tracking, exportPdf
├── src-tauri/                # Camada Rust (Win32, bandeja, janelas)
├── server/                   # Servidor de sincronização + web
│   ├── src/
│   │   ├── index.js          # Rotas Express
│   │   └── db.js             # Schema SQLite
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml        # Implantação em um container
├── .env.example              # PORT, DB_PATH
├── docs/
│   └── DEPLOYMENT.md         # Guia detalhado de implantação
├── index.html
├── vite.config.js
└── package.json
```

---

## Modelo de dados

> **Importante:** sessões guardam `start`/`end` como **minutos-desde-meia-noite**
> (não timestamps com data). O modelo atual trata as sessões como pertencentes
> ao dia corrente.

**Sessão (evento)**
```js
{ id, start, end, dur, app, title, doc, windowTitle,
  project,            // id do projeto (ou null = não classificado)
  status,             // 'confirmed' | 'suggested' | 'unsorted'
  tags: [tagId],
  confidence, manual, auto }
```

**Projeto**
```js
{ id, name, color, billable, rate,
  clientId,           // referência à tabela de clientes
  client,             // nome resolvido (legado/conveniência)
  rules: [{ type, pattern }],
  tags: [tagId] }
```

**Cliente** `{ id, name, email, cnpj, phone, address, notes }`
**Tag** `{ id, name, color }`
**Meta** `{ id, type, label, target, projectId, done }`

No servidor (SQLite) os campos viram `snake_case` (`project_id`, `client_id`,
`window_title`). As funções `rowTo*` em `server/src/index.js` convertem de volta
para `camelCase` ao retornar para o cliente — esse mapeamento de ida e volta é
essencial para o modo web não perder a classificação ao recarregar.

---

## Desenvolvimento

Pré-requisitos: **Node 20+**. Para o desktop, **Rust** + toolchain do Tauri.

### Cliente (web/UI)

```bash
npm install
npm run dev          # Vite em http://localhost:5173
```

### Servidor

```bash
cd server
npm install          # compila better-sqlite3 (precisa de toolchain nativo)
npm run dev          # node --watch, http://localhost:3001
```

Em desenvolvimento o app na porta 5173 usa `localStorage` (não fala com o
servidor). Para testar o modo web, faça o build e sirva pelo Express
(ver [Servidor e modo web](#servidor-e-modo-web)).

---

## Build do desktop (Tauri)

```bash
npm install
npm run tauri build      # gera instalador em src-tauri/target/release/bundle
```

O rastreamento nativo (janela ativa, ociosidade) usa **Win32** e só funciona no
**Windows**. Em outras plataformas o app compila e roda, mas os comandos de
rastreamento retornam vazio (entrada manual continua disponível).

Comandos Rust expostos (`src-tauri/src/lib.rs`):
`get_active_window`, `get_window_info`, `get_idle_seconds`,
`set_close_behavior`, `open_mini_widget`, `close_mini_widget`.

---

## Servidor e modo web

O servidor faz duas coisas:

1. **API de sincronização** — `GET/POST /api/data`, `DELETE /api/data/:table/:id`,
   `POST /sync` (compat. desktop), `GET /health`.
2. **Hospedagem do SPA** — serve o build do React montado em `/app/public`.

Para rodar a versão web completa:

```bash
npm run build                     # gera ./dist
docker compose up -d --build      # monta ./dist como /app/public e sobe o servidor
```

Acesse `http://localhost:3001`. O usuário é identificado pelo nome definido no
onboarding (`?user=<nome>` nas chamadas de API).

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET`  | `/health` | `{ ok, ts }` |
| `GET`  | `/api/data?user=` | Estado completo `{ sessions, projects, clients, tags, goals }` |
| `POST` | `/api/data?user=` | Upsert de todas as entidades (transação) |
| `DELETE` | `/api/data/:table/:id?user=` | Remove uma entidade (tabela na allowlist) |
| `POST` | `/sync` | Compat. desktop: envia sessões, recebe o conjunto remoto |

---

## Implantação

A forma recomendada é **Docker Compose** (servidor + SQLite em um container,
com o SPA montado como volume). Passo a passo, variáveis de ambiente, backup do
banco e **considerações de segurança** estão em:

➡️ **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**

Resumo rápido:

```bash
cp .env.example .env          # ajuste PORT se necessário
npm install && npm run build
docker compose up -d --build
# app em http://localhost:3001
```

> ⚠️ O servidor **não tem autenticação** e o CORS é aberto — projetado para uso
> pessoal/single-user. Não exponha diretamente à internet sem um proxy reverso
> com TLS e autenticação. Detalhes em DEPLOYMENT.md.
