"""
Authentication endpoints for the Todo List Xtreme API.

This module contains all HTTP endpoints related to user authentication,
including Google OAuth flow and JWT token management.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
import httpx
from pydantic import BaseModel, ConfigDict

from todo_api.config.database import get_db
from todo_api.config.settings import settings
from todo_api.config.logging import get_logger, log_api_call, log_authentication_event, log_error
from todo_api.models import User

router = APIRouter()
logger = get_logger("auth")

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Google OAuth endpoints
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


# Simple schemas for responses
class UserSchema(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    is_active: bool = True
    
    model_config = ConfigDict(from_attributes=True)


class AuthToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Data to encode in the token
        expires_delta: Token expiration time
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[str]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token to verify
        
    Returns:
        Email from token payload or None if invalid
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: Optional[str] = payload.get("sub")
        return email
    except JWTError:
        return None


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Get the current authenticated user from JWT token.
    
    Args:
        token: JWT token from Authorization header
        db: Database session
        
    Returns:
        Current authenticated user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    email = verify_token(token)
    if email is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    if user.is_active is not True:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user


@router.get("/google/login")
def google_login():
    """
    Initiate Google OAuth authentication flow.
    Alias for /google endpoint to match frontend expectations.
    
    Returns:
        Redirect to Google OAuth authorization URL
    """
    return google_auth()


@router.get("/google")
def google_auth():
    """
    Initiate Google OAuth authentication flow.
    
    Returns:
        Redirect to Google OAuth authorization URL
    """
    log_api_call(logger, "/google", "GET")
    
    # Use the already imported settings object
    if not settings.GOOGLE_CLIENT_ID:
        log_error(logger, HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured"
        ), "google_auth")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured"
        )
    
    log_authentication_event(logger, "google_oauth_initiated")
    
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "scope": "openid email profile",
        "response_type": "code",
        "access_type": "offline",
        "prompt": "consent"
    }
    
    google_auth_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    logger.info(f"Redirecting to Google OAuth URL", extra={"redirect_url": google_auth_url})
    return RedirectResponse(url=google_auth_url)


@router.get("/google/callback")
@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """
    Handle Google OAuth callback and create/login user.
    
    Args:
        code: Authorization code from Google
        db: Database session
        
    Returns:
        Redirect to frontend with JWT token
        
    Raises:
        HTTPException: If OAuth flow fails
    """
    log_api_call(logger, "/google/callback", "GET", code=code[:10] + "..." if len(code) > 10 else code)
    
    # Use the already imported settings object
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        error = HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured"
        )
        log_error(logger, error, "google_callback_config")
        raise error
    
    try:
        # Exchange authorization code for access token
        logger.info("Exchanging authorization code for access token")
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                }
            )
            
            if token_response.status_code != 200:
                logger.error(f"Token exchange failed with status {token_response.status_code}: {token_response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange authorization code for token"
                )
            
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                logger.error("No access token received from Google")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No access token received from Google"
                )
            
            # Get user info from Google
            logger.info("Fetching user info from Google")
            user_response = await client.get(
                GOOGLE_USER_INFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if user_response.status_code != 200:
                logger.error(f"User info fetch failed with status {user_response.status_code}: {user_response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user info from Google"
                )
            
            user_data = user_response.json()
            user_email = user_data.get("email")
            
            logger.info(f"Google OAuth successful for user", extra={"user_email": user_email})
            
            # Create or get user
            user = db.query(User).filter(User.email == user_email).first()
            
            if not user:
                logger.info(f"Creating new user", extra={"user_email": user_email})
                log_authentication_event(logger, "user_created", user_email)
                user = User(
                    email=user_email,
                    name=user_data.get("name"),
                    google_id=user_data.get("sub"),
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            else:
                logger.info(f"User login", extra={"user_id": user.id, "user_email": user_email})
                log_authentication_event(logger, "user_login", str(user.id))
                # Update user info if needed
                if user.google_id != user_data.get("sub"):
                    user.google_id = user_data.get("sub")
                if user.name != user_data.get("name"):
                    user.name = user_data.get("name")
                db.commit()
            
            # Create JWT token
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            jwt_token = create_access_token(
                data={"sub": user.email},
                expires_delta=access_token_expires
            )
            
            log_authentication_event(logger, "jwt_token_created", str(user.id))
            
            # Redirect to frontend with token
            frontend_url = f"{settings.FRONTEND_URL}?token={jwt_token}"
            logger.info(f"Redirecting to frontend", extra={"user_id": user.id, "frontend_url": settings.FRONTEND_URL})
            return RedirectResponse(url=frontend_url)
            
    except httpx.RequestError as e:
        log_error(logger, e, "google_oauth_request")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to communicate with Google OAuth service"
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        log_error(logger, e, "google_oauth_general")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

@router.post("/token", response_model=AuthToken)
def create_token_for_user(
    email: str,
    db = Depends(get_db)
):
    """
    Create a JWT token for a user (for testing purposes).
    
    Args:
        email: User email
        db: Database session
        
    Returns:
        JWT token information
        
    Raises:
        HTTPException: If user not found
    """
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Use the already imported settings object
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    return AuthToken(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
@router.get("/me", response_model=UserSchema)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current user information.
    
    Args:
        current_user: Authenticated user
        
    Returns:
        Current user information
    """
    log_api_call(logger, "/me", "GET", user_id=current_user.id)
    logger.info(f"User info requested", extra={"user_id": current_user.id, "user_email": current_user.email})
    return current_user


@router.post("/logout")
def logout():
    """
    Logout endpoint.
    
    Note: With JWT tokens, logout is handled client-side by removing the token.
    This endpoint exists for API completeness and could be extended with
    token blacklisting if needed.
    
    Returns:
        Success message
    """
    log_api_call(logger, "/logout", "POST")
    log_authentication_event(logger, "user_logout")
    logger.info("User logout requested")
    return {"message": "Successfully logged out"}
