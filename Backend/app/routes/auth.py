from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timezone
import os

from app.database.database import SessionLocal
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user_id,
    require_role
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------- REGISTER ----------------

# ---------------- REGISTER ----------------

@router.post("/register")
def register(
    user_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Determine account role
    role = "user"

    if user_data.role == "admin":
        if user_data.admin_code != os.getenv("ADMIN_REGISTRATION_CODE"):
            raise HTTPException(
                status_code=403,
                detail="Invalid admin authorization code"
            )

        role = "admin"

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=hash_password(user_data.password),
        role=role,
        created_at=datetime.now(timezone.utc)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": f"{role.capitalize()} registered successfully",
        "user_id": new_user.user_id,
        "role": new_user.role
    }


# ---------------- LOGIN ----------------

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        form_data.password,
        user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Your account has been deactivated"
        )

    access_token = create_access_token(
        data={
            "user_id": user.user_id,
            "role": user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ---------------- CURRENT USER ----------------

@router.get("/me")
def get_me(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
    "id": user.user_id,
    "name": user.name,
    "email": user.email,
    "role": user.role
}
@router.get("/admin-test")
def admin_test(
    admin_user: User = Depends(require_role("admin"))
):
    return {
        "message": "Admin access successful",
        "user_id": admin_user.user_id,
        "role": admin_user.role
    }
# ---------------- ADMIN USER MANAGEMENT ----------------

@router.get("/users")
def get_all_users(
    admin_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()

    return [
    {
        "id": user.user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at
    }
    for user in users
]


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    if user_id == admin_user.user_id:
        raise HTTPException(
            status_code=400,
            detail="Admin cannot delete their own account"
        )

    user = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    try:
        # Delete publishing logs connected to this user's posts
        # or publishing queues
        db.execute(
            text("""
                DELETE FROM publishing_logs
                WHERE post_id IN (
                    SELECT post_id
                    FROM posts
                    WHERE user_id = :user_id
                       OR account_id IN (
                           SELECT account_id
                           FROM social_accounts
                           WHERE user_id = :user_id
                       )
                       OR campaign_id IN (
                           SELECT campaign_id
                           FROM campaigns
                           WHERE user_id = :user_id
                       )
                )
                OR queue_id IN (
                    SELECT queue_id
                    FROM publishing_queue
                    WHERE post_id IN (
                        SELECT post_id
                        FROM posts
                        WHERE user_id = :user_id
                           OR account_id IN (
                               SELECT account_id
                               FROM social_accounts
                               WHERE user_id = :user_id
                           )
                           OR campaign_id IN (
                               SELECT campaign_id
                               FROM campaigns
                               WHERE user_id = :user_id
                           )
                    )
                )
            """),
            {"user_id": user_id}
        )

        # Delete publishing queue entries
        db.execute(
            text("""
                DELETE FROM publishing_queue
                WHERE post_id IN (
                    SELECT post_id
                    FROM posts
                    WHERE user_id = :user_id
                       OR account_id IN (
                           SELECT account_id
                           FROM social_accounts
                           WHERE user_id = :user_id
                       )
                       OR campaign_id IN (
                           SELECT campaign_id
                           FROM campaigns
                           WHERE user_id = :user_id
                       )
                )
            """),
            {"user_id": user_id}
        )

        # Delete scheduled posts
        db.execute(
            text("""
                DELETE FROM scheduled_posts
                WHERE post_id IN (
                    SELECT post_id
                    FROM posts
                    WHERE user_id = :user_id
                       OR account_id IN (
                           SELECT account_id
                           FROM social_accounts
                           WHERE user_id = :user_id
                       )
                       OR campaign_id IN (
                           SELECT campaign_id
                           FROM campaigns
                           WHERE user_id = :user_id
                       )
                )
            """),
            {"user_id": user_id}
        )

        # Delete recurring posts
        db.execute(
            text("""
                DELETE FROM recurring_posts
                WHERE post_id IN (
                    SELECT post_id
                    FROM posts
                    WHERE user_id = :user_id
                       OR account_id IN (
                           SELECT account_id
                           FROM social_accounts
                           WHERE user_id = :user_id
                       )
                       OR campaign_id IN (
                           SELECT campaign_id
                           FROM campaigns
                           WHERE user_id = :user_id
                       )
                )
            """),
            {"user_id": user_id}
        )

        # Delete post analytics
        db.execute(
            text("""
                DELETE FROM post_analytics
                WHERE post_id IN (
                    SELECT post_id
                    FROM posts
                    WHERE user_id = :user_id
                       OR account_id IN (
                           SELECT account_id
                           FROM social_accounts
                           WHERE user_id = :user_id
                       )
                       OR campaign_id IN (
                           SELECT campaign_id
                           FROM campaigns
                           WHERE user_id = :user_id
                       )
                )
            """),
            {"user_id": user_id}
        )

        # Delete posts
        db.execute(
            text("""
                DELETE FROM posts
                WHERE user_id = :user_id
                   OR account_id IN (
                       SELECT account_id
                       FROM social_accounts
                       WHERE user_id = :user_id
                   )
                   OR campaign_id IN (
                       SELECT campaign_id
                       FROM campaigns
                       WHERE user_id = :user_id
                   )
            """),
            {"user_id": user_id}
        )

        # Delete campaigns
        db.execute(
            text("""
                DELETE FROM campaigns
                WHERE user_id = :user_id
            """),
            {"user_id": user_id}
        )

        # Delete social accounts
        db.execute(
            text("""
                DELETE FROM social_accounts
                WHERE user_id = :user_id
            """),
            {"user_id": user_id}
        )

        # Finally delete the user
        db.execute(
            text("""
                DELETE FROM users
                WHERE user_id = :user_id
            """),
            {"user_id": user_id}
        )

        db.commit()

        return {
            "message": "User deleted successfully"
        }

    except Exception:
        db.rollback()
        raise


@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role: str,
    admin_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    if role not in ["user", "admin"]:
        raise HTTPException(
            status_code=400,
            detail="Role must be either user or admin"
        )

    if user_id == admin_user.user_id:
        raise HTTPException(
            status_code=400,
            detail="Admin cannot change their own role"
        )

    user = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.role = role
    db.commit()
    db.refresh(user)

    return {
        "message": "User role updated successfully",
        "user_id": user.user_id,
        "role": user.role
    }
@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    is_active: bool,
    admin_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    if user_id == admin_user.user_id:
        raise HTTPException(
            status_code=400,
            detail="Admin cannot deactivate their own account"
        )

    user = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.is_active = is_active

    db.commit()
    db.refresh(user)

    return {
        "message": (
            "User activated successfully"
            if is_active
            else "User deactivated successfully"
        ),
        "user_id": user.user_id,
        "is_active": user.is_active
    }