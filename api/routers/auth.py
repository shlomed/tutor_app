from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from api.deps import create_access_token, get_current_user
from api.schemas import (
    RegisterRequest, TokenResponse, UserResponse,
    UpdatePreferencesRequest, MessageResponse,
)
from services.auth_service import (
    register_user,
    verify_password,
    get_user_by_username,
    update_learning_preferences,
)

router = APIRouter()


@router.post("/register", response_model=MessageResponse)
def register(req: RegisterRequest):
    try:
        register_user(req.username, req.name, req.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return {"message": "נרשמת בהצלחה!"}


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user_by_username(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="שם משתמש או סיסמה שגויים",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({
        "sub": user["username"],
        "user_id": user["id"],
        "name": user["name"],
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user["id"],
        "name": user["name"],
        "learning_preferences": user.get("learning_preferences", ""),
    }


@router.get("/me", response_model=UserResponse)
def me(current_user: dict = Depends(get_current_user)):
    # Fetch from DB to get current preferences (not from JWT)
    user = get_user_by_username(current_user["username"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": user["id"],
        "username": user["username"],
        "name": user["name"],
        "learning_preferences": user.get("learning_preferences", ""),
    }


@router.put("/preferences", response_model=MessageResponse)
def update_preferences(req: UpdatePreferencesRequest, current_user: dict = Depends(get_current_user)):
    update_learning_preferences(current_user["user_id"], req.learning_preferences)
    return {"message": "ההעדפות עודכנו בהצלחה"}
