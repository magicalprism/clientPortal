// components/SortableTaskNode.js - Clean implementation with proper parent detection

import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Stack,
  Card,
  CardContent,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  Plus,
  DotsSixVertical,
  CaretDown,
  CaretRight,
  Timer,
  TreeStructure,
  ArrowsOutCardinal,
} from '@phosphor-icons/react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ViewButtons } from '@/components/buttons/ViewButtons';
import { TaskDropZone } from '@/components/views/TaskTemplateTree/dragdrop/DropZoneComponents';

// Drag Intent Indicator - Shows current drag mode
const DragIntentIndicator = ({ dragIntent, isOverForParent }) => {
  if (!dragIntent) return null;

  const getIcon = () => {
    if (isOverForParent) return <TreeStructure size={20} />;
    switch (dragIntent) {
      case 'parent': return <TreeStructure size={16} />;
      case 'reorder': return <ArrowsOutCardinal size={16} />;
      default: return <ArrowsOutCardinal size={16} />;
    }
  };

  const getColor = () => {
    if (isOverForParent) return 'success.main';
    switch (dragIntent) {
      case 'parent': return 'success.main';
      case 'reorder': return 'primary.main';
      default: return 'primary.main';
    }
  };

  const getText = () => {
    if (isOverForParent) return 'Drop to make child';
    switch (dragIntent) {
      case 'parent': return 'Parent mode';
      case 'reorder': return 'Reorder mode';
      default: return 'Drag mode';
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 20,
        right: 20,
        backgroundColor: getColor(),
        color: 'white',
        px: 2,
        py: 1,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        fontSize: '0.875rem',
        fontWeight: 600,
        zIndex: 1000,
        boxShadow: 3,
        pointerEvents: 'none',
      }}
    >
      {getIcon()}
      {getText()}
    </Box>
  );
};

// Sortable Task Node - Clean and minimal
export const SortableTaskNode = ({ 
  task, 
  level = 0, 
  onAddChild, 
  onUpdateTitle, 
  allTasks = [],
  config,
  onRefresh,
  isDragActive = false,
  draggedTaskId = null,
  canBeParent = () => false,
  dragIntent = null,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id.toString(),
    data: {
      type: 'task',
      task,
      level,
    },
  });

  // Make it droppable for parent relationships
  const { 
    setNodeRef: setDropRef, 
    isOver: isOverForParent 
  } = useDroppable({
    id: task.id.toString(),
  });

  // Combine refs
  const combinedRef = (node) => {
    setSortableRef(node);
    setDropRef(node);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const hasChildren = task.children && task.children.length > 0;
  const indentWidth = level * 24;
  
  // Check if this task can be a valid parent for the dragged task
  const isValidParent = canBeParent(task.id, draggedTaskId);
  const isParentIntent = dragIntent === 'parent';
  const showAsParentTarget = isValidParent && isParentIntent;

  const handleTitleSave = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      onUpdateTitle(task.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Box>
      {/* Drag Intent Indicator - only show when this task is being dragged */}
      {isDragging && <DragIntentIndicator dragIntent={dragIntent} isOverForParent={isOverForParent} />}
      
      <Box ref={combinedRef} style={style}>
        <Card
          elevation={isDragging ? 8 : (isOverForParent ? 4 : (showAsParentTarget ? 2 : 1))}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          sx={{
            mb: 1.5,
            ml: `${indentWidth}px`,
            mr: 2,
            border: '2px solid',
            borderColor: isDragging ? 'primary.main' : 
                       (isOverForParent ? 'success.main' : 
                       (showAsParentTarget ? 'success.light' : 'divider')),
            backgroundColor: isDragging ? 'primary.25' : 
                           (isOverForParent ? 'success.100' : 
                           (showAsParentTarget ? 'success.25' : 'background.paper')),
            transition: 'all 0.2s ease',
            cursor: isDragging ? 'grabbing' : (showAsParentTarget ? 'pointer' : 'default'),
            position: 'relative',
            transform: isOverForParent ? 'scale(1.02)' : 'scale(1)',
            boxShadow: isDragging ? 8 : 
                      (isOverForParent ? 4 : 
                      (showAsParentTarget ? 2 : 1)),
            '&:hover': !isDragging ? {
              borderColor: showAsParentTarget ? 'success.main' : 'primary.light',
              transform: 'translateY(-1px)',
            } : {},
            // Subtle glow for parent targets
            ...(showAsParentTarget && !isOverForParent && {
              animation: 'parentPulse 2s infinite',
              '@keyframes parentPulse': {
                '0%': { boxShadow: '0 0 0 0 rgba(46, 125, 50, 0.2)' },
                '50%': { boxShadow: '0 0 0 4px rgba(46, 125, 50, 0.1)' },
                '100%': { boxShadow: '0 0 0 0 rgba(46, 125, 50, 0.2)' },
              },
            }),
          }}
        >
          {/* Parent drop feedback */}
          {isOverForParent && (
            <Box
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                backgroundColor: 'success.main',
                color: 'success.contrastText',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.75rem',
                fontWeight: 600,
                zIndex: 10,
                boxShadow: 3,
                animation: 'bounceIn 0.3s ease-out',
                '@keyframes bounceIn': {
                  '0%': { transform: 'scale(0)', opacity: 0 },
                  '50%': { transform: 'scale(1.1)', opacity: 1 },
                  '100%': { transform: 'scale(1)', opacity: 1 },
                },
              }}
            >
              <TreeStructure size={12} />
              Child
            </Box>
          )}
          
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Drag Handle */}
              <Tooltip 
                title="Drag to move • Horizontal = parent • Vertical = reorder" 
                placement="top"
              >
                <IconButton
                  size="small"
                  {...attributes}
                  {...listeners}
                  sx={{
                    cursor: 'grab',
                    color: 'text.secondary',
                    backgroundColor: isHovered ? 'primary.50' : 'transparent',
                    '&:hover': { 
                      color: 'primary.main',
                      backgroundColor: 'primary.100',
                    },
                    '&:active': { cursor: 'grabbing' },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <DotsSixVertical size={16} />
                </IconButton>
              </Tooltip>

              {/* Expand/Collapse Button */}
              {hasChildren ? (
                <IconButton
                  size="small"
                  onClick={() => setIsExpanded(!isExpanded)}
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  {isExpanded ? <CaretDown size={16} /> : <CaretRight size={16} />}
                </IconButton>
              ) : (
                <Box sx={{ width: 32 }} />
              )}

              {/* Task Title */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {isEditing ? (
                  <TextField
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={handleKeyPress}
                    variant="standard"
                    size="small"
                    autoFocus
                    fullWidth
                  />
                ) : (
                  <Typography
                    variant="body2"
                    onClick={() => setIsEditing(true)}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: level === 0 ? 600 : 400,
                      color: level === 0 ? 'text.primary' : 'text.secondary',
                      '&:hover': {
                        color: 'primary.main',
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {task.title}
                    {showAsParentTarget && (
                      <Chip
                        label="Drop target"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{
                          ml: 1,
                          height: 16,
                          fontSize: '0.7rem',
                        }}
                      />
                    )}
                  </Typography>
                )}
              </Box>

              {/* Task Metadata */}
              <Stack direction="row" spacing={1} alignItems="center">
                {/* Duration */}
                {task.estimated_duration && (
                  <Chip
                    icon={<Timer size={12} />}
                    label={formatDuration(task.estimated_duration)}
                    size="small"
                    variant="outlined"
                    sx={{ height: 24, fontSize: '0.75rem' }}
                  />
                )}

                {/* Priority */}
                {task.priority && task.priority !== 'medium' && (
                  <Chip
                    label={task.priority}
                    size="small"
                    color={
                      task.priority === 'high' || task.priority === 'urgent' 
                        ? 'error' 
                        : 'default'
                    }
                    sx={{ height: 24, fontSize: '0.75rem' }}
                  />
                )}

                {/* Add Subtask */}
                <Tooltip title="Add subtask" placement="top">
                  <IconButton
                    size="small"
                    onClick={() => onAddChild(task.id)}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { 
                        color: 'primary.main',
                        backgroundColor: 'primary.50',
                      },
                    }}
                  >
                    <Plus size={14} />
                  </IconButton>
                </Tooltip>

                {/* ViewButtons for edit/delete */}
                <ViewButtons
                  config={config}
                  id={task.id}
                  record={task}
                  onRefresh={onRefresh}
                  showFullView={false}
                  showExport={false}
                  size="small"
                />
              </Stack>
            </Stack>

            {/* Task Description Preview */}
            {task.description && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  mt: 1,
                  ml: hasChildren ? 6 : 6,
                  fontStyle: 'italic',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {task.description}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Children with minimal drop zones */}
        {hasChildren && isExpanded && (
          <Box sx={{ mt: 1 }}>
            {task.children.map((child, index) => (
              <Box key={`child-container-${child.id}`}>
                {/* Drop zone before child - only when dragging */}
                <TaskDropZone 
                  id={`drop-before-${child.id}`} 
                  position="before"
                  level={level + 1}
                  isActive={isDragActive}
                  dragIntent={dragIntent}
                />
                
                {/* The child task */}
                <SortableTaskNode
                  task={child}
                  level={level + 1}
                  onAddChild={onAddChild}
                  onUpdateTitle={onUpdateTitle}
                  allTasks={allTasks}
                  config={config}
                  onRefresh={onRefresh}
                  isDragActive={isDragActive}
                  draggedTaskId={draggedTaskId}
                  canBeParent={canBeParent}
                  dragIntent={dragIntent}
                />
                
                {/* Drop zone after last child - only when dragging */}
                {index === task.children.length - 1 && (
                  <TaskDropZone 
                    id={`drop-after-${child.id}`} 
                    position="after"
                    level={level + 1}
                    isActive={isDragActive}
                    dragIntent={dragIntent}
                  />
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};