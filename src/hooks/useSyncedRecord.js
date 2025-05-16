'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { hydrateRecord } from '@/lib/utils/hydrateRecord';

const supabase = createClient();

export const useSyncedRecord = ({ config, recordId, initialRecord = {} }) => {
  const [record, setRecord] = useState(initialRecord);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecord = useCallback(async () => {
    if (!recordId || !config?.name) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from(config.name)
        .select('*')
        .eq('id', recordId)
        .single();

      if (error) throw error;

      const hydrated = await hydrateRecord(data, config, supabase);

      setRecord(hydrated);
    } catch (err) {
      console.error('[useSyncedRecord] fetch error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [recordId, config?.name]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  return {
    record,
    isLoading,
    error,
    refreshRecord: fetchRecord,
    setRecord,
  };
};
