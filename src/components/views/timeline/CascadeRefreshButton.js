'use client';

import { useState } from 'react';
import { Button, Tooltip, CircularProgress } from '@mui/material';
import { ArrowClockwise } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';

export default function CascadeRefreshButton({ taskId, milestoneId, projectId, disabled = false }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleCascade = async () => {
    setLoading(true);

    // 1. Get project
    const { data: project, error: projectError } = await supabase
      .from('project')
      .select('start_date, status')
      .eq('id', projectId)
      .single();

    if (projectError || !project?.start_date || project.status !== 'in_progress') {
      console.warn('Cascade aborted: project not valid or not in_progress.');
      setLoading(false);
      return;
    }

    // 2. Get milestones
    const { data: milestones } = await supabase
      .from('milestone_project')
      .select('milestone(id, start_date, end_date)')
      .eq('project_id', projectId);

    const milestoneList = (milestones || [])
      .map(m => m.milestone)
      .filter(Boolean)
      .sort((a, b) => new Date(a.start_date || 0) - new Date(b.start_date || 0));

    // 3. Get the starting task
    const { data: currentTask, error: taskError } = await supabase
      .from('task')
      .select('due_date, order_index')
      .eq('id', taskId)
      .single();

    if (taskError || !currentTask?.due_date) {
      console.warn('Cascade aborted: no starting task due_date.');
      setLoading(false);
      return;
    }

    let cursor = new Date(currentTask.due_date);
    const updatedChildIds = [];

    // 4. Cascade through tasks
    for (const milestone of milestoneList) {
      const { data: tasks } = await supabase
        .from('task')
        .select('id, estimated_duration, order_index')
        .eq('milestone_id', milestone.id)
        .eq('project_id', projectId)
        .order('order_index');

      let milestoneStart = new Date(cursor);
      let milestoneEnd = new Date(milestoneStart);

      for (const task of tasks) {
        if (task.id === taskId || task.order_index <= currentTask.order_index) {
          continue;
        }

        const est = Number(task.estimated_duration) || 1;
        const taskStart = new Date(cursor);
        const taskEnd = new Date(taskStart);
        taskEnd.setDate(taskEnd.getDate() + est);

        await supabase
          .from('task')
          .update({
            start_date: taskStart.toISOString(),
            due_date: taskEnd.toISOString()
          })
          .eq('id', task.id);

        updatedChildIds.push(task.id);
        cursor = new Date(taskEnd);
        milestoneEnd = new Date(taskEnd);
      }

      await supabase
        .from('milestone')
        .update({
          start_date: milestoneStart.toISOString(),
          end_date: milestoneEnd.toISOString()
        })
        .eq('id', milestone.id);
    }

    // 5. Get parent of the initial task being cascaded from
    const { data: directParent } = await supabase
      .from('task')
      .select('parent_id')
      .eq('id', taskId)
      .single();

    if (directParent?.parent_id) {
      updatedChildIds.push(directParent.parent_id);
    }

    // 6. Recursively update all parent tasks affected
    const updateParentsFromChildren = async (taskIds) => {
      const visited = new Set();
      const queue = [...new Set(taskIds)];

      while (queue.length > 0) {
        const currentId = queue.shift();
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const { data: children } = await supabase
          .from('task')
          .select('start_date, due_date')
          .eq('parent_id', currentId);

        if (!children || children.length === 0) continue;

        const validStarts = children
          .map(t => new Date(t.start_date))
          .filter(d => !isNaN(d.getTime()));
        const validEnds = children
          .map(t => new Date(t.due_date))
          .filter(d => !isNaN(d.getTime()));

        if (validStarts.length && validEnds.length) {
          const minStart = new Date(Math.min(...validStarts.map(d => d.getTime())));
          const maxDue = new Date(Math.max(...validEnds.map(d => d.getTime())));

          await supabase
            .from('task')
            .update({
              start_date: minStart.toISOString(),
              due_date: maxDue.toISOString()
            })
            .eq('id', currentId);
        }

        const { data: parent } = await supabase
          .from('task')
          .select('parent_id')
          .eq('id', currentId)
          .single();

        if (parent?.parent_id) {
          queue.push(parent.parent_id);
        }
      }
    };

    await updateParentsFromChildren(updatedChildIds);

    setLoading(false);
    window.location.reload();
  };

  return (
    <Tooltip title="Cascade dates from here">
      <span style={{ display: 'inline-block' }}>
        <Button
          onClick={handleCascade}
          variant="outlined"
          size="small"
          disabled={loading || disabled || !milestoneId}
          startIcon={loading ? <CircularProgress size={14} /> : <ArrowClockwise size={16} />}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </span>
    </Tooltip>
  );
}
