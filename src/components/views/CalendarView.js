'use client';

import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { useModal } from '@/components/modals/ModalContext';
import { CalendarPage } from './calendar/CalendarPage';

const supabase = createClient();

// ✅ Only allow these views to prevent FullCalendar errors
const allowedViews = ['dayGridMonth', 'timeGridWeek', 'listWeek'];

export default function CalendarView({ config, filters }) {
  const [tasks, setTasks] = useState([]);
  const { openModal } = useModal();
  const searchParams = useSearchParams();
  const rawView = searchParams.get('view');
  const view = allowedViews.includes(rawView) ? rawView : 'dayGridMonth';

  useEffect(() => {
    const fetchTasks = async () => {
      let query = supabase.from(config.name).select('*');

      for (const key in filters) {
        if (filters[key]) {
          query = query.ilike(key, `%${filters[key]}%`);
        }
      }

      const { data, error } = await query;
      if (error) return console.error('Error fetching calendar tasks:', error);

      const parsed = data.map((item) => ({
        ...item,
        id: item.id,
        start: new Date(item.start || item.due_date || item.created_at),
        end: new Date(item.due_date || item.start),
      }));

      setTasks(parsed);
    };

    fetchTasks();
  }, [filters, config]);

  return (
    <Box sx={{ px: 2 }}>
      <CalendarPage
        view={view}
        tasks={tasks}
        onTaskClick={(task) =>
          openModal('edit', {
            config,
            defaultValues: task,
          })
        }
      />
    </Box>
  );
}
