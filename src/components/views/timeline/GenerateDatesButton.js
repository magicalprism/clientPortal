'use client';

import { useState } from 'react';
import { Button } from '@mui/material';
import { createClient } from '@/lib/supabase/browser';
import { isWeekend, shiftDateToNextWeekday } from '@/lib/utils/dateUtils';

export default function GenerateDatesButton({ projectId, onComplete }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleGenerate = async () => {
    setLoading(true);

    // 1. Get project start date
    const { data: project, error: projectError } = await supabase
      .from('project')
      .select('start_date')
      .eq('id', projectId)
      .single();

    if (projectError || !project?.start_date) {
      console.error('Missing project start date:', projectError);
      setLoading(false);
      return;
    }

    let cursor = new Date(project.start_date);

    // 2. Get milestones
    const { data: milestones } = await supabase
      .from('milestone_project')
      .select('milestone(id, title)')
      .eq('project_id', projectId);

    for (const row of milestones) {
      const milestoneId = row.milestone?.id;
      if (!milestoneId) continue;

      const { data: tasks } = await supabase
        .from('task')
        .select('id, parent_id, estimated_duration, order_index' )
        .eq('milestone_id', milestoneId)
        .eq('project_id', projectId);

      const childTasks = tasks.filter(t => t.parent_id);
      const parentTasks = tasks
      .filter(t => !t.parent_id)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

      const childDateMap = {}; // { parent_id: { startDates: [], endDates: [] } }

      let milestoneStart = new Date(cursor);
      let milestoneEnd = new Date(cursor);

      // 🔁 FIRST PASS: Grouped child task generation
const groupedChildren = {};
for (const task of childTasks) {
  if (!groupedChildren[task.parent_id]) groupedChildren[task.parent_id] = [];
  groupedChildren[task.parent_id].push(task);
}

for (const parentId of Object.keys(groupedChildren)) {
  const children = groupedChildren[parentId].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  );
  let localCursor = new Date(cursor);
  let childStarts = [], childEnds = [];

  for (const task of children) {
    const est = Number(task.estimated_duration) || 1;
    const start = shiftDateToNextWeekday(new Date(localCursor));
    let end = new Date(start);
    let added = 0;
    while (added < est) {
      end.setDate(end.getDate() + 1);
      if (!isWeekend(end)) added++;
    }

    await supabase
      .from('task')
      .update({
        start_date: start.toISOString(),
        due_date: end.toISOString(),
      })
      .eq('id', task.id);

    childStarts.push(start);
    childEnds.push(end);
    localCursor = shiftDateToNextWeekday(new Date(end));
  }

  childDateMap[parentId] = {
    startDates: childStarts,
    endDates: childEnds,
  };

  cursor = new Date(localCursor);
  milestoneEnd = new Date(cursor);
}

      // 🔁 SECOND PASS: Handle parent tasks
      for (const task of parentTasks) {
        const children = childDateMap[task.id];

        if (children) {
          // Derive date range from children
          const minStart = new Date(Math.min(...children.startDates.map(d => d.getTime())));
          const maxEnd = new Date(Math.max(...children.endDates.map(d => d.getTime())));

          await supabase
            .from('task')
            .update({
              start_date: minStart.toISOString(),
              due_date: maxEnd.toISOString(),
            })
            .eq('id', task.id);

          milestoneEnd = new Date(Math.max(milestoneEnd.getTime(), maxEnd.getTime()));
        } else {
          // No children — treat as standalone
          const est = Number(task.estimated_duration) || 1;
            const start = shiftDateToNextWeekday(new Date(cursor));
            let end = new Date(start);
            let added = 0;
            while (added < est) {
              end.setDate(end.getDate() + 1);
              if (!isWeekend(end)) added++;
            }


          await supabase
            .from('task')
            .update({
              start_date: start.toISOString(),
              due_date: end.toISOString(),
            })
            .eq('id', task.id);

          cursor = shiftDateToNextWeekday(new Date(end));
          milestoneEnd = new Date(end);
        }
      }

      // 3. Update milestone with min/max range
      await supabase
        .from('milestone')
        .update({
          start_date: milestoneStart.toISOString(),
          end_date: milestoneEnd.toISOString(),
        })
        .eq('id', milestoneId);
    }

    setLoading(false);
    if (typeof onComplete === 'function') onComplete();
  };

  return (
    <Button onClick={handleGenerate} variant="outlined" disabled={loading} sx={{ mb: 0 }}>
      {loading ? 'Generating...' : 'Generate Timeline from Estimates'}
    </Button>
  );
}
