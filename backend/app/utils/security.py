import os
import datetime
import hashlib
import hmac
import base64
import json
from typing import Optional
from app.config import settings

# Attempt import of bcrypt and pyjwt, with standard-library fallback for maximum resilience
try:
    import bcrypt
    HAS_BCRYPT = True
except ImportError:
    HAS_BCRYPT = False

try:
    import jwt
    HAS_PYJWT = True
except ImportError:
    HAS_PYJWT = False


def hash_password(password: str) -> str:
    """Securely hash a plain password."""
    if HAS_BCRYPT:
        pwd_bytes = password.encode('utf-8')
        # bcrypt accepts max 72 bytes
        if len(pwd_bytes) > 72:
            pwd_bytes = pwd_bytes[:72]
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')
    else:
        # Fallback SHA256 with secret salt
        salt = settings.SECRET_KEY[:16].encode('utf-8')
        hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return "pbkdf2:" + hashed.hex()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash."""
    if not hashed_password:
        return False

    if hashed_password.startswith("pbkdf2:"):
        salt = settings.SECRET_KEY[:16].encode('utf-8')
        expected = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000).hex()
        return hmac.compare_digest(hashed_password[7:], expected)

    if HAS_BCRYPT:
        try:
            pwd_bytes = plain_password.encode('utf-8')
            if len(pwd_bytes) > 72:
                pwd_bytes = pwd_bytes[:72]
            return bcrypt.checkpw(pwd_bytes, hashed_password.encode('utf-8'))
        except Exception:
            return False

    return False


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Generate a signed JWT token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    if HAS_PYJWT:
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    else:
        # Fallback lightweight standard HMAC-SHA256 JWT
        header = {"alg": "HS256", "typ": "JWT"}
        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
        to_encode["exp"] = int(expire.timestamp())
        payload_b64 = base64.urlsafe_b64encode(json.dumps(to_encode).encode()).decode().rstrip("=")
        signing_input = f"{header_b64}.{payload_b64}".encode()
        sig = hmac.new(settings.SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
        sig_b64 = base64.urlsafe_b64encode(sig).decode().rstrip("=")
        return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a signed JWT token."""
    try:
        if HAS_PYJWT:
            return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        else:
            parts = token.split(".")
            if len(parts) != 3:
                return None
            header_b64, payload_b64, sig_b64 = parts
            signing_input = f"{header_b64}.{payload_b64}".encode()
            expected_sig = hmac.new(settings.SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
            sig = base64.urlsafe_b64decode(sig_b64 + "==")
            if not hmac.compare_digest(sig, expected_sig):
                return None

            payload_json = base64.urlsafe_b64decode(payload_b64 + "==").decode()
            payload = json.loads(payload_json)
            if "exp" in payload and payload["exp"] < datetime.datetime.utcnow().timestamp():
                return None
            return payload
    except Exception:
        return None

