import { useState, useEffect, useCallback } from 'react';
import type { Dashboard } from '../types/progress';
import * as progressApi from '../api/progress';

export function useProgress(courseId?: number) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await progressApi.getDashboard(courseId);
      setDashboard(data);
    } catch {
      setError('שגיאה בטעינת התקדמות');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { dashboard, loading, error, refetch: fetchDashboard };
}
