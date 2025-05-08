import {
    Box,
    Stack,
    TextField,
    IconButton,
    FormControlLabel,
    Checkbox
  } from '@mui/material';
  import { Trash } from '@phosphor-icons/react';
  import { ViewButtons } from '@/components/buttons/ViewButtons';
  
  export default function ChecklistCard({
    checklist,
    config,
    onChangeTitle,
    onDelete,
    onToggleComplete
  }) {
    return (
      <>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <TextField
            variant="standard"
            value={checklist.title}
            onChange={(e) => onChangeTitle(checklist.id, e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <IconButton onClick={() => onDelete(checklist.id)} color="error">
            <Trash size={18} />
          </IconButton>
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
        </Box>
      </>
    );
  }
  