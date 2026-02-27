import client from './client';
import type { SyllabusTree, FlatSyllabusRow, SyllabusSchema, SyllabusSaveCounts } from '../types/course';

export async function getSyllabusTree(courseId: number): Promise<SyllabusTree> {
  const { data } = await client.get<SyllabusTree>(`/syllabus/${courseId}`);
  return data;
}

export async function getSyllabusFlat(courseId: number): Promise<FlatSyllabusRow[]> {
  const { data } = await client.get<FlatSyllabusRow[]>(`/syllabus/${courseId}/flat`);
  return data;
}

export async function parseSyllabus(rawText: string): Promise<SyllabusSchema> {
  const { data } = await client.post<SyllabusSchema>('/syllabus/parse', { raw_text: rawText });
  return data;
}

export async function saveSyllabus(courseId: number, syllabus: SyllabusSchema): Promise<SyllabusSaveCounts> {
  const { data } = await client.post<SyllabusSaveCounts>(`/syllabus/${courseId}/save`, syllabus);
  return data;
}

export async function deleteSyllabus(courseId: number): Promise<void> {
  await client.delete(`/syllabus/${courseId}`);
}

export async function updateSubjectName(subjectId: number, name: string): Promise<void> {
  await client.put(`/syllabus/subject/${subjectId}`, { name });
}

export async function updateTopicName(topicId: number, name: string): Promise<void> {
  await client.put(`/syllabus/topic/${topicId}`, { name });
}

export async function updateSubtopicName(subtopicId: number, name: string): Promise<void> {
  await client.put(`/syllabus/subtopic/${subtopicId}`, { name });
}

export async function addSubtopic(topicId: number, name: string): Promise<{ id: number }> {
  const { data } = await client.post<{ id: number }>(`/syllabus/topic/${topicId}/subtopic`, { name });
  return data;
}

export async function removeSubtopic(subtopicId: number): Promise<void> {
  await client.delete(`/syllabus/subtopic/${subtopicId}`);
}

export async function reimportSyllabus(courseId: number, rawText: string): Promise<SyllabusSaveCounts> {
  const { data } = await client.put<SyllabusSaveCounts>(`/syllabus/${courseId}/reimport`, { raw_text: rawText });
  return data;
}
