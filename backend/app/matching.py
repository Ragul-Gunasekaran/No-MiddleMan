import logging

logger = logging.getLogger("matching")

# Helper to normalize units to kilograms (kg)
def convert_to_kg(quantity: float, unit: str) -> float:
    unit_lower = unit.lower().strip()
    if unit_lower in ["ton", "tons", "t"]:
        return quantity * 1000.0
    elif unit_lower in ["bag", "bags"]:
        return quantity * 50.0 # Standard agricultural bag size (approx 50kg)
    elif unit_lower in ["kg", "kgs", "kilogram", "kilograms"]:
        return quantity
    else:
        # Fallback
        return quantity

# Mock distance database for realistic calculation
# Format: (city1, city2) -> distance in km
MOCK_DISTANCES = {
    ("nashik", "nashik"): 0,
    ("mumbai", "mumbai"): 0,
    ("pune", "pune"): 0,
    ("nashik", "mumbai"): 120,
    ("mumbai", "nashik"): 120,
    ("nashik", "pune"): 150,
    ("pune", "nashik"): 150,
    ("mumbai", "pune"): 100,
    ("pune", "mumbai"): 100,
}

def get_distance(loc1: str, loc2: str) -> float:
    l1 = loc1.lower().strip()
    l2 = loc2.lower().strip()
    
    # Direct lookup
    if (l1, l2) in MOCK_DISTANCES:
        return float(MOCK_DISTANCES[(l1, l2)])
    if (l2, l1) in MOCK_DISTANCES:
        return float(MOCK_DISTANCES[(l2, l1)])
        
    # Substring checks
    if l1 in l2 or l2 in l1:
        return 0.0
        
    # Region similarity check (e.g. maharashtra)
    mh_keywords = {"maharashtra", "mh", "nashik", "pune", "mumbai", "satara", "nagpur", "aurangabad"}
    if any(k in l1 for k in mh_keywords) and any(k in l2 for k in mh_keywords):
        return 80.0
        
    # Fallback default distance
    return 300.0

def calculate_match_score(crop, req) -> dict:
    """
    Calculates a dynamic matching score (out of 100 points) between a Crop and a Buyer Requirement.
    - Crop Name Match (40 pts)
    - Location Proximity Match (25 pts)
    - Quantity Compatibility Match (20 pts)
    - Price Fit Match (15 pts)
    """
    score_details = {}
    total_score = 0.0
    
    # 1. Crop Match (40 points)
    c_name = crop.crop_name.lower().strip()
    r_name = req.crop_name.lower().strip()
    if c_name == r_name:
        crop_score = 40.0
    elif c_name in r_name or r_name in c_name:
        crop_score = 25.0
    else:
        crop_score = 0.0
    total_score += crop_score
    score_details["crop_score"] = crop_score
    
    # 2. Location/Distance Match (25 points)
    distance = get_distance(crop.location, req.preferred_location)
    max_dist = req.max_distance_km if req.max_distance_km else 100.0
    
    if distance == 0.0:
        loc_score = 25.0
    elif distance <= max_dist * 0.5:
        loc_score = 20.0
    elif distance <= max_dist:
        loc_score = 15.0
    elif distance <= max_dist * 1.5:
        loc_score = 5.0
    else:
        loc_score = 0.0
    total_score += loc_score
    score_details["location_score"] = loc_score
    score_details["distance_km"] = distance
    
    # 3. Quantity Fit (20 points)
    crop_qty_kg = convert_to_kg(crop.quantity, crop.unit)
    req_qty_kg = convert_to_kg(req.required_quantity, req.unit)
    
    if req_qty_kg <= 0:
        qty_score = 0.0
    else:
        ratio = crop_qty_kg / req_qty_kg
        if 0.7 <= ratio <= 1.5:
            qty_score = 20.0
        elif 0.5 <= ratio <= 2.0:
            qty_score = 10.0
        else:
            qty_score = 2.0
            
    total_score += qty_score
    score_details["quantity_score"] = qty_score
    score_details["crop_qty_kg"] = crop_qty_kg
    score_details["req_qty_kg"] = req_qty_kg
    
    # 4. Price Fit (15 points)
    # Expected Price (Farmer) vs Max Price (Buyer)
    exp_price = crop.expected_price
    max_price = req.max_price
    
    if max_price <= 0:
        price_score = 0.0
    elif exp_price <= max_price * 0.8:
        price_score = 15.0
    elif exp_price > max_price:
        price_score = 0.0
    else:
        # Interpolated price score from 15 down to 10 points
        price_score = 15.0 - 5.0 * (exp_price - 0.8 * max_price) / (0.2 * max_price)
        
    total_score += price_score
    score_details["price_score"] = round(price_score, 1)
    
    if crop_score == 0.0:
        total_score = 0.0
        
    score_details["total_score"] = round(total_score, 1)
    return score_details

def find_matches_for_crop(db, crop) -> list:
    """
    Queries all buyer requirements and scores them against the given crop.
    Returns list of matching buyer requirements with score details.
    """
    from app.models import BuyerRequirement, User
    
    # Get all active requirements
    requirements = db.query(BuyerRequirement).all()
    matches = []
    
    for req in requirements:
        score_details = calculate_match_score(crop, req)
        
        # We only consider it a match if they share some crop similarities (crop score > 0)
        if score_details["crop_score"] > 0:
            buyer = db.query(User).filter(User.id == req.buyer_id).first()
            matches.append({
                "requirement": req,
                "buyer": buyer,
                "score_details": score_details
            })
            
    # Sort matches by total score descending
    matches.sort(key=lambda x: x["score_details"]["total_score"], reverse=True)
    return matches

def find_matches_for_requirement(db, req) -> list:
    """
    Queries all active crops and scores them against the given buyer requirement.
    Returns list of matching crops with score details.
    """
    from app.models import Crop, User
    
    # Get all active crops
    crops = db.query(Crop).filter(Crop.status == "active").all()
    matches = []
    
    for crop in crops:
        score_details = calculate_match_score(crop, req)
        
        # We only consider it a match if they share some crop similarities (crop score > 0)
        if score_details["crop_score"] > 0:
            farmer = db.query(User).filter(User.id == crop.farmer_id).first()
            matches.append({
                "crop": crop,
                "farmer": farmer,
                "score_details": score_details
            })
            
    # Sort matches by total score descending
    matches.sort(key=lambda x: x["score_details"]["total_score"], reverse=True)
    return matches
