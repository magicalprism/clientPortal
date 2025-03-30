"use client";

import * as React from "react";
import { useSelection } from "@/hooks/use-selection"; // ✅ make sure this hook exists

function noop() {
  // No operation
}

export const tasksSelectionContext = React.createContext({
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

  return (
    <tasksSelectionContext.Provider value={{ ...selection }}>
      {children}
    </tasksSelectionContext.Provider>
  );
}

export function useTasksSelection() {
  return React.useContext(tasksSelectionContext);
}
