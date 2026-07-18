import sqlite3

DB_FILE = "server/database.db"

def test_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Check users
    cursor.execute("SELECT * FROM users")
    users = [dict(row) for row in cursor.fetchall()]
    print("----- Users in Database -----")
    for u in users:
        print(f"ID: {u['id']}, Username: {u['username']}, Email: {u['email']}, XP: {u['xp']}, Auth Token: {u['auth_token']}")
        
    conn.close()

if __name__ == "__main__":
    test_db()
