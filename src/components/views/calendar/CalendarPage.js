'use client';

import * as React from "react";
import Calendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import timelinePlugin from "@fullcalendar/timeline";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";

const plugins = [
  dayGridPlugin,
  interactionPlugin,
  listPlugin,
  timeGridPlugin,
  timelinePlugin,
];

export const CalendarPage = React.forwardRef(
  ({ view = "dayGridMonth", tasks = [], onTaskClick }, ref) => {
    return (
      <Card sx={{ overflowX: "auto" }}>
        <Box sx={{ minWidth: "800px" }}>
          <Calendar
            ref={ref} // ✅ pass the ref to FullCalendar
            plugins={plugins}
            initialView={view}
            headerToolbar={false}
            height={800}
            editable={false}
            selectable={false}
            events={tasks}
            eventClick={({ event }) => {
              const task = {
                id: event.id,
                title: event.title,
                start: event.start,
                end: event.end,
                ...event.extendedProps,
              };
              onTaskClick?.(task);
            }}
            eventDisplay="block"
            eventMinHeight={25}
            dayMaxEventRows={3}
            rerenderDelay={10}
            weekends
          />
        </Box>
      </Card>
    );
  }
);
