"use client";

import { useContext, useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { Play, Stop } from "@phosphor-icons/react";
import { TaskTimerContext } from "./TimeTrackerContext";
import { createClient } from '@/lib/supabase/browser';

export function TimeTrackerField({ task }) {
  const { currentTask, isRunning, startTimer, stopTimer, elapsed, getElapsedForTask } = useContext(TaskTimerContext);
  const [localElapsed, setLocalElapsed] = useState(getElapsedForTask(task.id));
  const supabase = createClient();

useEffect(() => {
  let interval = null;

  if (currentTask?.id === task.id && isRunning) {
    const updateElapsed = () => {
      setLocalElapsed(getElapsedForTask(task.id));
    };

    updateElapsed(); // Initial sync
    interval = setInterval(updateElapsed, 1000);
  } else {
    setLocalElapsed(getElapsedForTask(task.id)); // Stop state fallback
  }

  return () => {
    if (interval) clearInterval(interval);
  };
}, [currentTask?.id, isRunning, task.id, getElapsedForTask]);



  const isActive = currentTask?.id === task.id && isRunning;

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        backgroundColor: isActive ? "#e3f2fd" : "#f5f5f5",
        px: 2,
        py: 1,
        borderRadius: 1,
      }}
    >
      <Typography variant="body2" sx={{ minWidth: 80 }}>
        {formatTime(localElapsed)}
      </Typography>
      {isActive ? (
        <Button
          size="small"
          color="error"
          onClick={async () => {
            const stoppedTask = stopTimer();

            if (!stoppedTask?.id) {
              console.warn('⚠️ No task ID found in stoppedTask:', stoppedTask);
              return;
            }

            const { data: existingTask, error: fetchError } = await supabase
              .from('task')
              .select('duration')
              .eq('id', stoppedTask.id)
              .single();

            if (fetchError) {
              console.error('❌ Error fetching task:', fetchError);
              return;
            }


            const { error: updateError } = await supabase
              .from('task')
              .update({
                duration: stoppedTask.duration, // ✅ already includes total
                end_time: stoppedTask.endTime,
              })
              .eq('id', stoppedTask.id);


            if (updateError) {
              console.error('❌ Failed to update duration in Supabase:', updateError);
            } else {
              console.log('✅ Timer duration saved from modal:', stoppedTask.duration);
            }
          }}
          startIcon={<Stop size={16} />}>
          Stop
        </Button>

      ) : (
        <Button
            size="small"
            color="primary"
            onClick={async () => {
              const supabase = createClient();
              const { data: freshTask, error } = await supabase
                .from('task')
                .select('*')
                .eq('id', task.id)
                .single();

              if (error || !freshTask) {
                console.error('❌ Failed to fetch fresh task:', error);
                return;
              }

              startTimer(freshTask); // ✅ Now we start with the latest duration
            }}
            startIcon={<Play size={16} />}
          >
            Start
          </Button>

      )}
    </Box>
  );
}
