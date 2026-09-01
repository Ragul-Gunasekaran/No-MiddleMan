import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_regression_journey():
    print("--- STARTING NO MIDDLE MAN E2E REGRESSION TEST ---")
    
    # 1. Login Rajesh and BigMart
    print("\n1. Logging in Farmer Rajesh and Buyer BigMart...")
    r_login = requests.post(f"{BASE_URL}/api/auth/login", json={
        "phone": "9876543210",
        "password": "password123"
    })
    assert r_login.status_code == 200, "Rajesh login failed"
    rajesh_auth = r_login.json()
    rajesh = rajesh_auth['user']
    print(f"Rajesh Logged In (ID: {rajesh['id']})")
    
    b_login = requests.post(f"{BASE_URL}/api/auth/login", json={
        "phone": "8888888888",
        "password": "password123"
    })
    assert b_login.status_code == 200, "BigMart login failed"
    bigmart_auth = b_login.json()
    bigmart = bigmart_auth['user']
    print(f"BigMart Logged In (ID: {bigmart['id']}, Verified: {bigmart['is_verified']})")
    assert bigmart['is_verified'] is True, "Expected BigMart to be verified"

    # Headers for authentication
    rajesh_headers = {"Authorization": f"Bearer {rajesh_auth['access_token']}"}
    bigmart_headers = {"Authorization": f"Bearer {bigmart_auth['access_token']}"}
    
    # 2. Farmer Rajesh uploads crop: Tomato, 5 tons, Nashik
    print("\n2. Rajesh uploads Tomato crop listing...")
    r_crop = requests.post(f"{BASE_URL}/api/crops", headers=rajesh_headers, json={
        "crop_name": "Tomato",
        "variety": "Local Hybrid",
        "quantity": 5.0,
        "unit": "tons",
        "expected_price": 20.0,
        "location": "Nashik",
        "description": "Ready for loading"
    })
    assert r_crop.status_code == 200, "Crop upload failed"
    crop = r_crop.json()
    print(f"Crop uploaded: ID {crop['id']}, expected Rs.{crop['expected_price']}/{crop['unit']}")

    # 3. Check Smart Matches for Rajesh's crop
    print("\n3. Verifying Smart Matches for Rajesh's Tomato crop...")
    r_matches = requests.get(f"{BASE_URL}/api/crops/{crop['id']}/matches", headers=rajesh_headers)
    assert r_matches.status_code == 200, "Fetching matches failed"
    matches = r_matches.json()
    print(f"Matches found: {len(matches)}")
    
    # Find BigMart requirement in matches
    bigmart_match = next((m for m in matches if m["buyer_id"] == bigmart["id"]), None)
    assert bigmart_match is not None, "BigMart requirement should match Rajesh's tomatoes"
    print(f"BigMart Smart Match Score: {bigmart_match['score_details']['total_score']}%")
    print(f"Match Score Breakdown: {bigmart_match['score_details']}")
    
    # Expected score:
    # Crop: 40/40
    # Location (Nashik -> Nashik = 0km): 25/25
    # Quantity (5 tons = 5000 kg vs BigMart 10 tons = 10000 kg -> 50% ratio): 10/20
    # Price (Expected 20.0 <= max budget 25.0 * 0.8 (20.0)): 15/15
    # Total = 40 + 25 + 10 + 15 = 90.0
    expected_score = 90.0
    assert bigmart_match['score_details']['total_score'] == expected_score, f"Expected match score {expected_score}, got {bigmart_match['score_details']['total_score']}"
    print("OK: Smart Match formula scoring validated successfully!")

    # 4. Find Suppliers for BigMart Requirement
    print("\n4. Verifying inverse Find Suppliers smart match discovery...")
    # Find BigMart requirement ID
    r_reqs = requests.get(f"{BASE_URL}/api/requirements/my", headers=bigmart_headers)
    assert r_reqs.status_code == 200
    reqs = r_reqs.json()
    bigmart_req = next((r for r in reqs if r["crop_name"] == "Tomato"), None)
    assert bigmart_req is not None
    
    # Fetch matching suppliers
    b_matches = requests.get(f"{BASE_URL}/api/requirements/{bigmart_req['id']}/matches", headers=bigmart_headers)
    assert b_matches.status_code == 200
    suppliers = b_matches.json()
    rajesh_supplier_match = next((s for s in suppliers if s["farmer_id"] == rajesh["id"]), None)
    assert rajesh_supplier_match is not None, "Rajesh Patil crop listing should show up as matching BigMart requirement"
    print(f"Find Suppliers Score for Rajesh Patil: {rajesh_supplier_match['score_details']['total_score']}%")
    assert rajesh_supplier_match['score_details']['total_score'] == expected_score
    print("OK: Find Suppliers matching validated successfully!")

    # 5. Buyer BigMart sends Rs.18/kg offer
    print("\n5. BigMart sends Rs.18/kg offer on Rajesh's Tomatoes...")
    b_offer = requests.post(f"{BASE_URL}/api/crops/{crop['id']}/offers", headers=bigmart_headers, json={
        "offered_price_per_unit": 18.0,
        "quantity": 5.0,
        "message": "We can offer Rs.18/kg."
    })
    assert b_offer.status_code == 200
    offer = b_offer.json()
    print(f"Offer sent: ID {offer['id']}, price: Rs.{offer['offered_price_per_unit']}")

    # 6. Rajesh views offers and compares with Market Reference Price
    print("\n6. Rajesh reviews offers and checks market reference price...")
    r_offers = requests.get(f"{BASE_URL}/api/crops/{crop['id']}/offers", headers=rajesh_headers)
    assert r_offers.status_code == 200
    offers = r_offers.json()
    assert len(offers) > 0
    crop_offer = next((o for o in offers if o["id"] == offer["id"]), None)
    assert crop_offer is not None
    
    # Retrieve reference market price
    r_ref = requests.get(f"{BASE_URL}/api/market-prices/{crop['crop_name']}")
    assert r_ref.status_code == 200
    ref = r_ref.json()
    print(f"Tomato Market Reference: Rs.{ref['reference_price']}/{ref['unit']}")
    print(f"Offer Price: Rs.{crop_offer['offered_price_per_unit']}")
    # Verify offer is below reference
    is_below = crop_offer['offered_price_per_unit'] < ref['reference_price']
    print(f"Is offer below reference? {is_below}")
    assert is_below is True
    print("OK: Market Price Warning condition verified successfully!")

    # 7. Rajesh sends counter offer of Rs.20/kg...
    print("\n7. Rajesh sends counter offer of Rs.20/kg...")
    r_counter = requests.post(f"{BASE_URL}/api/offers/{offer['id']}/respond", headers=rajesh_headers, json={
        "status": "countered",
        "counter_price": 20.0,
        "message": "Can you do Rs.20/kg?"
    })
    assert r_counter.status_code == 200
    counter = r_counter.json()
    assert counter["status"] == "countered"
    assert counter["offered_price_per_unit"] == 20.0
    print(f"Counter offer set to: Rs.{counter['offered_price_per_unit']}")

    # 8. BigMart accepts the counter offer
    print("\n8. BigMart accepts counter offer...")
    b_accept = requests.post(f"{BASE_URL}/api/offers/{offer['id']}/respond", headers=bigmart_headers, json={
        "status": "accepted",
        "message": "Yes, we accept Rs.20/kg."
    })
    assert b_accept.status_code == 200
    accepted = b_accept.json()
    assert accepted["status"] == "accepted"
    print(f"Offer Status: {accepted['status']}")

    # 9. Verify final deal state and negotiation history
    print("\n9. Verifying final deal state and negotiation logs...")
    # Fetch negotiation messages
    r_msgs = requests.get(f"{BASE_URL}/api/offers/{offer['id']}/messages", headers=rajesh_headers)
    assert r_msgs.status_code == 200
    msgs = r_msgs.json()
    print(f"Negotiation message logs (Count: {len(msgs)}):")
    for m in msgs:
        msg_text = m['message_text'].replace('₹', 'Rs.')
        print(f" - Sender {m['sender_id']}: {msg_text}")
        
    assert len(msgs) >= 3, "Expected at least 3 negotiation messages"
    print("OK: E2E Deal State and chat logs verified!")
    print("\nALL E2E REGRESSION CHECKS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    try:
        test_regression_journey()
        sys.exit(0)
    except Exception as e:
        print(f"\nTest failed: {e}")
        sys.exit(1)
