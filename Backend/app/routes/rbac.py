from fastapi import APIRouter, Depends

from app.core.security import require_role


router = APIRouter(
    tags=["RBAC"]
)


@router.get("/admin-test")
def admin_test(
    current_user=Depends(require_role(1))
):
    return {
        "message": "Welcome Admin!",
        "user_id": current_user.id,
        "role_id": current_user.role_id
    }


@router.get("/team-test")
def team_test(
    current_user=Depends(require_role(2))
):
    return {
        "message": "Welcome Team Member!",
        "user_id": current_user.id,
        "role_id": current_user.role_id
    }
    