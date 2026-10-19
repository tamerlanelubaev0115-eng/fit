const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dbPath = path.join(__dirname, 'data.db');
const db = new DatabaseSync(dbPath);

// Initialize tables
db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    start_weight REAL DEFAULT 95.0,
    current_weight REAL DEFAULT 92.4,
    target_weight REAL DEFAULT 80.0,
    calorie_target INTEGER DEFAULT 2100,
    water_target INTEGER DEFAULT 2500,
    step_target INTEGER DEFAULT 10000,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    category TEXT NOT NULL, -- 'food', 'drink', 'nicotine'
    name TEXT NOT NULL,
    calories INTEGER DEFAULT 0,
    amount_ml INTEGER DEFAULT 0,
    nicotine_subtype TEXT, -- 'stick', 'cigarette'
    nicotine_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS daily_stats (
    date TEXT PRIMARY KEY,
    steps INTEGER DEFAULT 0,
    weight REAL,
    notes TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_logs_date ON logs(date);
`);

// Ensure profile row exists
const getProfileStmt = db.prepare('SELECT * FROM profile WHERE id = 1');
const profile = getProfileStmt.get();
if (!profile) {
  const insertProfile = db.prepare(`
    INSERT INTO profile (id, start_weight, current_weight, target_weight, calorie_target, water_target, step_target)
    VALUES (1, 95.0, 92.4, 80.0, 2100, 2500, 10000)
  `);
  insertProfile.run();
}

// Seed initial realistic data if logs is empty so user immediately sees calendar & dashboard
const countLogsStmt = db.prepare('SELECT COUNT(*) as count FROM logs');
const logCount = countLogsStmt.get().count;

if (logCount === 0) {
  const today = new Date();
  const insertLog = db.prepare(`
    INSERT INTO logs (date, time, category, name, calories, amount_ml, nicotine_subtype, nicotine_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertDaily = db.prepare(`
    INSERT OR REPLACE INTO daily_stats (date, steps, weight)
    VALUES (?, ?, ?)
  `);

  // Generate 21 days of history leading up to today
  for (let i = 21; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const weightProgress = +(95.0 - (95.0 - 92.4) * ((21 - i) / 21)).toFixed(1);
    const steps = Math.floor(6000 + Math.random() * 6500);
    insertDaily.run(dateStr, steps, i % 3 === 0 ? weightProgress : null);

    // Food logs
    insertLog.run(dateStr, '09:15', 'food', 'Овсяная каша с ягодами', 340, 0, null, 0);
    insertLog.run(dateStr, '13:30', 'food', 'Онигири с тунцом и салат', 410, 0, null, 0);
    insertLog.run(dateStr, '19:40', 'food', 'Куриная грудка с гречкой и овощи', 550, 0, null, 0);

    // Drinks
    insertLog.run(dateStr, '09:00', 'drink', 'Вода', 0, 250, null, 0);
    insertLog.run(dateStr, '11:20', 'drink', 'Минеральная вода', 0, 500, null, 0);
    insertLog.run(dateStr, '15:10', 'drink', 'Вода', 0, 250, null, 0);
    insertLog.run(dateStr, '18:00', 'drink', 'Вода', 0, 1000, null, 0);

    // Nicotine
    const sticks = Math.floor(2 + Math.random() * 4);
    const cigs = Math.floor(Math.random() * 3);
    for (let s = 0; s < sticks; s++) {
      const h = String(9 + s * 2).padStart(2, '0');
      insertLog.run(dateStr, `${h}:20`, 'nicotine', 'Стик', 0, 0, 'stick', 1);
    }
    for (let c = 0; c < cigs; c++) {
      const h = String(10 + c * 4).padStart(2, '0');
      insertLog.run(dateStr, `${h}:50`, 'nicotine', 'Сигарета', 0, 0, 'cigarette', 1);
    }
  }
}

module.exports = { db };
