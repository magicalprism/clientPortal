'use client';

import { useEffect, useState } from 'react';
import {
  Box, Typography, Stack, Button, Avatar, CircularProgress, Link
} from '@mui/material';
import { useComments } from '@/components/fields/custom/comments/useComments';
import { useCurrentContact } from '@/hooks/useCurrentContact';
import RichTextFieldRenderer from '@/components/fields/text/richText/RichTextFieldRenderer';
import NextLink from 'next/link';

export const CommentThread = ({ entity, entityId }) => {
  const [input, setInput] = useState('');
  const { contact, loading: contactLoading } = useCurrentContact();
  const { comments, addComment, loading: commentsLoading } = useComments({ entity, entityId });

  const handleSubmit = async () => {
    if (!input.trim()) return;
    if (!contact?.id) return;

    await addComment(input.trim());
    setInput('');
  };

  const handleInputChange = (value) => {
    setInput(value);
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
            borderColor: '#e5e5e5'
          }}>
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
            value={input}
            editable={true}
            mode="create"
            onChange={handleInputChange}
            field={{ name: 'comment_input' }}
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
    </Box>
  );
};