from __future__ import annotations

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from services.ai_core import get_llm
from database.db import get_connection


def _save_message(user_id: int, subtopic_id: int, role: str, content: str) -> None:
    """Persist a chat message to the ChatSessions table."""
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO ChatSessions (user_id, subtopic_id, role, content) VALUES (?, ?, ?, ?)",
            (user_id, subtopic_id, role, content),
        )


def _load_history(user_id: int, subtopic_id: int) -> list:
    """Load chat history from DB as LangChain message objects."""
    with get_connection() as conn:
        rows = conn.execute(
            """SELECT role, content FROM ChatSessions
               WHERE user_id = ? AND subtopic_id = ?
               ORDER BY created_at""",
            (user_id, subtopic_id),
        ).fetchall()

    messages = []
    for row in rows:
        if row["role"] == "user":
            messages.append(HumanMessage(content=row["content"]))
        elif row["role"] == "assistant":
            messages.append(AIMessage(content=row["content"]))
    return messages


def _get_cached_lesson(subtopic_id: int) -> str | None:
    """Return cached lesson content from DB, or None if not found."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT content FROM LessonContent WHERE subtopic_id = ?",
            (subtopic_id,),
        ).fetchone()
    return row["content"] if row else None


def _save_lesson(subtopic_id: int, content: str) -> None:
    """Persist generated lesson content to DB for future reuse."""
    with get_connection() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO LessonContent (subtopic_id, content) VALUES (?, ?)",
            (subtopic_id, content),
        )


def get_i_do_content(subtopic_name: str, subtopic_id: int) -> str:
    """Phase 'I Do': Return cached lesson or generate + cache a new one."""
    # Check DB cache first
    cached = _get_cached_lesson(subtopic_id)
    if cached:
        return cached

    llm = get_llm()
    prompt = f"""You are an expert tutor helping an Israeli high-school student prepare for the Bagrut exam.

Topic: {subtopic_name}

Generate a thorough lesson that includes ALL of the following sections:

## 1. Introduction
- What is this topic about and why is it important?
- Where does it appear in the Bagrut exam?

## 2. Core Concept Explanation
- Explain the key concepts, definitions, and rules in detail (4-6 paragraphs).
- Use clear analogies or real-world examples to build intuition.
- Highlight common misconceptions and pitfalls students encounter.

## 3. Key Formulas / Rules
- List all relevant formulas, rules, or patterns.
- Explain when and how to apply each one.

## 4. Solved Example 1 (Basic)
- A straightforward problem with a detailed step-by-step solution.
- Explain the reasoning behind each step.

## 5. Solved Example 2 (Intermediate)
- A slightly harder problem that combines multiple concepts.
- Show the complete solution with explanations.

## 6. Summary & Tips
- Summarize the 3-4 most important points.
- Give practical tips for the exam (common mistakes to avoid, shortcuts, etc.).

FORMATTING RULES:
- Use LaTeX notation for all math ($...$ for inline, $$...$$ for block).
- Use markdown headers (##), bold (**), and bullet points for clear structure.
- Write entirely in Hebrew.
- Be thorough but keep explanations accessible for a high-school student."""

    response = llm.invoke([HumanMessage(content=prompt)])
    content = response.content

    # Cache for future use
    _save_lesson(subtopic_id, content)

    return content


def process_we_do_chat(user_message: str, user_id: int, subtopic_id: int,
                       subtopic_name: str) -> str:
    """Phase 'We Do': Socratic tutoring — guide the student, never give the answer directly."""
    llm = get_llm()

    system = SystemMessage(content=f"""You are a warm, encouraging Socratic tutor helping an Israeli high-school student practice: {subtopic_name}.

YOUR APPROACH:
1. Start by presenting a practice problem appropriate for the Bagrut exam level.
2. Guide the student through the solution step by step using questions.
3. When the student answers correctly, praise them specifically ("!מצוין, זיהית נכון ש...") and move to the next step.
4. When the student makes an error, gently point out the issue WITHOUT giving the answer. Ask a simpler guiding question.
5. If the student is stuck after 2 attempts, give a concrete hint (e.g., "try applying formula X" or "think about what happens when...").
6. After solving one problem, offer to try another one at a similar or harder level.

STRICT RULES:
- NEVER reveal the full answer directly — always guide through questions.
- Keep your responses focused and clear (2-4 paragraphs per message).
- Use LaTeX for all math ($...$ inline, $$...$$ block).
- Respond entirely in Hebrew.
- Be warm, patient, and encouraging — this is a tutoring session, not an exam.""")

    # Load history and add new user message
    history = _load_history(user_id, subtopic_id)
    _save_message(user_id, subtopic_id, "user", user_message)

    messages = [system] + history + [HumanMessage(content=user_message)]
    response = llm.invoke(messages)

    _save_message(user_id, subtopic_id, "assistant", response.content)
    return response.content


def process_you_do_hint(user_message: str, user_id: int, subtopic_id: int,
                        subtopic_name: str) -> str:
    """Phase 'You Do': Independent practice — only give minor hints."""
    llm = get_llm()

    system = SystemMessage(content=f"""You are a tutor overseeing independent practice on: {subtopic_name}.

The student is now practicing independently. Each "question" is a separate exercise they must solve on their own.

YOUR APPROACH:
1. When the student first arrives (e.g., says "שאלה הבאה" or starts the session):
   - Present ONE clear, self-contained practice problem at Bagrut exam level.
   - State the problem fully — all given information and what is asked.
   - Do NOT provide hints, solutions, or sub-steps with the initial problem.
2. When the student asks for help, give ONE small hint — just enough to unblock them.
   - 1-2 sentences only. Point toward the right method without solving it.
3. If they're on the right track, confirm briefly and encourage them to continue.
4. When the student says "שאלה הבאה" (next question), present a NEW problem on a DIFFERENT aspect of {subtopic_name}.
   - Vary difficulty and the specific concept tested. Do NOT repeat a previous problem.

STRICT RULES:
- Keep hints minimal (1-2 sentences). Each hint costs the student XP.
- When presenting a problem, be clear and self-contained — no vagueness.
- Use LaTeX for all math ($...$ inline, $$...$$ block).
- Respond entirely in Hebrew.
- Be encouraging: "!אתה בכיוון הנכון", "!כמעט שם" etc.""")

    history = _load_history(user_id, subtopic_id)
    _save_message(user_id, subtopic_id, "user", user_message)

    messages = [system] + history + [HumanMessage(content=user_message)]
    response = llm.invoke(messages)

    _save_message(user_id, subtopic_id, "assistant", response.content)
    return response.content


def clear_chat_history(user_id: int, subtopic_id: int) -> None:
    """Clear stored chat history for a subtopic (used when restarting)."""
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM ChatSessions WHERE user_id = ? AND subtopic_id = ?",
            (user_id, subtopic_id),
        )
