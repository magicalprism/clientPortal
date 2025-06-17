// src/components/fields/custom/comments/useComments.js
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { pivot } from '@/lib/supabase/queries';

export const useComments = ({ entity, entityId }) => {
  const supabase = createClient();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      console.log('[Comments] Entity:', entity);
      console.log('[Comments] Entity ID:', entityId);

      try {
        // Use the appropriate method based on entity type
        if (entity.toLowerCase() === 'project') {
          // Use the dedicated pivot module for project comments
          const projectComments = await pivot.comment_project.fetchCommentsForProject(entityId);
          console.log('[Comments] Project comments:', projectComments);
          
          // Sort by created_at
          projectComments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          
          setComments(projectComments || []);
        } else {
          // For other entities, use the dynamic approach
          const linkTable = `comment_${entity.toLowerCase()}`;
          const entityField = `${entity.toLowerCase()}_id`;
          
          console.log('[Comments] Query:', { linkTable, entityField, entityId });
          
          const { data, error } = await supabase
            .from(linkTable)
            .select(`
              comment(*, author:author_id(id, title, thumbnail:thumbnail_id(url))),
              id
            `)
            .eq(entityField, entityId);
          
          if (error) {
            console.error('[Comments] Error fetching:', error);
            setComments([]);
          } else {
            console.log('[Comments] Raw data:', data);
            const processedComments = data?.map(row => row.comment).filter(Boolean) || [];
            
            // Debug: Log the author data
            processedComments.forEach(comment => {
              console.log('[Comments] Comment author data:', comment.author);
            });
            
            // Sort by created_at after processing
            processedComments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            
            console.log('[Comments] Processed comments:', processedComments);
            setComments(processedComments);
          }
        }
      } catch (err) {
        console.error('[Comments] Fetch error:', err);
        setComments([]);
      }

      setLoading(false);
    };

    if (entityId) {
      fetchComments();
    }
  }, [entity, entityId]);

  const addComment = async (content) => {
    try {
      // Get current contact using your existing utility
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        console.error('Failed to get user:', userError);
        return;
      }

      // Get contact ID from user
      const { data: contact, error: contactError } = await supabase
        .from('contact')
        .select('id')
        .eq('email', userData.user.email)
        .single();

      if (contactError || !contact) {
        console.error('Failed to get contact:', contactError);
        return;
      }

      const contactId = contact.id;

      // Insert new comment - ONLY the fields that exist in your schema
      const { data: newComments, error: insertError } = await supabase
        .from('comment')
        .insert([{ 
          content: content,
          author_id: contactId
        }])
        .select('*, author:author_id(id, title, email, thumbnail:thumbnail_id(url))');

      if (insertError || !newComments || newComments.length === 0) {
        console.error('Error adding comment:', insertError);
        return;
      }

      const commentId = newComments[0].id;

      // Create link between comment and entity based on entity type
      if (entity.toLowerCase() === 'project') {
        // Use the dedicated pivot module for project comments
        const { success, error } = await pivot.comment_project.linkCommentToProject(commentId, entityId);
        
        if (!success) {
          console.error('Error linking comment to project:', error);
          return;
        }
      } else {
        // For other entities, use the dynamic approach
        const linkTable = `comment_${entity.toLowerCase()}`;
        const entityField = `${entity.toLowerCase()}_id`;
        
        const { error: linkError } = await supabase
          .from(linkTable)
          .insert([{ [entityField]: entityId, comment_id: commentId }]);

        if (linkError) {
          console.error('Error creating link:', linkError);
          return;
        }
      }

      // Update local state
      setComments(prev => [...prev, newComments[0]]);
    } catch (error) {
      console.error('Error in addComment:', error);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      if (entity.toLowerCase() === 'project') {
        // Use the dedicated pivot module for project comments
        const { success, error } = await pivot.comment_project.unlinkCommentFromProject(commentId, entityId);
        
        if (!success) {
          console.error('Error unlinking comment from project:', error);
          return;
        }
      } else {
        // For other entities, use the dynamic approach
        const linkTable = `comment_${entity.toLowerCase()}`;
        
        // Delete the link first
        const { error: linkError } = await supabase
          .from(linkTable)
          .delete()
          .eq('comment_id', commentId);

        if (linkError) {
          console.error('Error deleting comment link:', linkError);
          return;
        }
      }

      // Delete the comment
      const { error: commentError } = await supabase
        .from('comment')
        .delete()
        .eq('id', commentId);

      if (commentError) {
        console.error('Error deleting comment:', commentError);
        return;
      }

      // Update local state
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error in deleteComment:', error);
    }
  };

  return { comments, addComment, deleteComment, loading };
};