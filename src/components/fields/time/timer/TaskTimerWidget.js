'use client';

import React, { useEffect, useState } from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import { Timer as TimerIcon, StopCircle, PlayCircle } from '@phosphor-icons/react';
import { useTaskTimer } from '@/components/fields/time/timer/TimeTrackerContext';
import { useModal } from '@/components/modals/ModalContext';
import * as collections from '@/collections';
import { createClient } from '@/lib/supabase/browser';


function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function TaskTimerWidget() {
  const { currentTask, isRunning, startTime, stopTimer, getElapsedForTask, startTimer } = useTaskTimer();
  const { openModal } = useModal();
  const [elapsed, setElapsed] = useState(() => {
  return currentTask?.id ? getElapsedForTask(currentTask.id) : 0;
});
  const taskConfig = collections.task;
  const supabase = createClient();
  

const handleStop = async () => {
    const stoppedTask = stopTimer();

    if (!stoppedTask?.id) {
      console.warn('⚠️ No task ID found in stoppedTask:', stoppedTask);
      return;
    }

    try {
      const { error } = await supabase
        .from('task')
        .update({
          duration: stoppedTask.duration,
          end_time: stoppedTask.endTime,
        })
        .eq('id', stoppedTask.id);

      if (error) {
        console.error('❌ Supabase update error:', error);
      } else {
        console.log('✅ Task successfully updated in Supabase:', stoppedTask.duration);
      }
    } catch (err) {
      console.error('🚨 Unexpected error during Supabase update:', err);
    }
  };

useEffect(() => {
  if (!isRunning || !startTime || !currentTask?.id) return;

  const interval = setInterval(() => {
    setElapsed(getElapsedForTask(currentTask.id));
  }, 1000);

  return () => clearInterval(interval);
}, [isRunning, startTime, currentTask?.id, getElapsedForTask]);






const handleClick = async () => {
    if (isRunning && currentTask) {
      openModal('edit', {
        config: taskConfig,
        defaultValues: currentTask
      });
      return;
    }

    try {
      const { data: newTask, error } = await supabase
        .from('task')
        .insert({
          title: 'Untitled Task',
          status: 'in_progress',
          start_time: new Date().toISOString(),
          duration: 0
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create task:', error);
        return;
      }

      startTimer(newTask);
      openModal('edit', {
        config: taskConfig,
        defaultValues: newTask
      });
    } catch (err) {
      console.error('🚨 Error creating task:', err);
    }
  };


  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1400,
        backgroundColor: isRunning ? 'success.main' : 'grey.700',
        color: 'white',
        px: 2,
        py: 1,
        borderRadius: '999px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: 4,
        cursor: 'pointer',
        gap: 1,
      }}
      onClick={handleClick}
    >
      <TimerIcon size={20} />
      {isRunning ? (
        <>
          <Typography variant="body2">{currentTask?.title || 'Unnamed Task'}</Typography>
          <Typography variant="body2">{formatElapsed(elapsed)}</Typography>
          <Tooltip title="Stop Timer">
            <IconButton
              onClick={(e) => {
                console.log('🛑 Stop button clicked');
                e.stopPropagation();
                handleStop();
              }}
              size="small"
              color="inherit"
            >
              <StopCircle size={18} />
            </IconButton>
          </Tooltip>
        </>
      ) : (
        <Tooltip title="Start Task Timer">
          <IconButton size="small" color="inherit">
            <PlayCircle size={18} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
