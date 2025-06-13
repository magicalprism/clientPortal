// lib/supabase/queries/table/comment.js

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get a single comment by ID with all related data
 */
export const fetchCommentById = async (id) => {
  const { data, error } = await supabase
    .from('comment')
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title, status),
      author:author_id(id, title, email),
      parent_comment:parent_id(id, title, content),
      replies:comment!parent_id(
        id,
        title,
        content,
        status,
        created_at,
        author:author_id(id, title, email)
      ),
      tags:category_comment(
        category:category_id(id, title)
      )
    `)
    .eq('id', id)
    .single();

  // Transform tags data
  if (data && data.tags) {
    data.tags = data.tags.map(t => t.category);
  }

  // Sort replies by creation date
  if (data && data.replies) {
    data.replies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  return { data, error };
};

/**
 * Get all comments with optional filters
 */
export const fetchAllComments = async (filters = {}) => {
  let query = supabase
    .from('comment')
    .select(`
      id,
      title,
      content,
      status,
      parent_id,
      created_at,
      updated_at,
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title),
      parent_comment:parent_id(id, title),
      reply_count:comment!parent_id(count)
    `);

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }
  
  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id);
  }
  
  if (filters.project_id) {
    query = query.eq('project_id', filters.project_id);
  }
  
  if (filters.author_id) {
    query = query.eq('author_id', filters.author_id);
  }
  
  if (filters.parent_id !== undefined) {
    if (filters.parent_id === null) {
      query = query.is('parent_id', null); // Top-level comments only
    } else {
      query = query.eq('parent_id', filters.parent_id);
    }
  }

  // Apply sorting
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  return { data, error };
};

/**
 * Create a new comment
 */
export const createComment = async (commentData) => {
  const { data, error } = await supabase
    .from('comment')
    .insert([{
      ...commentData,
      status: commentData.status || 'todo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title),
      parent_comment:parent_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Update a comment
 */
export const updateComment = async (id, updates) => {
  const { data, error } = await supabase
    .from('comment')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title),
      parent_comment:parent_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Delete a comment (soft delete)
 */
export const deleteComment = async (id, softDelete = true) => {
  if (softDelete) {
    const { error } = await supabase
      .from('comment')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    return { success: !error, error };
  } else {
    const { error } = await supabase
      .from('comment')
      .delete()
      .eq('id', id);
    return { success: !error, error };
  }
};

/**
 * Get comments by company
 */
export const fetchCommentsByCompany = async (companyId, includeReplies = true) => {
  let query = supabase
    .from('comment')
    .select(`
      id,
      title,
      content,
      status,
      parent_id,
      created_at,
      project:project_id(id, title),
      author:author_id(id, title),
      ${includeReplies ? 'reply_count:comment!parent_id(count)' : ''}
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false);

  if (!includeReplies) {
    query = query.is('parent_id', null); // Top-level comments only
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
};

/**
 * Get comments by project
 */
export const fetchCommentsByProject = async (projectId, includeReplies = true) => {
  let query = supabase
    .from('comment')
    .select(`
      id,
      title,
      content,
      status,
      parent_id,
      created_at,
      author:author_id(id, title, email),
      ${includeReplies ? 'reply_count:comment!parent_id(count)' : ''}
    `)
    .eq('project_id', projectId)
    .eq('is_deleted', false);

  if (!includeReplies) {
    query = query.is('parent_id', null); // Top-level comments only
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
};

/**
 * Get comment thread (comment with all nested replies)
 */
export const fetchCommentThread = async (commentId) => {
  const buildThread = async (parentId, level = 0) => {
    const { data: comments, error } = await supabase
      .from('comment')
      .select(`
        id,
        title,
        content,
        status,
        created_at,
        updated_at,
        author:author_id(id, title, email)
      `)
      .eq('parent_id', parentId)
      .eq('is_deleted', false)
      .order('created_at');

    if (error || !comments) return [];

    const thread = [];
    for (const comment of comments) {
      const replies = await buildThread(comment.id, level + 1);
      thread.push({
        ...comment,
        level,
        replies
      });
    }

    return thread;
  };

  // Get the root comment
  const { data: rootComment, error: rootError } = await fetchCommentById(commentId);
  
  if (rootError || !rootComment) {
    return { data: null, error: rootError };
  }

  // Build the full thread
  const replies = await buildThread(commentId);
  
  const thread = {
    ...rootComment,
    level: 0,
    replies
  };

  return { data: thread, error: null };
};

/**
 * Get replies to a comment
 */
export const fetchCommentReplies = async (parentId) => {
  const { data, error } = await supabase
    .from('comment')
    .select(`
      id,
      title,
      content,
      status,
      created_at,
      author:author_id(id, title, email),
      reply_count:comment!parent_id(count)
    `)
    .eq('parent_id', parentId)
    .eq('is_deleted', false)
    .order('created_at');

  return { data, error };
};

/**
 * Create a reply to a comment
 */
export const createCommentReply = async (parentId, replyData) => {
  // Get parent comment to inherit company and project
  const { data: parentComment, error: parentError } = await supabase
    .from('comment')
    .select('company_id, project_id')
    .eq('id', parentId)
    .single();

  if (parentError) {
    return { data: null, error: parentError };
  }

  const commentData = {
    ...replyData,
    parent_id: parentId,
    company_id: parentComment.company_id,
    project_id: parentComment.project_id
  };

  return await createComment(commentData);
};

/**
 * Link tags to comment
 */
export const linkTagsToComment = async (commentId, categoryIds) => {
  if (!Array.isArray(categoryIds)) {
    categoryIds = [categoryIds];
  }

  // Remove existing links first
  await supabase
    .from('category_comment')
    .delete()
    .eq('comment_id', commentId);

  // Add new links
  const insertData = categoryIds.map(categoryId => ({
    comment_id: commentId,
    category_id: categoryId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('category_comment')
    .insert(insertData)
    .select(`
      category:category_id(id, title)
    `);

  return { 
    data: data?.map(item => item.category) || [], 
    error 
  };
};

/**
 * Get comment tags
 */
export const fetchCommentTags = async (commentId) => {
  const { data, error } = await supabase
    .from('category_comment')
    .select(`
      category:category_id(id, title)
    `)
    .eq('comment_id', commentId);

  return { 
    data: data?.map(item => item.category) || [], 
    error 
  };
};

/**
 * Get comment statistics for a project
 */
export const getCommentStats = async (projectId) => {
  const { data, error } = await supabase
    .from('comment')
    .select('id, status, parent_id')
    .eq('project_id', projectId)
    .eq('is_deleted', false);

  if (error) {
    return { data: null, error };
  }

  const stats = {
    totalComments: data.length,
    topLevelComments: data.filter(c => !c.parent_id).length,
    replies: data.filter(c => c.parent_id).length,
    todoComments: data.filter(c => c.status === 'todo').length,
    inProgressComments: data.filter(c => c.status === 'in_progress').length,
    completeComments: data.filter(c => c.status === 'complete').length,
    archivedComments: data.filter(c => c.status === 'archived').length
  };

  return { data: stats, error: null };
};

/**
 * Search comments by content
 */
export const searchComments = async (searchTerm, filters = {}) => {
  let query = supabase
    .from('comment')
    .select(`
      id,
      title,
      content,
      status,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title)
    `)
    .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
    .eq('is_deleted', false);

  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id);
  }
  
  if (filters.project_id) {
    query = query.eq('project_id', filters.project_id);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(50);

  return { data, error };
};

/**
 * Get recent comments by author
 */
export const fetchRecentCommentsByAuthor = async (authorId, limit = 10) => {
  const { data, error } = await supabase
    .from('comment')
    .select(`
      id,
      title,
      content,
      status,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title),
      parent_comment:parent_id(id, title)
    `)
    .eq('author_id', authorId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data, error };
};

/**
 * Mark comment as read/unread (if you have a read tracking system)
 */
export const markCommentAsRead = async (commentId, userId) => {
  // This would require a comment_reads junction table
  const { data, error } = await supabase
    .from('comment_reads')
    .upsert({
      comment_id: commentId,
      user_id: userId,
      read_at: new Date().toISOString()
    }, {
      onConflict: 'comment_id,user_id'
    });

  return { success: !error, error };
};

/**
 * Get unread comments for a user
 */
export const fetchUnreadComments = async (userId, filters = {}) => {
  let query = supabase
    .from('comment')
    .select(`
      id,
      title,
      content,
      status,
      created_at,
      company:company_id(id, title),
      project:project_id(id, title),
      author:author_id(id, title)
    `)
    .eq('is_deleted', false);

  // Filter out comments that have been read
  query = query.not('id', 'in', `(
    SELECT comment_id FROM comment_reads WHERE user_id = ${userId}
  )`);

  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id);
  }
  
  if (filters.project_id) {
    query = query.eq('project_id', filters.project_id);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false });

  return { data, error };
};

/**
 * Archive old completed comments
 */
export const archiveOldComments = async (daysOld = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { data, error } = await supabase
    .from('comment')
    .update({ 
      status: 'archived',
      updated_at: new Date().toISOString()
    })
    .eq('status', 'complete')
    .lt('updated_at', cutoffDate.toISOString())
    .select('id');

  return { 
    success: !error, 
    archivedCount: data?.length || 0, 
    error 
  };
};