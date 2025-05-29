import React from 'react';
import {
  Paper,
  TextField,
  IconButton,
  Box,
  Chip,
  Stack
} from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash, DotsSixVertical } from '@phosphor-icons/react';

export const SortableContractPart = ({ 
  part, 
  onContentChange, 
  onTitleChange, 
  onRemove, 
  isLocked = false 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `part-${part.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={isDragging ? 4 : 2}
      sx={{
        p: 3,
        mb: 2,
        border: isDragging ? '2px dashed #1976d2' : '1px solid #e0e0e0',
        backgroundColor: isDragging ? '#f5f5f5' : 'white'
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box sx={{ flex: 1, mr: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="medium"
            value={part.title}
            onChange={(e) => onTitleChange(part.id, e.target.value)}
            placeholder="Section Title"
            sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={1}>
            {part.is_required && (
              <Chip label="Required" size="small" color="primary" />
            )}
            {isLocked && (
              <Chip label="Locked" size="small" color="secondary" />
            )}
          </Stack>
        </Box>
        
        <Stack direction="row" spacing={1}>
          {!isLocked && (
            <IconButton 
              onClick={() => onRemove(part.id)}
              color="error"
              size="small"
            >
              <Trash size={18} />
            </IconButton>
          )}
          <IconButton 
            {...listeners} 
            {...attributes}
            sx={{ cursor: 'grab' }}
            size="small"
          >
            <DotsSixVertical size={18} />
          </IconButton>
        </Stack>
      </Stack>

      <TextField
        fullWidth
        multiline
        rows={6}
        variant="outlined"
        value={part.content}
        onChange={(e) => onContentChange(part.id, e.target.value)}
        placeholder="Enter section content..."
        sx={{
          '& .MuiOutlinedInput-root': {
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }
        }}
      />
    </Paper>
  );
};