import sys, os
sys.path.insert(0, os.path.abspath("."))
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# User 1 demo user login
login_res = client.post("/api/auth/login", json={
    "email": "demo@habitflow.com",
    "password": "password123"
})
assert login_res.status_code == 200, f"Login failed: {login_res.text}"
token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Habit 1 is Diet
resp = client.get("/api/habits/1/statistics?period=week", headers=headers)
print("Week stats response:", resp.status_code, resp.json())
assert resp.status_code == 200
data = resp.json()
assert data["period"] == "week"
assert data["total_days"] == 7
assert "completed_days" in data
assert "completion_percentage" in data
assert len(data["days"]) == 7

# Month stats
resp_m = client.get("/api/habits/1/statistics?period=month", headers=headers)
print("Month stats response:", resp_m.status_code, resp_m.json())
assert resp_m.status_code == 200
data_m = resp_m.json()
assert data_m["period"] == "month"
assert "total_days" in data_m
assert "completed_days" in data_m
assert "completion_percentage" in data_m

print("[PASS] Backend statistics endpoint works flawlessly!")
