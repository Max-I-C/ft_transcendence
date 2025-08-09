import Database from "better-sqlite3";
import fs from 'fs';

const dbFile = './data/app.db';
console.log('📦 SQLite path:', process.cwd() + '/' + dbFile);


if(!fs.existsSync('./data'))
{
    fs.mkdirSync('./data');
}

const db = new Database(dbFile);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    twoaf INTEGER DEFAULT 0,

    game_play INTEGER DEFAULT 10,
    game_win INTEGER DEFAULT 6,
    game_loss INTEGER DEFAULT 4,
    score_total INTEGER DEFAULT 10,
    level INTEGER DEFAULT 1,
    rank TEXT DEFAULT 'Unranked',
    

    achievements TEXT DEFAULT '[]' -- JSON string, ex: '["first_win", "level_10"]'
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS match_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    match_date DATETIME DEFAULT CURRENT_TIMESTAMP, -- date du match
    match_score TEXT NOT NULL,                     -- ex: "2-3"
    result TEXT CHECK(result IN ('win', 'loss')) NOT NULL, -- win ou loss
    points_change INTEGER NOT NULL,                -- ex: +30 ou -15

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);


export { db };