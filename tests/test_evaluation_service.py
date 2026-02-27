import pytest

from services.evaluation_service import EvaluationResult, calculate_xp


class TestCalculateXp:
    def test_zero_hints(self):
        assert calculate_xp(0) == 100

    def test_one_hint(self):
        assert calculate_xp(1) == 70

    def test_two_hints(self):
        assert calculate_xp(2) == 40

    def test_many_hints(self):
        assert calculate_xp(3) == 10
        assert calculate_xp(10) == 10


class TestEvaluationResultSchema:
    def test_correct_result(self):
        r = EvaluationResult(is_correct=True, feedback="מצוין!")
        assert r.is_correct is True
        assert r.feedback == "מצוין!"

    def test_incorrect_result(self):
        r = EvaluationResult(is_correct=False, feedback="יש טעות בסימן")
        assert r.is_correct is False


@pytest.mark.llm
def test_evaluate_final_answer_live():
    """Live test: send an answer to Claude for grading."""
    from dotenv import load_dotenv
    load_dotenv()
    from services.evaluation_service import evaluate_final_answer

    result = evaluate_final_answer(
        student_answer="x = 5",
        subtopic_name="פתרון המשוואה 2x + 3 = 13",
    )
    assert isinstance(result, EvaluationResult)
    assert isinstance(result.is_correct, bool)
    print(f"\nEvaluation: correct={result.is_correct}, feedback={result.feedback}")
