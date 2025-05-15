"use client";

import * as React from "react";
import Calendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import timelinePlugin from "@fullcalendar/timeline";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import { createClient } from '@/lib/supabase/browser';
import * as collections from '@/collections';
import { useModal } from '@/components/modals/ModalContext';

const supabase = createClient();




const plugins = [
  dayGridPlugin,
  interactionPlugin,
  listPlugin,
  timeGridPlugin,
  timelinePlugin,
];



export function CalendarPage({ view = "dayGridMonth", tasks = [], onTaskClick }) {
  const { openModal } = useModal(); // Place this at the top of your CalendarPage
  return (
    <Card sx={{ overflowX: "auto" }}>
      <Box sx={{ minWidth: "800px" }}>
        <Calendar
          plugins={plugins}
          initialView={view}
          headerToolbar={false}
          height={800}
          eventContent={({ event }) => {
            const type = event.extendedProps.type;
            const isMeeting = type === 'meeting';
            const timeText = isMeeting
              ? event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : null;

            return (
              <div
                style={{ padding: '4px 8px' }}
                title={event.title} // 👈 Native HTML tooltip
              >
                {timeText && <strong>{timeText} </strong>}
                <span>{event.title}</span>
              </div>
            );
          }}
          editable={false}
          selectable={false}
          events={tasks} // still required as `events`
          eventClick={async ({ event }) => {
            const id = event.id;
            const type = event.extendedProps?.type;
            const configName = event.extendedProps?.collection || 'task'; // Or pass `config` as a prop if available

            const fullConfig = collections[configName];

            const { data, error } = await supabase
              .from(configName)
              .select('*')
              .eq('id', id)
              .single();

            if (error) {
              console.error('[CalendarPage] Failed to fetch event record:', error);
              return;
            }

            openModal('edit', {
              config: fullConfig,
              defaultValues: data,
            });
          }}
          // these are FullCalendar’s internal props — cannot rename
          eventDisplay="block"
          eventMinHeight={25}
          dayMaxEventRows={3}
          rerenderDelay={10}
          weekends
          eventClassNames={({ event }) => {
            const type = event.extendedProps.task_type;

            if (type === 'meeting') return ['event-meeting'];
            if (type === 'task') return ['event-task'];
            return ['event-default'];
          }}
        />
      </Box>
    </Card>
  );
}
