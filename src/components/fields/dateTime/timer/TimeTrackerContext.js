'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export const TaskTimerContext = createContext();

export function TaskTimerProvider({ children }) {
  const [currentTask, setCurrentTask] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('task-timer');
    if (saved) {
      const { task, start, running } = JSON.parse(saved);
      if (task) {
        setCurrentTask({
          ...task,
          initialDuration: Number(task?.initialDuration ?? task?.duration ?? 0)
        });
      }
      setStartTime(start ? new Date(start) : null);
      setIsRunning(running);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'task-timer',
      JSON.stringify({
        task: currentTask,
        start: startTime,
        running: isRunning
      })
    );
  }, [currentTask, startTime, isRunning]);

  const startTimer = useCallback((task) => {
  setCurrentTask({
    ...task,
    initialDuration: Number(task.duration || 0) // ⏱️ make sure duration is included
  });
  setStartTime(new Date());
  setIsRunning(true);
}, []);

const stopTimer = useCallback(() => {
  const endTime = new Date();
  const elapsed = startTime ? Math.floor((endTime - new Date(startTime)) / 1000) : 0;

  const baseDuration = Number(currentTask?.initialDuration ?? currentTask?.duration ?? 0); // ✅ fallback to currentTask.duration

  const updatedTask = {
    ...currentTask,
    duration: baseDuration + elapsed,
    endTime: endTime.toISOString(),
    startTime: startTime?.toISOString()
  };

  setStartTime(null);
  setIsRunning(false);
  setCurrentTask(updatedTask);

  localStorage.setItem(
    'task-timer',
    JSON.stringify({
      task: updatedTask,
      start: null,
      running: false
    })
  );

  return updatedTask;
}, [currentTask, startTime]);




const getElapsedForTask = useCallback((taskId) => {
  if (currentTask?.id !== taskId) return 0;

  const base = currentTask.initialDuration || 0;

  if (!startTime) return base;

  const activeElapsed = Math.floor((Date.now() - new Date(startTime)) / 1000);
  return base + activeElapsed;
}, [currentTask, startTime]);


  return (
    <TaskTimerContext.Provider
      value={{ currentTask, startTime, isRunning, startTimer, stopTimer, getElapsedForTask }}
    >
      {children}
    </TaskTimerContext.Provider>
  );
}

export function useTaskTimer() {
  return useContext(TaskTimerContext);
}
