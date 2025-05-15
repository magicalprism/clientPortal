'use client';

import React, { useEffect, useState } from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import { Timer as TimerIcon, StopCircle, PlayCircle } from '@phosphor-icons/react';
import { useTaskTimer } from '@/components/fields/time/timer/TimeTrackerContext';
import { useModal } from '@/components/modals/ModalContext';
import * as collections from '@/collections';
import { createClient } from '@/lib/supabase/browser';
import { useCurrentContact } from '@/hooks/useCurrentContact';


function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function TaskTimerWidget() {
  const { contact, loading } = useCurrentContact();
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
  if (!currentTask?.id) return;

  // ⏱ Immediately update elapsed as soon as we get a valid task
  setElapsed(getElapsedForTask(currentTask.id));

  if (!isRunning || !startTime) return;

  const interval = setInterval(() => {
    setElapsed(getElapsedForTask(currentTask.id));
  }, 1000);

  return () => clearInterval(interval);
}, [isRunning, startTime, currentTask?.id, getElapsedForTask]);



const handleClick = async () => {
  if (isRunning && currentTask) {
    // 🟢 If already running, open modal for current task
    openModal('edit', {
      config: taskConfig,
      defaultValues: currentTask
    });
    return;
  }
    if (!contact?.id) {
        console.error('❌ No contact found for current user.');
        return;
      }

  try {
    // 🟡 Create a brand new task

    const { data: insertedTask, error: insertError } = await supabase   
      .from('task')
      .insert({
        title: 'Untitled Task',
        status: 'todo',
        start_time: new Date().toISOString(),
        duration: 0,
        author_id: contact.id,
        assigned_id: contact.id
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to insert task:', insertError);
      return;
    }

    // ✅ Start the timer with the freshly created task
    startTimer(insertedTask);

    // ✅ Open modal with that same task
    openModal('edit', {
      config: taskConfig,
      defaultValues: insertedTask
    });
  } catch (err) {
    console.error('🚨 Error creating or starting task:', err);
  }
};




  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 30,
        right: 100,
        zIndex: 1400,
        backgroundColor: isRunning ? 'success.main' : '#1c1d1e',
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
