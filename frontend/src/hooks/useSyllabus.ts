import { useState, useEffect, useCallback } from 'react';
import type { SyllabusTree } from '../types/course';
import * as syllabusApi from '../api/syllabus';

export function useSyllabus(courseId: number | null) {
  const [tree, setTree] = useState<SyllabusTree>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = useCallback(async () => {
    if (!courseId) {
      setTree([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await syllabusApi.getSyllabusTree(courseId);
      setTree(data);
    } catch {
      setError('שגיאה בטעינת סילבוס');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  return { tree, loading, error, refetch: fetchTree };
}
