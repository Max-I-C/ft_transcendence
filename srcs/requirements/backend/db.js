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

export { db };