import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

export const fetchProjectsWithCompany = async () => {
  return await supabase
    .from('project')
    .select('*, company_project!inner(company_id)');
};

export const fetchMilestonesByProjectId = async (projectId) => {
  return await supabase
    .from('milestone_project')
    .select('milestone_id, milestone:milestone_id(title)')
    .eq('project_id', projectId);
};

export const fetchTasksByMilestoneId = async (milestoneId) => {
  return await supabase
    .from('milestone_task')
    .select('task_id, task:task_id(title, status)')
    .eq('milestone_id', milestoneId);
};

// More queries here as needed...
