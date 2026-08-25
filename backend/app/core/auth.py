from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWKClient
from jwt.exceptions import PyJWTError
from app.core.config import settings

security = HTTPBearer()

# Initialize the JWKS client pointing to Supabase
jwks_url = f"{settings.SUPABASE_URL}/rest/v1/jwks"
jwks_client = PyJWKClient(jwks_url)

def verify_supabase_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")
        
        # If the token uses a legacy symmetric key, use the JWT Secret from .env
        if alg == "HS256":
            signing_key = settings.SUPABASE_JWT_SECRET
        else:
            # For modern asymmetric keys (ECC P-256 / ES256, RS256), fetch the public key from Supabase JWKS
            signing_key = jwks_client.get_signing_key_from_jwt(token).key
        
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=[alg, "HS256", "RS256", "ES256"],
            options={"verify_aud": False}
        )
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user_id(payload: dict = Depends(verify_supabase_token)) -> str:
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject (sub) claim",
        )
    return user_id
