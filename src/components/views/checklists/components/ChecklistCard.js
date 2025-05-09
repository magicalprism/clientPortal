import {
    Box,
    Stack,
    TextField,
    IconButton,
    FormControlLabel,
    Checkbox,
    Typography
  } from '@mui/material';
  import { useState } from 'react';
  import { Trash } from '@phosphor-icons/react';
  import { DotsSixVertical } from '@phosphor-icons/react';
  import { ViewButtons } from '@/components/buttons/ViewButtons';
  import AddRecordButton from '@/components/buttons/AddRecordButton';
  import { useSearchParams } from 'next/navigation';
  import { useModal } from '@/components/modals/ModalContext';
  import * as collections from '@/collections';
  import SortableTask from './SortableTask';
  import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';


  export default function ChecklistCard({
    checklist,
    config,
    onChangeTitle,
    onDelete,
    onToggleComplete,
    listeners,
    field,
    record,
    dragging = false
  }) {
    const { openModal } = useModal();
    const [editingTitle, setEditingTitle] = useState(false);
    const [localTitle, setLocalTitle] = useState(checklist.title);
    const searchParams = useSearchParams();
    const view = searchParams.get('view');
    
  
    return (
      <>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
          sx={{
            opacity: dragging ? 0.7 : 1,
            pointerEvents: dragging ? 'none' : 'auto',
            backgroundColor: dragging ? 'background.paper' : 'white', // ✅ add this line
            boxShadow: dragging ? 3 : 0,
            borderRadius: 2,
                    }}
        >
          {editingTitle ? (
            <TextField
              variant="standard"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={() => {
                setEditingTitle(false);
                if (localTitle !== checklist.title) {
                  onChangeTitle(checklist.id, localTitle);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.target.blur();
              }}
              sx={{ flexGrow: 1 }}
              autoFocus
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1,  }}>
              <Typography
                variant="h6"
                onClick={() => setEditingTitle(true)}
                sx={{ cursor: 'pointer', flexGrow: 1 }}
              >
                {checklist.title}
              </Typography>
            </Box>
          )}
  
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AddRecordButton 
              config={collections.checklist} // 🔁 or however you're passing config
              defaultValues={{
                title: 'New Task', title: 'New Checklist'}}
              variant="icon"
              
        />
            
            <IconButton onClick={() => onDelete(checklist.id)} color="error">
              <Trash size={18} />
            </IconButton>
            <IconButton {...listeners}>
              <DotsSixVertical size={18} />
            </IconButton>
          </Box>
        </Stack>
  
        <Box sx={{ flexGrow: 1 }}>
        <SortableContext
            items={(checklist.tasks || []).map((t) => `task-${t.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {(checklist.tasks || []).map((task) => (
              <SortableTask
                key={task.id}
                task={task}
                config={config}
                onToggleComplete={onToggleComplete}
              />
            ))}
          </SortableContext>


          <Box sx={{ mt: 2, textAlign: 'left' }}>
            <AddRecordButton
              config={config}
              defaultValues={{
                title: 'New Task',
                status: 'todo',
                checklist_id: checklist.id
              }}
              variant="button"
            />
          </Box>
        </Box>
      </>
    );
  }
  