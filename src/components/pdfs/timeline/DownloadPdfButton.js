'use client';

import { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import TimelinePdfView from '@/components/pdfs/timeline/TimelinePdfView';
import { Button, CircularProgress } from '@mui/material';
import { createClient } from '@/lib/supabase/browser';

export default function DownloadPdfButton({ projectId }) {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    const supabase = createClient();

    const { data: projectData } = await supabase
      .from('project')
      .select('*, company_id(title, thumbnail_id(url))')
      .eq('id', projectId)
      .single();

    const { data: milestoneData } = await supabase
      .from('milestone_project')
      .select('milestone(*)')
      .eq('project_id', projectId);

    const milestones = milestoneData
      .map(r => r.milestone)
      .filter(Boolean)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

    const milestoneIds = milestones.map(m => m.id);

    const { data: tasks } = await supabase
      .from('task')
      .select('*, contact:assigned_id(title), company:assigned_company_id(title)')
      .in('milestone_id', milestoneIds)
      .eq('project_id', projectId);

    const tasksByMilestone = {};
    for (const task of tasks) {
      const key = task.milestone_id;
      if (!tasksByMilestone[key]) tasksByMilestone[key] = [];
      tasksByMilestone[key].push(task);
    }

    const enriched = milestones.map(m => ({
      ...m,
      tasks: tasksByMilestone[m.id] || []
    }));

    setData({ project: projectData, milestones: enriched });
  };

  return data ? (
    <PDFDownloadLink
      document={<TimelinePdfView {...data} />}
      fileName="project-timeline.pdf"
      style={{ textDecoration: 'none' }}
    >
      {({ loading }) =>
        loading ? <CircularProgress size={20} /> : <Button variant="outlined">Download PDF</Button>
      }
    </PDFDownloadLink>
  ) : (
    <Button variant="outlined" onClick={fetchData}>
      Prepare PDF
    </Button>
  );
}
