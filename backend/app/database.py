from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging

logger = logging.getLogger("database")

import os
import shutil

# Detect Vercel or serverless read-only filesystem environments
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    sqlite_src = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "no_middle_man.db"))
    sqlite_dest = "/tmp/no_middle_man.db"
    if not os.path.exists(sqlite_dest):
        if os.path.exists(sqlite_src):
            try:
                shutil.copy2(sqlite_src, sqlite_dest)
            except Exception:
                pass
    DATABASE_URL = f"sqlite:///{sqlite_dest}"
else:
    DATABASE_URL = "sqlite:///./no_middle_man.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # This import is done inside the function to avoid circular imports
    from app.models import User, BuyerRequirement, Crop
    from passlib.context import CryptContext
    
    pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
    
    Base.metadata.create_all(bind=engine)
    
    # Seed mock data if database is empty
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            logger.info("Seeding initial database users...")
            
            # Create Farmer
            farmer_rajesh = User(
                name="Rajesh Patil",
                role="FARMER",
                phone="9876543210",
                password_hash=pwd_context.hash("password123"),
                location="Nashik",
                is_verified=False
            )
            
            # Create Buyers
            buyer_bigmart = User(
                name="BigMart Wholesale",
                role="BUYER",
                phone="8888888888",
                password_hash=pwd_context.hash("password123"),
                location="Mumbai",
                is_verified=True
            )
            
            buyer_freshmart = User(
                name="FreshMart Retail",
                role="BUYER",
                phone="9999999999",
                password_hash=pwd_context.hash("password123"),
                location="Pune",
                is_verified=False
            )
            
            db.add_all([farmer_rajesh, buyer_bigmart, buyer_freshmart])
            db.commit()
            
            # Seed initial buyer requirements
            logger.info("Seeding initial buyer requirements...")
            req_tomato_big = BuyerRequirement(
                buyer_id=buyer_bigmart.id,
                crop_name="Tomato",
                required_quantity=10000.0, # 10 tons in kg
                unit="kg",
                preferred_location="Nashik",
                max_price=25.0,
                max_distance_km=150.0
            )
            
            req_tomato_fresh = BuyerRequirement(
                buyer_id=buyer_freshmart.id,
                crop_name="Tomato",
                required_quantity=2000.0, # 2 tons in kg
                unit="kg",
                preferred_location="Pune",
                max_price=22.0,
                max_distance_km=50.0
            )
            
            req_potato_fresh = BuyerRequirement(
                buyer_id=buyer_freshmart.id,
                crop_name="Potato",
                required_quantity=3000.0,
                unit="kg",
                preferred_location="Pune",
                max_price=20.0,
                max_distance_km=100.0
            )
            
            db.add_all([req_tomato_big, req_tomato_fresh, req_potato_fresh])
            db.commit()
            
            logger.info("Database initialized and seeded successfully.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
