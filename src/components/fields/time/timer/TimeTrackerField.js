"use client";

import { useContext, useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { Play, Stop } from "@phosphor-icons/react";
import { TaskTimerContext } from "./TimeTrackerContext";

export function TimeTrackerField({ task }) {
  const { currentTask, isRunning, startTimer, stopTimer, elapsed, getElapsedForTask } = useContext(TaskTimerContext);
  const [localElapsed, setLocalElapsed] = useState(getElapsedForTask(task.id));

  useEffect(() => {
    let interval;
    if (currentTask?.id === task.id && isRunning) {
      interval = setInterval(() => {
        setLocalElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setLocalElapsed(getElapsedForTask(task.id));
    }
    return () => clearInterval(interval);
  }, [currentTask, isRunning, task.id]);

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
        <Button size="small" color="error" onClick={stopTimer} startIcon={<Stop size={16} />}>Stop</Button>
      ) : (
        <Button size="small" color="primary" onClick={() => startTimer(task)} startIcon={<Play size={16} />}>
          Start
        </Button>
      )}
    </Box>
  );
}
