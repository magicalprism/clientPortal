"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import { createClient } from "@/lib/supabase/browser";
import { CalendarProvider } from "@/components/dashboard/calendar/calendar-context";
import { CalendarView } from "@/components/dashboard/calendar/calendar-view";
import { CalendarFilters } from "@/components/dashboard/calendar/calendar-filters";

const supabase = createClient();

export default function Page() {
  const [events, setEvents] = React.useState([]);
  const [filterType, setFilterType] = React.useState("all");

  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "dayGridMonth";

  const type = searchParams.get("type") || "all";
const title = searchParams.get("title") || "";

React.useEffect(() => {
  const fetchEvents = async () => {
    try {
      let query = supabase.from("task").select("*");

      if (type !== "all") {
        query = query.eq("type", type);
      }

      if (title) {
        query = query.ilike("title", `%${title}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Supabase fetch error:", error);
        return;
      }

      const parsed = data.map((event) => ({
        id: event.id || `temp-${Math.random()}`,
        ...event,
        start: new Date(event.start || event.due_date),
        end: new Date(event.due_date),
      }));

      setEvents(parsed);
    } catch (err) {
      console.error("Unexpected fetch error:", err);
    }
  };

  fetchEvents();
}, [type, title]);

  
  

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
        <CalendarFilters />
      </Box>

      <CalendarProvider events={events}>
        <CalendarView view={view} />
      </CalendarProvider>
    </Box>
  );
}

