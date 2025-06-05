from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
import httpx

from app.config import settings
from app.database import get_db
from app.models import User

router = APIRouter()

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Google OAuth endpoints
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get the current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub") # type: ignore
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


@router.get("/google/login")
async def login_google():
    """Redirect to Google OAuth login page"""
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "email profile",
    }
    
    authorize_url = f"{GOOGLE_AUTH_URL}?" + "&".join([f"{k}={v}" for k, v in params.items()])
    return RedirectResponse(authorize_url)


@router.get("/google/callback")
async def auth_google_callback(request: Request, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")
    
    # Exchange code for token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            },
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        token_data = token_response.json()
        access_token = token_data["access_token"]
        
        # Get user info
        user_response = await client.get(
            GOOGLE_USER_INFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        user_info = user_response.json()
        
        # Get or create user
        user = db.query(User).filter(User.email == user_info["email"]).first()
        if not user:
            user = User(
                email=user_info["email"],
                name=user_info.get("name", ""),
                google_id=user_info.get("sub", ""),
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create JWT token
        token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        jwt_token = create_access_token(
            data={"sub": user.email},
            expires_delta=token_expires,
        )
        
        # Redirect to frontend with token
        frontend_url = settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:3000"
        redirect_url = f"{frontend_url}/auth/callback?token={jwt_token}"
        return RedirectResponse(redirect_url)


@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return {
        "email": current_user.email,
        "name": current_user.name,
        "id": current_user.id,
    }
