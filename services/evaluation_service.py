from __future__ import annotations

from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field

from services.ai_core import get_llm
from services.pedagogy_service import _save_message
from services.progress_service import accumulate_question_xp


class EvaluationResult(BaseModel):
    is_correct: bool = Field(description="Whether the student's answer is correct")
    feedback: str = Field(description="Short feedback in Hebrew explaining the evaluation")


def _get_course_context_for_eval(subtopic_id: int) -> str:
    """Look up course context for the evaluation prompt."""
    from database.db import get_connection
    with get_connection() as conn:
        row = conn.execute("""
            SELECT c.name, c.description FROM Courses c
            JOIN Subjects s ON s.course_id = c.id
            JOIN Topics t ON t.subject_id = s.id
            JOIN SubTopics st ON st.topic_id = t.id
            WHERE st.id = ?""", (subtopic_id,)).fetchone()
    if not row:
        return ""
    desc = (row["description"] or "").strip()
    return f"Course: {row['name']}" + (f"\n{desc}" if desc else "")


def _get_recent_question(user_id: int, subtopic_id: int) -> str:
    """Load the last few chat messages to find the question being answered."""
    from database.db import get_connection
    with get_connection() as conn:
        rows = conn.execute(
            """SELECT role, content FROM ChatSessions
               WHERE user_id = ? AND subtopic_id = ?
               ORDER BY created_at DESC LIMIT 6""",
            (user_id, subtopic_id),
        ).fetchall()
    if not rows:
        return ""
    # Reverse to chronological order and format
    rows = list(reversed(rows))
    lines = []
    for r in rows:
        label = "Student" if r["role"] == "user" else "Tutor"
        lines.append(f"{label}: {r['content'][:500]}")
    return "\n".join(lines)


def evaluate_final_answer(student_answer: str, subtopic_name: str,
                          subtopic_id: int = 0,
                          user_id: int = 0) -> EvaluationResult:
    """Use Claude as a strict grader to evaluate the student's final answer."""
    llm = get_llm()
    structured_llm = llm.with_structured_output(EvaluationResult)

    course_ctx = _get_course_context_for_eval(subtopic_id) if subtopic_id else ""
    course_block = f"\n{course_ctx}\n" if course_ctx else ""

    # Load recent chat to know what question was asked
    conversation_ctx = ""
    if user_id and subtopic_id:
        recent = _get_recent_question(user_id, subtopic_id)
        if recent:
            conversation_ctx = f"\nRecent conversation (the last tutor message contains the question being answered):\n{recent}\n"

    prompt = f"""You are a strict but fair exam grader. Adapt your grading to the student's level and course context.
{course_block}
Topic: {subtopic_name}
{conversation_ctx}
Student's final answer:
---
{student_answer}
---

Evaluate whether the answer is correct for the specific question that was asked in the conversation above.

GRADING GUIDELINES:
- The answer MUST match the specific question asked. Use the conversation context to identify the exact question.
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
    """Full evaluation pipeline: grade, calculate XP, persist answer+feedback to chat, accumulate in DB.
    Returns (evaluation_result, xp_earned)."""
    # Save the student's answer into chat history so the You-Do AI stays aware
    _save_message(user_id, subtopic_id, "user", f"[תשובה סופית] {student_answer}")

    result = evaluate_final_answer(student_answer, subtopic_name, subtopic_id, user_id)

    if result.is_correct:
        xp = calculate_xp(hints_used)
        accumulate_question_xp(user_id, subtopic_id, xp, hints_used)
    else:
        xp = 0

    # Save evaluation feedback into chat history
    status = "✅ נכון" if result.is_correct else "❌ לא נכון"
    _save_message(user_id, subtopic_id, "assistant", f"[הערכה: {status}] {result.feedback}")

    return result, xp
