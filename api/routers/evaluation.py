from fastapi import APIRouter, Depends

from api.deps import get_current_user
from api.schemas import EvaluateRequest, EvaluateResponse
from services.evaluation_service import evaluate_and_save

router = APIRouter()


@router.post("/evaluate", response_model=EvaluateResponse)
def evaluate(req: EvaluateRequest, current_user: dict = Depends(get_current_user)):
    result, xp = evaluate_and_save(
        student_answer=req.student_answer,
        subtopic_name=req.subtopic_name,
        user_id=current_user["user_id"],
        subtopic_id=req.subtopic_id,
        hints_used=req.hints_used,
    )
    return {
        "is_correct": result.is_correct,
        "feedback": result.feedback,
        "xp_earned": xp,
    }
