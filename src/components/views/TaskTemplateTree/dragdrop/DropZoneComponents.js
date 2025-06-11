// components/dragdrop/DropZoneComponents.js - Minimal, clean drop zones

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
} from '@mui/material';
import {
  Plus,
} from '@phosphor-icons/react';
import { useDroppable } from '@dnd-kit/core';

// Minimal Drop Zone - Only shows when actively dragging
export const TaskDropZone = ({ id, position, level = 0, isActive = false, dragIntent = null }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  
  // Only show for reorder intent when actually dragging
  const isReorderIntent = dragIntent === 'reorder';
  const shouldShow = isActive && isReorderIntent;
  
  // Don't render anything if not needed
  if (!shouldShow && !isOver) {
    return null;
  }

  const getDropText = () => {
    switch (position) {
      case 'before': return 'Drop above';
      case 'after': return 'Drop below';
      case 'in-empty': return 'Drop here';
      default: return 'Drop here';
    }
  };

  return (
    <Box
      ref={setNodeRef}
      sx={{
        height: isOver ? 32 : 4,
        ml: `${level * 24}px`,
        mr: 2,
        backgroundColor: isOver ? 'primary.main' : 'primary.light',
        borderRadius: 1,
        transition: 'all 0.2s ease',
        opacity: isOver ? 1 : 0.6,
        my: 0.5,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'default',
      }}
    >
      {isOver && (
        <Typography
          variant="caption"
          sx={{
            color: 'primary.contrastText',
            fontWeight: 600,
            fontSize: '0.75rem',
            px: 1,
          }}
        >
          {getDropText()}
        </Typography>
      )}
    </Box>
  );
};

// Enhanced Droppable Milestone Header
export const DroppableMilestoneHeader = ({ 
  milestoneId, 
  milestone, 
  taskCount, 
  onAddTask,
  isActive = false,
  dragIntent = null
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `milestone-${milestoneId}`,
  });

  // Show enhanced state when dragging
  const isEnhanced = isOver || (isActive && dragIntent !== 'parent');

  return (
    <Box
      ref={setNodeRef}
      sx={{ 
        mb: 3, 
        p: 2,
        borderRadius: 2,
        backgroundColor: isOver ? 'primary.100' : (isActive ? 'grey.75' : 'grey.50'),
        border: '2px solid',
        borderColor: isOver ? 'primary.main' : (isActive ? 'primary.light' : 'grey.300'),
        transition: 'all 0.3s ease',
        transform: isOver ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isOver ? 4 : (isActive ? 2 : 1),
        position: 'relative',
        cursor: isActive && !isOver ? 'pointer' : 'default',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography 
            variant="h6" 
            sx={{ 
              color: isOver ? 'primary.main' : 'text.secondary',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: '1.1rem',
            }}
          >
            📋 {milestone.title}
            <Chip 
              label={taskCount}
              size="small"
              sx={{
                height: 20,
                backgroundColor: isOver ? 'primary.main' : 'grey.400',
                color: 'white',
                fontWeight: 600,
              }}
            />
          </Typography>
          
          {isOver && (
            <Typography 
              variant="caption" 
              color="primary.main"
              sx={{ mt: 0.5, fontWeight: 600 }}
            >
              Drop to assign to this milestone
            </Typography>
          )}
        </Box>
        
        <Button
          size="small"
          variant={isOver ? "contained" : "outlined"}
          startIcon={<Plus size={14} />}
          onClick={() => onAddTask(milestoneId)}
          sx={{
            borderColor: isOver ? 'primary.main' : 'grey.400',
            color: isOver ? 'white' : 'text.secondary',
            backgroundColor: isOver ? 'primary.main' : 'transparent',
            transition: 'all 0.3s ease',
          }}
        >
          Add
        </Button>
      </Stack>
    </Box>
  );
};

// Empty Milestone Drop Zone
export const EmptyMilestoneDropZone = ({ 
  milestoneId, 
  milestoneInfo, 
  isActive = false, 
  dragIntent = null 
}) => {
  const isReorderIntent = dragIntent === 'reorder' || dragIntent === null;
  
  return (
    <Box
      sx={{
        minHeight: 80,
        border: '2px dashed',
        borderColor: (isActive && isReorderIntent) ? 'primary.main' : 'grey.300',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
        backgroundColor: (isActive && isReorderIntent) ? 'primary.25' : 'grey.25',
        transition: 'all 0.3s ease',
      }}
    >
      <TaskDropZone 
        id={`drop-in-empty-${milestoneId}`} 
        position="in-empty"
        level={0}
        isActive={isActive}
        dragIntent={dragIntent}
      />
      <Typography variant="body2" color="text.secondary">
        No templates in <strong>{milestoneInfo.title}</strong>
      </Typography>
    </Box>
  );
};