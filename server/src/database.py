"""
Database Access Layer for Prodo FastAPI Backend.

Provides a unified interface for SQLite execution (used locally and in standard Python container deployments)
and abstracts query execution so every route handler remains clean and readable.
"""

import os
import sqlite3
from typing import Any, Dict, List, Optional

# Global variable set by main.py in Cloudflare Workers to access D1 bindings
WORKER_ENV = None

# Path to local SQLite database file in the server directory
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database.db")


def get_db_connection() -> sqlite3.Connection:
    """
    Creates and returns a SQLite database connection configured with Row factory
    so query results can be accessed like dictionaries.
    """
    # Open connection to the database file
    conn = sqlite3.connect(DB_PATH)
    # Enable Row factory to return dict-like rows instead of tuples
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """
    Initializes database tables and ensures all schema columns exist.
    Reads table definitions from schema.sql.
    """
    schema_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "schema.sql")
    if os.path.exists(schema_path):
        conn = get_db_connection()
        cursor = conn.cursor()
        with open(schema_path, "r", encoding="utf-8") as f:
            schema_script = f.read()
        cursor.executescript(schema_script)
        conn.commit()

        # Check existing columns in users table to perform alter table migrations if needed
        cursor.execute("PRAGMA table_info(users)")
        existing_cols = [row["name"] for row in cursor.fetchall()]

        migrations = [
            ("needs_handle", "INTEGER DEFAULT 0"),
            ("is_dev", "INTEGER DEFAULT 0"),
            ("dev_token", "TEXT"),
            ("is_tester", "INTEGER DEFAULT 0"),
            ("tester_expires_at", "REAL"),
            ("auth_token", "TEXT"),
            ("total_lifetime_points", "INTEGER DEFAULT 0"),
            ("current_balance", "INTEGER DEFAULT 0"),
        ]

        for col_name, col_def in migrations:
            if col_name not in existing_cols:
                try:
                    cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
                except Exception:
                    pass

        conn.commit()
        conn.close()


async def query_one(sql: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    """
    Executes a SELECT query expecting a single record.
    Returns a dictionary representation of the row or None if no match.
    """
    if WORKER_ENV is not None and hasattr(WORKER_ENV, "DB"):
        stmt = WORKER_ENV.DB.prepare(sql)
        if params:
            stmt = stmt.bind(*params)
        row = await stmt.first()
        if not row:
            return None
        return row.to_py() if hasattr(row, "to_py") else dict(row)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None


async def query_all(sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """
    Executes a SELECT query expecting multiple records.
    Returns a list of dictionaries.
    """
    if WORKER_ENV is not None and hasattr(WORKER_ENV, "DB"):
        stmt = WORKER_ENV.DB.prepare(sql)
        if params:
            stmt = stmt.bind(*params)
        res = await stmt.all()
        results = res.results.to_py() if hasattr(res.results, "to_py") else list(res.results)
        return [dict(r) for r in results]

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


async def execute_db(sql: str, params: tuple = ()) -> int:
    """
    Executes an INSERT, UPDATE, or DELETE query.
    Returns the last inserted row ID.
    """
    if WORKER_ENV is not None and hasattr(WORKER_ENV, "DB"):
        stmt = WORKER_ENV.DB.prepare(sql)
        if params:
            stmt = stmt.bind(*params)
        res = await stmt.run()
        meta = res.meta.to_py() if hasattr(res.meta, "to_py") else dict(res.meta)
        return meta.get("last_row_id", 0)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return last_id
