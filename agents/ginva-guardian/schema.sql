-- GINVA Guardian D1 Schema

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_address TEXT UNIQUE NOT NULL,
    collateral_amount INTEGER NOT NULL DEFAULT 0,
    collateral_mint TEXT,
    borrowed_amount INTEGER NOT NULL DEFAULT 0,
    health_factor REAL NOT NULL DEFAULT 100.0,
    liquidation_threshold REAL NOT NULL DEFAULT 1.0,
    is_active INTEGER NOT NULL DEFAULT 1,
    grace_period_end INTEGER,
    last_update INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_positions_user_address ON positions(user_address);
CREATE INDEX IF NOT EXISTS idx_positions_is_active ON positions(is_active);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_address TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('warning', 'critical', 'emergency')),
    health_factor REAL NOT NULL,
    message TEXT,
    acknowledged INTEGER NOT NULL DEFAULT 0,
    timestamp INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_address ON alerts(user_address);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);

-- Stats table (singleton)
CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    total_watched INTEGER NOT NULL DEFAULT 0,
    warnings INTEGER NOT NULL DEFAULT 0,
    criticals INTEGER NOT NULL DEFAULT 0,
    emergencies INTEGER NOT NULL DEFAULT 0,
    last_check INTEGER
);

-- Initialize stats row if not exists
INSERT OR IGNORE INTO stats (id, total_watched, warnings, criticals, emergencies, last_check)
VALUES (1, 0, 0, 0, 0, NULL);