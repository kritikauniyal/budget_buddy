import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def api_call(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        print(f"HTTPError on {method} {path} ({e.code}): {err_msg}")
        raise e

def main():
    print("================================================================")
    print("BUDGET BUDDY: ROOM SHARING MULTI-USER TEST SCENARIO")
    print("Members: Kritika, Rahul, Aman, Priya | Group: Room 204")
    print("================================================================")

    # 1. Register / Login all 4 users
    users = [
        {"name": "Kritika", "email": "kritika@room204.com", "phone": "9811111111", "password": "password123"},
        {"name": "Rahul", "email": "rahul@room204.com", "phone": "9822222222", "password": "password123"},
        {"name": "Aman", "email": "aman@room204.com", "phone": "9833333333", "password": "password123"},
        {"name": "Priya", "email": "priya@room204.com", "phone": "9844444444", "password": "password123"},
    ]

    tokens = {}
    user_ids = {}

    for u in users:
        # Try login first, register if not exists
        try:
            res = api_call("/api/auth/login", method="POST", data={"email": u["email"], "password": u["password"]})
        except Exception:
            res = api_call("/api/auth/register", method="POST", data={
                "full_name": u["name"],
                "email": u["email"],
                "phone": u["phone"],
                "password": u["password"]
            })
        tokens[u["name"]] = res["access_token"]
        user_ids[u["name"]] = res["user"]["id"]
        print(f"✓ Authenticated {u['name']} (ID: {user_ids[u['name']]})")

    # 2. Kritika creates the group "Room 204"
    group = api_call("/api/groups", method="POST", data={
        "name": "Room 204",
        "group_type": "Room Sharing",
        "description": "Flatmates sharing rent, groceries, electricity and Wi-Fi",
        "currency": "₹"
    }, token=tokens["Kritika"])
    group_id = group["id"]
    print(f"✓ Kritika created Group '{group['name']}' (ID: {group_id}, Type: {group['group_type']})")

    # 3. Add other 3 members: Rahul, Aman, Priya
    for friend_name in ["Rahul", "Aman", "Priya"]:
        invite = api_call(f"/api/invitations/group/{group_id}/invite", method="POST", data={
            "contacts": [{"name": friend_name, "email": f"{friend_name.lower()}@room204.com"}]
        }, token=tokens["Kritika"])
        token = invite[0]["token"]
        # Friend accepts invitation
        api_call(f"/api/invitations/{token}/accept", method="POST", token=tokens[friend_name])
        print(f"✓ {friend_name} accepted invite and joined Room 204")

    # Verify group members
    members = api_call(f"/api/groups/{group_id}/members", token=tokens["Kritika"])
    print(f"✓ Group Members Count: {len(members)} ({', '.join([m['full_name'] for m in members])})")
    assert len(members) == 4, f"Expected 4 members, got {len(members)}"

    # 4. Add Group Expenses
    # Kritika: Grocery ₹1,200
    e1 = api_call(f"/api/groups/{group_id}/expenses", method="POST", data={
        "title": "Grocery Shopping",
        "amount": 1200.0,
        "category_name": "Grocery",
        "paid_by": user_ids["Kritika"],
        "split_type": "equal",
        "payment_method": "UPI",
        "description": "Vegetables, milk, pulses for the week"
    }, token=tokens["Kritika"])
    print("✓ Kritika added: Grocery ₹1,200 (UPI)")

    # Rahul: Rent ₹20,000
    e2 = api_call(f"/api/groups/{group_id}/expenses", method="POST", data={
        "title": "Monthly Flat Rent",
        "amount": 20000.0,
        "category_name": "Rent",
        "paid_by": user_ids["Rahul"],
        "split_type": "equal",
        "payment_method": "Net Banking",
        "description": "November month house rent paid to landlord"
    }, token=tokens["Rahul"])
    print("✓ Rahul added: Flat Rent ₹20,000 (Net Banking)")

    # Aman: Electricity ₹1,500
    e3 = api_call(f"/api/groups/{group_id}/expenses", method="POST", data={
        "title": "Electricity Bill",
        "amount": 1500.0,
        "category_name": "Electricity",
        "paid_by": user_ids["Aman"],
        "split_type": "equal",
        "payment_method": "UPI",
        "description": "State power board bill"
    }, token=tokens["Aman"])
    print("✓ Aman added: Electricity Bill ₹1,500 (UPI)")

    # Priya: Wi-Fi ₹800
    e4 = api_call(f"/api/groups/{group_id}/expenses", method="POST", data={
        "title": "Airtel Wi-Fi Fiber",
        "amount": 800.0,
        "category_name": "Internet",
        "paid_by": user_ids["Priya"],
        "split_type": "equal",
        "payment_method": "UPI",
        "description": "High-speed broadband monthly recharge"
    }, token=tokens["Priya"])
    print("✓ Priya added: Airtel Wi-Fi Fiber ₹800 (UPI)")

    # 5. Group Inbox Consistency: Verify all 4 users see identical expenses
    for name in ["Kritika", "Rahul", "Aman", "Priya"]:
        inbox_expenses = api_call(f"/api/groups/{group_id}/expenses", token=tokens[name])
        assert len(inbox_expenses) == 4, f"{name} saw {len(inbox_expenses)} expenses instead of 4"
        total_in_inbox = sum(e["amount"] for e in inbox_expenses)
        assert total_in_inbox == 23500.0, f"{name} calculated total {total_in_inbox} instead of 23500"
    print("✓ Verified: All 4 members see identical shared group inbox expenses (Total: ₹23,500.00)")

    # 6. Verify Exact Balances:
    # Total = 23,500; Equal share = 5,875 each
    # Kritika: 1200 - 5875 = -4675 (owes 4675)
    # Rahul: 20000 - 5875 = +14125 (receives 14125)
    # Aman: 1500 - 5875 = -4375 (owes 4375)
    # Priya: 800 - 5875 = -5075 (owes 5075)
    balances = api_call(f"/api/groups/{group_id}/balances", token=tokens["Kritika"])
    bal_map = {b["user_name"]: b for b in balances["member_balances"]}

    print("\n--- Member Balances Calculation ---")
    for name, b in bal_map.items():
        print(f"  {name:10} | Paid: ₹{b['total_paid']:8.2f} | Share: ₹{b['total_share']:8.2f} | Net Balance: ₹{b['net_balance']:+9.2f} ({b['status']})")

    assert bal_map["Kritika"]["net_balance"] == -4675.0, f"Expected -4675.0, got {bal_map['Kritika']['net_balance']}"
    assert bal_map["Rahul"]["net_balance"] == 14125.0, f"Expected +14125.0, got {bal_map['Rahul']['net_balance']}"
    assert bal_map["Aman"]["net_balance"] == -4375.0, f"Expected -4375.0, got {bal_map['Aman']['net_balance']}"
    assert bal_map["Priya"]["net_balance"] == -5075.0, f"Expected -5075.0, got {bal_map['Priya']['net_balance']}"
    print("✓ Balance calculation matches exact specification formula: Net Balance = Total Paid - Total Share")

    print("\n--- Simplified Settlement Suggestions ---")
    for s in balances["suggested_settlements"]:
        print(f"  💸 {s['from_user_name']} pays {s['to_user_name']}: ₹{s['amount']:.2f}")

    # 7. Record Settlement: Kritika settles up with Rahul (₹4,675 via UPI)
    settlement = api_call(f"/api/groups/{group_id}/settle", method="POST", data={
        "payer_id": user_ids["Kritika"],
        "receiver_id": user_ids["Rahul"],
        "amount": 4675.0,
        "payment_method": "UPI",
        "notes": "Paid via Google Pay for flat share"
    }, token=tokens["Kritika"])
    print(f"\n✓ Recorded Settlement: Kritika paid Rahul ₹{settlement['amount']} via UPI")

    # 8. Verify updated balances after settlement
    updated_bal = api_call(f"/api/groups/{group_id}/balances", token=tokens["Rahul"])
    up_map = {b["user_name"]: b for b in updated_bal["member_balances"]}

    print("\n--- Updated Balances After Settlement ---")
    for name, b in up_map.items():
        print(f"  {name:10} | Paid: ₹{b['total_paid']:8.2f} | Share: ₹{b['total_share']:8.2f} | Net Balance: ₹{b['net_balance']:+9.2f} ({b['status']})")

    assert up_map["Kritika"]["net_balance"] == 0.0, f"Kritika should be settled (0.0), got {up_map['Kritika']['net_balance']}"
    assert up_map["Rahul"]["net_balance"] == 9450.0, f"Rahul should have 9450.0 remaining, got {up_map['Rahul']['net_balance']}"
    print("✓ Kritika is fully settled (₹0.00 balance). Rahul's remaining credit updated to +₹9,450.00!")

    # 9. Verify settlement history
    settlements = api_call(f"/api/groups/{group_id}/settlements", token=tokens["Priya"])
    assert len(settlements) >= 1
    print(f"✓ Settlement history verified: {settlements[0]['payer_name']} paid {settlements[0]['receiver_name']} ₹{settlements[0]['amount']}")

    print("\n================================================================")
    print("🎉 ALL TESTS PASSED SUCCESSFULLY! SMART EXPENSE SHARING VERIFIED.")
    print("================================================================")

if __name__ == "__main__":
    main()
