import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Box,
  Stack
} from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash, DotsSixVertical, CaretDown } from '@phosphor-icons/react';

export const ContractPartCard = ({ 
  part, 
  onRemove,
  showContent = false 
}) => {
  const [expanded, setExpanded] = useState(false);
  
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
    <Card
      ref={setNodeRef}
      style={style}
      elevation={isDragging ? 4 : 1}
      sx={{
        mb: 1,
        border: isDragging ? '2px dashed #1976d2' : '1px solid #e0e0e0',
        backgroundColor: isDragging ? '#f5f5f5' : 'white',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          {/* Drag Handle */}
          <IconButton 
            {...listeners} 
            {...attributes}
            sx={{ cursor: 'grab' }}
            size="small"
          >
            <DotsSixVertical size={16} />
          </IconButton>

          {/* Title and Badges */}
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body1" fontWeight="medium">
                {part.title}
              </Typography>
              {part.is_required && (
                <Chip label="Required" size="small" color="primary" variant="outlined" />
              )}
            </Stack>
          </Box>

          {/* Actions */}
          <Stack direction="row" spacing={1}>
            {showContent && (
              <IconButton
                onClick={() => setExpanded(!expanded)}
                size="small"
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              >
                <CaretDown size={16} />
              </IconButton>
            )}
            <IconButton 
              onClick={() => onRemove(part.id)}
              color="error"
              size="small"
            >
              <Trash size={16} />
            </IconButton>
          </Stack>
        </Stack>

        {/* Expandable Content */}
        {showContent && expanded && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="body2" color="text.secondary">
              Content Preview:
            </Typography>
            <Box
              sx={{
                mt: 1,
                p: 2,
                backgroundColor: '#f9f9f9',
                borderRadius: 1,
                maxHeight: 200,
                overflow: 'auto',
                fontSize: '0.875rem'
              }}
              dangerouslySetInnerHTML={{ __html: part.content }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};