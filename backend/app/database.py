import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError

# =====================================================
# LOAD ENV
# =====================================================
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
LOCAL_SQLITE_URL = "sqlite:///./test.db"

# =====================================================
# ENGINE CONFIG WITH AUTO-FALLBACK
# =====================================================
engine = None

if DATABASE_URL and not DATABASE_URL.startswith("sqlite"):
    print("Attempting to connect to global database...")
    
    # Configure timeout to avoid hanging indefinitely if no internet
    connect_args = {}
    if DATABASE_URL.startswith("postgresql"):
        connect_args["connect_timeout"] = 15
        
    try:
        temp_engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            connect_args=connect_args
        )
        # Test connection by actually connecting
        with temp_engine.connect() as conn:
            print("Successfully connected to global database!")
        engine = temp_engine
    except OperationalError as e:
        print(f"Failed to connect to global database: {e}")
        engine = None
    except Exception as e:
        print(f"Database connection error: {e}")
        import traceback
        traceback.print_exc()
        engine = None

# If no global database was configured or it failed, use local SQLite
if engine is None:
    print("Using local SQLite database.")
    DATABASE_URL = LOCAL_SQLITE_URL
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )


# =====================================================
# SESSION CONFIG
# =====================================================
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# =====================================================
# BASE CLASS
# =====================================================
Base = declarative_base()


# =====================================================
# DEPENDENCY
# =====================================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()