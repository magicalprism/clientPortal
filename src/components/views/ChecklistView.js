// ChecklistView.js with cross-checklist drag-and-drop for tasks (preserving original checklist DnD)
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { createClient } from '@/lib/supabase/browser';
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
import  CollectionModal  from '@/components/modals/CollectionModal';
import { useSearchParams } from 'next/navigation';
import SortableChecklist from '@/components/views/checklists/components/SortableChecklist';
import ChecklistCard from '@/components/views/checklists/ChecklistCard';

export default function ChecklistView({ config, overId, dragging }) {
  const supabase = createClient();
  const [checklists, setChecklists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor));
  const searchParams = useSearchParams();
  const showModal = searchParams.get('modal') === 'create';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: checklistsData, error: checklistError } = await supabase
  .from('checklist')
  .select('*')
  .order('order_index', { ascending: true });

  const { data: tasksData, error: taskError } = await supabase
  .from('task')
  .select('*')
  .in('status', ['in_progress', 'todo']);

  if (checklistError) console.error('Checklist fetch error:', checklistError);
  if (taskError) console.error('Task fetch error:', taskError);
  
      console.log('Fetched checklists:', checklistsData);
      console.log('Fetched tasks:', tasksData);

    setChecklists(checklistsData || []);
    setTasks(tasksData || []);
  };

  const handleToggleComplete = async (taskId) => {
    await supabase.from('task').update({ status: 'complete' }).eq('id', taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleChecklistChange = async (id, title) => {
    await supabase.from('checklist').update({ title }).eq('id', id);
    fetchData();
  };

  const handleChecklistDelete = async (id) => {
    await supabase.from('task').delete().eq('checklist_id', id);
    await supabase.from('checklist').delete().eq('id', id);
    fetchData();
  };

  const groupedTasks = useMemo(() => {
    return checklists.map((cl) => ({
      ...cl,
      tasks: tasks
        .filter((t) => t.checklist_id === cl.id)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    }));
  }, [checklists, tasks]);
  

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;
  
    // ✅ Reorder checklists
    if (!isNaN(active.id) && !isNaN(over.id)) {
      const oldIndex = checklists.findIndex((c) => c.id === active.id);
      const newIndex = checklists.findIndex((c) => c.id === over.id);
      const newOrder = arrayMove(checklists, oldIndex, newIndex);
  
      setChecklists(newOrder);
      const updates = newOrder.map((cl, index) => ({ id: cl.id, order_index: index }));
      await supabase.from('checklist').upsert(updates, { onConflict: ['id'] });
      return;
    }
  
    // ✅ Move task to another checklist
    // Move task to a different checklist based on the task it was dropped over
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
// Move task to an empty checklist (or dropped directly on checklist)
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

  
    // ✅ Reorder tasks within the same checklist
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
        <Typography sx={{ pb: 3 }} variant="h5" gutterBottom>
          {(config?.singularLabel || config?.label || 'Untitled') + ' Checklists'}
        </Typography>

        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter} // 👈 smoother target recognition
            onDragEnd={handleDragEnd}
            onDragStart={({ active }) => setActiveTask(active)}
            onDragCancel={() => setActiveTask(null)}
          >
          <SortableContext items={groupedTasks.map(cl => cl.id)}
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
                }}
                >
                  Moving task...
                </Box>
              ) : typeof activeTask?.id === 'number' ? (
                // Render the actual ChecklistCard
                <ChecklistCard
                  checklist={checklists.find(c => c.id === activeTask.id)}
                  config={config}
                  onChangeTitle={() => {}}
                  onDelete={() => {}}
                  onToggleComplete={() => {}}
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
      </Box>

      {showModal && (
        <CollectionModal
          open
          config={config}
          onClose={() => window.history.back()}
          onRefresh={fetchData}
        />
      )}
    </>
  );
}
