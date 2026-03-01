import client from './client';

export async function getIDoContent(subtopicName: string, subtopicId: number): Promise<string> {
  const { data } = await client.post<{ content: string }>('/learning/i-do', {
    subtopic_name: subtopicName,
    subtopic_id: subtopicId,
  });
  return data.content;
}

export async function sendWeDoMessage(
  message: string,
  subtopicId: number,
  subtopicName: string
): Promise<string> {
  const { data } = await client.post<{ response: string }>('/learning/we-do', {
    message,
    subtopic_id: subtopicId,
    subtopic_name: subtopicName,
  });
  return data.response;
}

export async function sendYouDoMessage(
  message: string,
  subtopicId: number,
  subtopicName: string
): Promise<string> {
  const { data } = await client.post<{ response: string }>('/learning/you-do', {
    message,
    subtopic_id: subtopicId,
    subtopic_name: subtopicName,
  });
  return data.response;
}

export async function clearChatHistory(subtopicId: number): Promise<void> {
  await client.delete(`/learning/chat/${subtopicId}`);
}
