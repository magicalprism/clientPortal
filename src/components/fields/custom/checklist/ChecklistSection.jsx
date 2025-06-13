// components/fields/custom/checklist/ChecklistSection.jsx
'use client';
import * as React from "react";
import { useState, useCallback } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Button, 
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert
} from '@mui/material';
import { Plus } from '@phosphor-icons/react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import ChecklistCard from '@/components/views/checklists/ChecklistCard';
import { createClient } from '@/lib/supabase/browser';
import { getCurrentContactId } from '@/lib/utils/getCurrentContactId';

export default function ChecklistSection({
  entityType = 'event',
  entityId,
  checklists = [],
  isLoading = false,
  editable = true,
  variant = 'embedded', // 'compact', 'embedded', 'full'
  allowCreate = true,
  allowReorder = true,
  assignableContacts = [],
  showProgress = true,
  onChecklistsUpdate,
  onCreateChecklist,
  defaultChecklistName = 'New Checklist',
  maxHeight,
  ...props
}) {
  const [activeChecklist, setActiveChecklist] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [localChecklists, setLocalChecklists] = useState(checklists);
  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Update local state when props change
  React.useEffect(() => {
    setLocalChecklists(checklists);
  }, [checklists]);

  // Handle task completion
  const handleToggleComplete = async (taskId) => {
    console.log('[ChecklistSection] Marking task complete:', taskId);
    
    try {
      const { error } = await supabase
        .from('task')
        .update({ 
          status: 'complete',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);
        
      if (error) {
        console.error('[ChecklistSection] Error marking task complete:', error);
        return;
      }

      // Update local state - remove completed task from all checklists
      setLocalChecklists(prev => 
        prev.map(checklist => ({
          ...checklist,
          tasks: checklist.tasks?.filter(task => task.id !== taskId) || []
        }))
      );

      // Notify parent
      if (onChecklistsUpdate) {
        const updatedChecklists = localChecklists.map(checklist => ({
          ...checklist,
          tasks: checklist.tasks?.filter(task => task.id !== taskId) || []
        }));
        onChecklistsUpdate(updatedChecklists);
      }

    } catch (err) {
      console.error('[ChecklistSection] Unexpected error marking task complete:', err);
    }
  };

  // Handle task deletion
  const handleTaskDelete = async (taskId) => {
    console.log('[ChecklistSection] Deleting task:', taskId);
    
    try {
      const { error } = await supabase
        .from('task')
        .delete()
        .eq('id', taskId);
        
      if (error) {
        console.error('[ChecklistSection] Error deleting task:', error);
        return;
      }

      // Update local state
      setLocalChecklists(prev => 
        prev.map(checklist => ({
          ...checklist,
          tasks: checklist.tasks?.filter(task => task.id !== taskId) || []
        }))
      );

      // Notify parent
      if (onChecklistsUpdate) {
        const updatedChecklists = localChecklists.map(checklist => ({
          ...checklist,
          tasks: checklist.tasks?.filter(task => task.id !== taskId) || []
        }));
        onChecklistsUpdate(updatedChecklists);
      }

    } catch (err) {
      console.error('[ChecklistSection] Unexpected error deleting task:', err);
    }
  };

  // Handle task addition
  const handleTaskAdd = (checklistId, newTask) => {
    console.log('[ChecklistSection] Adding new task to checklist:', checklistId, newTask);
    
    // Update local state
    setLocalChecklists(prev => 
      prev.map(checklist => 
        checklist.id === checklistId 
          ? {
              ...checklist,
              tasks: [...(checklist.tasks || []), newTask]
            }
          : checklist
      )
    );

    // Notify parent
    if (onChecklistsUpdate) {
      const updatedChecklists = localChecklists.map(checklist => 
        checklist.id === checklistId 
          ? {
              ...checklist,
              tasks: [...(checklist.tasks || []), newTask]
            }
          : checklist
      );
      onChecklistsUpdate(updatedChecklists);
    }
  };

  // Handle checklist title changes
  const handleChecklistChange = async (checklistId, title) => {
    console.log('[ChecklistSection] Updating checklist title:', checklistId, title);
    
    try {
      const { error } = await supabase
        .from('checklist')
        .update({ 
          title,
          updated_at: new Date().toISOString()
        })
        .eq('id', checklistId);
        
      if (error) {
        console.error('[ChecklistSection] Error updating checklist:', error);
        return;
      }

      // Update local state
      setLocalChecklists(prev => 
        prev.map(checklist => 
          checklist.id === checklistId 
            ? { ...checklist, title }
            : checklist
        )
      );

      // Notify parent
      if (onChecklistsUpdate) {
        const updatedChecklists = localChecklists.map(checklist => 
          checklist.id === checklistId 
            ? { ...checklist, title }
            : checklist
        );
        onChecklistsUpdate(updatedChecklists);
      }

    } catch (err) {
      console.error('[ChecklistSection] Unexpected error updating checklist:', err);
    }
  };

  // Handle checklist deletion
  const handleChecklistDelete = async (checklistId) => {
    console.log('[ChecklistSection] Deleting checklist:', checklistId);
    
    try {
      // Delete all tasks in this checklist first (CASCADE should handle this)
      const { error } = await supabase
        .from('checklist')
        .delete()
        .eq('id', checklistId);
        
      if (error) {
        console.error('[ChecklistSection] Error deleting checklist:', error);
        return;
      }

      // Update local state
      const updatedChecklists = localChecklists.filter(checklist => checklist.id !== checklistId);
      setLocalChecklists(updatedChecklists);

      // Notify parent
      if (onChecklistsUpdate) {
        onChecklistsUpdate(updatedChecklists);
      }

    } catch (err) {
      console.error('[ChecklistSection] Unexpected error deleting checklist:', err);
    }
  };

  // Handle drag and drop for checklist reordering
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setIsDragging(false);
    setActiveChecklist(null);
    
    if (!active || !over || active.id === over.id || !allowReorder) return;

    console.log('[ChecklistSection] Reordering checklists:', active.id, '→', over.id);
    
    const oldIndex = localChecklists.findIndex((c) => c.id === active.id);
    const newIndex = localChecklists.findIndex((c) => c.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(localChecklists, oldIndex, newIndex);
      
      // Update local state immediately
      setLocalChecklists(newOrder);
      
      // Update order_index in database
      try {
        const updates = newOrder.map((checklist, index) => ({
          id: checklist.id,
          order_index: index
        }));
        
        // Import the reorder function based on entity type
        const { table } = await import('@/lib/supabase/queries');
        const entityQueries = table[entityType];
        const reorderFunction = entityConfig.reorderFunction; // Gets correct function name from config
        if (entityQueries && entityQueries[reorderFunction]) {
          const { success, errors } = await entityQueries[reorderFunction](entityId, updates);
          
          if (!success) {
            console.error('[ChecklistSection] Error updating checklist order:', errors);
          }
        }
        
        // Notify parent
        if (onChecklistsUpdate) {
          onChecklistsUpdate(newOrder);
        }
        
      } catch (err) {
        console.error('[ChecklistSection] Unexpected error updating order:', err);
        // Revert on error
        setLocalChecklists(checklists);
      }
    }
  };

  const handleDragStart = ({ active }) => {
    setIsDragging(true);
    setActiveChecklist(localChecklists.find(c => c.id === active.id));
  };

  // Handle create checklist dialog
  const handleCreateDialogOpen = () => {
    setNewChecklistTitle('');
    setShowCreateDialog(true);
  };

  const handleCreateDialogClose = () => {
    setShowCreateDialog(false);
    setNewChecklistTitle('');
  };

  const handleCreateDialogSubmit = async () => {
    const title = newChecklistTitle.trim() || defaultChecklistName;
    
    if (onCreateChecklist) {
      await onCreateChecklist(title);
    }
    
    handleCreateDialogClose();
  };

  // Determine grid spacing based on variant
  const getGridSpacing = () => {
    switch (variant) {
      case 'compact': return 2;
      case 'embedded': return 3;
      case 'full': return 4;
      default: return 3;
    }
  };

  // Determine if checklist should show full features
  const showFullFeatures = variant !== 'compact';

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (localChecklists.length === 0 && !allowCreate) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        py: 4,
        color: 'text.secondary' 
      }}>
        <Typography variant="body2">
          No checklists found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxHeight, overflow: 'auto' }}>
      

      {/* Checklists Grid */}
      {localChecklists.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          onDragCancel={() => {
            setIsDragging(false);
            setActiveChecklist(null);
          }}
        >
          <SortableContext 
            items={localChecklists.map(cl => cl.id)}
            strategy={verticalListSortingStrategy}
          >
            <Grid container spacing={getGridSpacing()} alignItems="stretch">
              {localChecklists.map((checklist) => (
                <Grid item xs={12} md={variant === 'compact' ? 12 : 6} key={checklist.id}>
                  <ChecklistCard
                    checklist={checklist}
                    config={{ fields: [] }} // Minimal config
                    field={{ name: 'checklist_id', label: 'Task' }}
                    record={{ id: checklist.id }}
                    onChangeTitle={handleChecklistChange}
                    onDelete={handleChecklistDelete}
                    onToggleComplete={handleToggleComplete}
                    onTaskDelete={handleTaskDelete}
                    onTaskAdd={(newTask) => handleTaskAdd(checklist.id, newTask)}
                    enableTaskDrag={showFullFeatures}
                    editable={editable}
                    assignableContacts={assignableContacts}
                    listeners={allowReorder ? { /* will be set by SortableContext */ } : undefined}
                    dragging={isDragging && activeChecklist?.id === checklist.id}
                    variant={variant}
                  />
                </Grid>
              ))}
            </Grid>
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {activeChecklist && (
              <Box sx={{
                opacity: 0.8,
                transform: 'rotate(2deg)',
                maxWidth: 400,
                filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))'
              }}>
                <ChecklistCard
                  checklist={activeChecklist}
                  config={{ fields: [] }}
                  onChangeTitle={() => {}}
                  onDelete={() => {}}
                  onToggleComplete={() => {}}
                  onTaskDelete={() => {}}
                  onTaskAdd={() => {}}
                  field={{ name: 'checklist_id', label: 'Task' }}
                  record={{ id: activeChecklist.id }}
                  dragging={true}
                />
              </Box>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Add Another Checklist Button */}
      {allowCreate && localChecklists.length > 0 && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            startIcon={<Plus size={16} />}
            onClick={handleCreateDialogOpen}
            variant="text"
            size="small"
            sx={{
              textTransform: 'none',
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover',
                color: 'primary.main'
              }
            }}
          >
            Add Another Checklist
          </Button>
        </Box>
      )}

      {/* Create Checklist Dialog */}
      <Dialog 
        open={showCreateDialog} 
        onClose={handleCreateDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Checklist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Checklist Name"
            fullWidth
            variant="outlined"
            value={newChecklistTitle}
            onChange={(e) => setNewChecklistTitle(e.target.value)}
            placeholder={defaultChecklistName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateDialogSubmit();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateDialogClose}>Cancel</Button>
          <Button onClick={handleCreateDialogSubmit} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}