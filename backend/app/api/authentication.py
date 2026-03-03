"""Authentication API module.

This module provides JWT-based authentication endpoints for caregivers.
Includes login, registration, and token management.
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
import os
from app.limiter import limiter

from app.schemas.authentication_schema import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    CaregiverProfile,
)
from app.services.caregiver_facade import CaregiverFacade
from app.schemas.caregiver_schema import CaregiverResponse
from app import get_db

# JWT Configuration
SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Security
security = HTTPBearer()

# Router
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# Dependency to get caregiver facade instance
def get_caregiver_facade(db: Session = Depends(get_db)) -> CaregiverFacade:
    """Dependency to create CaregiverFacade instance with database session."""
    return CaregiverFacade(db)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token.

    Args:
        data (dict): Data to encode in the token
        expires_delta (Optional[timedelta]): Custom expiration time

    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify and decode JWT token.

    Args:
        credentials (HTTPAuthorizationCredentials): Bearer token from request

    Returns:
        dict: Decoded token payload

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("sub") is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post(
    "/register",
    response_model=CaregiverProfile,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new caregiver account",
    description="""
    Create a new caregiver account with email and password.
    
    This endpoint allows new caregivers to register in the system.
    The email must be unique and not already registered.
    Password will be securely hashed before storage.
    
    **Requirements:**
    - Valid email format
    - Password minimum 8 characters
    - First name and last name required
    
    **Returns a caregiver profile with:**
    - Unique caregiver ID
    - Personal information
    - Account creation timestamp
    """,
    responses={
        201: {
            "description": "Caregiver successfully registered",
            "content": {
                "application/json": {
                    "example": {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "first_name": "John",
                        "last_name": "Doe",
                        "email": "john.doe@example.com",
                        "created_at": "2026-02-27T10:30:00Z",
                    }
                }
            },
        },
        400: {
            "description": "Bad request - Validation error or email already exists",
            "content": {
                "application/json": {
                    "examples": {
                        "email_exists": {
                            "summary": "Email already registered",
                            "value": {"detail": "Email already registered"},
                        },
                        "validation_error": {
                            "summary": "Validation error",
                            "value": {"detail": "Invalid email format"},
                        },
                    }
                }
            },
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to create caregiver"}
                }
            },
        },
    },
)
@limiter.limit("3/minute")
async def register(
    request: Request,
    body: RegisterRequest,
    caregiver_facade: CaregiverFacade = Depends(get_caregiver_facade),
):
    """Register a new caregiver account.

    Args:
        request (RegisterRequest): Registration data
        caregiver_facade (CaregiverFacade): Caregiver service facade

    Returns:
        CaregiverProfile: Created caregiver profile

    Raises:
        HTTPException: If email already exists or validation fails
    """
    try:
        # Check if email already exists
        existing_caregiver = caregiver_facade.get_caregiver_by_email(body.email)
        if existing_caregiver:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Create new caregiver
        caregiver_data = {
            "first_name": body.first_name,
            "last_name": body.last_name,
            "email": body.email,
            "password": body.password,
        }

        caregiver = caregiver_facade.create_caregiver(caregiver_data)

        return CaregiverProfile(
            id=str(caregiver.id),
            first_name=caregiver.first_name,
            last_name=caregiver.last_name,
            email=caregiver.email,
            created_at=caregiver.created_at,
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create caregiver: {str(e) or type(e).__name__}",
        )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login as caregiver",
    description="""
    Authenticate a caregiver and receive a JWT access token.
    
    Use the email and password provided during registration to authenticate.
    Upon successful authentication, you will receive a JWT token that must be
    included in the Authorization header of subsequent requests.
    
    **Token Format:** `Bearer <access_token>`
    
    **Token Expiration:** 60 minutes
    
    The returned token contains:
    - Caregiver ID (sub claim)
    - Email address
    - Expiration time
    - Issue time
    """,
    responses={
        200: {
            "description": "Login successful, JWT token returned",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "bearer",
                        "expires_in": 3600,
                    }
                }
            },
        },
        401: {
            "description": "Authentication failed - Invalid credentials",
            "content": {
                "application/json": {"example": {"detail": "Invalid email or password"}}
            },
        },
        500: {
            "description": "Internal server error",
            "content": {"application/json": {"example": {"detail": "Login failed"}}},
        },
    },
)
@limiter.limit("5/minute")
async def login(
    request: Request,
    body: LoginRequest,
    caregiver_facade: CaregiverFacade = Depends(get_caregiver_facade),
):
    """Authenticate caregiver and return JWT token.

    Args:
        request (LoginRequest): Login credentials
        caregiver_facade (CaregiverFacade): Caregiver service facade

    Returns:
        TokenResponse: JWT access token

    Raises:
        HTTPException: If credentials are invalid
    """
    try:
        # Find caregiver by email
        caregiver = caregiver_facade.get_caregiver_by_email(body.email)

        if not caregiver:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verify password
        if not caregiver.verify_password(body.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(caregiver.id), "email": caregiver.email},
            expires_delta=access_token_expires,
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}",
        )


@router.get(
    "/me",
    response_model=CaregiverProfile,
    summary="Get current caregiver profile",
    description="""
    Retrieve the profile information of the currently authenticated caregiver.
    
    This endpoint requires a valid JWT token in the Authorization header.
    It returns the complete profile information for the authenticated caregiver.
    
    **Authentication required:** Bearer token
    
    Use this endpoint to:
    - Display caregiver profile in the UI
    - Verify token validity
    - Get current user context
    """,
    responses={
        200: {
            "description": "Caregiver profile retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "first_name": "John",
                        "last_name": "Doe",
                        "email": "john.doe@example.com",
                        "created_at": "2026-02-27T10:30:00Z",
                    }
                }
            },
        },
        401: {
            "description": "Unauthorized - Invalid or expired token",
            "content": {
                "application/json": {
                    "example": {"detail": "Could not validate credentials"}
                }
            },
        },
        404: {
            "description": "Caregiver not found",
            "content": {
                "application/json": {"example": {"detail": "Caregiver not found"}}
            },
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {"example": {"detail": "Failed to get profile"}}
            },
        },
    },
)
async def get_current_user(
    token_payload: dict = Depends(verify_token),
    caregiver_facade: CaregiverFacade = Depends(get_caregiver_facade),
):
    """Get current authenticated caregiver profile.

    Args:
        token_payload (dict): Decoded JWT token
        caregiver_facade (CaregiverFacade): Caregiver service facade

    Returns:
        CaregiverProfile: Current caregiver profile

    Raises:
        HTTPException: If caregiver not found
    """
    try:
        caregiver_id = token_payload.get("sub")
        caregiver = caregiver_facade.get_caregiver(caregiver_id)

        if not caregiver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Caregiver not found"
            )

        return CaregiverProfile(
            id=str(caregiver.id),
            first_name=caregiver.first_name,
            last_name=caregiver.last_name,
            email=caregiver.email,
            created_at=caregiver.created_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get profile: {str(e)}",
        )


@router.post(
    "/logout",
    summary="Logout caregiver",
    description="""
    Logout the currently authenticated caregiver.
    
    **Important:** JWT tokens are stateless and cannot be invalidated server-side.
    The client application must discard the token upon receiving this response.
    
    This endpoint:
    - Validates the provided token
    - Returns a success confirmation
    - Serves as a logout confirmation point
    
    **Client responsibilities:**
    - Remove token from local storage
    - Clear authentication state
    - Redirect to login screen
    
    **Authentication required:** Bearer token
    """,
    responses={
        200: {
            "description": "Logout successful",
            "content": {
                "application/json": {"example": {"message": "Successfully logged out"}}
            },
        },
        401: {
            "description": "Unauthorized - Invalid or expired token",
            "content": {
                "application/json": {
                    "example": {"detail": "Could not validate credentials"}
                }
            },
        },
    },
)
async def logout(token_payload: dict = Depends(verify_token)):
    """Logout current user (client should discard token).

    Args:
        token_payload (dict): Decoded JWT token

    Returns:
        dict: Success message

    Note:
        JWT tokens are stateless, so actual logout is handled client-side
        by discarding the token. This endpoint is for consistency.
    """
    return {"message": "Successfully logged out"}


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh JWT access token",
    description="""
    Generate a new JWT access token using a valid existing token.
    
    Use this endpoint to refresh an expired or soon-to-expire token without
    requiring the user to log in again. The new token will have the same
    claims as the original token but with an updated expiration time.
    
    **Authentication required:** Bearer token (can be near expiration)
    
    **Use cases:**
    - Token is about to expire
    - Implementing silent authentication
    - Extending user session
    
    **Token Expiration:** 60 minutes from refresh time
    """,
    responses={
        200: {
            "description": "Token refreshed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "bearer",
                        "expires_in": 3600,
                    }
                }
            },
        },
        401: {
            "description": "Unauthorized - Invalid or expired token",
            "content": {
                "application/json": {
                    "example": {"detail": "Could not validate credentials"}
                }
            },
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {"example": {"detail": "Token refresh failed"}}
            },
        },
    },
)
async def refresh_token(token_payload: dict = Depends(verify_token)):
    """Refresh JWT access token.

    Args:
        token_payload (dict): Decoded JWT token

    Returns:
        TokenResponse: New JWT access token
    """
    try:
        caregiver_id = token_payload.get("sub")
        email = token_payload.get("email")

        # Create new access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": caregiver_id, "email": email},
            expires_delta=access_token_expires,
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}",
        )


# Export for use in other modules
__all__ = ["router", "verify_token"]
