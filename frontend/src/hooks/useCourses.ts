import { useState, useEffect, useCallback } from 'react';
import type { Course } from '../types/course';
import * as coursesApi from '../api/courses';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await coursesApi.getCourses();
      setCourses(data);
    } catch {
      setError('שגיאה בטעינת קורסים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, loading, error, refetch: fetchCourses };
}
