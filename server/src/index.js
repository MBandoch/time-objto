'use strict';

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const Database = require('better-sqlite3');

// ── Config ────────────────────────────────────────────────────────────────────

const PORT       = process.env.PORT || 3001;
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';          // empty = no auth (dev)
const DB_PATH    = process.env.DB_PATH || path.join(__dirname, '../data/tracker.db');

// ── Database ──────────────────────────────────────────────────────────────────

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    date        TEXT NOT NULL,
    start       INTEGER NOT NULL,
    end         INTEGER NOT NULL,
    dur         INTEGER NOT NULL,
    app         TEXT,
    title       TEXT,
    project_id  TEXT,
    project_name TEXT,
    client      TEXT,
    billable    INTEGER DEFAULT 0,
    rate        REAL    DEFAULT 0,
    status      TEXT    DEFAULT 'confirmed',
    manual      INTEGER DEFAULT 0,
    synced_at   TEXT    DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_date    ON sessions(date);
  CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
`);

// ── Auth middleware ────────────────────────────────────────────────────────────

function auth(req, res, next) {
  if (!AUTH_TOKEN) return next();
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token !== AUTH_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const minToHHMM = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

function periodWhere(period) {
  if (!period || period === 'all') return { clause: '1=1', params: [] };
  const today = new Date().toISOString().slice(0, 10);
  if (period === 'today') return { clause: 'date = ?', params: [today] };
  if (period === 'week') {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    return { clause: 'date >= ?', params: [d.toISOString().slice(0, 10)] };
  }
  if (period === 'month') {
    return { clause: "date >= date('now','start of month')", params: [] };
  }
  return { clause: '1=1', params: [] };
}

// ── App ───────────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check — also used by the Settings "Test" button
app.get('/health', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as n FROM sessions').get().n;
  res.json({ ok: true, version: '1.0.0', sessions: count, auth: !!AUTH_TOKEN });
});

// Upsert one or many sessions
app.post('/sessions', auth, (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [req.body];
  if (!items.length) return res.status(400).json({ error: 'No sessions provided' });

  const upsert = db.prepare(`
    INSERT INTO sessions (id, date, start, end, dur, app, title,
      project_id, project_name, client, billable, rate, status, manual, synced_at)
    VALUES (@id, @date, @start, @end, @dur, @app, @title,
      @project_id, @project_name, @client, @billable, @rate, @status, @manual, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      date = excluded.date, start = excluded.start, end = excluded.end,
      dur = excluded.dur, title = excluded.title, project_id = excluded.project_id,
      project_name = excluded.project_name, client = excluded.client,
      billable = excluded.billable, rate = excluded.rate, status = excluded.status,
      synced_at = datetime('now')
  `);

  const insertMany = db.transaction((rows) => {
    for (const s of rows) {
      upsert.run({
        id:           s.id || `ev_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        date:         s.date || new Date().toISOString().slice(0, 10),
        start:        s.start ?? 0,
        end:          s.end ?? 0,
        dur:          s.dur ?? 0,
        app:          s.app || '',
        title:        s.title || '',
        project_id:   s.project || s.project_id || '',
        project_name: s.projectName || s.project_name || '',
        client:       s.client || '',
        billable:     s.billable ? 1 : 0,
        rate:         s.rate ?? 0,
        status:       s.status || 'confirmed',
        manual:       s.manual ? 1 : 0,
      });
    }
  });

  try {
    insertMany(items);
    res.json({ ok: true, synced: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List sessions with optional filters
app.get('/sessions', auth, (req, res) => {
  const { from, to, project, period, limit = 500 } = req.query;
  const conditions = [];
  const params     = [];

  if (from)    { conditions.push('date >= ?'); params.push(from); }
  if (to)      { conditions.push('date <= ?'); params.push(to); }
  if (project) { conditions.push('project_id = ?'); params.push(project); }
  if (period && period !== 'all') {
    const w = periodWhere(period);
    conditions.push(w.clause);
    params.push(...w.params);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows  = db.prepare(
    `SELECT * FROM sessions ${where} ORDER BY date DESC, start DESC LIMIT ?`
  ).all(...params, Number(limit));

  res.json(rows);
});

// Summary report by project
app.get('/report', auth, (req, res) => {
  const { period = 'week' } = req.query;
  const { clause, params }  = periodWhere(period);

  const rows = db.prepare(`
    SELECT
      project_id,
      project_name,
      client,
      MAX(billable) as billable,
      MAX(rate)     as rate,
      SUM(dur)      as total_min,
      COUNT(*)      as sessions
    FROM sessions
    WHERE ${clause} AND status = 'confirmed'
    GROUP BY project_id
    ORDER BY total_min DESC
  `).all(...params);

  const totalMin  = rows.reduce((s, r) => s + r.total_min, 0);
  const totalValue = rows.reduce((s, r) =>
    s + (r.billable ? (r.total_min / 60) * r.rate : 0), 0);

  res.json({
    period,
    total_min:   totalMin,
    total_hours: +(totalMin / 60).toFixed(2),
    total_value: +totalValue.toFixed(2),
    projects: rows.map((r) => ({
      ...r,
      total_hours: +(r.total_min / 60).toFixed(2),
      value: r.billable ? +((r.total_min / 60) * r.rate).toFixed(2) : 0,
    })),
  });
});

// CSV export
app.get('/export/csv', auth, (req, res) => {
  const { period = 'all' } = req.query;
  const { clause, params } = periodWhere(period);
  const rows = db.prepare(
    `SELECT * FROM sessions WHERE ${clause} ORDER BY date, start`
  ).all(...params);

  const header = ['ID', 'Data', 'Início', 'Fim', 'Duração (min)', 'App', 'Título',
                  'Projeto', 'Cliente', 'Faturável', 'Taxa (R$/h)', 'Valor (R$)', 'Status', 'Synced'];
  const lines  = rows.map((r) => [
    r.id, r.date, minToHHMM(r.start), minToHHMM(r.end), r.dur,
    r.app, r.title, r.project_name, r.client,
    r.billable ? 'Sim' : 'Não', r.rate,
    r.billable ? +((r.dur / 60) * r.rate).toFixed(2) : 0,
    r.status, r.synced_at,
  ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));

  const csv = '﻿' + [header.map((h) => `"${h}"`).join(','), ...lines].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="objto-${period}-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send(csv);
});

// Delete a session
app.delete('/sessions/:id', auth, (req, res) => {
  const info = db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`OBJ_TO Sync Server running on http://localhost:${PORT}`);
  console.log(`Auth: ${AUTH_TOKEN ? 'enabled' : 'disabled (dev mode)'}`);
  console.log(`DB:   ${DB_PATH}`);
});
