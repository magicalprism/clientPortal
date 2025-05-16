'use client';

import { useEffect, useState } from 'react';
import {
  Box, Typography, CircularProgress, Divider, Stack, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { createClient } from '@/lib/supabase/browser';
import GenerateDatesButton from '@/components/views/timeline/GenerateDatesButton';
import { CaretDown } from '@phosphor-icons/react';
import DownloadPdfButton from '@/components/pdfs/timeline/DownloadPdfButton';


function formatDate(dateString) {
  if (!dateString) return 'TBD';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatusPill({ status }) {
  const labelMap = {
    todo: 'To Do',
    in_progress: 'In Progress',
    complete: 'Complete'
  };

  const colorMap = {
    todo: { bg: '#635bff', color: 'white' },           // Primary
    in_progress: { bg: '#fb9c0c', color: 'white' },     // Yellow/Orange
    complete: { bg: '#13a38e', color: 'white' }         // Green
  };

  const normalized = (status || '').toLowerCase();
  const colors = colorMap[normalized] || { bg: '#eee', color: '#555' };
  const label = labelMap[normalized] || status;

  return (
    <Box
      sx={{
        backgroundColor: colors.bg,
        color: colors.color,
        px: 1.5,
        py: 0.5,
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: '1em',
        display: 'inline-block',
        textTransform: 'capitalize'
      }}
    >
      {label}
    </Box>
  );
}


export default function TimelineView({ projectId, config }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

   const fetchMilestones = async () => {
    const { data, error } = await supabase
      .from('milestone_project')
      .select('milestone(*)')
      .eq('project_id', projectId);

    if (error) {
      console.error('Failed to fetch milestones:', error);
      setLoading(false);
      return;
    }

    const milestones = (data || [])
      .map((row) => row.milestone)
      .filter(Boolean)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    // Fetch all tasks tied to milestones in this project
    const milestoneIds = milestones.map(m => m.id);
    const { data: tasks, error: taskError } = await supabase
      .from('task')
      .select('*, contact:assigned_id(title), company:assigned_company_id(title)')
      .in('milestone_id', milestoneIds)
      .eq('project_id', projectId);

    if (taskError) {
      console.error('Failed to fetch tasks:', taskError);
      setLoading(false);
      return;
    }

    // Attach tasks to milestones
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

    setMilestones(enriched);
    setLoading(false);
  };

useEffect(() => {
  if (projectId) fetchMilestones();
}, [projectId]);



  if (loading) return <CircularProgress />;

return (
  <Box mt={4} p={3}>
    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px' }}>
      <Typography variant="h5" gutterBottom>
        Project Timeline
      </Typography>
      <Box spacing={4} sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', alignContent: 'center', gap: 2}}>
          <DownloadPdfButton projectId={projectId} />
          <GenerateDatesButton
  projectId={projectId}
  onComplete={fetchMilestones}
/>
      </Box>

    </Box>


 <Stack spacing={4} sx={{ position: 'relative', pl: 3, pt: 0, borderLeft: `2px solid #635bff2b` }}>
      {milestones.map((milestone) => {
        const sortedTasks = [...(milestone.tasks || [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
        const topLevelTasks = sortedTasks.filter(task => !task.parent_id);
        const childTasks = sortedTasks.filter(task => task.parent_id);

        return (
          <Accordion key={milestone.id} disableGutters square sx={{ 
            background: 'transparent', 
            boxShadow: 'none', 
            borderBottom: 'none', 
            boxShadow: 'none',
            borderBottom: 'none',
           '&::before': {
            display: 'none'
  }
 }}>
            <AccordionSummary
              expandIcon={<CaretDown size={16} />}
              sx={{
                background: 'transparent',
                boxShadow: 'none',
                borderBottom: 'none',
                '&::before': {
                  display: 'none'
                }
              }}
            >
              <Box sx={{ position: 'relative', pl: 2, pt: 2, }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 18,
                    left: -47,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    '&::before': {
                    display: 'none'
                  }
                  }}
                />
                <Typography variant="subtitle2" color="text.secondary">
                  {formatDate(milestone.start_date)} – {formatDate(milestone.end_date)}
                </Typography>
                <Typography variant="h6">{milestone.title}</Typography>
                {milestone.description && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {milestone.description}
                  </Typography>
                )}
              </Box>
            </AccordionSummary >
            <AccordionDetails sx={{ borderBottom: 'none' }}>
              {topLevelTasks?.length > 0 && (
                <Stack spacing={0}  >
                  {topLevelTasks.map((task) => {
                    const children = childTasks.filter(t => t.parent_id === task.id);
                    const hasChildren = children.length > 0;

                    return (
                     <Accordion
                          key={task.id}
                          disableGutters
                          square
                          expanded={hasChildren ? undefined : false}
                          sx={{
                            backgroundColor: 'white',
                            boxShadow: 'none',
                            '&::before': { display: 'none' }
                          }}
                        >
                          <AccordionSummary
                            {...(hasChildren ? { expandIcon: <CaretDown size={16} /> } : {})}
                            sx={{
                              background: 'transparent',
                              boxShadow: 'none',
                              borderBottom: 'none',
                              '&::before': { display: 'none' },
                              px: 2,
                              cursor: hasChildren ? 'pointer' : 'default'
                            }}
                          >
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold" display="inline">
                                {task.title}
                              </Typography>
                              {(task.contact?.title || task.company?.title) && (
                                <Typography variant="caption" color="text.secondary" display="inline" ml={1}>
                                  {[task.contact?.title, task.company?.title && `(${task.company.title})`].filter(Boolean).join(' ')}
                                </Typography>
                              )}
                              <Box display="flex" alignItems="center" flexWrap="wrap" gap={1} pt={1}>
                                <StatusPill status={task.status} />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(task.start_date)} – {formatDate(task.due_date)}
                                </Typography>
                              </Box>
                            </Box>
                          </AccordionSummary>

                          {hasChildren && (
                            <AccordionDetails>
                              <Stack spacing={1} mt={1}>
                                {children.map((child) => (
                                  <Box
                                    key={child.id}
                                    sx={{
                                      borderRadius: 2,
                                      px: 2,
                                      py: 1,
                                      bgcolor: 'primary.50',
                                      border: '1px solid',
                                      borderColor: 'primary.300'
                                    }}
                                  >
                                    <Typography variant="subtitle2" fontWeight="bold" display="inline">
                                      {child.title}
                                    </Typography>
                                    {(child.contact?.title || child.company?.title) && (
                                      <Typography variant="caption" color="primary.main" display="inline" ml={1}>
                                        {[child.contact?.title, child.company?.title && `(${child.company.title})`].filter(Boolean).join(' ')}
                                      </Typography>
                                    )}
                                    <Box display="flex" alignItems="center" flexWrap="wrap" gap={1} mt={0.5}>
                                      <StatusPill status={task.status} />
                                      <Typography variant="caption" color="text.secondary">
                                        {formatDate(child.start_date)} – {formatDate(child.due_date)}
                                      </Typography>
                                    </Box>
                                  </Box>
                                ))}
                              </Stack>
                            </AccordionDetails>
                          )}
                        </Accordion>

                    );
                  })}
                </Stack>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
      
     
    </Stack>
  </Box>
);
}
