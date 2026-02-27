from __future__ import annotations

from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field

from services.ai_core import get_llm
from services.progress_service import update_progress


class EvaluationResult(BaseModel):
    is_correct: bool = Field(description="Whether the student's answer is correct")
    feedback: str = Field(description="Short feedback in Hebrew explaining the evaluation")


def evaluate_final_answer(student_answer: str, subtopic_name: str) -> EvaluationResult:
    """Use Claude as a strict grader to evaluate the student's final answer."""
    llm = get_llm()
    structured_llm = llm.with_structured_output(EvaluationResult)

    prompt = f"""You are a strict but fair exam grader for the Israeli Bagrut exam.

Topic: {subtopic_name}

Student's answer:
---
{student_answer}
---

Evaluate whether the answer demonstrates correct understanding of the topic.

GRADING GUIDELINES:
- Accept answers that show correct understanding even if phrasing is imperfect.
- For math: the numerical result must be correct AND the method should be sound.
- For concepts: the core idea must be accurate, minor details can be forgiven.
- If the answer is partially correct, consider it incorrect but acknowledge what was right.

FEEDBACK GUIDELINES:
- If correct: Give specific praise about what the student did well (1-2 sentences in Hebrew).
- If wrong: Explain what specifically went wrong WITHOUT revealing the correct answer (1-2 sentences in Hebrew).
  Point the student toward the right direction (e.g., "check your calculation in step 2" or "consider the definition of X")."""

    result = structured_llm.invoke([HumanMessage(content=prompt)])
    return result


def calculate_xp(hints_used: int) -> int:
    """Calculate XP based on number of hints used during 'You Do' phase."""
    if hints_used == 0:
        return 100
    elif hints_used == 1:
        return 70
    elif hints_used == 2:
        return 40
    else:
        return 10


def evaluate_and_save(student_answer: str, subtopic_name: str,
                      user_id: int, subtopic_id: int,
                      hints_used: int) -> tuple[EvaluationResult, int]:
    """Full evaluation pipeline: grade, calculate XP, save to DB.
    Returns (evaluation_result, xp_earned)."""
    result = evaluate_final_answer(student_answer, subtopic_name)

    if result.is_correct:
        xp = calculate_xp(hints_used)
        update_progress(user_id, subtopic_id, "completed", xp, hints_used)
    else:
        xp = 0

    return result, xp
