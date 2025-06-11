'use client';
import { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import dynamic from 'next/dynamic';
import * as collections from '@/collections';

// Dynamic import for better performance
const ProjectKanbanBoard = dynamic(() => import('@/components/views/kanban/ProjectKanbanBoard'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  ),
});

export const KanbanTab = ({
  record,
  config,
  embedded = false,
  onTaskUpdate,
  initialMode = 'milestone',
  initialShowCompleted = false
}) => {
  const [kanbanMode, setKanbanMode] = useState(initialMode);
  const [showCompletedTasks, setShowCompletedTasks] = useState(initialShowCompleted);
  const [loading, setLoading] = useState(false);

  // Get kanban configuration from collection config
  const kanbanConfig = config?.kanban || {};
  const availableModes = kanbanConfig.modes || ['milestone', 'support'];
  
  // Get task configuration
  const taskConfigName = kanbanConfig.taskConfig || 'task';
  const taskConfig = collections[taskConfigName];

  // Initialize from config defaults
  useEffect(() => {
    if (kanbanConfig.defaultMode && kanbanConfig.defaultMode !== kanbanMode) {
      setKanbanMode(kanbanConfig.defaultMode);
    }
    if (kanbanConfig.defaultShowCompleted !== undefined && 
        kanbanConfig.defaultShowCompleted !== showCompletedTasks) {
      setShowCompletedTasks(kanbanConfig.defaultShowCompleted);
    }
  }, [kanbanConfig]);

  const handleKanbanModeChange = (newMode) => {
    setLoading(true);
    setKanbanMode(newMode);
    
    // Small delay to show loading state
    setTimeout(() => {
      setLoading(false);
    }, 300);
  };

  const handleShowCompletedToggle = () => {
    setLoading(true);
    setShowCompletedTasks(prev => !prev);
    
    // Small delay to show loading state
    setTimeout(() => {
      setLoading(false);
    }, 300);
  };

  // Validation
  if (!record?.id) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Record ID is required to display the kanban board.
      </Alert>
    );
  }

  if (!taskConfig) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Task configuration not found. Please check your collection setup.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header Controls - hide if embedded */}
      {!embedded && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Typography variant="h6" component="h2">
            {kanbanConfig.title || 'Task Board'}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Mode Toggle - only show if multiple modes available */}
            {availableModes.length > 1 && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="body2" sx={{ alignSelf: 'center', mr: 1, color: 'text.secondary' }}>
                  View:
                </Typography>
                {availableModes.map((mode) => (
                  <Button
                    key={mode}
                    size="small"
                    variant={kanbanMode === mode ? 'contained' : 'outlined'}
                    onClick={() => handleKanbanModeChange(mode)}
                    sx={{ 
                      textTransform: 'capitalize',
                      minWidth: 'auto',
                      px: 2
                    }}
                    disabled={loading}
                  >
                    {mode === 'milestone' ? 'Milestones' : 'Support'}
                  </Button>
                ))}
              </Box>
            )}
            
            {/* Show Completed Toggle */}
            <Button
              size="small"
              variant={showCompletedTasks ? 'contained' : 'outlined'}
              onClick={handleShowCompletedToggle}
              disabled={loading}
              sx={{ minWidth: 'auto' }}
            >
              {showCompletedTasks ? 'Hide' : 'Show'} Completed
            </Button>
          </Box>
        </Box>
      )}

      {/* Description text for embedded view */}
      {embedded && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {kanbanMode === 'milestone' ? 'Tasks organized by milestone' : 'Support tasks by status'}
        </Typography>
      )}

      {/* Loading overlay */}
      {loading && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          py: 2,
          mb: 2
        }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Updating board...
          </Typography>
        </Box>
      )}

      {/* Kanban Board */}
      <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s' }}>
        <ProjectKanbanBoard
          projectId={record.id}
          mode={kanbanMode}
          showCompleted={showCompletedTasks}
          embedded={embedded}
          config={taskConfig}
          onTaskUpdate={onTaskUpdate}
        />
      </Box>
    </Box>
  );
};