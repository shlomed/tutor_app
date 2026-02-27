from __future__ import annotations

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage

_llm: ChatAnthropic | None = None


def get_llm() -> ChatAnthropic:
    """Return the shared LangChain LLM instance (lazy singleton)."""
    global _llm
    if _llm is None:
        _llm = ChatAnthropic(model="claude-sonnet-4-6")
    return _llm


def ping_llm() -> str:
    """Send a minimal prompt to verify the API key and connection.
    Returns the model's response text."""
    llm = get_llm()
    response = llm.invoke([HumanMessage(content="Reply with the single word: pong")])
    return response.content
