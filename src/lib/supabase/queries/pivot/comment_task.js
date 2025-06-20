// lib/supabase/queries/pivot/comment_task.js

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get all comments for a task
 */
export const fetchCommentsForTask = async (taskId) => {
  const { data, error } = await supabase
    .from('comment_task')
    .select(`
      comment_id,
      comment:comment_id(
        id, 
        title, 
        content, 
        status, 
        created_at,
        author_id,
        author:author_id(id, title, email, thumbnail:thumbnail_id(url))
      )
    `)
    .eq('task_id', taskId)
    .order('created_at', { foreignTable: 'comment', ascending: false });

  if (error) {
    console.error('Error fetching comments for task:', error);
    return [];
  }

  // Extract the comment objects from the result
  return data?.map(item => item.comment) || [];
};

/**
 * Link a comment to a task
 */
export const linkCommentToTask = async (commentId, taskId) => {
  try {
    // First check if the link already exists
    const { data: existingLinks, error: checkError } = await supabase
      .from('comment_task')
      .select('*')
      .eq('comment_id', commentId)
      .eq('task_id', taskId);

    // Handle check error
    if (checkError) {
      console.error('Error checking existing comment_task link:', checkError);
      return { success: false, error: checkError };
    }

    // If the link already exists, return success
    if (existingLinks && existingLinks.length > 0) {
      return { success: true, data: existingLinks[0] };
    }
  } catch (err) {
    console.error('Error in linkCommentToTask check:', err);
    return { success: false, error: err };
  }

  // Otherwise, create the link
  const { data, error } = await supabase
    .from('comment_task')
    .insert([{
      comment_id: commentId,
      task_id: taskId,
      created_at: new Date().toISOString()
    }])
    .select();

  return {
    success: !error,
    data: data?.[0] || null,
    error
  };
};

/**
 * Unlink a comment from a task
 */
export const unlinkCommentFromTask = async (commentId, taskId) => {
  try {
    // Delete the link
    const { error } = await supabase
      .from('comment_task')
      .delete()
      .eq('comment_id', commentId)
      .eq('task_id', taskId);

    if (error) {
      console.error('Error unlinking comment from task:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error('Error in unlinkCommentFromTask:', err);
    return { success: false, error: err };
  }
};

/**
 * Get comment count for a task
 */
export const getCommentCountForTask = async (taskId) => {
  try {
    const { count, error } = await supabase
      .from('comment_task')
      .select('*', { count: 'exact' })
      .eq('task_id', taskId);

    if (error) {
      console.error('Error getting comment count:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error in getCommentCountForTask:', err);
    return 0;
  }
};