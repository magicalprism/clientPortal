// ChecklistView.js with inline task creation support and fixed create checklist button
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Box, Typography, Grid, IconButton, Tooltip } from '@mui/material';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
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
import CollectionModal from '@/components/modals/CollectionModal';
import { useSearchParams } from 'next/navigation';
import SortableChecklist from '@/components/views/checklists/components/SortableChecklist';
import ChecklistCard from '@/components/views/checklists/ChecklistCard';
import * as collections from '@/collections';
import { Plus } from '@phosphor-icons/react';

export default function ChecklistView({ config, overId, dragging }) {
  const supabase = createClient();
  const router = useRouter();
  const [checklists, setChecklists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const sensors = useSensors(useSensor(PointerSensor));
  const searchParams = useSearchParams();
  const showModal = searchParams.get('modal') === 'create';

  // Fetch data function
  const fetchData = useCallback(async () => {
    console.log('[ChecklistView] Fetching data...');
    setIsLoading(true);
    
    try {
      const { data: checklistsData, error: checklistError } = await supabase
        .from('checklist')
        .select('*')
        .order('order_index', { ascending: true });

      const { data: tasksData, error: taskError } = await supabase
        .from('task')
        .select('*')
        .neq('status', 'complete')
        .order('order_index', { ascending: true });

      if (checklistError) {
        console.error('Checklist fetch error:', checklistError);
      }
      if (taskError) {
        console.error('Task fetch error:', taskError);
      }
      
      console.log('[ChecklistView] Fetched checklists:', checklistsData?.length || 0);
      console.log('[ChecklistView] Fetched tasks:', tasksData?.length || 0);

      setChecklists(checklistsData || []);
      setTasks(tasksData || []);
    } catch (error) {
      console.error('[ChecklistView] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle task completion
  const handleToggleComplete = async (taskId) => {
    console.log('[ChecklistView] Marking task complete:', taskId);
    
    // Update state immediately for responsive UI
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    
    try {
      const { error } = await supabase
        .from('task')
        .update({ status: 'complete' })
        .eq('id', taskId);
        
      if (error) {
        console.error('[ChecklistView] Error marking task complete:', error);
        await fetchData();
      }
    } catch (err) {
      console.error('[ChecklistView] Unexpected error marking task complete:', err);
      await fetchData();
    }
  };

  // Handle task deletion
  const handleTaskDelete = async (taskId) => {
    console.log('[ChecklistView] Deleting task:', taskId);
    
    // Update state immediately for responsive UI
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    
    try {
      const { error } = await supabase
        .from('task')
        .delete()
        .eq('id', taskId);
        
      if (error) {
        console.error('[ChecklistView] Error deleting task:', error);
        await fetchData();
      }
    } catch (err) {
      console.error('[ChecklistView] Unexpected error deleting task:', err);
      await fetchData();
    }
  };

  // Handle inline task addition
  const handleTaskAdd = (newTask) => {
    console.log('[ChecklistView] Adding new task to state:', newTask);
    
    // Add the new task to state immediately, but check for duplicates
    setTasks((prev) => {
      // Check if task already exists (prevent duplicates)
      const exists = prev.some(task => task.id === newTask.id);
      if (exists) {
        console.log('[ChecklistView] Task already exists, skipping duplicate');
        return prev;
      }
      
      const updated = [...prev, newTask];
      console.log('[ChecklistView] Tasks updated, new length:', updated.length);
      return updated;
    });
  };

  // Handle checklist title changes
  const handleChecklistChange = async (id, title) => {
    console.log('[ChecklistView] Updating checklist:', id, title);
    
    // Update state immediately
    setChecklists(prev => prev.map(cl => 
      cl.id === id ? { ...cl, title } : cl
    ));
    
    try {
      const { error } = await supabase
        .from('checklist')
        .update({ title })
        .eq('id', id);
        
      if (error) {
        console.error('[ChecklistView] Error updating checklist:', error);
        await fetchData();
      }
    } catch (err) {
      console.error('[ChecklistView] Unexpected error updating checklist:', err);
      await fetchData();
    }
  };

  // Handle checklist deletion
  const handleChecklistDelete = async (id) => {
    console.log('[ChecklistView] Deleting checklist:', id);
    
    // Update state immediately
    setChecklists(prev => prev.filter(cl => cl.id !== id));
    setTasks(prev => prev.filter(t => t.checklist_id !== id));
    
    try {
      // Delete all tasks in this checklist first
      await supabase.from('task').delete().eq('checklist_id', id);
      // Then delete the checklist
      const { error } = await supabase.from('checklist').delete().eq('id', id);
      
      if (error) {
        console.error('[ChecklistView] Error deleting checklist:', error);
        await fetchData();
      }
    } catch (err) {
      console.error('[ChecklistView] Unexpected error deleting checklist:', err);
      await fetchData();
    }
  };

  // Handle create checklist button click
  const handleCreateChecklist = () => {
    console.log('[ChecklistView] Opening create checklist modal');
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set('modal', 'create');
    // Don't override the type, keep existing URL structure
    router.push(currentUrl.pathname + currentUrl.search);
  };

  // Handle modal close
  const handleModalClose = () => {
    console.log('[ChecklistView] Modal closed');
    window.history.back();
  };

  // Handle modal refresh/success
  const handleModalRefresh = () => {
    console.log('[ChecklistView] Modal refresh triggered');
    fetchData();
  };

  // Group tasks by checklist
  const groupedTasks = useMemo(() => {
    return checklists.map((cl) => ({
      ...cl,
      tasks: tasks
        .filter((t) => t.checklist_id === cl.id)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    }));
  }, [checklists, tasks]);

  // Handle drag and drop
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;
  
    // Reorder checklists
    if (!isNaN(active.id) && !isNaN(over.id)) {
      const oldIndex = checklists.findIndex((c) => c.id === active.id);
      const newIndex = checklists.findIndex((c) => c.id === over.id);
      const newOrder = arrayMove(checklists, oldIndex, newIndex);
  
      setChecklists(newOrder);
      const updates = newOrder.map((cl, index) => ({ id: cl.id, order_index: index }));
      await supabase.from('checklist').upsert(updates, { onConflict: ['id'] });
      return;
    }
  
    // Move task to another checklist
    if (String(active.id).startsWith('task-') && String(over.id).startsWith('task-')) {
      const taskId = parseInt(active.id.replace('task-', ''));
      const overTaskId = parseInt(over.id.replace('task-', ''));

      const task = tasks.find((t) => t.id === taskId);
      const overTask = tasks.find((t) => t.id === overTaskId);

      if (!task || !overTask) return;

      const isSameChecklist = task.checklist_id === overTask.checklist_id;

      // If different checklist → move it
      if (!isSameChecklist) {
        await supabase
          .from('task')
          .update({ checklist_id: overTask.checklist_id })
          .eq('id', taskId);

        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, checklist_id: overTask.checklist_id }
              : t
          )
        );
      }
    }
    
    // Move task to an empty checklist
    if (
      String(active.id).startsWith('task-') &&
      !String(over.id).startsWith('task-')
    ) {
      const taskId = parseInt(active.id.replace('task-', ''));
      const newChecklistId = parseInt(over.id);

      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.checklist_id === newChecklistId) return;

      await supabase
        .from('task')
        .update({ checklist_id: newChecklistId })
        .eq('id', taskId);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, checklist_id: newChecklistId } : t
        )
      );
      return;
    }

    // Reorder tasks within the same checklist
    if (String(active.id).startsWith('task-') && String(over.id).startsWith('task-')) {
      const taskId = parseInt(active.id.replace('task-', ''));
      const overTaskId = parseInt(over.id.replace('task-', ''));
  
      const task = tasks.find((t) => t.id === taskId);
      const overTask = tasks.find((t) => t.id === overTaskId);
  
      if (!task || !overTask || task.checklist_id !== overTask.checklist_id) return;
  
      const checklistTasks = tasks
        .filter((t) => t.checklist_id === task.checklist_id)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  
      const oldIndex = checklistTasks.findIndex((t) => t.id === taskId);
      const newIndex = checklistTasks.findIndex((t) => t.id === overTaskId);
  
      const reordered = arrayMove(checklistTasks, oldIndex, newIndex);
  
      const updates = reordered.map((t, index) => ({
        id: t.id,
        order_index: index
      }));
  
      await supabase.from('task').upsert(updates, { onConflict: ['id'] });
      setTasks((prev) =>
        prev.map((t) =>
          updates.find((u) => u.id === t.id)
            ? { ...t, order_index: updates.find((u) => u.id === t.id).order_index }
            : t
        )
      );
    }
  };

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 3 
        }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
            {(config?.singularLabel || config?.label || 'Untitled') + ' Checklists'}
          </Typography>
          
          <Tooltip title="Create checklist">
            <IconButton
              onClick={handleCreateChecklist}
              sx={{ 
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.50'
                }
              }}
            >
              <Plus size={20} />
            </IconButton>
          </Tooltip>
        </Box>

        {isLoading ? (
          <Typography>Loading checklists...</Typography>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={({ active }) => setActiveTask(active)}
            onDragCancel={() => setActiveTask(null)}
          >
            <SortableContext 
              items={groupedTasks.map(cl => cl.id)}
              strategy={verticalListSortingStrategy}
            >
              <Grid container spacing={3} alignItems="stretch">
                {groupedTasks.map((cl) => (
                  <Grid item xs={12} md={6} key={cl.id}>
                    <SortableChecklist
                      id={cl.id}
                      checklist={cl}
                      active={activeTask}
                      over={{ id: overId }}
                    >
                      <ChecklistCard
                        checklist={cl}
                        config={config}
                        field={{ name: 'checklist_id', label: 'Task' }}
                        record={{ id: cl.id }}
                        onChangeTitle={handleChecklistChange}
                        onDelete={handleChecklistDelete}
                        onToggleComplete={handleToggleComplete}
                        onTaskDelete={handleTaskDelete}
                        onTaskAdd={handleTaskAdd}
                        enableTaskDrag
                      />
                    </SortableChecklist>
                  </Grid>
                ))}
              </Grid>
            </SortableContext>

            <DragOverlay dropAnimation={null}>
              {typeof activeTask?.id === 'string' && activeTask.id.toString().startsWith('task-') ? (
                <Box sx={{
                  p: 2,
                  backgroundColor: 'background.paper',
                  borderRadius: 2,
                  boxShadow: 3,
                  width: '100%',
                  maxWidth: 400,
                  opacity: 0.95
                }}>
                  Moving task...
                </Box>
              ) : typeof activeTask?.id === 'number' ? (
                <ChecklistCard
                  checklist={checklists.find(c => c.id === activeTask.id)}
                  config={config}
                  onChangeTitle={() => {}}
                  onDelete={() => {}}
                  onToggleComplete={() => {}}
                  onTaskDelete={() => {}}
                  onTaskAdd={() => {}}
                  field={{ name: 'checklist_id', label: 'Task' }}
                  record={{ id: activeTask.id }}
                  dragging
                  sx={{
                    opacity: dragging ? 0.7 : 1,
                    backgroundColor: dragging ? 'background.paper' : 'inherit',
                    pointerEvents: dragging ? 'none' : 'auto',
                    borderRadius: 2,
                    boxShadow: dragging ? 3 : 'none'
                  }}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </Box>

      {/* Modal for checklist creation */}
      {showModal && (
        <CollectionModal
          open
          config={collections.checklist}
          onClose={handleModalClose}
          onRefresh={handleModalRefresh}
        />
      )}
    </>
  );
}