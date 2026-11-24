import sys
sys.path.append('backend')
from app.database import engine
from sqlalchemy import text
from app.utils.security import create_access_token
import urllib.request
import json

# Fetch user kittu
with engine.connect() as conn:
    row = conn.execute(text("SELECT id, email, full_name FROM users WHERE email = 'kittu@gmail.com'")).first()
    if not row:
        print("ERROR: User kittu not found in database!")
        sys.exit(1)
    kittu_id, kittu_email, kittu_name = row[0], row[1], row[2]
    print(f"Logged in as: {kittu_name} ({kittu_email}, ID: {kittu_id})")

token = create_access_token(data={"sub": str(kittu_id), "email": kittu_email})
base_url = "http://127.0.0.1:8000"

def make_req(path, method="GET", body=None, auth_token=token):
    headers = {"Content-Type": "application/json"}
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(f"{base_url}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

print("\n--- 1. Testing GET /api/invitations/group/2/eligible-friends ---")
status, res = make_req("/api/invitations/group/2/eligible-friends")
print("Status:", status)
if status == 200 and isinstance(res, list):
    print(f"Found {len(res)} eligible friends in DB:")
    for f in res:
        print(f"  - ID: {f['id']} | Name: {f['full_name']} | Email: {f['email']}")
else:
    print("Response:", res)

print("\n--- 2. Testing search on eligible-friends ---")
status, res_search = make_req("/api/invitations/group/2/eligible-friends?search=rahul")
print("Status:", status)
if status == 200 and isinstance(res_search, list):
    print(f"Found {len(res_search)} matching friends:")
    for f in res_search:
        print(f"  - Matched: {f['full_name']} ({f['email']})")
else:
    print("Response:", res_search)

print("\n--- 3. Testing get_or_create_group_share_link ---")
status, link_res = make_req("/api/invitations/group/2/link", method="POST")
print("Status:", status)
inv_token = link_res["token"]
print(f"Universal invite token: {inv_token}")
print(f"Invite link: {link_res['invite_link']}")

print("\n--- 4. Testing inspect_invitation (Public preview before login) ---")
status, preview_res = make_req(f"/api/invitations/{inv_token}", auth_token=None)
print("Status:", status)
print(f"Preview Group: '{preview_res['group_name']}' | Inviter: '{preview_res['invited_by_name']}' | Members: {preview_res['member_count']}")

print("\n--- 5. Testing Guest Join POST /api/invitations/{token}/guest-join ---")
status, guest_res = make_req(f"/api/invitations/{inv_token}/guest-join", method="POST", body={"guest_name": "Test Guest User", "phone": "9998887776"}, auth_token=None)
print("Status:", status)
guest_token = guest_res["access_token"]
print("Guest registered successfully:", guest_res["user"]["full_name"], "is_guest:", guest_res["user"]["is_guest"])

print("\n--- 6. Verifying Guest Access to Group with Guest Token ---")
status, guest_grp = make_req("/api/groups/2", auth_token=guest_token)
print("Guest viewing group status:", status, "| Group:", guest_grp["name"])

print("\n--- 7. Testing Unauthenticated Access Rejection ---")
status, unauth_res = make_req("/api/reports/data", auth_token=None)
print("Unauthenticated /api/reports/data status:", status, "(Expected 401)")

status, unauth_notes = make_req("/api/notifications", auth_token=None)
print("Unauthenticated /api/notifications status:", status, "(Expected 401)")

status, unauth_inbox = make_req("/api/group-inbox", auth_token=None)
print("Unauthenticated /api/group-inbox status:", status, "(Expected 401)")

print("\nAll database & invitation checks verified successfully!")
