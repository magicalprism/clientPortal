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
import { CalendarPage } from '@/components/views/calendar/CalendarPage';
import { getCompanyLogoJoinSelect } from '@/lib/utils/getCompanyLogoJoinSelect';

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

  const updateCalendarDate = (date) => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.gotoDate(date);
      const updatedDate = api.getDate();
      setCurrentDate(new Date(updatedDate));
    }
  };

  const handlePrev = () => {
    const api = calendarRef.current?.getApi();

    if (api) {
      api.prev();
      const updatedDate = api.getDate();

      setCurrentDate(new Date(updatedDate));
    } else {

    }
  };

  const handleNext = () => {
    const api = calendarRef.current?.getApi();

    if (api) {
      api.next();
      const updatedDate = api.getDate();

      setCurrentDate(new Date(updatedDate));
    } else {

    }
  };

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    const newDate = new Date(currentDate);
    newDate.setMonth(newMonth);

    updateCalendarDate(newDate);
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    const newDate = new Date(currentDate);
    newDate.setFullYear(newYear);

    updateCalendarDate(newDate);
  };

  useEffect(() => {
    const fetchItems = async () => {
  const selectString = getCompanyLogoJoinSelect(config);

  const { data, error } = await supabase
    .from(config.name)
    .select(selectString);

  if (error) {

    return;
  }

  for (const filter of config.filters || []) {
    const value = filters?.[filter.name];
    if (!value || filter.name === 'sort') continue;

    if (['select', 'relationship', 'boolean'].includes(filter.type)) {
      query = query.eq(filter.name, value);
    } else if (filter.type === 'text') {
      query = query.ilike(filter.name, `%${value}%`);
    }
  }

  const parentIds = new Set(data.map(item => item.parent_id).filter(Boolean));

  const parsed = data.map((item) => ({
    ...item,
    id: item.id,
    start: new Date(item.start_date || item.due_date || item.created_at),
    end: new Date(item.due_date || item.start_date),
    allDay: item.type !== 'meeting',
    has_children: parentIds.has(item.id),
    company_thumbnail_url: item.company?.media?.url || null
  }));

  setTasks(parsed);
};


    fetchItems();
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