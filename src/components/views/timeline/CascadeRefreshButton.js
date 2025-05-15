import { useState } from 'react';
import { Button, Tooltip, CircularProgress } from '@mui/material';
import { ArrowClockwise } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';

export default function CascadeRefreshButton({ taskId, milestoneId, projectId, disabled = false }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleCascade = async () => {
    setLoading(true);

    // Get project start_date and status
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

    // Get all milestones in order
    const { data: milestones } = await supabase
      .from('milestone_project')
      .select('milestone(id, start_date, end_date)')
      .eq('project_id', projectId);

    const milestoneList = (milestones || [])
      .map(m => m.milestone)
      .filter(Boolean)
      .sort((a, b) => new Date(a.start_date || 0) - new Date(b.start_date || 0));

    let cursor = new Date(project.start_date);

    for (const milestone of milestoneList) {
      const { data: tasks } = await supabase
        .from('task')
        .select('id, estimated_duration')
        .eq('milestone_id', milestone.id)
        .eq('project_id', projectId)
        .order('order_index');

      let milestoneStart = new Date(cursor);
      let milestoneEnd = new Date(milestoneStart);

      for (const task of tasks) {
        const est = Number(task.estimated_duration) || 1;
        const taskStart = new Date(cursor);
        const taskEnd = new Date(taskStart);
        taskEnd.setDate(taskEnd.getDate() + est);

        await supabase
          .from('task')
          .update({ start_date: taskStart.toISOString(), due_date: taskEnd.toISOString() })
          .eq('id', task.id);

        cursor = new Date(taskEnd);
        milestoneEnd = new Date(taskEnd);
      }

      await supabase
        .from('milestone')
        .update({ start_date: milestoneStart.toISOString(), end_date: milestoneEnd.toISOString() })
        .eq('id', milestone.id);
    }

    setLoading(false);
    window.location.reload();
  };

  return (
    <Tooltip title="Cascade dates from here">
      <span>
        <Button
          onClick={handleCascade}
          variant="outlined"
          size="small"
          disabled={loading || disabled || !milestoneId}
          startIcon={loading ? <CircularProgress size={14} /> : <ArrowClockwise size={16} />}
        >
          Refresh
        </Button>
      </span>
    </Tooltip>
  );
}
