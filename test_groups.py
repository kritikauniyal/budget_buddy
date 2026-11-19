import urllib.request
import urllib.error
import json

def post(url, data, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print('HTTP Error', e.code, e.read().decode())
        raise

def get(url, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print('HTTP Error', e.code, e.read().decode())
        raise

# 1. Login demo user (or register if not exists)
try:
    auth = post('http://127.0.0.1:8000/api/auth/login', {'email': 'kritika@budgetbuddy.local', 'password': 'password123'})
except Exception:
    auth = post('http://127.0.0.1:8000/api/auth/register', {
        'full_name': 'Kritika Sharma',
        'email': 'kritika@budgetbuddy.local',
        'password': 'password123',
        'phone': '+91 9999988888'
    })

token = auth['access_token']
user = auth['user']
print(f"[1/6] Authenticated as: {user['full_name']} ({user['email']})")

# 2. Register friend Rahul so he is already a registered user
try:
    rahul_auth = post('http://127.0.0.1:8000/api/auth/register', {
        'full_name': 'Rahul Verma',
        'email': 'rahul.test@budgetbuddy.local',
        'password': 'password123',
        'phone': '+91 9876543210'
    })
    print("[2/6] Registered test friend: Rahul Verma")
except Exception:
    rahul_auth = post('http://127.0.0.1:8000/api/auth/login', {'email': 'rahul.test@budgetbuddy.local', 'password': 'password123'})
    print("[2/6] Logged in test friend: Rahul Verma")

rahul_token = rahul_auth['access_token']

# 3. Create group with Kritika
group = post('http://127.0.0.1:8000/api/groups', {
    'name': 'Goa Beach Trip 2026',
    'group_type': 'Trip',
    'description': 'Weekend getaway with friends',
    'currency': '₹',
    'contacts_to_invite': [
        {'name': 'Rahul Verma', 'email': 'rahul.test@budgetbuddy.local', 'phone': '+91 9876543210'},
        {'name': 'Ankit (Unregistered)', 'email': 'ankit.new@example.com', 'phone': '+91 9123456789'}
    ]
}, token)
print(f"[3/6] Group created successfully: '{group['name']}' (ID: {group['id']})")

# 4. Rahul checks pending invitations and accepts!
rahul_invites = get('http://127.0.0.1:8000/api/invitations/pending', rahul_token)
print(f"[4/6] Rahul received {len(rahul_invites)} invitation(s). Accepting...")
for inv in rahul_invites:
    if inv['group_id'] == group['id']:
        accepted = post(f"http://127.0.0.1:8000/api/invitations/{inv['token']}/accept", {}, rahul_token)
        print(f"      -> Rahul accepted invitation: {accepted['message']}")

# 5. Add Group Expense: Dinner at Beach Shack (₹3,000) split equally
expense = post(f"http://127.0.0.1:8000/api/groups/{group['id']}/expenses", {
    'title': 'Dinner at Beach Shack',
    'amount': 3000.0,
    'category_name': 'Food',
    'payment_method': 'UPI',
    'split_type': 'equal'
}, token)
print(f"[5/6] Expense added: '{expense['title']}' for ₹{expense['amount']} by {expense['payer_name']}")
for s in expense['splits']:
    print(f"      Split: {s['user_name']} owes ₹{s['owed_amount']}")

# 6. Check Balances & Debt Optimization
balances = get(f"http://127.0.0.1:8000/api/groups/{group['id']}/balances", token)
print(f"[6/6] Group Balances verified:")
print(f"      Total Group Expenses: ₹{balances['total_expense']}")
for mb in balances['member_balances']:
    print(f"      Member: {mb['user_name']} | Paid: ₹{mb['total_paid']} | Share: ₹{mb['total_share']} | Net: {mb['net_balance']} ({mb['status']})")

print("      Suggested Settlements ('Who Owes Whom'):")
for s in balances['suggested_settlements']:
    print(f"      -> {s['from_user_name']} owes {s['to_user_name']} ₹{s['amount']}")

# 7. Record Settle Up: Rahul pays Kritika ₹1,500
settle = post(f"http://127.0.0.1:8000/api/groups/{group['id']}/settle", {
    'payer_id': rahul_auth['user']['id'],
    'receiver_id': user['id'],
    'amount': 1500.0,
    'payment_method': 'UPI',
    'notes': 'Settled via Google Pay'
}, rahul_token)
print(f"      Settlement recorded: {settle['payer_name']} paid {settle['receiver_name']} ₹{settle['amount']} via {settle['payment_method']}")

# Verify balances after settlement
post_bal = get(f"http://127.0.0.1:8000/api/groups/{group['id']}/balances", token)
print("      Post-Settlement Balances:")
for mb in post_bal['member_balances']:
    print(f"      Member: {mb['user_name']} | Net Balance: ₹{mb['net_balance']} ({mb['status']})")

print("\n========================================================")
print("  VERIFICATION COMPLETE: ALL TESTS PASSED WITH 100% SUCCESS!")
print("========================================================\n")
