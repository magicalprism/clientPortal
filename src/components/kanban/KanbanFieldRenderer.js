'use client';
import { useState, useCallback } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import dynamic from 'next/dynamic';
import * as collections from '@/collections';

// Dynamic import for better performance
const ProjectKanbanBoard = dynamic(() => import('@/components/kanban/ProjectKanbanBoard'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
      <CircularProgress size={24} sx={{ mr: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Loading kanban board...
      </Typography>
    </Box>
  ),
});

/**
 * Kanban Field Renderer - Renders a kanban board for task management
 * Used in forms when field type is 'kanban'
 */
const KanbanFieldRenderer = ({
  value,
  field,
  record,
  editable = false,
  mode = 'view',
  onChange = () => {},
  view = 'detail'
}) => {
  // State for kanban controls
  const [kanbanMode, setKanbanMode] = useState(field.defaultMode || field.mode || 'milestone');
  const [showCompleted, setShowCompleted] = useState(field.showCompleted || false);
  const [loading, setLoading] = useState(false);

  // Get configuration
  const availableModes = field.modes || ['milestone', 'support'];
  const taskConfigName = field.relation?.taskConfig || field.taskConfig || 'task';
  const taskConfig = collections[taskConfigName];
  const embedded = view === 'table' || view === 'card' || field.embedded;

  // Validation
  if (!record?.id) {
    return (
      <Alert severity="warning" sx={{ my: 1 }}>
        Record ID required to display kanban board
      </Alert>
    );
  }

  if (!taskConfig) {
    return (
      <Alert severity="error" sx={{ my: 1 }}>
        Task configuration '{taskConfigName}' not found
      </Alert>
    );
  }

  // Handlers
  const handleModeChange = useCallback((newMode) => {
    setLoading(true);
    setKanbanMode(newMode);
    
    // Notify parent of change if needed
    onChange && onChange(newMode);
    
    // Brief loading state
    setTimeout(() => setLoading(false), 300);
  }, [onChange]);

  const handleShowCompletedToggle = useCallback(() => {
    setLoading(true);
    setShowCompleted(prev => {
      const newValue = !prev;
      
      // Notify parent of change if needed
      onChange && onChange({ mode: kanbanMode, showCompleted: newValue });
      
      return newValue;
    });
    
    // Brief loading state
    setTimeout(() => setLoading(false), 300);
  }, [kanbanMode, onChange]);

  const handleTaskUpdate = useCallback(() => {
    // Notify parent that tasks were updated
    onChange && onChange({ action: 'taskUpdated', mode: kanbanMode });
  }, [kanbanMode, onChange]);

  // For embedded/compact views (like in tables or cards)
  if (embedded) {
    return (
      <Box sx={{ minHeight: 300, maxHeight: 400, overflow: 'hidden' }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          {kanbanMode === 'milestone' ? 'Tasks by milestone' : 'Support tasks by status'}
        </Typography>
        <Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s' }}>
          <ProjectKanbanBoard
            projectId={record.id}
            mode={kanbanMode}
            showCompleted={showCompleted}
            embedded={true}
            config={taskConfig}
            onTaskUpdate={handleTaskUpdate}
          />
        </Box>
      </Box>
    );
  }

  // Full view
  return (
    <Box>
      {/* Header Controls - only show in full view and if editable */}
      {!embedded && editable && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Typography variant="subtitle1" fontWeight={500}>
            {field.label || 'Task Board'}
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
                    onClick={() => handleModeChange(mode)}
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
              variant={showCompleted ? 'contained' : 'outlined'}
              onClick={handleShowCompletedToggle}
              disabled={loading}
              sx={{ minWidth: 'auto' }}
            >
              {showCompleted ? 'Hide' : 'Show'} Completed
            </Button>
          </Box>
        </Box>
      )}

      {/* Read-only header for non-editable views */}
      {!embedded && !editable && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 1 }}>
            {field.label || 'Task Board'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {kanbanMode === 'milestone' ? 'Tasks organized by milestone' : 'Support tasks by status'}
            {showCompleted && ' (including completed)'}
          </Typography>
        </Box>
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
          <CircularProgress size={20} sx={{ mr: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Updating board...
          </Typography>
        </Box>
      )}

      {/* Kanban Board */}
      <Box sx={{ 
        opacity: loading ? 0.6 : 1, 
        transition: 'opacity 0.3s',
        minHeight: embedded ? 'auto' : 400
      }}>
        <ProjectKanbanBoard
          projectId={record.id}
          mode={kanbanMode}
          showCompleted={showCompleted}
          embedded={embedded}
          config={taskConfig}
          onTaskUpdate={handleTaskUpdate}
        />
      </Box>
    </Box>
  );
};

export default KanbanFieldRenderer;