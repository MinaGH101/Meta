from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..database import get_db
from ..deps import get_current_user
from ..models import RefreshSession, User
from ..schemas import LoginIn, LogoutIn, RefreshIn, RegisterIn, TokenPair, UserOut, UserUpdate
from ..security import create_access_token, create_refresh_token, hash_password, hash_refresh_token, verify_password
from ..storage import remove_media_file, save_image

router = APIRouter(prefix="/auth", tags=["Authentication"])


def issue_pair(db: Session, user: User) -> TokenPair:
    refresh, refresh_hash, expires_at = create_refresh_token()
    db.add(RefreshSession(user_id=user.id, token_hash=refresh_hash, expires_at=expires_at))
    db.commit()
    return TokenPair(
        access_token=create_access_token(str(user.id), user.role),
        refresh_token=refresh,
        user=UserOut.model_validate(user),
    )


@router.post("/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    if not phone:
        raise HTTPException(status_code=422, detail="Phone number is required")
    email = payload.email.lower().strip() if payload.email else None
    if db.scalar(select(User).where(User.phone == phone)):
        raise HTTPException(status_code=409, detail="An account with this phone number already exists")
    if email and db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = User(full_name=payload.full_name.strip(), email=email, phone=phone, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return issue_pair(db, user)


@router.post("/login", response_model=TokenPair)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    if not phone:
        raise HTTPException(status_code=422, detail="Phone number is required")
    user = db.scalar(select(User).where(User.phone == phone))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid phone number or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    return issue_pair(db, user)


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshIn, db: Session = Depends(get_db)):
    token_hash = hash_refresh_token(payload.refresh_token)
    session = db.scalar(select(RefreshSession).where(RefreshSession.token_hash == token_hash))
    now = datetime.now(timezone.utc)
    expires_at = session.expires_at if session else None
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not session or session.revoked_at or not expires_at or expires_at <= now:
        raise HTTPException(status_code=401, detail="Refresh token is invalid or expired")
    user = db.get(User, session.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User is unavailable")
    session.revoked_at = now
    db.commit()
    return issue_pair(db, user)


@router.post("/logout", status_code=204)
def logout(payload: LogoutIn, db: Session = Depends(get_db)):
    session = db.scalar(select(RefreshSession).where(RefreshSession.token_hash == hash_refresh_token(payload.refresh_token)))
    if session and not session.revoked_at:
        session.revoked_at = datetime.now(timezone.utc)
        db.commit()


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
def update_me(payload: UserUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = payload.model_dump(exclude_unset=True)
    password = data.pop("password", None)
    phone = data.get("phone")
    if phone is not None:
        phone = str(phone).strip()
        if not phone:
            raise HTTPException(status_code=422, detail="Phone number is required")
        if db.scalar(select(User).where(User.phone == phone, User.id != user.id)):
            raise HTTPException(status_code=409, detail="An account with this phone number already exists")
        data["phone"] = phone
    for key, value in data.items():
        setattr(user, key, value)
    if password:
        user.password_hash = hash_password(password)
    db.commit()
    db.refresh(user)
    return user


@router.post("/me/avatar", response_model=UserOut)
def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    old_url = user.avatar_url
    user.avatar_url = save_image(file, f"avatars/{user.id}")
    db.commit()
    db.refresh(user)
    if old_url:
        remove_media_file(old_url)
    return user
