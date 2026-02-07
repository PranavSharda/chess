from fastapi import APIRouter, Depends, HTTPException, status
from schema import SignUpRequest, SignInRequest, UpdateChessComUsername
from db.dependencies import get_user_repository
from db.repositories import UserRepository
from .helpers import verify_chess_username
import argon2
import uuid as uuid_module
import httpx
import os

router = APIRouter()
ph = argon2.PasswordHasher()




@router.post('/user')
def signup(
    request: SignUpRequest,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Example of using repository for easy queries."""
    # Easy query: Check if username exists
    if user_repo.username_exists(request.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    if user_repo.email_exists(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Easy query: Create user
    password_salt = os.urandom(16).hex()  # Generate salt first
    # Combine password with salt before hashing
    password_with_salt = f"{request.password}{password_salt}"
    password_hash = ph.hash(password_with_salt)
    user = user_repo.create(
        username=request.username,
        email=request.email,
        password_hash=password_hash,
        password_salt=password_salt,
        lichess_id=request.lichess_id
    )
    
    return {"id": str(user.id), "username": user.username}

@router.post('/user/signin')
def login(
    request: SignInRequest,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Example of using repository for easy queries."""
    # Easy query: Check if username exists
    if user_repo.username_exists(request.emailOrUsername):
        user=user_repo.get_by_username(username=request.emailOrUsername)
    elif user_repo.email_exists(request.emailOrUsername):
        user=user_repo.get_by_email(email=request.emailOrUsername)
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or username"
        )
    password_with_salt = f"{request.password}{user.password_salt}"
    try:
        ph.verify(password=password_with_salt,hash=user.password_hash)
        return {
            "id": str(user.id), 
            "username": user.username, 
            "email": user.email, 
            "lichess_id": user.lichess_id,
            "chess_com_username": user.chess_com_username
        }
    except argon2.exceptions.VerifyMismatchError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )


@router.patch('/user/{user_id}/chess-com')
async def update_chess_com_username(
    user_id: str,
    request: UpdateChessComUsername,
    user_repo: UserRepository = Depends(get_user_repository)
):
    """Update user's Chess.com username with verification."""
    try:
        user_uuid = uuid_module.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    user = user_repo.get_by_id(user_uuid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify the Chess.com username exists
    chess_username = request.chess_com_username.lower()
    try:
        verify_response = await verify_chess_username(chess_username)
        if not verify_response.is_success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Chess.com username not found"
            )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to verify Chess.com username. Please try again later."
        )
    
    updated_user = user_repo.update(user_uuid, chess_com_username=chess_username)
    
    return {
        "id": str(updated_user.id),
        "username": updated_user.username,
        "email": updated_user.email,
        "lichess_id": updated_user.lichess_id,
        "chess_com_username": updated_user.chess_com_username
    }
