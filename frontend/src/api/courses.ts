import client from './client';
import type { Course } from '../types/course';

export async function getCourses(): Promise<Course[]> {
  const { data } = await client.get<Course[]>('/courses');
  return data;
}

export async function createCourse(name: string): Promise<Course> {
  const { data } = await client.post<Course>('/courses', { name });
  return data;
}

export async function updateCourse(courseId: number, name: string): Promise<void> {
  await client.put(`/courses/${courseId}`, { name });
}

export async function deleteCourse(courseId: number): Promise<void> {
  await client.delete(`/courses/${courseId}`);
}
