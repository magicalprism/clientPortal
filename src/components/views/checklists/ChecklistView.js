// ChecklistView.js with folder-style tabs and generated checklists
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Box, Typography, Grid, IconButton, Tooltip, Tab, Tabs } from '@mui/material';
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
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CollectionModal from '@/components/modals/CollectionModal';
import { useSearchParams } from 'next/navigation';
import ChecklistCard from '@/components/views/checklists/ChecklistCard';
import * as collections from '@/collections';
import { Plus } from '@phosphor-icons/react';
import { getCurrentContactId } from '@/lib/utils/getCurrentContactId';

// Tab definitions
const TAB_CONFIGS = {
  priority: { id: 'priority', label: 'Priority', type: 'priority' },
  internal: { id: 'internal', label: 'Internal', type: 'internal' },
  home: { id: 'home', label: 'Home', type: 'home' },
  all: { id: 'all', label: 'All', type: 'all' }
};

export default function ChecklistView({ config, overId, dragging }) {
  const supabase = createClient();
  const router = useRouter();
  const [checklists, setChecklists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('priority');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  const searchParams = useSearchParams();
  const showModal = searchParams.get('modal') === 'create';

  // Helper function to check if date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    const checkDate = new Date(date);
    return today.toDateString() === checkDate.toDateString();
  };

  // Helper function to check if date is this week
  const isThisWeek = (date) => {
    if (!date) return false;
    const today = new Date();
    const checkDate = new Date(date);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    return checkDate >= startOfWeek && checkDate <= endOfWeek;
  };

  // Generate virtual checklists for due dates - Always show priority, due today, and due this week
  const generateDateChecklists = useMemo(() => {
    const dueTodayTasks = tasks.filter(task => isToday(task.due_date));
    const dueThisWeekTasks = tasks.filter(task => isThisWeek(task.due_date) && !isToday(task.due_date));

    console.log('[ChecklistView] Generated checklists - Due Today:', dueTodayTasks.length, 'Due This Week:', dueThisWeekTasks.length);

    const generatedChecklists = [];

    // Always show Due Today (even if empty)
    generatedChecklists.push({
      id: 'due-today',
      title: 'Due Today',
      type: 'generated',
      isGenerated: true,
      tasks: dueTodayTasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    });

    // Always show Due This Week (even if empty)
    generatedChecklists.push({
      id: 'due-this-week',
      title: 'Due This Week',
      type: 'generated',
      isGenerated: true,
      tasks: dueThisWeekTasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    });

    return generatedChecklists;
  }, [tasks]);

  // Filter checklists based on active tab
  const filteredChecklists = useMemo(() => {
    let baseChecklists = [];

    switch (activeTab) {
      case 'priority':
        // Include priority checklist (author_id IS NULL) plus generated date checklists
        baseChecklists = checklists.filter(cl => cl.author_id === null).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        return [...baseChecklists, ...generateDateChecklists];
      case 'internal':
        return checklists.filter(cl => cl.type === 'internal' && cl.author_id !== null).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      case 'home':
        return checklists.filter(cl => cl.type === 'home' && cl.author_id !== null).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      case 'all':
      default:
        return checklists.filter(cl => cl.author_id !== null).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    }
  }, [checklists, activeTab, generateDateChecklists]);

  // Fetch data function
  const fetchData = useCallback(async () => {
    console.log('[ChecklistView] Fetching data...');
    setIsLoading(true);
    
    try {
      const currentUserId = await getCurrentContactId();
      console.log('[ChecklistView] Current user ID:', currentUserId);

      // Fetch checklists for current user OR priority checklist (author_id IS NULL)
      const { data: checklistsData, error: checklistError } = await supabase
        .from('checklist')
        .select('*')
        .or(`author_id.eq.${currentUserId},author_id.is.null`)
        .order('order_index', { ascending: true, nullsFirst: false });

      // Fetch tasks assigned to current user only
      const { data: tasksData, error: taskError } = await supabase
        .from('task')
        .select('*')
        .eq('assigned_id', currentUserId)
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

      // Ensure order_index is set for checklists that don't have it
      const processedChecklists = (checklistsData || []).map((cl, index) => ({
        ...cl,
        order_index: cl.order_index ?? index
      }));

      setChecklists(processedChecklists);
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

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

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
    setTasks((prev) => {
      const filtered = prev.filter((t) => t.id !== taskId);
      console.log('[ChecklistView] Tasks after deletion:', filtered.length);
      return filtered;
    });
    
    try {
      const { error } = await supabase
        .from('task')
        .delete()
        .eq('id', taskId);
        
      if (error) {
        console.error('[ChecklistView] Error deleting task:', error);
        await fetchData();
      } else {
        console.log('[ChecklistView] Task deleted successfully from database');
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
    // Don't allow editing generated checklists
    if (typeof id === 'string') return;
    
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
    // Don't allow deleting generated checklists
    if (typeof id === 'string') return;
    
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
  const handleCreateChecklist = async () => {
    console.log('[ChecklistView] Opening create checklist modal');
    
    try {
      const currentUserId = await getCurrentContactId();
      const currentUrl = new URL(window.location);
      currentUrl.searchParams.set('modal', 'create');
      
      // Set the type based on active tab
      const currentTabConfig = TAB_CONFIGS[activeTab];
      if (currentTabConfig && (currentTabConfig.type === 'internal' || currentTabConfig.type === 'home')) {
        currentUrl.searchParams.set('defaultType', currentTabConfig.type);
      }
      
      // Set default author_id (will be null for priority, user ID for others)
      if (currentTabConfig && currentTabConfig.type !== 'priority') {
        currentUrl.searchParams.set('defaultAuthorId', currentUserId);
      }
      
      router.push(currentUrl.pathname + currentUrl.search);
    } catch (err) {
      console.error('[ChecklistView] Error getting current user:', err);
    }
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
    const result = filteredChecklists.map((cl) => {
      // For generated checklists, tasks are already included
      if (cl.isGenerated) {
        return cl;
      }

      // For regular checklists, filter and sort tasks
      const checklistTasks = tasks
        .filter((t) => t.checklist_id === cl.id)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        
      return {
        ...cl,
        tasks: checklistTasks
      };
    });
    
    console.log('[ChecklistView] Grouped tasks updated:', result.map(cl => ({ id: cl.id, taskCount: cl.tasks?.length || 0 })));
    return result;
  }, [filteredChecklists, tasks]);

  // Handle drag and drop
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    console.log('[ChecklistView] Drag end:', { active: active?.id, over: over?.id });
    
    if (!active || !over || active.id === over.id) return;

    // Handle checklist reordering (only real checklists, not generated ones)
    if (!isNaN(active.id) && !isNaN(over.id)) {
      console.log('[ChecklistView] Reordering checklists:', active.id, '→', over.id);
      
      const realChecklists = checklists.filter(cl => !cl.isGenerated);
      const oldIndex = realChecklists.findIndex((c) => c.id === active.id);
      const newIndex = realChecklists.findIndex((c) => c.id === over.id);
      
      console.log('[ChecklistView] Indices:', { oldIndex, newIndex });
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(realChecklists, oldIndex, newIndex);
        
        // Update order_index for each checklist
        const updates = newOrder.map((cl, index) => ({ 
          id: cl.id, 
          order_index: index,
          title: cl.title,
          type: cl.type,
          created_at: cl.created_at,
          updated_at: new Date().toISOString()
        }));
        
        console.log('[ChecklistView] Updating order:', updates);
        
        // Update database first
        try {
          for (const update of updates) {
            const { error } = await supabase
              .from('checklist')
              .update({ order_index: update.order_index, updated_at: update.updated_at })
              .eq('id', update.id);
            
            if (error) {
              console.error('[ChecklistView] Error updating checklist order:', error);
            }
          }
          
          // Then update local state
          setChecklists(prev => prev.map(cl => {
            const updated = updates.find(u => u.id === cl.id);
            return updated ? { ...cl, order_index: updated.order_index } : cl;
          }));
          
        } catch (err) {
          console.error('[ChecklistView] Unexpected error updating order:', err);
          // Refresh data on error
          fetchData();
        }
      }
      return;
    }

    // Handle task operations (existing logic)
    if (String(active.id).startsWith('task-')) {
      const taskId = parseInt(active.id.replace('task-', ''));
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // Move task to another checklist (drop on checklist)
      if (!String(over.id).startsWith('task-') && typeof over.id === 'number') {
        const newChecklistId = parseInt(over.id);
        if (task.checklist_id === newChecklistId) return;

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

      // Reorder tasks or move between checklists (drop on task)
      if (String(over.id).startsWith('task-')) {
        const overTaskId = parseInt(over.id.replace('task-', ''));
        const overTask = tasks.find((t) => t.id === overTaskId);
        if (!overTask) return;

        const isSameChecklist = task.checklist_id === overTask.checklist_id;

        // Move to different checklist
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
        } else {
          // Reorder within same checklist
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
      }
    }
  };

  const handleDragStart = ({ active }) => {
    console.log('[ChecklistView] Drag start:', active?.id);
    setActiveTask(active);
  };

  // Custom component for generated checklists to ensure consistent styling
 const GeneratedChecklistCard = ({ checklist }) => (
<ChecklistCard
checklist={checklist}
config={{
name: 'task',
table: 'task', // ✅ GOOD: Proper task config for DeleteRecordButton
fields: []
}}
field={{ name: 'checklist_id', label: 'Task' }}
record={{ id: checklist.id }}
onChangeTitle={() => {}} // No editing for generated
onDelete={() => {}} // No deletion for generated
onToggleComplete={handleToggleComplete}
onTaskDelete={handleTaskDelete}
onTaskAdd={handleTaskAdd}
enableTaskDrag={false} // Disable drag for generated
isGenerated={true}
/>
);

  // Sortable checklist component
  const SortableChecklistCard = ({ checklist }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: checklist.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
  <div ref={setNodeRef} style={style} {...attributes}>
    <ChecklistCard
      checklist={checklist}
      config={{ 
        name: 'task',
        table: 'task', // ✅ GOOD: Proper task config for DeleteRecordButton
        fields: [] 
      }}
      field={{ name: 'checklist_id', label: 'Task' }}
      record={{ id: checklist.id }}
      onChangeTitle={handleChecklistChange}
      onDelete={handleChecklistDelete}
      onToggleComplete={handleToggleComplete}
      onTaskDelete={handleTaskDelete}
      onTaskAdd={handleTaskAdd}
      enableTaskDrag
      listeners={listeners}
      dragging={isDragging}
    />
  </div>
);
  };

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 2 
        }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
            My {(config?.label || 'Checklist')} 
          </Typography>
          
          <Tooltip title="Create checklist">
            <IconButton
              onClick={handleCreateChecklist}
              sx={{ 
                color: 'primary.main',
                backgroundColor: 'primary.50',
                '&:hover': {
                  backgroundColor: 'primary.100'
                }
              }}
            >
              <Plus size={20} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Modern Tabs */}
        <Box sx={{ 
          mb: 3,
          borderRadius: 2,
          p: 0.5,
          backgroundColor: 'grey.50',
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              minHeight: 40,
              '& .MuiTabs-flexContainer': {
                gap: 0.5
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                minHeight: 40,
                fontWeight: 500,
                borderRadius: 1.5,
                transition: 'all 0.2s ease-in-out',
                color: 'text.secondary',
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: 'grey.100',
                  color: 'text.primary'
                },
                '&.Mui-selected': {
                  backgroundColor: 'background.paper',
                  color: 'primary.main',
                  fontWeight: 600,
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
                }
              },
              '& .MuiTabs-indicator': {
                display: 'none'
              }
            }}
          >
            {Object.values(TAB_CONFIGS).map((tab) => (
              <Tab
                key={tab.id}
                label={tab.label}
                value={tab.id}
              />
            ))}
          </Tabs>
        </Box>

        {isLoading ? (
          <Typography>Loading checklists...</Typography>
        ) : (
          <>
            {groupedTasks.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 4,
                color: 'text.secondary' 
              }}>
                <Typography variant="h6" gutterBottom>
                  No checklists found
                </Typography>
                <Typography variant="body2">
                  {activeTab === 'priority' && 'No priority checklist available and no tasks due today/this week.'}
                  {activeTab === 'internal' && 'Create your first internal checklist to get started.'}
                  {activeTab === 'home' && 'Create your first home checklist to get started.'}
                  {activeTab === 'all' && 'Create your first checklist to get started.'}
                </Typography>
              </Box>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
                onDragCancel={() => setActiveTask(null)}
              >
                <SortableContext 
                  items={groupedTasks.filter(cl => !cl.isGenerated).map(cl => cl.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Grid container spacing={3} alignItems="stretch">
                    {groupedTasks.map((cl) => (
                      <Grid item xs={12} md={6} key={`${cl.id}-${cl.tasks?.length || 0}`}>
                        {cl.isGenerated ? (
                          <GeneratedChecklistCard checklist={cl} />
                        ) : (
                          <SortableChecklistCard checklist={cl} />
                        )}
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
                      <Typography variant="body2" color="text.secondary">
                        Moving task...
                      </Typography>
                    </Box>
                  ) : typeof activeTask?.id === 'number' ? (
                    <Box sx={{
                      opacity: 0.8,
                      transform: 'rotate(2deg)',
                      maxWidth: 400,
                      filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))'
                    }}>
                     <ChecklistCard
                        checklist={checklists.find(c => c.id === activeTask.id)}
                        config={{
                        name: 'task',
                        table: 'task', // ✅ GOOD: Proper task config for DeleteRecordButton
                        fields: []
                        }}
                        onChangeTitle={() => {}}
                        onDelete={() => {}}
                        onToggleComplete={() => {}}
                        onTaskDelete={() => {}}
                        onTaskAdd={() => {}}
                        field={{ name: 'checklist_id', label: 'Task' }}
                        record={{ id: activeTask.id }}
                        dragging
                        />
                    </Box>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </>
        )}
      </Box>

      {/* Modal for checklist creation */}
      {showModal && (
        <CollectionModal
          open
          config={collections.checklist}
          onClose={handleModalClose}
          onRefresh={handleModalRefresh}
          defaultValues={{
            type: searchParams.get('defaultType') || null,
            author_id: searchParams.get('defaultAuthorId') || null
          }}
        />
      )}
    </>
  );
}