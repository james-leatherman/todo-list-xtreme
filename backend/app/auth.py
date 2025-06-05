from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlencode

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
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured. Please set GOOGLE_CLIENT_ID in environment variables."
        )
    
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    
    authorize_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return RedirectResponse(authorize_url)


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle the Google OAuth callback"""
    token_params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": settings.GOOGLE_REDIRECT_URI
    }
    
    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_response = await client.post(GOOGLE_TOKEN_URL, data=token_params)
        token_data = token_response.json()
        
        if "error" in token_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Google OAuth error: {token_data.get('error')}"
            )
        
        # Get user info
        headers = {"Authorization": f"Bearer {token_data.get('access_token')}"}
        user_response = await client.get(GOOGLE_USER_INFO_URL, headers=headers)
        user_data = user_response.json()
        
        # Find or create user
        email = user_data.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google"
            )
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                name=user_data.get("name", ""),
                google_id=user_data.get("sub", "")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create JWT token
        access_token = create_access_token(data={"sub": user.email})
        
        # Redirect to frontend with token
        frontend_url = settings.FRONTEND_URL
        redirect_url = f"{frontend_url}/auth/callback?token={access_token}"
        return RedirectResponse(redirect_url)


@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return {
        "email": current_user.email,
        "name": current_user.name,
        "id": current_user.id,
    }
