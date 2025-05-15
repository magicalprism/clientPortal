import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';

export const useAutoUpdateTasks = (record) => {
  const supabase = createClient();

  useEffect(() => {
    if (!record?.status || record.status !== 'not started') return;
    if (!record?.start_date || new Date(record.start_date) > new Date()) return;

    const updateStatus = async () => {
      await supabase
        .from('task')
        .update({ status: 'todo' })
        .eq('id', record.id)
        .eq('status', 'not started'); // just in case it changed

      // Optional: trigger a refresh if needed
    };

    updateStatus();
  }, [record?.id, record?.status, record?.start_date]);
};
