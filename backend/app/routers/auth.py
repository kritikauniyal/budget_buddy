from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import (
    User,
    ExpenseCategory,
    IncomeCategory,
    Group,
    GroupMember,
    GroupInvitation,
    Notification
)
from app.schemas.schemas import (
    UserCreate,
    UserLogin,
    UserOut,
    TokenResponse,
    ChangePasswordRequest,
    UpdateProfileRequest
)
from app.utils.security import hash_password, verify_password, create_access_token
from app.dependencies.auth import get_current_user
from app.routers.dashboard import DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES

router = APIRouter(prefix="/api/auth", tags=["Authentication & Profile"])


@router.post("/register", response_model=TokenResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )

    # Hash password and create user
    hashed = hash_password(user_in.password)
    user = User(
        full_name=user_in.full_name.strip(),
        email=user_in.email.lower().strip(),
        phone=user_in.phone.strip() if user_in.phone else None,
        hashed_password=hashed,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Automatically seed personal categories for this new user
    for cat in DEFAULT_EXPENSE_CATEGORIES:
        db.add(ExpenseCategory(user_id=user.id, name=cat["name"], icon=cat["icon"], color=cat["color"]))
    for cat in DEFAULT_INCOME_CATEGORIES:
        db.add(IncomeCategory(user_id=user.id, name=cat["name"], icon=cat["icon"], color=cat["color"]))
    db.commit()

    # Check for invitation token to automatically join group
    if user_in.invitation_token:
        inv = db.query(GroupInvitation).filter(
            GroupInvitation.token == user_in.invitation_token.strip(),
            GroupInvitation.status == "pending"
        ).first()
        if inv:
            inv.status = "accepted"
            # Add member if not already added
            existing_member = db.query(GroupMember).filter(
                GroupMember.group_id == inv.group_id,
                GroupMember.user_id == user.id
            ).first()
            if not existing_member:
                db.add(GroupMember(
                    group_id=inv.group_id,
                    user_id=user.id,
                    role="member",
                    status="active"
                ))
                group = db.query(Group).filter(Group.id == inv.group_id).first()
                group_name = group.name if group else "Group"
                db.add(Notification(
                    user_id=user.id,
                    title=f"Joined {group_name}",
                    message=f"You successfully joined {group_name} through your invitation link!",
                    type="group_invite"
                ))
            db.commit()

    # Generate JWT access token
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email.lower().strip()).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )


@router.get("/me", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserOut)
def update_profile(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.full_name = body.full_name.strip()
    if body.phone is not None:
        current_user.phone = body.phone.strip()
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/change-password")
def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password does not match")

    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    current_user.hashed_password = hash_password(body.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
