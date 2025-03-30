"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import { createClient } from "@/lib/supabase/browser";
import { CalendarProvider } from "@/components/dashboard/calendar/calendar-context";
import { CalendarView } from "@/components/dashboard/calendar/calendar-view";

const supabase = createClient();

export default function Page() {
  const [events, setEvents] = React.useState([]);
  const [filterType, setFilterType] = React.useState("all");

  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "dayGridMonth";

  React.useEffect(() => {
    const fetchEvents = async () => {
      let query = supabase.from("tasks").select("*");

      if (filterType !== "all") {
        query = query.eq("type", filterType);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching events:", error);
      } else {
        const parsed = data.map((event) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }));
        setEvents(parsed);
      }
    };

    fetchEvents();
  }, [filterType]);

  return (
    <Box
      sx={{
        maxWidth: "var(--Content-maxWidth)",
        m: "var(--Content-margin)",
        p: "var(--Content-padding)",
        width: "var(--Content-width)",
      }}
    >
      <Box sx={{ mb: 2 }}>
        <label htmlFor="filter">Filter by type: </label>
        <select
          id="filter"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All</option>
          <option value="meeting">Meetings</option>
          <option value="task">Tasks</option>
          <option value="reminder">Reminders</option>
        </select>
      </Box>

      <CalendarProvider events={events}>
        <CalendarView view={view} />
      </CalendarProvider>
    </Box>
  );
}
