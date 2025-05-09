'use client';

import { Box, IconButton, Typography, Checkbox } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVertical } from '@phosphor-icons/react';
import { ViewButtons } from '@/components/buttons/ViewButtons';
import { useModal } from '@/components/modals/ModalContext';


export default function SortableTask({ task, config, onToggleComplete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `task-${task.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { openModal } = useModal();

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1,
        pl: 2,
        borderTop: '1px solid #eee',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
        <Checkbox
          checked={task.status === 'complete'}
          onChange={() => onToggleComplete(task.id)}
          sx={{ mr: 1 }}
        />
        <Typography
          variant="body2"
          sx={{
            userSelect: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
          onClick={() =>
            openModal('edit', {
              config,
              defaultValues: task,
            })
          }
        >
          {task.title}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ViewButtons config={config} id={task.id} />
        <IconButton {...listeners} {...attributes} size="small">
          <DotsSixVertical size={16} />
        </IconButton>
      </Box>
    </Box>
  );
}
