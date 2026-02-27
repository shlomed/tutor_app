from typing import Optional

from fastapi import APIRouter, Depends, Query

from api.deps import get_current_user
from api.schemas import ProgressUpdate, MessageResponse
from services.progress_service import get_user_dashboard, update_progress

router = APIRouter()


@router.get("/dashboard")
def dashboard(
    course_id: Optional[int] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    return get_user_dashboard(current_user["user_id"], course_id)


@router.put("", response_model=MessageResponse)
def update(req: ProgressUpdate, current_user: dict = Depends(get_current_user)):
    update_progress(
        user_id=current_user["user_id"],
        subtopic_id=req.subtopic_id,
        status=req.status,
        xp_earned=req.xp_earned,
        assistance_level_used=req.assistance_level_used,
    )
    return {"message": "ההתקדמות עודכנה"}
