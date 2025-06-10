'use client';

import { Box, Typography, IconButton, Badge, Chip } from '@mui/material';
import { Plus as PlusIcon, DotsThree as DotsThreeIcon } from '@phosphor-icons/react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export function KanbanColumn({ 
  id, 
  title, 
  description,
  tasks = [], 
  onAddTask,
  onMenuClick,
  children,
  color = 'primary',
  maxHeight = 600
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: id
  });

  const taskCount = tasks.length;
  const completedCount = tasks.filter(task => task.is_complete).length;

  return (
    <Box
      ref={setNodeRef}
      sx={{
        minWidth: 300,
        maxWidth: 350,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1,
        border: isOver ? 2 : 1,
        borderColor: isOver ? 'primary.main' : 'divider',
        transition: 'border-color 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        height: 'fit-content',
        maxHeight: maxHeight
      }}
    >
      {/* Column Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: `${color}.50`,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: description ? 0.5 : 0 }}>
            <Typography 
              variant="subtitle1" 
              fontWeight={600}
              color={`${color}.800`}
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {title}
            </Typography>
            <Badge 
              badgeContent={taskCount} 
              color={color}
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: `${color}.600`,
                  color: 'white'
                }
              }}
            />
          </Box>
          
          {description && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {description}
            </Typography>
          )}
          
          {taskCount > 0 && (
            <Box sx={{ mt: 1 }}>
              <Chip
                size="small"
                label={`${completedCount}/${taskCount} completed`}
                color={completedCount === taskCount ? 'success' : 'default'}
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={onAddTask}
            sx={{ 
              color: `${color}.600`,
              '&:hover': { bgcolor: `${color}.100` }
            }}
          >
            <PlusIcon size={16} />
          </IconButton>
          
          {onMenuClick && (
            <IconButton
              size="small"
              onClick={onMenuClick}
              sx={{ 
                color: `${color}.600`,
                '&:hover': { bgcolor: `${color}.100` }
              }}
            >
              <DotsThreeIcon size={16} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Tasks Container */}
      <Box
        sx={{
          flex: 1,
          p: 1,
          overflowY: 'auto',
          minHeight: 200,
          maxHeight: maxHeight - 120 // Account for header height
        }}
      >
        <SortableContext 
          items={tasks.map(task => `task-${task.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {children}
        </SortableContext>
        
        {/* Empty state */}
        {tasks.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 150,
              color: 'text.secondary',
              textAlign: 'center',
              p: 2
            }}
          >
            <Typography variant="body2" sx={{ mb: 1 }}>
              No tasks yet
            </Typography>
            <Typography variant="caption">
              Click + to add a task
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}