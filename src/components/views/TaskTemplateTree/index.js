// TaskTemplateTree.js - Refactored main component with separated drag & drop logic

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Stack,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  GlobalStyles,
} from '@mui/material';
import {
  Plus,
  ArrowsClockwise,
  DotsSixVertical,
  FloppyDisk,
  Check,
} from '@phosphor-icons/react';
import {
  DndContext,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
} from '@dnd-kit/sortable';
import { createClient } from '@/lib/supabase/browser';
import { ViewButtons } from '@/components/buttons/ViewButtons';
import { useModal } from '@/components/modals/ModalContext';
import * as collections from '@/collections';

// Import separated logic and components
import { useDragAndDrop } from '@/hooks/kanban/useDragAndDrop';
import { 
  TaskDropZone, 
  DroppableMilestoneHeader, 
  EmptyMilestoneDropZone 
} from '@/components/views/TaskTemplateTree/dragdrop/DropZoneComponents';
import { SortableTaskNode } from '@/components/views/TaskTemplateTree/SortableTaskNode';

// Main Component
const TaskTemplateTree = ({
  projectId = null,
}) => {
  const supabase = createClient();
  const { openModal } = useModal();
  
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [selectedMilestone, setSelectedMilestone] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pending changes for batch saving
  const [pendingChanges, setPendingChanges] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Get the task template config
  const config = collections.task || {
    name: 'task',
    singularLabel: 'Task Template',
    label: 'Task Templates'
  };

  // Optimistic update helper
  const updateTaskOptimistically = useCallback((taskId, updates) => {
    console.log('🔄 Optimistic update:', { taskId, updates });
    
    setTasks(prev => {
      const updatedTask = prev.find(t => t.id === taskId);
      console.log('📋 Before update:', updatedTask ? { id: updatedTask.id, title: updatedTask.title, order_index: updatedTask.order_index, milestone_id: updatedTask.milestone_id } : 'Task not found');
      
      const newTasks = prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      );
      
      const afterUpdate = newTasks.find(t => t.id === taskId);
      console.log('📋 After update:', afterUpdate ? { id: afterUpdate.id, title: afterUpdate.title, order_index: afterUpdate.order_index, milestone_id: afterUpdate.milestone_id } : 'Task not found');
      
      // Log all tasks in the same milestone with their order_index
      const sameMillestone = newTasks.filter(t => t.milestone_id === afterUpdate?.milestone_id && !t.parent_id);
      console.log('📊 All tasks in milestone after update:', sameMillestone.map(t => ({ id: t.id, title: t.title, order_index: t.order_index })));
      
      return newTasks;
    });
    
    // Add to pending changes
    setPendingChanges(prev => {
      const existing = prev.find(change => change.id === taskId);
      if (existing) {
        return prev.map(change => 
          change.id === taskId 
            ? { ...change, updates: { ...change.updates, ...updates } }
            : change
        );
      } else {
        return [...prev, { id: taskId, updates }];
      }
    });
  }, []);

  // Build tree structure
  const buildTaskTree = (tasks) => {
    if (!tasks || tasks.length === 0) return [];
    
    console.log('🌳 Building tree for tasks:', tasks.length);
    
    const taskMap = new Map();
    tasks.forEach(task => {
      taskMap.set(task.id, { ...task, children: [] });
    });

    const rootTasks = [];
    
    tasks.forEach(task => {
      const taskNode = taskMap.get(task.id);
      
      if (task.parent_id && taskMap.has(task.parent_id)) {
        const parent = taskMap.get(task.parent_id);
        parent.children.push(taskNode);
      } else {
        rootTasks.push(taskNode);
      }
    });

    // Sort each level by order_index with detailed logging
    const sortByOrderIndex = (taskList, level = 0) => {
      const beforeSort = taskList.map(t => ({ id: t.id, title: t.title, order_index: t.order_index }));
      
      const sorted = taskList.sort((a, b) => {
        const aOrder = a.order_index || 0;
        const bOrder = b.order_index || 0;
        return aOrder - bOrder;
      });
      
      const afterSort = sorted.map(t => ({ id: t.id, title: t.title, order_index: t.order_index }));
      
      // Log the sorting for root level
      if (level === 0) {
        console.log('📋 Before sorting:', beforeSort);
        console.log('📋 After sorting:', afterSort);
        
        // Check if order actually changed
        const orderChanged = JSON.stringify(beforeSort) !== JSON.stringify(afterSort);
        console.log('📋 Order changed:', orderChanged);
      }
      
      sorted.forEach(task => {
        if (task.children?.length > 0) {
          sortByOrderIndex(task.children, level + 1);
        }
      });
    };

    sortByOrderIndex(rootTasks);
    
    console.log('🌳 Tree built - Root tasks:', rootTasks.length);
    return rootTasks;
  };

  // Group tasks by milestone
  const groupedTasks = useMemo(() => {
    console.log('📊 Grouping tasks by milestone...');
    
    const grouped = {};
    
    // Initialize ALL milestones (even empty ones)
    milestones.forEach(milestone => {
      grouped[milestone.id] = [];
    });
    
    // Always include unassigned
    grouped['unassigned'] = [];
    
    // Group tasks into milestones
    tasks.forEach(task => {
      const milestoneId = task.milestone_id || 'unassigned';
      if (!grouped[milestoneId]) {
        grouped[milestoneId] = [];
      }
      grouped[milestoneId].push(task);
    });

    // Build tree for each milestone
    Object.keys(grouped).forEach(milestoneId => {
      grouped[milestoneId] = buildTaskTree(grouped[milestoneId]);
      console.log(`📋 Milestone ${milestoneId}: ${grouped[milestoneId].length} root tasks`);
    });

    console.log('📊 Final grouped tasks:', Object.keys(grouped).map(k => `${k}: ${grouped[k].length}`));
    return grouped;
  }, [tasks, milestones]);

  // Initialize drag and drop logic
  const dragDropLogic = useDragAndDrop({
    tasks,
    milestones,
    groupedTasks,
    updateTaskOptimistically
  });

  // Filter tasks based on selected milestone
  const filteredTasks = useMemo(() => {
    if (selectedMilestone === 'all') {
      // Show ALL milestones, even empty ones
      const allMilestones = {};
      
      // Add all actual milestones
      milestones.forEach(milestone => {
        allMilestones[milestone.id] = groupedTasks[milestone.id] || [];
      });
      
      // Add unassigned
      allMilestones['unassigned'] = groupedTasks['unassigned'] || [];
      
      return allMilestones;
    }
    
    // Show specific milestone
    const filtered = selectedMilestone in groupedTasks ? 
      { [selectedMilestone]: groupedTasks[selectedMilestone] } : 
      { [selectedMilestone]: [] };
    
    return filtered;
  }, [groupedTasks, selectedMilestone, milestones]);

  // Create milestone options including empty ones
  const milestoneOptions = useMemo(() => {
    const options = [{ id: 'all', title: 'All Milestones', count: tasks.length }];
    
    // Add unassigned
    const unassignedCount = groupedTasks['unassigned']?.length || 0;
    options.push({ 
      id: 'unassigned', 
      title: 'Unassigned', 
      count: unassignedCount 
    });

    // Add all milestones (even empty ones)
    milestones.forEach(milestone => {
      const count = groupedTasks[milestone.id]?.length || 0;
      options.push({
        id: milestone.id,
        title: milestone.title,
        count
      });
    });

    return options;
  }, [milestones, groupedTasks, tasks.length]);

  // Get milestone info
  const getMilestoneInfo = (milestoneId) => {
    if (milestoneId === 'unassigned') {
      return { id: 'unassigned', title: 'Unassigned Templates' };
    }
    const milestone = milestones.find(m => m.id.toString() === milestoneId.toString());
    return milestone || { id: milestoneId, title: `Milestone ${milestoneId}` };
  };

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestone')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (milestonesError) {
        console.error('Error fetching milestones:', milestonesError);
      } else {
        console.log('📍 Fetched milestones:', milestonesData?.length || 0);
        setMilestones(milestonesData || []);
      }

      // Fetch task templates
      let tasksQuery = supabase
        .from('task')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          task_type,
          estimated_duration,
          milestone_id,
          parent_id,
          project_id,
          order_index,
          is_template,
          created_at,
          updated_at,
          content,
          due_date,
          start_date
        `)
        .eq('is_template', true);
    
      // Add is_deleted filter if column exists
      try {
        tasksQuery = tasksQuery.eq('is_deleted', false);
      } catch (e) {
        console.log('No is_deleted column, skipping filter');
      }

      // Add project filter if specified
      if (projectId) {
        tasksQuery = tasksQuery.eq('project_id', projectId);
      }

      tasksQuery = tasksQuery
        .order('milestone_id', { ascending: true, nullsFirst: false })
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });

      const { data: tasksData, error: tasksError } = await tasksQuery;

      if (tasksError) {
        throw tasksError;
      }

      console.log('📝 Fetched task templates:', {
        count: tasksData?.length || 0,
        withMilestone: tasksData?.filter(t => t.milestone_id).length || 0,
        unassigned: tasksData?.filter(t => !t.milestone_id).length || 0,
        withParent: tasksData?.filter(t => t.parent_id).length || 0,
      });

      setTasks(tasksData || []);
      setPendingChanges([]); // Clear pending changes on fresh load

    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [projectId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Batch save pending changes
  const savePendingChanges = useCallback(async () => {
    if (pendingChanges.length === 0) return;
    
    setIsSaving(true);
    try {
      const updatePromises = pendingChanges.map(async ({ id, updates }) => {
        const { error } = await supabase
          .from('task')
          .update(updates)
          .eq('id', id);
        
        if (error) throw error;
        return { id, success: true };
      });

      await Promise.all(updatePromises);
      
      console.log('✅ Saved all pending changes:', pendingChanges.length);
      setPendingChanges([]);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
      
    } catch (error) {
      console.error('❌ Error saving changes:', error);
      setError(error);
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges, supabase]);

  // Handle adding new task template
  const handleAddTask = useCallback(async (milestoneId, parentId = null) => {
    try {
      const templateData = {
        title: parentId ? 'New Subtask Template' : 'New Task Template',
        milestone_id: milestoneId === 'unassigned' ? null : parseInt(milestoneId),
        parent_id: parentId,
        order_index: 0,
        project_id: projectId,
        is_template: true,
        status: 'todo',
        task_type: 'task',
        priority: 'medium'
      };

      const { data: newTask, error } = await supabase
        .from('task')
        .insert(templateData)
        .select()
        .single();
      
      if (error) throw error;

      console.log('✅ Created new task template:', newTask);
      
      // Add to local state immediately
      setTasks(prev => [...prev, newTask]);
      
    } catch (error) {
      console.error('❌ Error creating task template:', error);
      setError(error);
    }
  }, [projectId, supabase]);

  // Handle task title update (optimistic)
  const handleUpdateTitle = useCallback(async (taskId, newTitle) => {
    // Update UI immediately
    updateTaskOptimistically(taskId, { title: newTitle });
    console.log('📝 Updated task title (optimistic):', newTitle);
  }, [updateTaskOptimistically]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading task templates...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading task templates: {error.message || 'Unknown error'}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Global Styles */}
      <GlobalStyles
        styles={{
          '@keyframes shimmer': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' },
          },
          '@keyframes glow': {
            '0%': { boxShadow: '0 0 5px rgba(25, 118, 210, 0.3)' },
            '50%': { boxShadow: '0 0 20px rgba(25, 118, 210, 0.6)' },
            '100%': { boxShadow: '0 0 5px rgba(25, 118, 210, 0.3)' },
          },
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.05)' },
            '100%': { transform: 'scale(1)' },
          },
        }}
      />
      
      <Typography variant="h4" gutterBottom>
        Task Templates
      </Typography>

      <Grid container spacing={3}>
        {/* Sticky Milestone Sidebar */}
        <Grid item xs={12} md={3}>
          <Box 
            sx={{ 
              position: 'sticky', 
              top: 20, 
              height: 'fit-content',
              maxHeight: 'calc(100vh - 40px)',
              overflow: 'auto',
              zIndex: 10,
            }}
          >
            <Card 
              sx={{
                border: pendingChanges.length > 0 ? '2px solid' : '1px solid',
                borderColor: pendingChanges.length > 0 ? 'warning.main' : 'divider',
                transition: 'all 0.3s ease',
                boxShadow: pendingChanges.length > 0 ? 6 : 3,
                backgroundColor: 'background.paper',
              }}
            >
              <CardContent>
                {/* Save Button */}
                {pendingChanges.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={savePendingChanges}
                      disabled={isSaving}
                      startIcon={
                        isSaving ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <FloppyDisk size={16} />
                        )
                      }
                      sx={{
                        py: 1.5,
                        fontWeight: 600,
                        animation: pendingChanges.length > 3 ? 'glow 2s infinite' : 'none',
                        boxShadow: 3,
                      }}
                    >
                      {isSaving ? 'Saving...' : `Save ${pendingChanges.length} Change${pendingChanges.length > 1 ? 's' : ''}`}
                    </Button>
                    
                    <Divider sx={{ mt: 2 }} />
                  </Box>
                )}

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6">
                    Milestones
                  </Typography>
                  
                  {pendingChanges.length > 0 && !isSaving && (
                    <Chip
                      label={`${pendingChanges.length} unsaved`}
                      color="warning"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Stack>
                
                <List dense>
                  {milestoneOptions.map((milestone) => (
                    <ListItem key={milestone.id} disablePadding>
                      <ListItemButton
                        selected={selectedMilestone === milestone.id}
                        onClick={() => setSelectedMilestone(milestone.id)}
                        sx={{
                          borderRadius: 1,
                          mb: 0.5,
                          '&.Mui-selected': {
                            backgroundColor: 'primary.50',
                            borderLeft: '3px solid',
                            borderLeftColor: 'primary.main',
                          }
                        }}
                      >
                        <ListItemText 
                          primary={
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: selectedMilestone === milestone.id ? 600 : 400,
                                  color: selectedMilestone === milestone.id ? 'primary.main' : 'text.primary'
                                }}
                              >
                                {milestone.title}
                              </Typography>
                              <Chip 
                                label={milestone.count}
                                size="small"
                                sx={{
                                  height: 20,
                                  minWidth: 20,
                                  fontSize: '0.75rem',
                                  backgroundColor: selectedMilestone === milestone.id ? 'primary.main' : 'grey.400',
                                  color: 'white',
                                  fontWeight: 600,
                                  '& .MuiChip-label': {
                                    px: 0.5
                                  }
                                }}
                              />
                            </Stack>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Plus size={16} />}
                  onClick={() => handleAddTask(selectedMilestone === 'all' ? 'unassigned' : selectedMilestone)}
                >
                  Add Template
                </Button>

                {/* Help Text */}
                <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                    💡 Drag Controls:
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                    • <strong>Vertical</strong> = Reorder tasks<br/>
                    • <strong>Horizontal →</strong> = Make child task<br/>
                    • <strong>Milestones</strong> = Change assignment
                  </Typography>
                  {dragDropLogic.activeTask && (
                    <Chip
                      label={`Dragging: ${dragDropLogic.dragIntent || 'reorder'}`}
                      size="small"
                      color={dragDropLogic.dragIntent === 'parent' ? 'success' : 'primary'}
                      sx={{ mt: 1, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>

        {/* Tasks Area */}
        <Grid item xs={12} md={9}>
          <Card sx={{ minHeight: 600 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="h6">
                    {selectedMilestone === 'all' ? 'All Templates' : getMilestoneInfo(selectedMilestone).title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Drag tasks freely • Move horizontally → to set parent • Move vertically ↕ to reorder
                    {dragDropLogic.activeTask && (
                      <Chip
                        label={`Mode: ${dragDropLogic.dragIntent || 'reorder'}`}
                        size="small"
                        color={dragDropLogic.dragIntent === 'parent' ? 'success' : 'primary'}
                        sx={{ ml: 1, height: 16, fontSize: '0.7rem' }}
                      />
                    )}
                  </Typography>
                </Box>
                
                <Stack direction="row" spacing={1}>
                  <IconButton 
                    onClick={fetchData}
                    sx={{ 
                      backgroundColor: 'grey.100',
                      '&:hover': { backgroundColor: 'grey.200' }
                    }}
                  >
                    <ArrowsClockwise size={20} />
                  </IconButton>
                  
                  <Button
                    variant="contained"
                    startIcon={<Plus size={16} />}
                    onClick={() => handleAddTask(selectedMilestone === 'all' ? 'unassigned' : selectedMilestone)}
                    sx={{ 
                      boxShadow: 2,
                      '&:hover': { boxShadow: 4 }
                    }}
                  >
                    Add Template
                  </Button>
                </Stack>
              </Stack>

              <DndContext {...dragDropLogic.dndContextProps}>
                <SortableContext 
                  items={dragDropLogic.allSortableIds} 
                  strategy={dragDropLogic.verticalListSortingStrategy}
                >
                  {Object.keys(filteredTasks).length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Templates Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {selectedMilestone === 'all' 
                          ? 'Create your first task template to get started'
                          : `No templates in ${getMilestoneInfo(selectedMilestone).title}`
                        }
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Plus size={16} />}
                        onClick={() => handleAddTask(selectedMilestone === 'all' ? 'unassigned' : selectedMilestone)}
                      >
                        Create First Template
                      </Button>
                    </Box>
                  ) : (
                    Object.entries(filteredTasks).map(([milestoneId, milestoneTasks]) => (
                      <Box key={milestoneId} sx={{ mb: 4 }}>
                        {/* Droppable Milestone Header */}
                        {selectedMilestone === 'all' && (
                          <DroppableMilestoneHeader
                            milestoneId={milestoneId}
                            milestone={getMilestoneInfo(milestoneId)}
                            taskCount={milestoneTasks.length}
                            onAddTask={handleAddTask}
                            isActive={!!dragDropLogic.activeTask}
                            dragIntent={dragDropLogic.dragIntent}
                          />
                        )}
                        
                        {/* Tasks with drop zones */}
                        {milestoneTasks.length > 0 ? (
                          milestoneTasks.map((task, index) => (
                            <Box key={`task-container-${task.id}-${task.order_index || 0}`}>
                              {/* Drop zone before task */}
                              <TaskDropZone 
                                id={`drop-before-${task.id}`} 
                                position="before"
                                level={0}
                                isActive={!!dragDropLogic.activeTask}
                                dragIntent={dragDropLogic.dragIntent}
                              />
                              
                              {/* The actual task */}
                              <SortableTaskNode
                                key={`task-${task.id}-${task.order_index || 0}`}
                                task={task}
                                onAddChild={(parentId) => handleAddTask(milestoneId, parentId)}
                                onUpdateTitle={handleUpdateTitle}
                                allTasks={tasks}
                                config={config}
                                onRefresh={fetchData}
                                isDragActive={!!dragDropLogic.activeTask}
                                draggedTaskId={dragDropLogic.activeTask?.id}
                                canBeParent={dragDropLogic.canBeParent}
                                dragIntent={dragDropLogic.dragIntent}
                              />
                              
                              {/* Drop zone after last task */}
                              {index === milestoneTasks.length - 1 && (
                                <TaskDropZone 
                                  id={`drop-after-${task.id}`} 
                                  position="after"
                                  level={0}
                                  isActive={!!dragDropLogic.activeTask}
                                  dragIntent={dragDropLogic.dragIntent}
                                />
                              )}
                            </Box>
                          ))
                        ) : (
                          // Empty milestone drop zone
                          <EmptyMilestoneDropZone
                            milestoneId={milestoneId}
                            milestoneInfo={getMilestoneInfo(milestoneId)}
                            isActive={!!dragDropLogic.activeTask}
                          />
                        )}
                      </Box>
                    ))
                  )}
                </SortableContext>

                {/* Clean Drag Overlay */}
                <DragOverlay>
                  {dragDropLogic.activeTask && (
                    <Card 
                      elevation={12} 
                      sx={{ 
                        opacity: 0.9, 
                        transform: 'rotate(1deg)',
                        border: '3px solid',
                        borderColor: dragDropLogic.dragIntent === 'parent' ? 'success.main' : 'primary.main',
                        maxWidth: 350,
                        background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <DotsSixVertical size={16} color={dragDropLogic.dragIntent === 'parent' ? '#2e7d32' : '#1976d2'} />
                          <Typography variant="body2" fontWeight={600} color={dragDropLogic.dragIntent === 'parent' ? 'success.main' : 'primary.main'}>
                            {dragDropLogic.activeTask.title}
                          </Typography>
                        </Stack>
                        
                        <Box 
                          sx={{ 
                            p: 1, 
                            backgroundColor: dragDropLogic.dragIntent === 'parent' ? 'success.50' : 'primary.50', 
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: dragDropLogic.dragIntent === 'parent' ? 'success.200' : 'primary.200'
                          }}
                        >
                          <Typography variant="caption" color={dragDropLogic.dragIntent === 'parent' ? 'success.dark' : 'primary.dark'} sx={{ fontWeight: 600 }}>
                            {dragDropLogic.dragIntent === 'parent' ? '🌲 Parent Mode' : '📝 Reorder Mode'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </DragOverlay>
              </DndContext>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Success Snackbar */}
      <Snackbar
        open={showSaved}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          icon={<Check />}
          sx={{ width: '100%' }}
        >
          All changes saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TaskTemplateTree;