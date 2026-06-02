const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDb, getDb } = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// ── helpers ────────────────────────────────────────────────────────────────────

const parseJson = (v, fallback = []) => { try { return JSON.parse(v); } catch { return fallback; } };

// Mapeia colunas snake_case do SQLite para os nomes camelCase que o cliente usa.
// O caminho de escrita já converte camelCase → snake_case; aqui fechamos o ciclo.
function rowToSession(r) {
  return {
    ...r,
    project: r.project_id ?? null,
    clientId: r.client_id ?? null,
    windowTitle: r.window_title ?? '',
    tags: parseJson(r.tags),
    billable: !!r.billable, manual: !!r.manual, auto: !!r.auto,
  };
}
function rowToProject(r) {
  return {
    ...r,
    clientId: r.client_id ?? null,
    rules: parseJson(r.rules), tags: parseJson(r.tags),
    billable: !!r.billable,
  };
}
function rowToGoal(r) {
  return { ...r, projectId: r.project_id ?? null, done: !!r.done };
}

// ── health ─────────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ── GET /api/data ──────────────────────────────────────────────────────────────

app.get('/api/data', (req, res) => {
  const { user } = req.query;
  if (!user) return res.status(400).json({ error: 'user required' });
  const db = getDb();

  const sessions  = db.prepare('SELECT * FROM sessions  WHERE username=? ORDER BY start').all(user).map(rowToSession);
  const projects  = db.prepare('SELECT * FROM projects  WHERE username=? ORDER BY name').all(user).map(rowToProject);
  const clients   = db.prepare('SELECT * FROM clients   WHERE username=? ORDER BY name').all(user);
  const tags      = db.prepare('SELECT * FROM tags      WHERE username=? ORDER BY name').all(user);
  const goals     = db.prepare('SELECT * FROM goals     WHERE username=?').all(user).map(rowToGoal);

  res.json({ sessions, projects, clients, tags, goals });
});

// ── POST /api/data ─────────────────────────────────────────────────────────────

app.post('/api/data', (req, res) => {
  const { user } = req.query;
  if (!user) return res.status(400).json({ error: 'user required' });
  const { sessions, projects, clients, tags, goals } = req.body;
  const db = getDb();

  const stmts = {
    session: db.prepare(`
      INSERT OR REPLACE INTO sessions
        (id, username, start, end, dur, app, title, window_title, project_id, client_id, status, billable, rate, tags, manual, auto, confidence)
      VALUES
        (@id, @username, @start, @end, @dur, @app, @title, @window_title, @project_id, @client_id, @status, @billable, @rate, @tags, @manual, @auto, @confidence)
    `),
    project: db.prepare(`
      INSERT OR REPLACE INTO projects (id, username, name, client_id, color, billable, rate, rules, tags)
      VALUES (@id, @username, @name, @client_id, @color, @billable, @rate, @rules, @tags)
    `),
    client: db.prepare(`
      INSERT OR REPLACE INTO clients (id, username, name, email, cnpj, phone, address, notes)
      VALUES (@id, @username, @name, @email, @cnpj, @phone, @address, @notes)
    `),
    tag: db.prepare(`
      INSERT OR REPLACE INTO tags (id, username, name, color)
      VALUES (@id, @username, @name, @color)
    `),
    goal: db.prepare(`
      INSERT OR REPLACE INTO goals (id, username, type, label, target, project_id, done)
      VALUES (@id, @username, @type, @label, @target, @project_id, @done)
    `),
  };

  db.transaction(() => {
    (sessions || []).forEach(s => stmts.session.run({
      id: s.id, username: user,
      start: s.start, end: s.end, dur: s.dur,
      app: s.app || '', title: s.title || '', window_title: s.windowTitle || '',
      project_id: s.project || null, client_id: s.clientId || null,
      status: s.status || 'confirmed',
      billable: s.billable ? 1 : 0, rate: s.rate || 0,
      tags: JSON.stringify(s.tags || []),
      manual: s.manual ? 1 : 0, auto: s.auto ? 1 : 0,
      confidence: s.confidence || null,
    }));

    (projects || []).forEach(p => stmts.project.run({
      id: p.id, username: user,
      name: p.name, client_id: p.clientId || null,
      color: p.color || '#6C7480',
      billable: p.billable ? 1 : 0, rate: p.rate || 0,
      rules: JSON.stringify(p.rules || []),
      tags: JSON.stringify(p.tags || []),
    }));

    (clients || []).forEach(c => stmts.client.run({
      id: c.id, username: user,
      name: c.name, email: c.email || '',
      cnpj: c.cnpj || '', phone: c.phone || '',
      address: c.address || '', notes: c.notes || '',
    }));

    (tags || []).forEach(t => stmts.tag.run({
      id: t.id, username: user, name: t.name, color: t.color || '#6C7480',
    }));

    (goals || []).forEach(g => stmts.goal.run({
      id: g.id, username: user,
      type: g.type, label: g.label,
      target: g.target || 0, project_id: g.projectId || null,
      done: g.done ? 1 : 0,
    }));
  })();

  res.json({ ok: true });
});

// ── DELETE /api/data/:table/:id ────────────────────────────────────────────────

const DELETABLE = new Set(['sessions', 'projects', 'clients', 'tags', 'goals']);
app.delete('/api/data/:table/:id', (req, res) => {
  const { user } = req.query;
  const { table, id } = req.params;
  if (!user || !DELETABLE.has(table)) return res.status(400).json({ error: 'invalid' });
  getDb().prepare(`DELETE FROM ${table} WHERE id=? AND username=?`).run(id, user);
  res.json({ ok: true });
});

// ── POST /sync (legacy desktop compat) ────────────────────────────────────────

app.post('/sync', (req, res) => {
  const { username, sessions } = req.body;
  if (!username || !Array.isArray(sessions)) return res.status(400).json({ error: 'invalid' });

  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO sessions
      (id, username, start, end, dur, app, title, project_id, client_id, status, billable, rate, manual, auto, confidence)
    VALUES
      (@id, @username, @start, @end, @dur, @app, @title, @project_id, @client_id, @status, @billable, @rate, @manual, @auto, @confidence)
  `);

  db.transaction(() => sessions.forEach(s => stmt.run({
    id: s.id, username,
    start: s.start, end: s.end, dur: s.dur,
    app: s.app || '', title: s.title || '',
    project_id: s.project || s.project_id || null,
    client_id: s.clientId || null,
    status: s.status || 'confirmed',
    billable: s.billable ? 1 : 0, rate: s.rate || 0,
    manual: s.manual ? 1 : 0, auto: s.auto ? 1 : 0,
    confidence: s.confidence || null,
  })))();

  const remote = db.prepare('SELECT * FROM sessions WHERE username=?').all(username).map(rowToSession);
  res.json({ ok: true, sessions: remote });
});

// ── Static SPA ─────────────────────────────────────────────────────────────────

const PUBLIC = path.join(__dirname, '../public');
if (fs.existsSync(PUBLIC)) {
  app.use(express.static(PUBLIC));
  app.get('*', (_req, res) => res.sendFile(path.join(PUBLIC, 'index.html')));
} else {
  app.get('/', (_req, res) => res.json({ ok: true, mode: 'api-only', hint: 'build the React app and mount ./app/dist as /app/public' }));
}

// ── start ──────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
initDb();
app.listen(PORT, () => console.log(`OBJ_TO server :${PORT}  db=${process.env.DB_PATH || 'objto.db'}`));
