from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.schemas import auth as schemas
from app.services import auth_service as auth
from app.models.user import User
from app.database import get_db
from app.config import settings

router = APIRouter(prefix="/auth")

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    
    if auth.get_user_by_email(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    if auth.get_user_by_username(db, user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    hashed_password = auth.get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login with email and password"""
    
    print(f"\n=== LOGIN ATTEMPT ===")
    print(f"Received username (email): {form_data.username}")
    print(f"Received password: {form_data.password}")
    
    # Find user
    user = auth.get_user_by_email(db, form_data.username)
    print(f"User found in DB: {user}")
    
    if user:
        print(f"User email: {user.email}")
        print(f"User hashed password: {user.hashed_password}")
    
    # Authenticate
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    print(f"Authentication result: {user}")
    
    if not user:
        print("Authentication failed - user is None")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print("Authentication successful")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    print(f"Token created: {access_token[:50]}...")
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user(
    current_user: User = Depends(auth.get_current_active_user)
):
    """Get current user profile"""
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
async def update_user(
    user_update: schemas.UserUpdate,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    
    if user_update.username:
        existing_user = auth.get_user_by_username(db, user_update.username)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        current_user.username = user_update.username
    
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password")
async def change_password(
    password_data: schemas.PasswordChange,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    
    if not auth.verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    current_user.hashed_password = auth.get_password_hash(password_data.new_password)
    db.commit()
    db.refresh(current_user)    
    
    return {"message": "Password updated successfully"}

@router.get("/debug/users")
def get_all_users(db: Session = Depends(get_db)):
    """Debug endpoint - remove in production"""
    users = db.query(User).all()
    return {
        "count": len(users),
        "users": [{"id": u.id, "email": u.email, "username": u.username} for u in users]
    }