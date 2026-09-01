from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging

logger = logging.getLogger("database")

import os
import shutil
import urllib.request
import json
import base64
import hashlib

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
GIST_ID = os.environ.get("GIST_ID")

def get_file_hash(filepath):
    if not os.path.exists(filepath):
        return ""
    hasher = hashlib.md5()
    with open(filepath, "rb") as f:
        hasher.update(f.read())
    return hasher.hexdigest()

def load_db_from_cloud():
    sqlite_dest = "/tmp/no_middle_man.db"
    os.makedirs(os.path.dirname(sqlite_dest), exist_ok=True)
    if GITHUB_TOKEN and GIST_ID:
        url = f"https://api.github.com/gists/{GIST_ID}"
        headers = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "FastAPI-App"
        }
        try:
            req = urllib.request.Request(url, headers=headers, method="GET")
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    res_data = json.loads(response.read().decode("utf-8"))
                    db_file_info = res_data.get("files", {}).get("no_middle_man.db.base64")
                    if db_file_info and db_file_info.get("content"):
                        db_bytes = base64.b64decode(db_file_info["content"])
                        with open(sqlite_dest, "wb") as f:
                            f.write(db_bytes)
                        logger.info("Successfully loaded SQLite database from GitHub Gist.")
                        return True
        except Exception as e:
            logger.error(f"Error loading database from GitHub Gist: {e}")
            
    sqlite_src = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "no_middle_man.db"))
    if os.path.exists(sqlite_src):
        try:
            shutil.copy2(sqlite_src, sqlite_dest)
            return True
        except Exception:
            pass
    return False

def save_db_to_cloud():
    sqlite_dest = "/tmp/no_middle_man.db"
    if not os.path.exists(sqlite_dest):
        return False
    if GITHUB_TOKEN and GIST_ID:
        try:
            with open(sqlite_dest, "rb") as f:
                db_bytes = f.read()
            encoded_content = base64.b64encode(db_bytes).decode("utf-8")
            url = f"https://api.github.com/gists/{GIST_ID}"
            headers = {
                "Authorization": f"token {GITHUB_TOKEN}",
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json",
                "User-Agent": "FastAPI-App"
            }
            payload = {
                "files": {
                    "no_middle_man.db.base64": {
                        "content": encoded_content
                    }
                }
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="PATCH"
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    logger.info("Successfully saved SQLite database to GitHub Gist.")
                    return True
        except Exception as e:
            logger.error(f"Error saving database to GitHub Gist: {e}")
    return False

# Use Postgres/MySQL if DATABASE_URL is provided in environment variables
env_db_url = os.environ.get("DATABASE_URL")

if env_db_url:
    # SQLAlchemy 1.4+ requires postgresql:// instead of postgres://
    if env_db_url.startswith("postgres://"):
        env_db_url = env_db_url.replace("postgres://", "postgresql://", 1)
    DATABASE_URL = env_db_url
    engine = create_engine(DATABASE_URL)
else:
    # Fallback to local/ephemeral SQLite
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        sqlite_dest = "/tmp/no_middle_man.db"
        if not os.path.exists(sqlite_dest):
            load_db_from_cloud()
        DATABASE_URL = f"sqlite:///{sqlite_dest}"
    else:
        DATABASE_URL = "sqlite:///./no_middle_man.db"
    
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    env_db_url = os.environ.get("DATABASE_URL")
    is_serverless = not env_db_url and (os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
    
    if is_serverless:
        load_db_from_cloud()
    
    sqlite_dest = "/tmp/no_middle_man.db"
    initial_hash = get_file_hash(sqlite_dest) if is_serverless else ""
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        if is_serverless:
            # Only upload if the file hash changed (indicating a write occurred)
            if get_file_hash(sqlite_dest) != initial_hash:
                save_db_to_cloud()

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
        if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
            save_db_to_cloud()
