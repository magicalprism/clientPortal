'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Select,
  MenuItem,
} from '@mui/material';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { useModal } from '@/components/modals/ModalContext';
import { CalendarPage } from './calendar/CalendarPage';

const supabase = createClient();
const allowedViews = ['dayGridMonth', 'timeGridWeek', 'listWeek'];

export default function CalendarView({ config, filters }) {
  const [tasks, setTasks] = useState([]);
  const { openModal } = useModal();
  const searchParams = useSearchParams();
  const rawView = searchParams.get('view');
  const view = allowedViews.includes(rawView) ? rawView : 'dayGridMonth';

  const calendarRef = useRef(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const logCalendarApi = (label) => {
    const api = calendarRef.current?.getApi();
    console.log(`[${label}] calendarApi:`, api);
    if (api) console.log(`[${label}] calendarApi.getDate():`, api.getDate());
  };

  const updateCalendarDate = (date) => {
    const api = calendarRef.current?.getApi();
    console.log('[updateCalendarDate] trying to go to:', date);
    if (api) {
      api.gotoDate(date);
      const updatedDate = api.getDate();
      console.log('[updateCalendarDate] calendar updated to:', updatedDate);
      setCurrentDate(new Date(updatedDate));
    } else {
      console.warn('[updateCalendarDate] calendarApi is undefined');
    }
  };

  const handlePrev = () => {
    const api = calendarRef.current?.getApi();
    console.log('[handlePrev] clicked');
    if (api) {
      api.prev();
      const updatedDate = api.getDate();
      console.log('[handlePrev] new date:', updatedDate);
      setCurrentDate(new Date(updatedDate));
    } else {
      console.warn('[handlePrev] calendarApi is undefined');
    }
  };

  const handleNext = () => {
    const api = calendarRef.current?.getApi();
    console.log('[handleNext] clicked');
    if (api) {
      api.next();
      const updatedDate = api.getDate();
      console.log('[handleNext] new date:', updatedDate);
      setCurrentDate(new Date(updatedDate));
    } else {
      console.warn('[handleNext] calendarApi is undefined');
    }
  };

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    const newDate = new Date(currentDate);
    newDate.setMonth(newMonth);
    console.log('[handleMonthChange] selected month:', newMonth, '→', newDate);
    updateCalendarDate(newDate);
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    const newDate = new Date(currentDate);
    newDate.setFullYear(newYear);
    console.log('[handleYearChange] selected year:', newYear, '→', newDate);
    updateCalendarDate(newDate);
  };

  useEffect(() => {
    logCalendarApi('onRender');

    const fetchTasks = async () => {
      let query = supabase.from(config.name).select('*');

      for (const filter of config.filters || []) {
        const value = filters?.[filter.name];
        if (!value) continue;
        if (filter.name === 'sort') continue;

        if (['select', 'relationship', 'boolean'].includes(filter.type)) {
          query = query.eq(filter.name, value);
        } else if (filter.type === 'text') {
          query = query.ilike(filter.name, `%${value}%`);
        }
      }

      const { data, error } = await query;
      if (error) return console.error('Error fetching calendar tasks:', error);

      const parsed = data.map((item) => ({
        ...item,
        id: item.id,
        start: new Date(item.start_date || item.due_date || item.created_at),
        end: new Date(item.due_date || item.start_date),
        allDay: item.type !== 'meeting', 
      }));

      setTasks(parsed);
    };

    fetchTasks();
  }, [filters, config]);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  return (
    <Box sx={{ px: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
        flexWrap="wrap"
        gap={2}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={handlePrev}><CaretLeft /></IconButton>
          <Typography variant="h6">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </Typography>
          <IconButton onClick={handleNext}><CaretRight /></IconButton>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Select size="small" value={month} onChange={handleMonthChange}>
            {Array.from({ length: 12 }).map((_, i) => (
              <MenuItem key={i} value={i}>
                {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
              </MenuItem>
            ))}
          </Select>
          <Select size="small" value={year} onChange={handleYearChange}>
            {Array.from({ length: 10 }).map((_, i) => {
              const y = new Date().getFullYear() - 5 + i;
              return (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              );
            })}
          </Select>
        </Stack>
      </Stack>

      <CalendarPage
        ref={calendarRef}
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