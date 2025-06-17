// lib/supabase/queries/pivot/comment_project.js

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get all comments for a project
 */
export const fetchCommentsForProject = async (projectId) => {
  const { data, error } = await supabase
    .from('comment_project')
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
    .eq('project_id', projectId)
    .order('created_at', { foreignTable: 'comment', ascending: false });

  if (error) {
    console.error('Error fetching comments for project:', error);
    return [];
  }

  // Extract the comment objects from the result
  return data?.map(item => item.comment) || [];
};

/**
 * Link a comment to a project
 */
export const linkCommentToProject = async (commentId, projectId) => {
  try {
    // First check if the link already exists
    const { data: existingLinks, error: checkError } = await supabase
      .from('comment_project')
      .select('*')
      .eq('comment_id', commentId)
      .eq('project_id', projectId);

    // Handle check error
    if (checkError) {
      console.error('Error checking existing comment_project link:', checkError);
      return { success: false, error: checkError };
    }

    // If the link already exists, return success
    if (existingLinks && existingLinks.length > 0) {
      return { success: true, data: existingLinks[0] };
    }
  } catch (err) {
    console.error('Error in linkCommentToProject check:', err);
    return { success: false, error: err };
  }

  // Otherwise, create the link
  const { data, error } = await supabase
    .from('comment_project')
    .insert([{
      comment_id: commentId,
      project_id: projectId,
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
 * Unlink a comment from a project
 */
export const unlinkCommentFromProject = async (commentId, projectId) => {
  try {
    // Delete the link
    const { error } = await supabase
      .from('comment_project')
      .delete()
      .eq('comment_id', commentId)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error unlinking comment from project:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error('Error in unlinkCommentFromProject:', err);
    return { success: false, error: err };
  }
};

/**
 * Get comment count for a project
 */
export const getCommentCountForProject = async (projectId) => {
  try {
    const { count, error } = await supabase
      .from('comment_project')
      .select('*', { count: 'exact' })
      .eq('project_id', projectId);

    if (error) {
      console.error('Error getting comment count:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error in getCommentCountForProject:', err);
    return 0;
  }
};