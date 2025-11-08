// app/hooks/useFieldOfInterest.ts
import { useState, useEffect } from 'react';

export function useFieldOfInterest(orgId: string) {
  const [fieldOfInterestOptions, setFieldOfInterestOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const fetchFieldOfInterestOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/google-sheets?action=getFieldOfInterestOptions&orgId=${orgId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch field of interest options: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.fieldOfInterestOptions) {
          setFieldOfInterestOptions(data.fieldOfInterestOptions);
        } else {
          throw new Error(data.error || 'Failed to load field of interest options');
        }
      } catch (err) {
        console.error('Error fetching field of interest options:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback to empty array
        setFieldOfInterestOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFieldOfInterestOptions();
  }, [orgId]);

  return { fieldOfInterestOptions, loading, error };
}