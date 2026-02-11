// db.js
const path = require("path");
const Database = require("better-sqlite3");

const dbFile = path.join(__dirname, "data.sqlite");
const db = new Database(dbFile);

// Create tables (minimal but useful)
db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('branch','b2b','admin')),
    label TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by INTEGER NOT NULL,
    customer_label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen','in_arbeit','versandt','abgeschlossen')),
    notes TEXT,
    FOREIGN KEY(created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product TEXT NOT NULL,
    size TEXT NOT NULL,           -- e.g. '1kg' / '5kg' / '11kg'
    qty INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  );
`);

module.exports = db;
