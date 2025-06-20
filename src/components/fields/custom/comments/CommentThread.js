'use client';

import { useEffect, useState } from 'react';
import {
  Box, Typography, Stack, Button, Avatar, CircularProgress, Link,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Trash, X, MagnifyingGlass } from '@phosphor-icons/react';
import { useComments } from '@/components/fields/custom/comments/useComments';
import { useCurrentContact } from '@/hooks/useCurrentContact';
import RichTextFieldRenderer from '@/components/fields/text/richText/RichTextFieldRenderer';
import NextLink from 'next/link';

export const CommentThread = ({ entity, entityId, projectId, companyId }) => {
  console.log('[CommentThread] Rendering with entity:', entity, 'entityId:', entityId, 'projectId:', projectId, 'companyId:', companyId);
  
  const [input, setInput] = useState('');
  const [editorKey, setEditorKey] = useState(0); // Add a key to force re-render
  const [viewingComment, setViewingComment] = useState(null); // Track which comment is being viewed
  const { contact, loading: contactLoading } = useCurrentContact();
  const { comments, addComment, deleteComment, loading: commentsLoading } = useComments({ 
    entity, 
    entityId, 
    projectId, 
    companyId 
  });
  
  console.log('[CommentThread] Comments:', comments);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    if (!contact?.id) return;

    await addComment(input.trim());
    setInput(''); // Clear the input state
    setEditorKey(prev => prev + 1); // Increment key to force re-render
  };

  const handleInputChange = (value) => {
    setInput(value);
  };
  
  // Handle opening the comment view modal
  const handleOpenModal = (comment) => {
    setViewingComment(comment);
  };
  
  // Handle closing the comment view modal
  const handleCloseModal = () => {
    setViewingComment(null);
  };
  
  // Handle deleting a comment
  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await deleteComment(commentId);
    }
  };

  if (commentsLoading || contactLoading) return <CircularProgress size={24} />;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>Comments</Typography>
      
      <Stack spacing={3} mt={2}>
        {comments.map((comment) => (
          <Box key={comment.id} sx={{ 
            p: 3, 
            borderRadius: 2, 
            backgroundColor: 'primary.50',
            border: '1px solid',
            borderColor: '#e5e5e5',
            position: 'relative' // Add position relative for absolute positioning of buttons
          }}>
            {/* View and Delete buttons */}
            <Box sx={{ 
              position: 'absolute', 
              top: 12, 
              right: 12,
              display: 'flex',
              gap: 1
            }}>
              <IconButton
                size="small"
                onClick={() => handleOpenModal(comment)}
                sx={{ color: 'primary.main' }}
                title="View details"
              >
                <MagnifyingGlass size={16} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleDeleteComment(comment.id)}
                sx={{ color: 'error.main' }}
                title="Delete comment"
              >
                <Trash size={16} />
              </IconButton>
            </Box>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Box 
                component={NextLink} 
                href={`/dashboard/contact/${comment.author?.id}`}
                sx={{ textDecoration: 'none' }}
              >
                {comment.author?.thumbnail?.url ? (
                  <Avatar 
                    src={comment.author.thumbnail.url} 
                    sx={{ 
                      bgcolor: 'primary.main',
                      width: 65,
                      height: 65,
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8
                      }
                    }}
                  >
                    {comment.author?.title?.charAt(0) || 'U'}
                  </Avatar>
                ) : (
                  <Avatar sx={{ 
                    bgcolor: '#9333ea', 
                    color: 'white',
                    width: 65,
                    height: 65,
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8
                    }
                  }}>
                    {comment.author?.title?.charAt(0) || 'L'}
                  </Avatar>
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ mb: 1 }}>
                  <Typography 
                    component={NextLink} 
                    href={`/dashboard/contact/${comment.author?.id}`}
                    variant="body2" 
                    color="text.secondary" 
                    fontSize="0.75rem"
                    sx={{ 
                      textDecoration: 'none', 
                      cursor: 'pointer',
                      '&:hover': { 
                        textDecoration: 'underline' 
                      } 
                    }}
                  >
                    {comment.author?.title || 'Unknown User'} • {new Date(comment.created_at).toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  {comment.content ? (
                    <RichTextFieldRenderer
                      value={comment.content}
                      editable={false}
                      mode="view"
                      field={{ name: 'comment_content', lines: 5 }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      No content
                    </Typography>
                  )}
                </Box>
              </Box>
            </Stack>
          </Box>
        ))}

        {comments.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No comments yet. Be the first to add one!
          </Typography>
        )}
      </Stack>

      {contact && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Add a comment
          </Typography>
          <RichTextFieldRenderer
            key={editorKey} // Add key prop to force re-render
            value={input}
            editable={true}
            mode="create"
            onChange={handleInputChange}
            field={{ name: 'comment_input', lines: 5 }}
          />
          <Button 
            variant="contained" 
            sx={{ mt: 2 }} 
            onClick={handleSubmit}
            disabled={!input.trim()}
          >
            Post Comment
          </Button>
        </Box>
      )}

      {!contact && !contactLoading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
          Please log in to add comments.
        </Typography>
      )}
      
      {/* Comment View Modal */}
      <Dialog 
        open={!!viewingComment} 
        onClose={handleCloseModal} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Comment Details
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {viewingComment && (
            <Box sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 3 }}>
                {/* Avatar */}
                <Box>
                  {viewingComment.author?.thumbnail?.url ? (
                    <Avatar 
                      src={viewingComment.author.thumbnail.url} 
                      sx={{ width: 80, height: 80 }}
                    >
                      {viewingComment.author?.title?.charAt(0) || 'U'}
                    </Avatar>
                  ) : (
                    <Avatar sx={{ bgcolor: '#9333ea', color: 'white', width: 80, height: 80 }}>
                      {viewingComment.author?.title?.charAt(0) || 'U'}
                    </Avatar>
                  )}
                </Box>
                
                {/* Author and date */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">
                    {viewingComment.author?.title || 'Unknown User'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(viewingComment.created_at).toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
              
              {/* Comment content */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Comment:
                </Typography>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <RichTextFieldRenderer
                    value={viewingComment.content}
                    editable={false}
                    mode="view"
                    field={{ name: 'comment_content_modal', lines: 10 }}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};