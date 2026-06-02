const Database = require('better-sqlite3');
const path = require('path');

let db;

function initDb() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../objto.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id           TEXT PRIMARY KEY,
      username     TEXT NOT NULL,
      start        INTEGER,
      end          INTEGER,
      dur          INTEGER,
      app          TEXT,
      title        TEXT,
      window_title TEXT DEFAULT '',
      project_id   TEXT,
      client_id    TEXT,
      status       TEXT DEFAULT 'confirmed',
      billable     INTEGER DEFAULT 0,
      rate         REAL    DEFAULT 0,
      tags         TEXT    DEFAULT '[]',
      manual       INTEGER DEFAULT 0,
      auto         INTEGER DEFAULT 0,
      confidence   TEXT,
      created_at   INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS projects (
      id         TEXT PRIMARY KEY,
      username   TEXT NOT NULL,
      name       TEXT NOT NULL,
      client_id  TEXT,
      color      TEXT DEFAULT '#6C7480',
      billable   INTEGER DEFAULT 0,
      rate       REAL    DEFAULT 0,
      rules      TEXT    DEFAULT '[]',
      tags       TEXT    DEFAULT '[]',
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS clients (
      id         TEXT PRIMARY KEY,
      username   TEXT NOT NULL,
      name       TEXT NOT NULL,
      email      TEXT DEFAULT '',
      cnpj       TEXT DEFAULT '',
      phone      TEXT DEFAULT '',
      address    TEXT DEFAULT '',
      notes      TEXT DEFAULT '',
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS tags (
      id         TEXT PRIMARY KEY,
      username   TEXT NOT NULL,
      name       TEXT NOT NULL,
      color      TEXT DEFAULT '#6C7480',
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS goals (
      id         TEXT PRIMARY KEY,
      username   TEXT NOT NULL,
      type       TEXT,
      label      TEXT,
      target     REAL    DEFAULT 0,
      project_id TEXT,
      done       INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );
  `);
}

function getDb() { return db; }

module.exports = { initDb, getDb };
