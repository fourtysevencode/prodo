import sqlite3
import json
import secrets
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add server to path
SERVER_DIR = Path(__file__).resolve().parents[1]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from app import app, DB_FILE

client = TestClient(app)

def run_tests():
    # 1. Clear database and reseed
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users")
    cursor.execute("DELETE FROM friends")
    cursor.execute("DELETE FROM coop_sessions")
    
    cursor.execute("INSERT INTO users (username, email, password_hash, xp, total_lifetime_points, current_balance, auth_token) VALUES ('a@prodo.live', 'a@prodo.live', 'password123', 100, 100, 100, 'tokenA')")
    idA = cursor.lastrowid
    
    cursor.execute("INSERT INTO users (username, email, password_hash, xp, total_lifetime_points, current_balance, auth_token) VALUES ('b@prodo.live', 'b@prodo.live', 'password123', 200, 200, 200, 'tokenB')")
    idB = cursor.lastrowid
    
    # Establish friendship
    cursor.execute("INSERT INTO friends (user_id, friend_id) VALUES (?, ?)", (idA, idB))
    cursor.execute("INSERT INTO friends (user_id, friend_id) VALUES (?, ?)", (idB, idA))
    
    conn.commit()
    conn.close()

    print(f"✅ Friendship established between a@prodo.live (ID: {idA}) and b@prodo.live (ID: {idB})")

    # 2. Test registration (email as username)
    reg_response = client.post("/auth/register", json={
        "username": "c@prodo.live",
        "email": "c@prodo.live",
        "password": "password123"
    })
    assert reg_response.status_code == 200
    reg_data = reg_response.json()
    assert reg_data["user"]["username"] == "c@prodo.live"
    assert reg_data["user"]["email"] == "c@prodo.live"
    tokenC = reg_data["token"]
    print("✅ Registration test passed: Username/Email matched:", reg_data["user"])

    # 3. Test constant auth key (login twice, token should not change)
    login_response_1 = client.post("/auth/login", json={
        "email": "c@prodo.live",
        "password": "password123"
    })
    assert login_response_1.status_code == 200
    token1 = login_response_1.json()["token"]
    assert token1 == tokenC  # Token should match initial registration token

    login_response_2 = client.post("/auth/login", json={
        "email": "c@prodo.live",
        "password": "password123"
    })
    assert login_response_2.status_code == 200
    token2 = login_response_2.json()["token"]
    assert token1 == token2  # Token remains constant across logins
    print("✅ Constant auth key test passed: Token remains constant", token1)

    # 4. Test Co-Op room creation (general/open room)
    coop_create_resp = client.post("/coop/create", json={}, headers={"Authorization": "Bearer tokenA"})
    assert coop_create_resp.status_code == 200
    session_id = coop_create_resp.json()["session_id"]
    print("✅ General Co-Op room created successfully: Session ID =", session_id)

    # 5. Test active room listing (friend B should discover A's room)
    coop_active_resp = client.get("/coop/active", headers={"Authorization": "Bearer tokenB"})
    assert coop_active_resp.status_code == 200
    rooms = coop_active_resp.json()["rooms"]
    assert len(rooms) == 1
    assert rooms[0]["session_id"] == session_id
    assert rooms[0]["host_username"] == "a@prodo.live"
    print("✅ Discover active rooms test passed: Friend B found room hosted by A")

    # 6. Test Co-Op room join
    coop_join_resp = client.post("/coop/join", json={"session_id": session_id}, headers={"Authorization": "Bearer tokenB"})
    assert coop_join_resp.status_code == 200
    print("✅ Joined Co-Op focus room successfully")

    # 7. Test sync boost (Camera off vs Camera on)
    # Camera Off
    sync_off_resp = client.post("/users/sync", json={
        "points_earned_since_last_sync": 10,
        "current_multiplier": 1.2,
        "is_cam_on": False
    }, headers={"Authorization": "Bearer tokenB"})
    assert sync_off_resp.status_code == 200
    assert sync_off_resp.json()["points_added"] == 10  # No boost if cam is off

    # Camera On
    sync_on_resp = client.post("/users/sync", json={
        "points_earned_since_last_sync": 10,
        "current_multiplier": 1.2,
        "is_cam_on": True
    }, headers={"Authorization": "Bearer tokenB"})
    assert sync_on_resp.status_code == 200
    assert sync_on_resp.json()["points_added"] == 50  # 5.0x boost if cam is on
    print("✅ Sync boost test passed: 10 XP sample ->", sync_off_resp.json()["points_added"], "XP (cam off) vs", sync_on_resp.json()["points_added"], "XP (cam on)")

    print("\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
