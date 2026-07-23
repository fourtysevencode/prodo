CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    google_id TEXT UNIQUE,
    xp INTEGER DEFAULT 0,
    current_multiplier REAL DEFAULT 1.0,
    total_lifetime_points INTEGER DEFAULT 0,
    current_balance INTEGER DEFAULT 0,
    auth_token TEXT,
    is_tester INTEGER DEFAULT 0,
    tester_expires_at REAL,
    needs_handle INTEGER DEFAULT 0,
    is_dev INTEGER DEFAULT 0,
    dev_token TEXT
);

CREATE TABLE IF NOT EXISTS friends (
    user_id INTEGER,
    friend_id INTEGER,
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(friend_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS coop_sessions (
    session_id TEXT PRIMARY KEY,
    host_user_id INTEGER,
    friend_user_id INTEGER,
    is_active INTEGER DEFAULT 1,
    started_at REAL
);

CREATE TABLE IF NOT EXISTS friend_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at REAL NOT NULL,
    UNIQUE(sender_id, receiver_id),
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS device_auths (
    device_code TEXT PRIMARY KEY,
    user_id INTEGER,
    auth_token TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS telemetry_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event TEXT NOT NULL,
    session_id TEXT,
    details TEXT,
    created_at REAL NOT NULL
);
