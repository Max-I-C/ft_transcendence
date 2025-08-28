/*
// -- db.js -- //
######################################################################################
# The db.js file is responsible for the database connection and schema definition.   #
# It initializes the SQLite database and creates the necessary tables for the        #
# application to function properly.                                                  #
######################################################################################
*/

import Database from "better-sqlite3";
import fs from 'fs';

const dbFile = './data/app.db';
console.log('📦 SQLite path:', process.cwd() + '/' + dbFile);

// -- Create data directory if it doesn't exist -- //
if(!fs.existsSync('./data'))
{
    fs.mkdirSync('./data');
}

const db = new Database(dbFile);

// -- Definition of all the tables and their content, so if you want data in the DB its here that you have to create the table -- //
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

db.exec(`
  CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('pending', 'accepted', 'declined')) NOT NULL DEFAULT 'pending',
    created DATETIME DEFAULT CURRENT_TIMESTAMP, -- date

    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    sender_id INTEGER,
    type TEXT,
    reference_id INTEGER,
    read INTEGER DEFAULT 0,
    created DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read INTEGER DEFAULT 0,

    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blocker_id INTEGER NOT NULL,
    blocked_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(blocker_id, blocked_id)
  );
`);


export { db };