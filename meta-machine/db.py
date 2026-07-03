"""قاعدة بيانات الماكينة — الخيط الذهبي: source_ad_id من أول رسالة لآخر طلبية."""
import sqlite3
from config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS customers (
    phone TEXT PRIMARY KEY,
    name TEXT,
    ctwa_clid TEXT,
    source_ad_id TEXT,
    first_seen TEXT DEFAULT (datetime('now')),
    last_seen TEXT
);
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    wamid TEXT UNIQUE,
    direction TEXT CHECK(direction IN ('in','out')),
    body TEXT,
    source_ad_id TEXT,
    ts TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    value REAL NOT NULL,
    currency TEXT NOT NULL,
    status TEXT DEFAULT 'confirmed'
        CHECK(status IN ('confirmed','shipped','delivered','rejected')),
    source_ad_id TEXT,
    ctwa_clid TEXT,
    capi_event_id TEXT UNIQUE,
    created TEXT DEFAULT (datetime('now')),
    updated TEXT
);
CREATE TABLE IF NOT EXISTS ads_map (
    ad_id TEXT PRIMARY KEY,
    campaign_id TEXT,
    adset_id TEXT,
    product_id TEXT,
    color TEXT,
    audience TEXT,
    status TEXT DEFAULT 'active',
    created TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS rule_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_id TEXT,
    action TEXT,
    reason TEXT,
    dry_run INTEGER DEFAULT 0,
    ts TEXT DEFAULT (datetime('now'))
);
"""


def connect():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys=ON")
    return con


def init():
    with connect() as con:
        con.executescript(SCHEMA)


if __name__ == "__main__":
    init()
    print(f"database ready: {DB_PATH}")
