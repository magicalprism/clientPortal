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
  
  export default function ChecklistCard({
    checklist,
    config,
    onChangeTitle,
    onDelete,
    onToggleComplete,
    listeners,
    field,
    record,
  }) {
    const [editingTitle, setEditingTitle] = useState(false);
    const [localTitle, setLocalTitle] = useState(checklist.title);
  
    return (
      <>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
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
              type="checklist"
              fields={{ title: 'New Checklist' }}
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
          {checklist.tasks.map((task) => (
            <Box
              key={task.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1,
                pl: 2,
                borderTop: '1px solid #eee',
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={task.status === 'complete'}
                    onChange={() => onToggleComplete(task.id)}
                  />
                }
                label={task.title}
                sx={{ flexGrow: 1 }}
              />
              <ViewButtons config={config} id={task.id} />
            </Box>
          ))}
  
          <Box sx={{ mt: 2, textAlign: 'left' }}>
            <AddRecordButton
              type="task"
            refField="checklist_id"
              id={checklist.id}
              label={`Add ${(config?.singularLabel || config?.label || 'Item')}`}
              variant="button"
              fields={{ title: 'New Task', status: 'in_progress' }}
            />
          </Box>
        </Box>
      </>
    );
  }
  