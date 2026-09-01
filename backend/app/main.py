from fastapi import FastAPI, HTTPException, Depends, Header, status, Request
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import logging
import os
from datetime import datetime, timedelta
import jwt

from app.database import get_db, init_db
from app.models import (
    User, Crop, BuyerRequirement, Offer, Negotiation,
    UserRegister, UserLogin, UserResponse, AuthResponse,
    CropCreate, CropResponse,
    RequirementCreate, RequirementResponse,
    OfferCreate, OfferResponse, OfferUpdateStatus,
    NegotiationCreate, NegotiationResponse
)
from app.matching import find_matches_for_crop, calculate_match_score
from passlib.context import CryptContext

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main_server")

# Initialize database tables and seed data
init_db()

app = FastAPI(
    title="NO MIDDLE MAN API",
    description="Connect farmers directly with buyers, smart matching and negotiation platform",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing configuration
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

# JWT Configuration
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "development_secret_key_change_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Secure JWT Authentication Dependency
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise credentials_exception
    return user

# Mock market reference prices for key crops (Phase 4 Market Support)
MOCK_MARKET_PRICES = {
    "tomato": {"name": "Tomato", "reference_price": 22.0, "unit": "kg"},
    "potato": {"name": "Potato", "reference_price": 18.0, "unit": "kg"},
    "onion": {"name": "Onion", "reference_price": 25.0, "unit": "kg"},
    "rice": {"name": "Rice", "reference_price": 40.0, "unit": "kg"},
    "wheat": {"name": "Wheat", "reference_price": 28.0, "unit": "kg"},
}


# ==========================================
# Authentication Endpoints
# ==========================================

@app.post("/api/auth/register", response_model=AuthResponse)
def register(req: UserRegister, db: Session = Depends(get_db)):
    # Check if phone exists
    existing_user = db.query(User).filter(User.phone == req.phone).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Phone number already registered")
        
    user = User(
        name=req.name,
        role=req.role.upper(),
        phone=req.phone,
        password_hash=pwd_context.hash(req.password),
        location=req.location,
        is_verified=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.post("/api/auth/login", response_model=AuthResponse)
def login(req: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == req.phone).first()
    if not user or not pwd_context.verify(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid phone or password")
        
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/api/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()


# ==========================================
# Crop Listings Endpoints (Farmers)
# ==========================================

@app.post("/api/crops", response_model=CropResponse)
def create_crop(req: CropCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "FARMER":
        raise HTTPException(status_code=403, detail="Only farmers can upload crops")
        
    crop = Crop(
        farmer_id=current_user.id,
        crop_name=req.crop_name,
        variety=req.variety,
        quantity=req.quantity,
        unit=req.unit,
        expected_price=req.expected_price,
        location=req.location,
        description=req.description,
        status="active"
    )
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop

@app.get("/api/crops", response_model=List[CropResponse])
def list_all_crops(db: Session = Depends(get_db)):
    return db.query(Crop).filter(Crop.status == "active").all()

@app.get("/api/crops/my", response_model=List[CropResponse])
def list_my_crops(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Crop).filter(Crop.farmer_id == current_user.id).all()

@app.put("/api/crops/{crop_id}", response_model=CropResponse)
def update_crop(crop_id: int, req: CropCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop listing not found")
    if crop.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to modify this crop listing")
    
    crop.crop_name = req.crop_name
    crop.variety = req.variety
    crop.quantity = req.quantity
    crop.unit = req.unit
    crop.expected_price = req.expected_price
    crop.location = req.location
    crop.description = req.description
    
    db.commit()
    db.refresh(crop)
    return crop

@app.delete("/api/crops/{crop_id}")
def delete_crop(crop_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop listing not found")
    if crop.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to delete this crop listing")
    
    db.delete(crop)
    db.commit()
    return {"success": True, "message": "Crop listing deleted successfully"}


# ==========================================
# Buyer Requirements Endpoints (Buyers)
# ==========================================

@app.post("/api/requirements", response_model=RequirementResponse)
def create_requirement(req: RequirementCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "BUYER":
        raise HTTPException(status_code=403, detail="Only buyers can create requirements")
        
    requirement = BuyerRequirement(
        buyer_id=current_user.id,
        crop_name=req.crop_name,
        required_quantity=req.required_quantity,
        unit=req.unit,
        preferred_location=req.preferred_location,
        max_price=req.max_price,
        max_distance_km=req.max_distance_km
    )
    db.add(requirement)
    db.commit()
    db.refresh(requirement)
    return requirement

@app.get("/api/requirements/my", response_model=List[RequirementResponse])
def list_my_requirements(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "BUYER":
        raise HTTPException(status_code=403, detail="Only buyers have requirements")
    return db.query(BuyerRequirement).filter(BuyerRequirement.buyer_id == current_user.id).all()

@app.get("/api/requirements", response_model=List[RequirementResponse])
def list_all_requirements(db: Session = Depends(get_db)):
    return db.query(BuyerRequirement).all()


# ==========================================
# Smart Match Engine Endpoints
# ==========================================

@app.get("/api/crops/{crop_id}/matches")
def get_crop_matches(crop_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
        
    if crop.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to view matches for this crop")
        
    matches = find_matches_for_crop(db, crop)
    
    # Map into a clean client-friendly format
    result = []
    for match in matches:
        req = match["requirement"]
        buyer = match["buyer"]
        score = match["score_details"]
        
        result.append({
            "requirement_id": req.id,
            "buyer_id": buyer.id,
            "buyer_name": buyer.name,
            "buyer_location": buyer.location,
            "buyer_verified": buyer.is_verified,
            "crop_name": req.crop_name,
            "required_quantity": req.required_quantity,
            "unit": req.unit,
            "max_price": req.max_price,
            "max_distance_km": req.max_distance_km,
            "score_details": score
        })
    return result

@app.get("/api/requirements/{req_id}/matches")
def get_requirement_matches(req_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(BuyerRequirement).filter(BuyerRequirement.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")
        
    if req.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to view matches for this requirement")
        
    from app.matching import find_matches_for_requirement
    matches = find_matches_for_requirement(db, req)
    
    result = []
    for match in matches:
        crop = match["crop"]
        farmer = match["farmer"]
        score = match["score_details"]
        
        result.append({
            "crop_id": crop.id,
            "farmer_id": farmer.id,
            "farmer_name": farmer.name,
            "farmer_location": farmer.location,
            "farmer_verified": farmer.is_verified,
            "crop_name": crop.crop_name,
            "variety": crop.variety,
            "quantity": crop.quantity,
            "unit": crop.unit,
            "expected_price": crop.expected_price,
            "score_details": score
        })
    return result


# ==========================================
# Market Support (Reference Prices)
# ==========================================

@app.get("/api/market-prices")
def get_market_prices():
    return MOCK_MARKET_PRICES

@app.get("/api/market-prices/{crop_name}")
def get_market_price_for_crop(crop_name: str):
    key = crop_name.lower().strip()
    if key in MOCK_MARKET_PRICES:
        return MOCK_MARKET_PRICES[key]
    # General fallback with seed average price
    return {"name": crop_name.capitalize(), "reference_price": 20.0, "unit": "kg", "is_fallback": True}


# ==========================================
# Offers Endpoints (Negotiations)
# ==========================================

@app.post("/api/crops/{crop_id}/offers", response_model=OfferResponse)
def submit_offer(crop_id: int, req: OfferCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "BUYER":
        raise HTTPException(status_code=403, detail="Only buyers can submit offers")
        
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop listing not found")
        
    offer = Offer(
        crop_id=crop_id,
        buyer_id=current_user.id,
        offered_price_per_unit=req.offered_price_per_unit,
        quantity=req.quantity,
        status="pending",
        message=req.message
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)
    
    # Save the initial offer note as the first negotiation message
    if req.message:
        neg = Negotiation(
            offer_id=offer.id,
            sender_id=current_user.id,
            message_text=req.message
        )
        db.add(neg)
        db.commit()
        
    return offer

@app.get("/api/crops/{crop_id}/offers", response_model=List[OfferResponse])
def get_crop_offers(crop_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
        
    # Check authorization (only listing owner farmer or buyers can access)
    if current_user.role == "FARMER" and crop.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to crop offers")
        
    return db.query(Offer).filter(Offer.crop_id == crop_id).all()

@app.get("/api/offers/my", response_model=List[OfferResponse])
def list_my_offers(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "FARMER":
        # Received offers for farmer's crops
        return db.query(Offer).join(Crop).filter(Crop.farmer_id == current_user.id).all()
    else:
        # Sent offers by buyer
        return db.query(Offer).filter(Offer.buyer_id == current_user.id).all()

@app.post("/api/offers/{offer_id}/respond", response_model=OfferResponse)
def respond_to_offer(offer_id: int, req: OfferUpdateStatus, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
        
    crop = db.query(Crop).filter(Crop.id == offer.crop_id).first()
    
    # Validation logic
    if req.status == "accepted":
        if current_user.role == "FARMER" and crop.farmer_id == current_user.id:
            offer.status = "accepted"
            # Close the crop listing as sold
            crop.status = "sold"
        elif current_user.role == "BUYER" and offer.buyer_id == current_user.id:
            # Buyer can accept a farmer's counter offer
            offer.status = "accepted"
            crop.status = "sold"
        else:
            raise HTTPException(status_code=403, detail="Unauthorized to accept this offer")
            
    elif req.status == "rejected":
        # Either party can reject
        if (current_user.role == "FARMER" and crop.farmer_id == current_user.id) or \
           (current_user.role == "BUYER" and offer.buyer_id == current_user.id):
            offer.status = "rejected"
        else:
            raise HTTPException(status_code=403, detail="Unauthorized to reject this offer")
            
    elif req.status == "countered":
        # Either party counters
        if (current_user.role == "FARMER" and crop.farmer_id == current_user.id) or \
           (current_user.role == "BUYER" and offer.buyer_id == current_user.id):
            if not req.counter_price:
                raise HTTPException(status_code=400, detail="Counter price is required for counter offer")
            offer.status = "countered"
            offer.offered_price_per_unit = req.counter_price
        else:
            raise HTTPException(status_code=403, detail="Unauthorized to counter this offer")
            
    else:
        raise HTTPException(status_code=400, detail="Invalid response status")
        
    db.commit()
    db.refresh(offer)
    db.refresh(crop)
    
    # Log the response state as a chat message
    system_msg = f"Offer status changed to: {req.status.upper()}."
    if req.counter_price:
        system_msg += f" New Counter Offer Price: ₹{req.counter_price}."
    if req.message:
        system_msg += f" Msg: {req.message}"
        
    neg = Negotiation(
        offer_id=offer.id,
        sender_id=current_user.id,
        message_text=system_msg
    )
    db.add(neg)
    db.commit()
    
    return offer


# ==========================================
# Direct Message Negotiation Endpoints
# ==========================================

@app.post("/api/offers/{offer_id}/messages", response_model=NegotiationResponse)
def send_negotiation_message(offer_id: int, req: NegotiationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
        
    # Check if user is associated with this offer
    crop = db.query(Crop).filter(Crop.id == offer.crop_id).first()
    if current_user.id != offer.buyer_id and current_user.id != crop.farmer_id:
        raise HTTPException(status_code=403, detail="Not authorized to participate in this negotiation")
        
    neg = Negotiation(
        offer_id=offer_id,
        sender_id=current_user.id,
        message_text=req.message_text
    )
    db.add(neg)
    db.commit()
    db.refresh(neg)
    return neg

@app.get("/api/offers/{offer_id}/messages", response_model=List[NegotiationResponse])
def get_negotiation_messages(offer_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
        
    crop = db.query(Crop).filter(Crop.id == offer.crop_id).first()
    if current_user.id != offer.buyer_id and current_user.id != crop.farmer_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this negotiation thread")
        
    return db.query(Negotiation).filter(Negotiation.offer_id == offer_id).order_by(Negotiation.created_at.asc()).all()

# Serve Frontend static assets in production
from fastapi.staticfiles import StaticFiles
import os

frontend_dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist_path):
    app.mount("/", StaticFiles(directory=frontend_dist_path, html=True), name="static")

