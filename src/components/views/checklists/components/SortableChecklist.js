import { Paper, Box, IconButton } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from '@phosphor-icons/react'; // Or any drag icon
import { DotsSixVertical } from '@phosphor-icons/react';
import React from 'react';

export default function SortableChecklist({ checklist, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: checklist.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    height: '100%'
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={3}
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >

      {React.cloneElement(children, { listeners, attributes })}
    </Paper>
  );
}
