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
      setCurrentTask(task);
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
    setCurrentTask(task);
    setStartTime(new Date());
    setIsRunning(true);
  }, []);

  const stopTimer = useCallback(() => {
    const endTime = new Date();
    const duration = startTime ? Math.floor((endTime - new Date(startTime)) / 1000) : 0;

    const stoppedTask = {
      ...currentTask,
      duration,
      endTime: endTime.toISOString(),
      startTime: startTime?.toISOString()
    };

    setCurrentTask(null);
    setStartTime(null);
    setIsRunning(false);
    localStorage.removeItem('task-timer');

    return stoppedTask;
  }, [currentTask, startTime]);

  const getElapsedForTask = useCallback((taskId) => {
    if (currentTask?.id !== taskId || !startTime) return 0;
    return Math.floor((Date.now() - new Date(startTime)) / 1000);
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
