import client from './client';
import type { EvaluationResult } from '../types/evaluation';

export async function evaluateAnswer(
  studentAnswer: string,
  subtopicName: string,
  subtopicId: number,
  hintsUsed: number
): Promise<EvaluationResult> {
  const { data } = await client.post<EvaluationResult>('/evaluation/evaluate', {
    student_answer: studentAnswer,
    subtopic_name: subtopicName,
    subtopic_id: subtopicId,
    hints_used: hintsUsed,
  });
  return data;
}
