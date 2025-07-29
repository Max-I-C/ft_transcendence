import Database from "better-sqlite3";
import fs from 'fs';

const dbFile = './data/app.db';

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
    password TEXT NOT NULL
  );
`);

export { db };