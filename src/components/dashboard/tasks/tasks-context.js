"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/browser";

function noop() {}

export const TasksContext = React.createContext({
  columns: new Map(),
  tasks: new Map(),
  setCurrentColumnId: noop,
  setCurrentTaskId: noop,
  createColumn: noop,
  updateColumn: noop,
  clearColumn: noop,
  deleteColumn: noop,
  dragTask: noop,
  createTask: noop,
  deleteTask: noop,
  updateTask: noop,
  addComment: noop,
  openTaskModal: noop,
  closeTaskModal: noop,
  taskModal: { open: false, columnId: null, taskId: null },
});

export function TasksProvider({ children, columns: initialColumns = [], tasks: initialTasks = [] }) {
  const [columns, setColumns] = React.useState(new Map());
  const [tasks, setTasks] = React.useState(new Map());
  const [currentColumnId, setCurrentColumnId] = React.useState();
  const [currentTaskId, setCurrentTaskId] = React.useState();
  const [taskModal, setTaskModal] = React.useState({ open: false, columnId: null, taskId: null });

  React.useEffect(() => {
    setColumns(new Map(initialColumns.map((col) => [col.id, col])));
  }, [initialColumns]);

  React.useEffect(() => {
    setTasks(new Map(initialTasks.map((task) => [task.id, task])));
  }, [initialTasks]);

  const supabase = createClient();

  const openTaskModal = (columnId = null, taskId = null) => {
    setTaskModal({ open: true, columnId, taskId });
  };

  const closeTaskModal = () => {
    setTaskModal({ open: false, columnId: null, taskId: null });
  };

  const handleCreateTask = async (columnId, title) => {
    const column = columns.get(columnId);
    if (!column || !title) return;

    const { data, error } = await supabase
      .from("task")
      .insert({
        title,
        checklist_id: columnId,
        created: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      console.error("❌ Failed to save task:", error.message);
      return;
    }

    const newTask = {
      id: data.id,
      title: data.title,
      columnId,
      createdAt: new Date(data.created),
    };

    setTasks((prev) => {
      const updated = new Map(prev);
      updated.set(newTask.id, newTask);
      return updated;
    });

    setColumns((prev) => {
      const updated = new Map(prev);
      const updatedCol = { ...column, taskIds: [newTask.id, ...column.taskIds] };
      updated.set(columnId, updatedCol);
      return updated;
    });
  };

  const handleDragTask = async (active, over) => {
    const taskId = active.id;
    const newChecklistId = over.id;
  
    const task = tasks.get(taskId);
    if (!task || !columns.has(newChecklistId)) return;
  
    const oldColumn = columns.get(task.columnId);
    const newColumn = columns.get(newChecklistId);
  
    const updatedTask = {
      ...task,
      columnId: newChecklistId, // local state uses columnId
    };
  
    // Update local state
    const updatedTasks = new Map(tasks);
    updatedTasks.set(taskId, updatedTask);
  
    const updatedOldColumn = {
      ...oldColumn,
      taskIds: oldColumn.taskIds.filter((id) => id !== taskId),
    };
  
    const updatedNewColumn = {
      ...newColumn,
      taskIds: [...newColumn.taskIds, taskId],
    };
  
    const updatedColumns = new Map(columns);
    updatedColumns.set(updatedOldColumn.id, updatedOldColumn);
    updatedColumns.set(updatedNewColumn.id, updatedNewColumn);
  
    setTasks(updatedTasks);
    setColumns(updatedColumns);
  
    // Update Supabase with the new checklist_id
    const { error } = await supabase
      .from("task")
      .update({ checklist_id: newChecklistId })
      .eq("id", taskId);
  
    if (error) {
      console.error("❌ Supabase drag update error:", error.message);
    }
  };
  

  const handleUpdateTask = React.useCallback(
    (taskId, updates) => {
      const task = tasks.get(taskId);
      if (!task) return;
      const updatedTasks = new Map(tasks);
      updatedTasks.set(taskId, { ...task, ...updates });
      setTasks(updatedTasks);
    },
    [tasks]
  );

  const handleDeleteTask = React.useCallback(
    (taskId) => {
      const task = tasks.get(taskId);
      if (!task) return;

      const updatedTasks = new Map(tasks);
      updatedTasks.delete(task.id);

      const updatedColumns = new Map(columns);
      const column = updatedColumns.get(task.columnId);
      if (column) {
        column.taskIds = column.taskIds.filter((id) => id !== task.id);
        updatedColumns.set(column.id, column);
      }

      setTasks(updatedTasks);
      setColumns(updatedColumns);
    },
    [tasks, columns]
  );

  const handleAddComment = React.useCallback(
    async (taskId, content) => {
      const task = tasks.get(taskId);
      if (!task) return;

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("❌ Unable to get user for comment:", userError?.message);
        return;
      }

      const { data, error } = await supabase
        .from("comment")
        .insert({
          task_id: taskId,
          content,
          author_id: user.id,
        })
        .select("*, author:contact(*)")
        .single();

      if (error) {
        console.error("❌ Failed to save comment:", error.message);
        return;
      }

      const updatedTasks = new Map(tasks);
      updatedTasks.set(task.id, {
        ...task,
        comments: [
          ...(task.comments || []),
          {
            id: data.id,
            content: data.content,
            createdAt: new Date(data.created),
            author: data.author,
          },
        ],
      });

      setTasks(updatedTasks);
    },
    [tasks]
  );

  return (
    <TasksContext.Provider
      value={{
        columns,
        tasks,
        currentColumnId,
        currentTaskId,
        setCurrentColumnId,
        setCurrentTaskId,
        createTask: handleCreateTask,
        updateTask: handleUpdateTask,
        deleteTask: handleDeleteTask,
        addComment: handleAddComment,
        dragTask: handleDragTask,
        openTaskModal,
        closeTaskModal,
        taskModal,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export const TasksConsumer = TasksContext.Consumer;  