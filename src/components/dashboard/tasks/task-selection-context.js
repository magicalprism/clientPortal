"use client";

import * as React from "react";

import { useSelection } from "@/hooks/use-selection";

function noop() {
	// No operation
}

export const TasksSelectionContext = React.createContext({
	deselectAll: noop,
	deselectOne: noop,
	selectAll: noop,
	selectOne: noop,
	selected: new Set(),
	selectedAny: false,
	selectedAll: false,
});

export function TasksSelectionProvider({ children, tasks = [] }) {
	const taskIds = React.useMemo(() => tasks.map((task) => task.id), [tasks]);
	const selection = useSelection(taskIds);

	return <TasksSelectionContext.Provider value={{ ...selection }}>{children}</TasksSelectionContext.Provider>;
}

export function useTasksSelection() {
	return React.useContext(TasksSelectionContext);
}
