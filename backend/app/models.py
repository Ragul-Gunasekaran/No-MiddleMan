from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List
from app.database import Base

# ==========================================
# SQLAlchemy Models
# ==========================================

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False) # "FARMER" or "BUYER"
    phone = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    location = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    crops = relationship("Crop", back_populates="farmer")
    requirements = relationship("BuyerRequirement", back_populates="buyer")
    offers = relationship("Offer", back_populates="buyer")

class Crop(Base):
    __tablename__ = "crops"
    
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    crop_name = Column(String, nullable=False)
    variety = Column(String, nullable=True)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False) # "kg", "tons", "bags"
    expected_price = Column(Float, nullable=False)
    location = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="active") # "active", "sold", "cancelled"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    farmer = relationship("User", back_populates="crops")
    offers = relationship("Offer", back_populates="crop", cascade="all, delete-orphan")

class BuyerRequirement(Base):
    __tablename__ = "buyer_requirements"
    
    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    crop_name = Column(String, nullable=False)
    required_quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False) # "kg", "tons", "bags"
    preferred_location = Column(String, nullable=False)
    max_price = Column(Float, nullable=False)
    max_distance_km = Column(Float, default=100.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    buyer = relationship("User", back_populates="requirements")

class Offer(Base):
    __tablename__ = "offers"
    
    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    offered_price_per_unit = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    status = Column(String, default="pending") # "pending", "accepted", "rejected", "countered"
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    crop = relationship("Crop", back_populates="offers")
    buyer = relationship("User", back_populates="offers")
    negotiations = relationship("Negotiation", back_populates="offer", cascade="all, delete-orphan")

class Negotiation(Base):
    __tablename__ = "negotiations"
    
    id = Column(Integer, primary_key=True, index=True)
    offer_id = Column(Integer, ForeignKey("offers.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    offer = relationship("Offer", back_populates="negotiations")


# ==========================================
# Pydantic Schemas
# ==========================================

# Auth
class UserRegister(BaseModel):
    name: str
    role: str # "FARMER" or "BUYER"
    phone: str
    password: str
    location: str
    is_verified: Optional[bool] = False

class UserLogin(BaseModel):
    phone: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    role: str
    phone: str
    location: str
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Crops
class CropCreate(BaseModel):
    crop_name: str
    variety: Optional[str] = None
    quantity: float
    unit: str
    expected_price: float
    location: str
    description: Optional[str] = None

class CropResponse(BaseModel):
    id: int
    farmer_id: int
    crop_name: str
    variety: Optional[str]
    quantity: float
    unit: str
    expected_price: float
    location: str
    description: Optional[str]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Buyer Requirements
class RequirementCreate(BaseModel):
    crop_name: str
    required_quantity: float
    unit: str
    preferred_location: str
    max_price: float
    max_distance_km: Optional[float] = 100.0

class RequirementResponse(BaseModel):
    id: int
    buyer_id: int
    crop_name: str
    required_quantity: float
    unit: str
    preferred_location: str
    max_price: float
    max_distance_km: float
    created_at: datetime
    
    class Config:
        from_attributes = True

# Offers
class OfferCreate(BaseModel):
    offered_price_per_unit: float
    quantity: float
    message: Optional[str] = None

class OfferUpdateStatus(BaseModel):
    status: str # "accepted", "rejected", "countered"
    counter_price: Optional[float] = None
    message: Optional[str] = None

class OfferResponse(BaseModel):
    id: int
    crop_id: int
    buyer_id: int
    offered_price_per_unit: float
    quantity: float
    status: str
    message: Optional[str]
    created_at: datetime
    buyer: UserResponse
    crop: CropResponse
    
    class Config:
        from_attributes = True

# Negotiations
class NegotiationCreate(BaseModel):
    message_text: str

class NegotiationResponse(BaseModel):
    id: int
    offer_id: int
    sender_id: int
    message_text: str
    created_at: datetime
    
    class Config:
        from_attributes = True
