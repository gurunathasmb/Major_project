from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import os

# --- Security and JWT setup ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET = os.getenv("JWT_SECRET", "supersecret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day
security = HTTPBearer()

def hash_password(password: str):
    if not isinstance(password, (str, bytes)):
        raise ValueError("Password must be a string or bytes")
    if isinstance(password, str):
        password = password.encode("utf-8")[:72]
    else:
        password = password[:72]
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str):
    """
    Verifies a plain password against a bcrypt hash.
    """
    if isinstance(plain, str):
        plain = plain.encode("utf-8")[:72]
    else:
        plain = plain[:72]
    return pwd_context.verify(plain, hashed)

# --- JWT Token Utilities ---
def create_access_token(data: dict, expires_delta: timedelta = None):
    """
    Creates a JWT access token with an expiration time.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: HTTPAuthorizationCredentials = Security(security)):
    """
    Decodes and validates JWT tokens from Authorization headers.
    """
    try:
        payload = jwt.decode(token.credentials, SECRET, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
