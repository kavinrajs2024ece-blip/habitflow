import os
import sys
sys.path.insert(0, os.path.abspath("."))

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.database import engine, Base
from app.migration import run_migrations
from app.main import app

client = TestClient(app)

def run_tests():
    print("=== Step 1: Run and Verify Database Migration ===")
    Base.metadata.create_all(bind=engine)
    run_migrations(engine)

    with engine.connect() as conn:
        # Check users table
        users = conn.execute(text("SELECT id, name, email FROM users;")).fetchall()
        print(f"Users in database: {users}")
        assert len(users) >= 1, "Expected at least 1 user (demo user)"

        # Check habits table columns
        habits_info = conn.execute(text("PRAGMA table_info(habits);")).fetchall()
        col_names = [col[1] for col in habits_info]
        assert "user_id" in col_names, "user_id column missing from habits"

        # Check existing habits
        habits = conn.execute(text("SELECT id, name, user_id FROM habits;")).fetchall()
        print(f"Habits in database: {habits}")
        for h in habits:
            assert h[2] is not None, f"Habit {h[0]} has NULL user_id!"
        print("[PASS] Migration succeeded and preserved all habits with valid user_id.")

    print("\n=== Step 2: Test Demo User Login & Preserved Data ===")
    demo_login = client.post("/api/auth/login", json={
        "email": "demo@habitflow.com",
        "password": "password123"
    })
    assert demo_login.status_code == 200, f"Demo login failed: {demo_login.text}"
    demo_token = demo_login.json()["access_token"]
    assert demo_token, "No access token returned for demo user"
    print("[PASS] Demo user logged in successfully with JWT.")

    # Fetch demo user habits
    demo_habits_resp = client.get(
        "/api/habits",
        headers={"Authorization": f"Bearer {demo_token}"}
    )
    assert demo_habits_resp.status_code == 200
    demo_habit_names = [h["name"] for h in demo_habits_resp.json()]
    print(f"Demo user habits: {demo_habit_names}")
    assert "Diet" in demo_habit_names
    assert "Workout" in demo_habit_names
    assert "DSA" in demo_habit_names
    print("[PASS] Existing habits ('Diet', 'Workout', 'DSA') successfully preserved for demo user.")

    print("\n=== Step 3: Test User Registration ===")
    test_email_alice = "alice_test@habitflow.com"
    test_email_bob = "bob_test@habitflow.com"
    # Clean up previous test run if exists (cascading habits first)
    with engine.connect() as conn:
        conn.execute(text(
            "DELETE FROM habit_records WHERE habit_id IN (SELECT id FROM habits WHERE user_id IN (SELECT id FROM users WHERE email IN (:e1, :e2)));"
        ), {"e1": test_email_alice, "e2": test_email_bob})
        conn.execute(text(
            "DELETE FROM habits WHERE user_id IN (SELECT id FROM users WHERE email IN (:e1, :e2));"
        ), {"e1": test_email_alice, "e2": test_email_bob})
        conn.execute(text(
            "DELETE FROM users WHERE email IN (:e1, :e2);"
        ), {"e1": test_email_alice, "e2": test_email_bob})
        conn.commit()

    reg_resp = client.post("/api/auth/register", json={
        "name": "Alice Wonderland",
        "email": test_email_alice,
        "password": "alicepassword"
    })
    assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.text}"
    alice_data = reg_resp.json()
    assert alice_data["email"] == test_email_alice
    assert "password_hash" not in alice_data, "SECURITY FLAW: password_hash exposed in response!"
    print("[PASS] Registration succeeded and password_hash is not returned.")

    # Duplicate registration
    dup_resp = client.post("/api/auth/register", json={
        "name": "Alice Impostor",
        "email": test_email_alice,
        "password": "anotherpassword"
    })
    assert dup_resp.status_code == 400, f"Expected 400 for duplicate email, got: {dup_resp.status_code}"
    print("[PASS] Duplicate email registration successfully rejected (400).")

    print("\n=== Step 4: Test Login and Authentication ===")
    # Wrong password
    bad_login = client.post("/api/auth/login", json={
        "email": test_email_alice,
        "password": "wrongpassword"
    })
    assert bad_login.status_code == 401, f"Expected 401 for bad password, got: {bad_login.status_code}"
    print("[PASS] Invalid password rejected with 401 Unauthorized.")

    # Correct password
    good_login = client.post("/api/auth/login", json={
        "email": test_email_alice,
        "password": "alicepassword"
    })
    assert good_login.status_code == 200
    alice_token = good_login.json()["access_token"]
    assert alice_token
    print("[PASS] Valid login returned JWT access token.")

    # Verify GET /api/auth/me
    me_resp = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == test_email_alice
    print(f"[PASS] /api/auth/me returned: {me_resp.json()['name']} ({me_resp.json()['email']})")

    print("\n=== Step 5: Test Multi-Tenant Habit Isolation ===")
    # Register Bob
    test_email_bob = "bob_test@habitflow.com"
    client.post("/api/auth/register", json={
        "name": "Bob Builder",
        "email": test_email_bob,
        "password": "bobpassword"
    })
    bob_login = client.post("/api/auth/login", json={
        "email": test_email_bob,
        "password": "bobpassword"
    })
    bob_token = bob_login.json()["access_token"]

    # Alice creates a habit
    alice_habit = client.post(
        "/api/habits",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={"name": "Alice Meditation", "description": "[Mindfulness] 10 mins"}
    ).json()
    alice_habit_id = alice_habit["id"]
    print(f"Created Alice habit ID {alice_habit_id}: {alice_habit['name']}")

    # Bob creates a habit
    bob_habit = client.post(
        "/api/habits",
        headers={"Authorization": f"Bearer {bob_token}"},
        json={"name": "Bob Running", "description": "[Fitness] 5km"}
    ).json()
    bob_habit_id = bob_habit["id"]
    print(f"Created Bob habit ID {bob_habit_id}: {bob_habit['name']}")

    # Alice lists habits -> must see ONLY Alice Meditation (not Bob, not demo)
    alice_list = client.get("/api/habits", headers={"Authorization": f"Bearer {alice_token}"}).json()
    alice_names = [h["name"] for h in alice_list]
    assert "Alice Meditation" in alice_names
    assert "Bob Running" not in alice_names
    assert "Diet" not in alice_names
    print(f"[PASS] Alice habit list isolated: {alice_names}")

    # Bob lists habits -> must see ONLY Bob Running
    bob_list = client.get("/api/habits", headers={"Authorization": f"Bearer {bob_token}"}).json()
    bob_names = [h["name"] for h in bob_list]
    assert "Bob Running" in bob_names
    assert "Alice Meditation" not in bob_names
    assert "Diet" not in bob_names
    print(f"[PASS] Bob habit list isolated: {bob_names}")

    # Alice attempts to access Bob's habit -> 404
    cross_get = client.get(
        f"/api/habits/{bob_habit_id}",
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    assert cross_get.status_code == 404, f"Expected 404 for cross-user get, got {cross_get.status_code}"
    print("[PASS] Cross-user habit retrieval blocked (404 Not Found).")

    # Alice attempts to update Bob's habit -> 404
    cross_put = client.put(
        f"/api/habits/{bob_habit_id}",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={"name": "Hacked name"}
    )
    assert cross_put.status_code == 404
    print("[PASS] Cross-user habit update blocked (404 Not Found).")

    # Alice attempts to delete Bob's habit -> 404
    cross_del = client.delete(
        f"/api/habits/{bob_habit_id}",
        headers={"Authorization": f"Bearer {alice_token}"}
    )
    assert cross_del.status_code == 404
    print("[PASS] Cross-user habit deletion blocked (404 Not Found).")

    # Alice attempts to record daily log for Bob's habit -> 404
    cross_rec = client.post(
        f"/api/habits/{bob_habit_id}/records",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={"record_date": "2026-09-05", "completed": True}
    )
    assert cross_rec.status_code == 404
    print("[PASS] Cross-user habit record creation blocked (404 Not Found).")

    # Bob logs record for Bob's habit -> 201
    bob_rec = client.post(
        f"/api/habits/{bob_habit_id}/records",
        headers={"Authorization": f"Bearer {bob_token}"},
        json={"record_date": "2026-09-05", "completed": True}
    )
    assert bob_rec.status_code == 201
    print("[PASS] Bob successfully logged completion for his own habit.")

    # Alice queries records by date -> Bob's record must NOT be visible
    alice_date_records = client.get(
        "/api/records/by-date/2026-09-05",
        headers={"Authorization": f"Bearer {alice_token}"}
    ).json()
    assert len(alice_date_records) == 0, "Alice should have 0 records logged for today"
    print("[PASS] Cross-user daily records are isolated.")

    # Unauthenticated request -> 401
    unauth_resp = client.get("/api/habits")
    assert unauth_resp.status_code == 401
    print("[PASS] Unauthenticated requests rejected with 401.")

    print("\n[SUCCESS] ALL MULTI-USER AUTHENTICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
