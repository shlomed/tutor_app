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


def get_i_do_content(subtopic_name: str) -> str:
    """Phase 'I Do': Generate micro-learning content with a solved example."""
    llm = get_llm()
    prompt = f"""You are an expert tutor helping an Israeli student prepare for the Bagrut exam.

Topic: {subtopic_name}

Generate a concise micro-lesson that includes:
1. A clear explanation of the concept (2-3 paragraphs max).
2. One fully solved example with step-by-step solution.

Use LaTeX notation for all math ($...$ for inline, $$...$$ for block).
Write in Hebrew. Keep it simple and clear."""

    response = llm.invoke([HumanMessage(content=prompt)])
    return response.content


def process_we_do_chat(user_message: str, user_id: int, subtopic_id: int,
                       subtopic_name: str) -> str:
    """Phase 'We Do': Socratic tutoring — guide the student, never give the answer directly."""
    llm = get_llm()

    system = SystemMessage(content=f"""You are a Socratic tutor helping a student with: {subtopic_name}.

STRICT RULES:
- NEVER reveal the full answer directly.
- Ask guiding questions that lead the student toward the solution.
- If the student is stuck, give a small hint and ask another question.
- Praise correct steps. Gently redirect wrong steps.
- Use LaTeX for math ($...$ inline, $$...$$ block).
- Respond in Hebrew.""")

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

STRICT RULES:
- The student should solve this on their own.
- Only give MINIMAL hints when explicitly asked.
- Never solve the problem or give more than one step at a time.
- Encourage the student to keep trying.
- Use LaTeX for math ($...$ inline, $$...$$ block).
- Respond in Hebrew.""")

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
