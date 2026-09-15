import sys, os
sys.path.insert(0, os.path.abspath("."))
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_reminders_api():
    login_res = client.post('/api/auth/login', json={'email': 'demo@habitflow.com', 'password': 'password123'})
    token = login_res.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # Create habit with reminder
    create_res = client.post('/api/habits', json={
        'name': 'Test Morning Jog',
        'description': '[Fitness] 30 days goal',
        'reminder_enabled': True,
        'reminder_time': '07:15'
    }, headers=headers)
    assert create_res.status_code == 201, create_res.text
    created = create_res.json()
    print('Created habit with reminder:', created['name'], created['reminder_enabled'], created['reminder_time'])
    assert created['reminder_enabled'] is True
    assert created['reminder_time'] == '07:15'

    habit_id = created['id']

    # Update reminder time
    update_res = client.put(f'/api/habits/{habit_id}', json={
        'reminder_time': '08:00',
        'reminder_enabled': False
    }, headers=headers)
    assert update_res.status_code == 200, update_res.text
    updated = update_res.json()
    print('Updated habit:', updated['name'], updated['reminder_enabled'], updated['reminder_time'])
    assert updated['reminder_enabled'] is False
    assert updated['reminder_time'] == '08:00'

    # Clean up test habit
    del_res = client.delete(f'/api/habits/{habit_id}', headers=headers)
    assert del_res.status_code == 204
    print('[SUCCESS] Reminder API end-to-end test passed successfully!')

if __name__ == '__main__':
    test_reminders_api()
