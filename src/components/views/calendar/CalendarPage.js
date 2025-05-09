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

const plugins = [
  dayGridPlugin,
  interactionPlugin,
  listPlugin,
  timeGridPlugin,
  timelinePlugin,
];

export function CalendarPage({ view = "dayGridMonth", tasks = [], onTaskClick }) {
  return (
    <Card sx={{ overflowX: "auto" }}>
      <Box sx={{ minWidth: "800px" }}>
        <Calendar
          plugins={plugins}
          initialView={view}
          headerToolbar={false}
          height={800}
          editable={false}
          selectable={false}
          events={tasks} // still required as `events`
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
          // these are FullCalendar’s internal props — cannot rename
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
