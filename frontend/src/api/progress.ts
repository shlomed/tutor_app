import client from './client';
import type { Dashboard, ProgressStatus } from '../types/progress';

export async function getDashboard(courseId?: number): Promise<Dashboard> {
  const params = courseId ? { course_id: courseId } : {};
  const { data } = await client.get<Dashboard>('/progress/dashboard', { params });
  return data;
}

export async function updateProgress(
  subtopicId: number,
  status: ProgressStatus,
  xpEarned = 0,
  assistanceLevelUsed = 0
): Promise<void> {
  await client.put('/progress', {
    subtopic_id: subtopicId,
    status,
    xp_earned: xpEarned,
    assistance_level_used: assistanceLevelUsed,
  });
}
