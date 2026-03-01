from fastapi import APIRouter, Depends

from api.deps import get_current_user
from api.schemas import EvaluateRequest, EvaluateResponse
from services.evaluation_service import evaluate_and_save, evaluate_final_answer, calculate_xp

router = APIRouter()


@router.post("/evaluate", response_model=EvaluateResponse)
def evaluate(req: EvaluateRequest, current_user: dict = Depends(get_current_user)):
    if req.save_progress:
        result, xp = evaluate_and_save(
            student_answer=req.student_answer,
            subtopic_name=req.subtopic_name,
            user_id=current_user["user_id"],
            subtopic_id=req.subtopic_id,
            hints_used=req.hints_used,
        )
    else:
        result = evaluate_final_answer(req.student_answer, req.subtopic_name, req.subtopic_id, current_user["user_id"])
        xp = calculate_xp(req.hints_used) if result.is_correct else 0
    return {
        "is_correct": result.is_correct,
        "feedback": result.feedback,
        "xp_earned": xp,
    }
