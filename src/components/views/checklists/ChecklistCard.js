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
    onTaskAdd, // New prop for adding tasks
    listeners,
    field,
    record,
    dragging = false
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
      <>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
          sx={{
            opacity: dragging ? 0.7 : 1,
            pointerEvents: dragging ? 'none' : 'auto',
            backgroundColor: dragging ? 'background.paper' : 'white',
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
                onTaskDelete={onTaskDelete}
              />
            ))}
          </SortableContext>

          {/* Inline task creation */}
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
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                Add task
              </Button>
            </Box>
          )}
        </Box>
      </>
    );
  }