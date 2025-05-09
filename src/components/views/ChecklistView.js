// ChecklistView.js
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { createClient } from '@/lib/supabase/browser';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CollectionModal } from '@/components/modals/CollectionModal';
import { useSearchParams } from 'next/navigation';
import SortableChecklist from '@/components/views/checklists/components/SortableChecklist';
import ChecklistCard from '@/components/views/checklists/components/ChecklistCard';

export default function ChecklistView({ config }) {
  const supabase = createClient();
  const [checklists, setChecklists] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: checklistsData } = await supabase.from('checklist').select('*').order('order_index', { ascending: true });
    const { data: tasksData } = await supabase
      .from('task')
      .select('*')
      .in('status', ['in_progress', 'todo']);

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
      tasks: tasks.filter((t) => t.checklist_id === cl.id),
    }));
  }, [checklists, tasks]);
  

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = checklists.findIndex((c) => c.id === active.id);
    const newIndex = checklists.findIndex((c) => c.id === over.id);
    const newOrder = arrayMove(checklists, oldIndex, newIndex);

    setChecklists(newOrder);

    // Persist order to Supabase
    const updates = newOrder.map((cl, index) => ({ id: cl.id, order_index: index }));
    supabase.from('checklist').upsert(updates, { onConflict: ['id'] });
  };

  const sensors = useSensors(useSensor(PointerSensor));
  const searchParams = useSearchParams();
  const showModal = searchParams.get('modal') === 'create';

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Typography sx={{ pb: 3 }} variant="h5" gutterBottom>
          {(config?.singularLabel || config?.label || 'Untitled') + ' Checklists'}
        </Typography>
  
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={groupedTasks.map((cl) => cl.id)}
            strategy={verticalListSortingStrategy}
          >
            <Grid container spacing={3} alignItems="stretch">
              {groupedTasks.map((cl) => (
                <Grid item xs={12} md={6} key={cl.id}>
                  <SortableChecklist checklist={cl}>
                    <ChecklistCard
                        checklist={cl}
                        config={config}
                        field={{ name: 'checklist_id', label: 'Task' }}
                        record={{ id: cl.id }}
                        onChangeTitle={handleChecklistChange}
                        onDelete={handleChecklistDelete}
                        onToggleComplete={handleToggleComplete}
                    />
                    </SortableChecklist>

                </Grid>
              ))}
            </Grid>
          </SortableContext>
        </DndContext>
      </Box>
  
      {showModal && (
        <CollectionModal
        open
        config={config}
        onClose={() => window.history.back()}
        onRefresh={async (newItem) => {
          if (!newItem) return;
        
          await fetchData();
        }}
        
      />
      )}
    </>
  );
}