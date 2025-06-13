import {
    Box,
    Stack,
    TextField,
    IconButton,
    FormControlLabel,
    Checkbox,
    Typography,
    Button
  } from '@mui/material';
  import { useState } from 'react';
  import { Trash, Plus } from '@phosphor-icons/react';
  import { DotsSixVertical } from '@phosphor-icons/react';
  import { ViewButtons } from '@/components/buttons/ViewButtons';
  import { useModal } from '@/components/modals/ModalContext';
  import * as collections from '@/collections';
  import SortableTask from './components/SortableTask';
  import InlineTask from './components/InlineTask'; // New component for inline editing
  import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
  import { createClient } from '@/lib/supabase/browser';
  import { getCurrentContactId } from '@/lib/utils/getCurrentContactId';


  export default function ChecklistCard({
    checklist,
    config,
    onChangeTitle,
    onDelete,
    onToggleComplete,
    onTaskDelete,
    onOpenModal,
    onTaskAdd, // New prop for adding tasks
    listeners,
    field,
    record,
    dragging = false,
    isGenerated = false,
    enableTaskDrag = true
  }) {
    const { openModal } = useModal();
    const [editingTitle, setEditingTitle] = useState(false);
    const [localTitle, setLocalTitle] = useState(checklist.title);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false); // ✅ Add saving state to prevent double submission
    const supabase = createClient();
    
    // Handle adding a new task inline
    const handleAddTask = async () => {
      if (!newTaskTitle.trim() || isSaving) {
        if (!isSaving) {
          setIsAddingTask(false);
          setNewTaskTitle('');
        }
        return;
      }

      setIsSaving(true); // ✅ Prevent double submission

      try {
        const authorId = await getCurrentContactId();
        
        const newTask = {
          title: newTaskTitle.trim(),
          status: 'todo',
          checklist_id: checklist.id,
          author_id: authorId,
          assigned_id: authorId, // ✅ Auto-assign to current user
          order_index: (checklist.tasks?.length || 0),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('[ChecklistCard] Creating task:', newTask);

        const { data, error } = await supabase
          .from('task')
          .insert([newTask])
          .select()
          .single();

        if (error) {
          console.error('Error creating task:', error);
          return;
        }

        console.log('[ChecklistCard] Task created successfully:', data);

        // Call parent function to update state
        if (onTaskAdd) {
          onTaskAdd(data);
        }

        // Reset form
        setNewTaskTitle('');
        setIsAddingTask(false);
      } catch (err) {
        console.error('Unexpected error creating task:', err);
      } finally {
        setIsSaving(false); // ✅ Reset saving state
      }
    };

    const handleCancelAdd = () => {
      setIsAddingTask(false);
      setNewTaskTitle('');
    };

    const handleStartAdd = () => {
      setIsAddingTask(true);
      setNewTaskTitle('');
    };
  
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          opacity: dragging ? 0.7 : 1,
          pointerEvents: dragging ? 'none' : 'auto',
          p: 3,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          boxShadow: dragging ? 3 : 1,
          '&:hover': {
            boxShadow: dragging ? 3 : 2
          }
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          {editingTitle && !isGenerated ? (
            <TextField
              variant="standard"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={() => {
                setEditingTitle(true);
                if (localTitle !== checklist.title) {
                  onChangeTitle(checklist.id, localTitle);
                }
              }}
              onDoubleClick={() => onOpenModal && onOpenModal()}
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
            onClick={() => !isGenerated && onOpenModal && onOpenModal()}
            sx={{ 
              cursor: isGenerated ? 'default' : 'pointer', 
              flexGrow: 1,
              fontWeight: 600,
              color: isGenerated ? 'primary.main' : 'text.primary'
            }}
          >
            {checklist.title}
          </Typography>
            </Box>
          )}
  
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {!isGenerated && (
              <>
                <IconButton 
                  onClick={() => onDelete(checklist.id)} 
                  color="error"
                  size="small"
                  sx={{
                    '&:hover': {
                      backgroundColor: 'error.50'
                    }
                  }}
                >
                  <Trash size={16} />
                </IconButton>
                <IconButton 
                  {...listeners}
                  size="small"
                  sx={{
                    cursor: 'grab',
                    '&:active': {
                      cursor: 'grabbing'
                    },
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <DotsSixVertical size={16} />
                </IconButton>
              </>
            )}
          </Box>
        </Stack>
  
        {/* Tasks */}
        <Box sx={{ flexGrow: 1 }}>
          {enableTaskDrag ? (
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
                  onTaskDelete={onTaskDelete}
                />
              ))}
            </SortableContext>
          ) : (
            // For generated checklists without drag and drop
            <Box>
              {(checklist.tasks || []).map((task) => (
                <Box 
                  key={task.id}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    py: 1,
                    px: 2,
                    mb: 1,
                    borderRadius: 1,
                    backgroundColor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'grey.200',
                    '&:hover': {
                      backgroundColor: 'grey.100'
                    }
                  }}
                >
                  <Checkbox
                    checked={task.status === 'complete'}
                    onChange={() => onToggleComplete(task.id)}
                    size="small"
                    sx={{ mr: 2 }}
                  />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      flexGrow: 1,
                      textDecoration: task.status === 'complete' ? 'line-through' : 'none',
                      color: task.status === 'complete' ? 'text.secondary' : 'text.primary'
                    }}
                  >
                    {task.title}
                  </Typography>
                  <IconButton
                    onClick={() => onTaskDelete(task.id)}
                    size="small"
                    sx={{ 
                      color: 'error.main',
                      opacity: 0.7,
                      '&:hover': {
                        opacity: 1,
                        backgroundColor: 'error.50'
                      }
                    }}
                  >
                    <Trash size={14} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          {/* Show message when no tasks in generated checklists */}
          {isGenerated && (!checklist.tasks || checklist.tasks.length === 0) && (
            <Box 
              sx={{ 
                py: 3,
                textAlign: 'center',
                color: 'text.secondary',
                backgroundColor: 'grey.50',
                borderRadius: 1,
                border: '1px dashed',
                borderColor: 'grey.300'
              }}
            >
              <Typography variant="body2">
                No tasks {checklist.id === 'due-today' ? 'due today' : 'due this week'}
              </Typography>
            </Box>
          )}

          {/* Inline task creation - Don't show for generated checklists */}
          {!isGenerated && (
            <>
              {isAddingTask ? (
                <InlineTask
                  value={newTaskTitle}
                  onChange={setNewTaskTitle}
                  onSave={handleAddTask}
                  onCancel={handleCancelAdd}
                  placeholder="Enter task title..."
                />
              ) : (
                <Box sx={{ mt: 2, textAlign: 'left' }}>
                  <Button
                    startIcon={<Plus size={16} />}
                    onClick={handleStartAdd}
                    variant="text"
                    size="small"
                    sx={{ 
                      color: 'text.secondary',
                      textTransform: 'none',
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        color: 'primary.main'
                      }
                    }}
                  >
                    Add task
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    );
  }