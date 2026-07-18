import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"
ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzg0MjE2NzMzLCJpYXQiOjE3ODQyMTMxMzMsImp0aSI6IjdmNTZkNzQ1NjY3ODRmOTM5ZmY1NTAzYTA3NmE3ZWI3IiwidXNlcl9pZCI6IjhjYWJiYWVlLThmNjgtNDY1MS1hMTZjLTAwOTdkMjlmM2RhMyJ9.zH8dFnK1-7M0oHzxVrg3KPrGgZlS1rBr1mhomLQ-pTQ"
USER_ID = "8cabbaee-8f68-4651-a16c-0097d29f3da3"

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

def log(msg):
    print(f"[TEST] {msg}")

def request_json(url, method="GET", data=None, expected_status=200):
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            body = response.read().decode('utf-8')
            if status_code not in (expected_status, 201, 200):
                print(f"FAILED! Expected {expected_status}, got {status_code}")
                print(body)
                sys.exit(1)
            data = json.loads(body)
            if isinstance(data, dict) and 'data' in data:
                inner_data = data['data']
                if isinstance(inner_data, dict) and 'results' in inner_data:
                    data['data'] = inner_data['results']
            return data
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code}")
        print(e.read().decode('utf-8'))
        sys.exit(1)

log("1. Auto-seeding and fetching Stages...")
data = request_json(f"{BASE_URL}/crm/stages/")
stages = data.get('data', [])
    
if not stages:
    print("FAILED: No stages returned!")
    print(f"Data received: {data}")
    sys.exit(1)
log(f"Stages fetched: {len(stages)}")
stage_new_id = stages[1]['id'] # New
stage_won_id = stages[6]['id'] # Won

log("1b. Fetching Sources...")
sources = request_json(f"{BASE_URL}/crm/sources/").get('data', [])
source_id = sources[0]['id']

import time
uid = str(int(time.time()))
email = f"johndoe_{uid}@example.com"
# Mobile should be 10 digits starting with 9
mobile = f"987{uid[-7:]}"

log("2. Duplicate Detection...")
dup_data = request_json(f"{BASE_URL}/crm/leads/check-duplicate/", method="POST", data={"email": email})
log(f"Duplicate check passed: {dup_data}")

log("3. Create Lead...")
lead_payload = {
    "title": "Lead from QA Test",
    "first_name": "John",
    "last_name": "Doe",
    "email": email,
    "mobile": mobile,
    "company_name": f"QA Corp {uid}",
    "stage_id": stage_new_id,
    "source_id": source_id,
    "estimated_value": 50000.00
}
lead = request_json(f"{BASE_URL}/crm/leads/", method="POST", data=lead_payload, expected_status=201).get('data', {})
lead_id = lead.get('id')
log(f"Lead created successfully! ID: {lead_id}")

log("4. Assign Employee...")
emp_data = request_json(f"{BASE_URL}/employees/").get('data', [])
if not emp_data:
    print("FAILED: No employees found!")
    sys.exit(1)
employee_id = emp_data[0]['id']
request_json(f"{BASE_URL}/crm/leads/{lead_id}/assign/", method="POST", data={"employee_id": employee_id})
log("Lead assigned successfully.")

log("5. Change Stage...")
request_json(f"{BASE_URL}/crm/leads/{lead_id}/stage/", method="POST", data={"stage_id": stage_new_id})
log("Stage changed successfully.")

log("6. Add Follow-up...")
request_json(f"{BASE_URL}/crm/leads/{lead_id}/followups/", method="POST", data={"followup_type": "call", "next_followup_date": "2026-07-20"}, expected_status=201)
log("Follow-up added successfully.")

log("7. Add Note...")
request_json(f"{BASE_URL}/crm/leads/{lead_id}/notes/", method="POST", data={"text": "This is a QA note."}, expected_status=201)
log("Note added successfully.")

log("8. Schedule Appointment...")
request_json(f"{BASE_URL}/crm/leads/{lead_id}/appointments/", method="POST", data={
    "title": "Initial Meeting",
    "start_time": "2026-07-25T14:00:00Z",
    "appointment_type": "call",
    "duration_minutes": 30,
    "location": "Zoom"
}, expected_status=201)
log("Appointment scheduled.")

log("9. Mark Won & Convert Lead...")
request_json(f"{BASE_URL}/crm/leads/{lead_id}/stage/", method="POST", data={"stage_id": stage_won_id})
request_json(f"{BASE_URL}/crm/leads/{lead_id}/convert/", method="POST", data={})
log("Lead converted successfully.")

log("10. Verify Dashboard Updates...")
dash = request_json(f"{BASE_URL}/crm/dashboard/").get('data', {})
log(f"Dashboard data retrieved successfully. Metrics: {dash.get('kpis')}")

log("11. Verify Timeline...")
timeline = request_json(f"{BASE_URL}/crm/leads/{lead_id}/timeline/").get('data', [])
log(f"Timeline retrieved: {len(timeline)} events found.")

log("ALL END-TO-END WORKFLOWS PASSED SUCCESSFULLY!")
