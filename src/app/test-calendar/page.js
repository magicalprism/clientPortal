'use client';

import { Box } from '@mui/material';
import UniversalCalendarView from '@/components/views/calendar/UniversalCalendarView';

export default function TestCalendarPage() {
  return (
    <Box sx={{ py: 3 }}>
      <UniversalCalendarView />
    </Box>
  );
}