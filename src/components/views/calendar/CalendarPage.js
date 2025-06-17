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



export const CalendarPage = React.forwardRef(function CalendarPage(
  { view = 'dayGridMonth', tasks = [], onTaskClick },
  ref
) 
{
  
  const { openModal } = useModal();
  return (
    <Card sx={{ overflowX: "auto" }}>
      <Box sx={{ minWidth: "800px" }}>
        <Calendar
         ref={ref} 
          plugins={plugins}
          initialView={view}
          headerToolbar={false}
          height={1200}
          eventContent={({ event }) => {
            const type = event.extendedProps.type;
            const isMeeting = type === 'meeting';
            const timeText = isMeeting
              ? event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : null;
              const thumbnailUrl = event.extendedProps.company_thumbnail_url;

            return (
              <div
                style={{ 
                  display: 'inline-flex',
                  padding: '4px 8px'
                 }}
                title={event.title} // 👈 Native HTML tooltip
              >
                 {thumbnailUrl && (
                    <img
                      src={thumbnailUrl}
                      alt="Logo"
                      style={{
                        width: 20,
                        height: 20,
                        objectFit: 'cover',
                        borderRadius: 4,
                        marginRight: 6,         // Adds spacing to the right of the image
                        flexShrink: 0,          // Prevents it from shrinking
                        display: 'inline-block',
                        padding: 1, 
                        background: 'white',
                      }}
                    />
                  )}
                {timeText && <strong>{timeText} </strong>}
                <span>{event.title}</span>
              </div>
            );
          }}
          editable={false}
          selectable={false}
          events={tasks} // still required as `events`
          eventClick={async ({ event }) => {
            try {
              // If onTaskClick is provided, use it instead of fetching data again
              if (onTaskClick && typeof onTaskClick === 'function') {
                // Pass the entire event object with extendedProps to the handler
                onTaskClick(event.extendedProps);
                return;
              }
              
              // Fallback to original behavior if no onTaskClick handler
              const id = event.id;
              const configName = event.extendedProps?.collection || 'task';
              const fullConfig = collections[configName];

              // Only fetch if we need to
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
            } catch (err) {
              console.error('[CalendarPage] Error handling event click:', err);
            }
          }}
          // these are FullCalendar’s internal props — cannot rename
          eventDisplay="block"
          eventMinHeight={25}
          dayMaxEventRows={4}
          rerenderDelay={10}
          weekends
          eventClassNames={({ event }) => {
            const type = event.extendedProps.type;
            const isParent = event.extendedProps.has_children;
            const isComplete = event.extendedProps.status === 'complete';

            if (isParent) return ['event-parent'];
            if (isComplete) return ['event-complete'];
            if (type === 'meeting') return ['event-meeting'];
            if (type === 'vacation') return ['event-vacation'];
            if (type === 'task') return ['event-task'];
            return ['event-default'];
          }}
        />
      </Box>
    </Card>
  );
}
)
