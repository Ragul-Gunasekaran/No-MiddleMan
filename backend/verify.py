import sys
import os

# Ensure project root is in the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.matching import calculate_match_score, convert_to_kg
from pydantic import BaseModel

class MockCrop:
    def __init__(self, crop_name, quantity, unit, expected_price, location, variety="Local"):
        self.crop_name = crop_name
        self.quantity = quantity
        self.unit = unit
        self.expected_price = expected_price
        self.location = location
        self.variety = variety

class MockRequirement:
    def __init__(self, crop_name, required_quantity, unit, preferred_location, max_price, max_distance_km=100.0):
        self.crop_name = crop_name
        self.required_quantity = required_quantity
        self.unit = unit
        self.preferred_location = preferred_location
        self.max_price = max_price
        self.max_distance_km = max_distance_km

def test_unit_normalization():
    print("Testing unit normalization to kg...")
    assert convert_to_kg(5.0, "tons") == 5000.0
    assert convert_to_kg(10.0, "ton") == 10000.0
    assert convert_to_kg(100.0, "kg") == 100.0
    assert convert_to_kg(4.0, "bags") == 200.0
    print("OK: Unit normalization is correct.")

def test_perfect_matching_score():
    print("\nTesting perfect match score (expected 100/100)...")
    crop = MockCrop(crop_name="Tomato", quantity=5.0, unit="tons", expected_price=20.0, location="Nashik")
    req = MockRequirement(crop_name="Tomato", required_quantity=5000.0, unit="kg", preferred_location="Nashik", max_price=25.0, max_distance_km=100.0)
    
    score = calculate_match_score(crop, req)
    print(f"Calculated score details: {score}")
    assert score["crop_score"] == 40.0, f"Expected crop score 40, got {score['crop_score']}"
    assert score["location_score"] == 25.0, f"Expected location score 25, got {score['location_score']}"
    assert score["quantity_score"] == 20.0, f"Expected quantity score 20, got {score['quantity_score']}"
    assert score["price_score"] == 15.0, f"Expected price score 15, got {score['price_score']}"
    assert score["total_score"] == 100.0, f"Expected total score 100, got {score['total_score']}"
    print("OK: Perfect match score calculates correctly.")

def test_gradual_price_matching_score():
    print("\nTesting gradual price match score and matching limits...")
    
    # Case A: expected price (24) is near max price (25) -> Price score should decrease gradually
    crop = MockCrop(crop_name="Tomato", quantity=5.0, unit="tons", expected_price=24.0, location="Nashik")
    req = MockRequirement(crop_name="Tomato", required_quantity=10000.0, unit="kg", preferred_location="Maharashtra", max_price=25.0, max_distance_km=150.0)
    
    score = calculate_match_score(crop, req)
    print(f"Calculated gradual score: {score}")
    # Expected scores:
    # Crop: 40/40
    # Location (Nashik -> Maharashtra = 80km, max_distance = 150km): 15/25
    # Quantity (5000kg vs 10000kg = 50% ratio): 10/20
    # Price (24.0 relative to max 25.0, 0.8*max = 20.0):
    # Interpolated score: 15.0 - 5.0 * (24.0 - 20.0) / (25.0 - 20.0) = 15.0 - 5.0 * (4.0/5.0) = 11.0
    assert score["price_score"] == 11.0, f"Expected price score 11.0, got {score['price_score']}"
    assert score["total_score"] == 76.0, f"Expected total score 76.0, got {score['total_score']}"
    print("OK: Gradual price fit is correctly interpolated.")
    
    # Case B: expected price (28) exceeds max price (25) -> Price score should be 0.0
    crop_exorbitant = MockCrop(crop_name="Tomato", quantity=5.0, unit="tons", expected_price=28.0, location="Nashik")
    score_exorbitant = calculate_match_score(crop_exorbitant, req)
    print(f"Calculated exorbitant score: {score_exorbitant}")
    assert score_exorbitant["price_score"] == 0.0, f"Expected price score 0, got {score_exorbitant['price_score']}"
    print("OK: Price exceeding maximum correctly yields 0 points.")

def test_negative_matching_score():
    print("\nTesting negative match score (expected low/zero score)...")
    crop = MockCrop(crop_name="Tomato", quantity=5.0, unit="tons", expected_price=20.0, location="Nashik")
    req = MockRequirement(crop_name="Wheat", required_quantity=5000.0, unit="kg", preferred_location="Nashik", max_price=25.0, max_distance_km=100.0)
    
    score = calculate_match_score(crop, req)
    print(f"Calculated negative match score details: {score}")
    assert score["crop_score"] == 0.0, f"Expected crop score 0, got {score['crop_score']}"
    assert score["total_score"] < 60.0, f"Expected total score to be low, got {score['total_score']}"
    print("OK: Non-matching crop types correctly result in a 0 crop score.")

if __name__ == "__main__":
    print("--- Running NO MIDDLE MAN Smart Match Engine verification tests ---")
    try:
        test_unit_normalization()
        test_perfect_matching_score()
        test_gradual_price_matching_score()
        test_negative_matching_score()
        print("\nAll math verification checks PASSED successfully!")
        sys.exit(0)
    except AssertionError as e:
        print(f"\nVerification FAILED: {e}")
        sys.exit(1)
