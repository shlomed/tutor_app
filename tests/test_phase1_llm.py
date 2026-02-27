import pytest


@pytest.mark.llm
def test_llm_ping():
    """Live test: verifies ANTHROPIC_API_KEY is valid and LLM responds.
    Run with: pytest -m llm
    Skipped by default to avoid API calls in CI / fast test runs."""
    from dotenv import load_dotenv
    load_dotenv()

    from services.ai_core import ping_llm

    response = ping_llm()
    assert isinstance(response, str)
    assert len(response) > 0
    print(f"\nLLM ping response: {response!r}")


@pytest.mark.llm
def test_llm_singleton():
    """get_llm() returns the same instance on repeated calls."""
    from dotenv import load_dotenv
    load_dotenv()

    from services.ai_core import get_llm

    llm1 = get_llm()
    llm2 = get_llm()
    assert llm1 is llm2
