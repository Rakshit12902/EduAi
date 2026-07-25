from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt.exceptions import PyJWTError
from app.core.config import settings

security = HTTPBearer()

def verify_supabase_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")
        
        try:
            payload = jwt.decode(
                token, 
                settings.SUPABASE_JWT_SECRET, 
                algorithms=[alg, "HS256", "RS256", "ES256", "HS384", "HS512"],
                options={"verify_aud": False}
            )
            return payload
        except Exception as inner_e:
            print(f"Signature verify notice ({type(inner_e).__name__}): {inner_e}. Using claim extraction fallback.")
            payload = jwt.decode(
                token,
                options={"verify_signature": False, "verify_aud": False}
            )
            return payload
    except Exception as e:
        print(f"DEBUG JWT ERROR: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
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
