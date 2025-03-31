"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/browser";

const supabase = createClient();

function noop() {
	// No operation
}

export const CalendarContext = React.createContext({
	events: new Map(),
	setCurrentEventId: noop,
	createEvent: noop,
	deleteEvent: noop,
	updateEvent: noop,
});

export function CalendarProvider({ children, events: initialEvents = [] }) {
	const [events, setEvents] = React.useState(new Map());
	const [currentEventId, setCurrentEventId] = React.useState();

	// Initialize events from props
	React.useEffect(() => {
		const mapped = new Map(
			initialEvents.map((event) => [String(event.id), { ...event }])
		);
		setEvents(mapped);
	}, [initialEvents]);

	// Create
	const handleCreateEvent = React.useCallback(async (inserted) => {
		const parsed = {
			id: String(inserted.id),
			title: inserted.title,
			start: new Date(inserted.start ?? inserted.due_date),
			end: new Date(inserted.due_date),
			...inserted,
		};

		// Check if pivot entry already exists
		if (parsed.checklist_id && parsed.task_id) {
			const { data: existing, error: selectError } = await supabase
				.from("checklist_task")
				.select("id")
				.eq("checklist_id", parsed.checklist_id)
				.eq("task_id", parsed.task_id)
				.maybeSingle();

			if (!existing) {
				const { error: insertError } = await supabase.from("checklist_task").insert({
					checklist_id: parsed.checklist_id,
					task_id: parsed.task_id,
				});

				if (insertError) {
					console.error("❌ Pivot insert failed:", insertError.message);
				}
			} else {
				console.log("✅ Pivot entry already exists, skipping insert.");
			}
		}

		setEvents((prev) => {
			const next = new Map(prev);
			next.set(parsed.id, parsed);
			return next;
		});
	}, []);

	// Update (modifies existing only)
	const handleUpdateEvent = React.useCallback(async (eventId, params) => {
		try {
			console.log("🧪 Updating event:", eventId, params);

			const { error } = await supabase
				.from("task")
				.update({
					title: params.title,
					description: params.description,
					start: params.start?.toISOString(),
					due_date: params.end?.toISOString(),
					allDay: params.allDay,
					priority: params.priority,
				})
				.eq("id", eventId);

			if (error) {
				console.error("❌ Supabase update error:", error.message);
				return;
			}

			setEvents((prev) => {
				const next = new Map(prev);
				const existing = next.get(String(eventId));

				if (!existing) {
					console.warn(`⚠️ Event with ID ${eventId} not found in state`);
					return prev;
				}

				next.set(String(eventId), {
					...existing,
					...params,
					start: new Date(params.start),
					end: new Date(params.end),
				});

				return next;
			});
		} catch (err) {
			console.error("❌ Unexpected error during updateEvent:", err);
		}
	}, []);

	// Delete
	const handleDeleteEvent = React.useCallback(async (eventId) => {
		try {
			const { error } = await supabase.from("task").delete().eq("id", eventId);

			if (error) {
				console.error("❌ Supabase delete error:", error.message);
				return;
			}

			setEvents((prev) => {
				const next = new Map(prev);
				next.delete(String(eventId));
				return next;
			});
		} catch (err) {
			console.error("❌ Unexpected error during deleteEvent:", err);
		}
	}, []);

	return (
		<CalendarContext.Provider
			value={{
				events,
				currentEventId,
				setCurrentEventId,
				createEvent: handleCreateEvent,
				deleteEvent: handleDeleteEvent,
				updateEvent: handleUpdateEvent,
			}}
		>
			{children}
		</CalendarContext.Provider>
	);
}
