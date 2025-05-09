import { Paper, Box, IconButton } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from '@phosphor-icons/react'; // Or any drag icon
import { DotsSixVertical } from '@phosphor-icons/react';
import React from 'react';

export default function SortableChecklist({ id, checklist, children, active, over }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id }); // ✅ plain ID

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined
  };
  const isOver = active?.id !== null && over?.id === id;

  return (
    <Paper
  ref={setNodeRef}
  style={style}
  elevation={3}
  sx={{
    p: 2,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    border: isOver ? '2px dashed #1976d2' : '1px solid transparent',
    backgroundColor: isOver ? '#ffffff' : 'background.paper',
    transition: 'all 0.2s ease'
  }}
>

      {React.cloneElement(children, { listeners, attributes })}
    </Paper>
  );
}
