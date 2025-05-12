'use client';

import React, { useEffect, useState } from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import { Timer as TimerIcon, StopCircle, PlayCircle } from '@phosphor-icons/react';
import { useTaskTimer } from '@/components/fields/time/timer/TimeTrackerContext';
import { useModal } from '@/components/modals/ModalContext';
import * as collections from '@/collections';

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function TaskTimerWidget() {
  const { currentTask, isRunning, startTime, stopTimer } = useTaskTimer();
  const { openModal } = useModal();
  const [elapsed, setElapsed] = useState(0);
  const taskConfig = collections.task;

  useEffect(() => {
    if (!isRunning || !startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startTime)) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const handleStop = () => {
    const stoppedTask = stopTimer();
    // Optional: Persist to Supabase here
    console.log('⏹️ Stopped task:', stoppedTask);
  };

  const handleClick = () => {
    if (isRunning && currentTask) {
      return openModal('edit', {
        config: taskConfig,
        defaultValues: currentTask
      });
    }
    return openModal('create', {
      config: taskConfig,
      defaultValues: {
        title: '',
        status: 'in_progress',
        start_time: new Date().toISOString()
      }
    });
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
