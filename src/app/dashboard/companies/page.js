"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import { createClient } from "@/lib/supabase/browser";
import { CalendarProvider } from "@/components/dashboard/calendar/calendar-context";
import { CalendarView } from "@/components/dashboard/calendar/calendar-view";
import { CalendarFilters } from "@/components/dashboard/calendar/calendar-filters";
import { EventDialog } from "@/components/dashboard/calendar/event-dialog"; // ✅ this is your modal

const supabase = createClient();

export default function Page() {
  const [events, setEvents] = React.useState([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogRange, setDialogRange] = React.useState(null); // for selecting a date/time range

  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "dayGridMonth";
  const type = searchParams.get("type") || "all";
  const title = searchParams.get("title") || "";

  const fetchEvents = async () => {
    let query = supabase.from("task").select("*");

    if (type !== "all") {
      query = query.eq("type", type);
    }
    if (title) {
      query = query.ilike("title", `%${title}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error("❌ Supabase fetch error:", error.message);
      return;
    }

    const parsed = data.map((event) => ({
      ...event,
      id: event.id,
      start: new Date(event.start || event.due_date),
      end: new Date(event.due_date),
    }));

    setEvents(parsed);
  };

  React.useEffect(() => {
    fetchEvents();
  }, [type, title]);

  // ✅ handle new event insert
  const handleCreateEvent = async (newEvent) => {
    const { error } = await supabase.from("task").insert({
      title: newEvent.title,
      description: newEvent.description,
      start: newEvent.start.toISOString(),
      due_date: newEvent.end.toISOString(),
      allDay: newEvent.allDay,
      priority: newEvent.priority,
      type: "task", // Or dynamic based on form if needed
    });

    if (error) {
      console.error("❌ Insert error:", error.message);
    } else {
      await fetchEvents(); // refresh list
    }

    setDialogOpen(false);
  };

  return (
    <Box
      sx={{
        maxWidth: "var(--Content-maxWidth)",
        m: "var(--Content-margin)",
        p: "var(--Content-padding)",
        width: "var(--Content-width)",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <CalendarFilters />
        <Button onClick={() => setDialogOpen(true)} variant="contained">
          Add Event
        </Button>
      </Box>

      <CalendarProvider events={events}>
        <CalendarView
          view={view}
          onRangeSelect={(range) => {
            setDialogRange(range);
            setDialogOpen(true);
          }}
        />
      </CalendarProvider>

      <EventDialog
        action="create"
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreateEvent} // ✅ now wired up
        range={dialogRange}
      />
    </Box>
  );
}
