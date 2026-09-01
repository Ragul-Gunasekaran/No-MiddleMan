import requests
import sys

BASE_URL = "http://localhost:8000/api"

def run_test():
    print("--- STARTING MULTI-USER ISOLATION & REGISTRATION TEST ---")
    
    # 1. Register users
    users_to_register = [
        {"phone": "9000000001", "name": "Farmer A", "password": "password123", "location": "Nashik", "role": "FARMER"},
        {"phone": "9000000002", "name": "Farmer B", "password": "password123", "location": "Pune", "role": "FARMER"},
        {"phone": "9000000003", "name": "Buyer A", "password": "password123", "location": "Nashik", "role": "BUYER"},
        {"phone": "9000000004", "name": "Buyer B", "password": "password123", "location": "Pune", "role": "BUYER"},
    ]
    
    sessions = {}
    
    for u in users_to_register:
        # Register if not already exists (ignore if phone already registered error)
        reg_resp = requests.post(f"{BASE_URL}/auth/register", json=u)
        if reg_resp.status_code == 400 and "already registered" in reg_resp.json().get("detail", ""):
            print(f"User {u['name']} already registered. Proceeding to login.")
        elif reg_resp.status_code != 200:
            print(f"FAIL: Registration failed for {u['name']}: {reg_resp.text}")
            sys.exit(1)
        else:
            print(f"OK: Registered user {u['name']} (Verified: {reg_resp.json()['is_verified']})")
            assert reg_resp.json()["is_verified"] is False, "Newly registered users must have is_verified = False"
            
        # Log in
        login_resp = requests.post(f"{BASE_URL}/auth/login", json={"phone": u["phone"], "password": u["password"]})
        if login_resp.status_code != 200:
            print(f"FAIL: Login failed for {u['name']}: {login_resp.text}")
            sys.exit(1)
        
        auth_res = login_resp.json()
        user_id = auth_res["user"]["id"]
        sessions[u["name"]] = {"id": user_id, "headers": {"Authorization": f"Bearer {auth_res['access_token']}"}}
        print(f"OK: Logged in {u['name']} (ID: {user_id})")

    # 2. Upload crops
    # Farmer A uploads Tomato
    crop_a_resp = requests.post(
        f"{BASE_URL}/crops",
        json={"crop_name": "Tomato", "variety": "Hybrid A", "quantity": 5.0, "unit": "tons", "expected_price": 20.0, "location": "Nashik"},
        headers=sessions["Farmer A"]["headers"]
    )
    assert crop_a_resp.status_code == 200
    crop_a_id = crop_a_resp.json()["id"]
    print(f"OK: Farmer A listed Tomato (ID: {crop_a_id})")

    # Farmer B uploads Onion
    crop_b_resp = requests.post(
        f"{BASE_URL}/crops",
        json={"crop_name": "Onion", "variety": "Red B", "quantity": 10.0, "unit": "tons", "expected_price": 15.0, "location": "Pune"},
        headers=sessions["Farmer B"]["headers"]
    )
    assert crop_b_resp.status_code == 200
    crop_b_id = crop_b_resp.json()["id"]
    print(f"OK: Farmer B listed Onion (ID: {crop_b_id})")

    # 3. Verify user crop isolation
    # Farmer A lists my crops
    my_crops_a = requests.get(f"{BASE_URL}/crops/my", headers=sessions["Farmer A"]["headers"]).json()
    assert any(c["id"] == crop_a_id for c in my_crops_a)
    assert not any(c["id"] == crop_b_id for c in my_crops_a)
    print("OK: Farmer A only sees Farmer A's crops in my crops list.")

    # Farmer A attempts to update Farmer B's crop (expect 403)
    hack_update = requests.put(
        f"{BASE_URL}/crops/{crop_b_id}",
        json={"crop_name": "Tomato Hacked", "variety": "Hybrid", "quantity": 5.0, "unit": "tons", "expected_price": 20.0, "location": "Nashik"},
        headers=sessions["Farmer A"]["headers"]
    )
    assert hack_update.status_code == 403
    print("OK: Farmer A blocked from updating Farmer B's crop listing.")

    # Farmer A attempts to delete Farmer B's crop (expect 403)
    hack_delete = requests.delete(
        f"{BASE_URL}/crops/{crop_b_id}",
        headers=sessions["Farmer A"]["headers"]
    )
    assert hack_delete.status_code == 403
    print("OK: Farmer A blocked from deleting Farmer B's crop listing.")

    # 4. Create requirements
    # Buyer A requirement
    req_a_resp = requests.post(
        f"{BASE_URL}/requirements",
        json={"crop_name": "Tomato", "required_quantity": 5.0, "unit": "tons", "preferred_location": "Nashik", "max_price": 25.0},
        headers=sessions["Buyer A"]["headers"]
    )
    assert req_a_resp.status_code == 200
    req_a_id = req_a_resp.json()["id"]
    print(f"OK: Buyer A posted Tomato requirement (ID: {req_a_id})")

    # Buyer B requirement
    req_b_resp = requests.post(
        f"{BASE_URL}/requirements",
        json={"crop_name": "Onion", "required_quantity": 10.0, "unit": "tons", "preferred_location": "Pune", "max_price": 18.0},
        headers=sessions["Buyer B"]["headers"]
    )
    assert req_b_resp.status_code == 200
    req_b_id = req_b_resp.json()["id"]
    print(f"OK: Buyer B posted Onion requirement (ID: {req_b_id})")

    # 5. Verify user requirement isolation
    my_reqs_a = requests.get(f"{BASE_URL}/requirements/my", headers=sessions["Buyer A"]["headers"]).json()
    assert any(r["id"] == req_a_id for r in my_reqs_a)
    assert not any(r["id"] == req_b_id for r in my_reqs_a)
    print("OK: Buyer A only sees Buyer A's requirements.")

    # 6. Verify offer and negotiation isolation
    # Buyer A offers on Farmer A's crop
    offer_resp = requests.post(
        f"{BASE_URL}/crops/{crop_a_id}/offers",
        json={"offered_price_per_unit": 22.0, "quantity": 5.0, "message": "Can load tomorrow"},
        headers=sessions["Buyer A"]["headers"]
    )
    assert offer_resp.status_code == 200
    offer_id = offer_resp.json()["id"]
    print(f"OK: Buyer A placed offer on Farmer A's crop (Offer ID: {offer_id})")

    # Buyer B tries to view Buyer A's negotiation messages (expect 403)
    hack_messages = requests.get(
        f"{BASE_URL}/offers/{offer_id}/messages",
        headers=sessions["Buyer B"]["headers"]
    )
    assert hack_messages.status_code == 403
    print("OK: Buyer B blocked from viewing Buyer A's negotiation chat messages.")

    # Buyer B tries to send message in Buyer A's negotiation (expect 403)
    hack_send_msg = requests.post(
        f"{BASE_URL}/offers/{offer_id}/messages",
        json={"message_text": "Hacked message"},
        headers=sessions["Buyer B"]["headers"]
    )
    assert hack_send_msg.status_code == 403
    print("OK: Buyer B blocked from writing messages in Buyer A's negotiation chat.")

    # Buyer B tries to respond to Buyer A's offer (expect 403)
    hack_respond = requests.post(
        f"{BASE_URL}/offers/{offer_id}/respond",
        json={"status": "accepted"},
        headers=sessions["Buyer B"]["headers"]
    )
    assert hack_respond.status_code == 403
    print("OK: Buyer B blocked from responding/accepting Buyer A's offer.")

    print("\nALL MULTI-USER ISOLATION & REGISTRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_test()
