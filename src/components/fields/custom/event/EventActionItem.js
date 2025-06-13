'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Stack,
  Avatar,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { Plus, CalendarBlank, User, Clock, CheckCircle, Trash } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';
import { getCurrentContactId } from '@/lib/utils/getCurrentContactId';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'high', label: 'High', color: 'error' }
];

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do', color: 'default' },
  { value: 'in_progress', label: 'In Progress', color: 'primary' },
  { value: 'complete', label: 'Complete', color: 'success' },
  { value: 'blocked', label: 'Blocked', color: 'error' }
];

export default function EventActionItems({ 
  record, 
  field, 
  editable = true, 
  onChange,
  view = 'detail' 
}) {
  const [tasks, setTasks] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    assigned_id: '',
    priority: 'medium',
    status: 'todo'
  });

  const supabase = createClient();

  // Get event participants (contacts attending)
  useEffect(() => {
    if (record?.id) {
      fetchParticipants();
      fetchTasks();
    }
  }, [record?.id]);

  const fetchParticipants = async () => {
    try {
      // Get contacts from the event
      const contactIds = record?.contacts || record?.contact_id || [];
      if (!contactIds.length) {
        setParticipants([]);
        return;
      }

      const { data, error } = await supabase
        .from('contact')
        .select('id, title, email, avatar_url')
        .in('id', contactIds);

      if (error) {
        console.error('Error fetching participants:', error);
        return;
      }

      setParticipants(data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Fetch tasks related to this event
      const { data, error } = await supabase
        .from('task')
        .select(`
          *,
          assigned:assigned_id(id, title, email, avatar_url),
          author:author_id(id, title)
        `)
        .eq('event_id', record.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const currentUserId = await getCurrentContactId();
      
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        due_date: newTask.due_date || null,
        assigned_id: newTask.assigned_id || currentUserId,
        author_id: currentUserId,
        event_id: record.id,
        priority: newTask.priority,
        status: newTask.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('task')
        .insert([taskData])
        .select(`
          *,
          assigned:assigned_id(id, title, email, avatar_url),
          author:author_id(id, title)
        `)
        .single();

      if (error) {
        console.error('Error creating task:', error);
        return;
      }

      // Add to local state
      setTasks(prev => [data, ...prev]);
      
      // Reset form
      setNewTask({
        title: '',
        description: '',
        due_date: '',
        assigned_id: '',
        priority: 'medium',
        status: 'todo'
      });
      setShowCreateDialog(false);
      
      // Notify parent if needed
      if (onChange) {
        onChange([data, ...tasks]);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const { data, error } = await supabase
        .from('task')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select(`
          *,
          assigned:assigned_id(id, title, email, avatar_url),
          author:author_id(id, title)
        `)
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return;
      }

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? data : task
      ));

      if (onChange) {
        onChange(tasks.map(task => task.id === taskId ? data : task));
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('task')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        return;
      }

      // Remove from local state
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      if (onChange) {
        onChange(tasks.filter(task => task.id !== taskId));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getStatusColor = (status) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.color || 'default';
  };

  const getPriorityColor = (priority) => {
    const option = PRIORITY_OPTIONS.find(opt => opt.value === priority);
    return option?.color || 'default';
  };

  const formatDueDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString();
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading action items...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 
      }}>
        <Typography variant="h6" component="h2">
          Action Items ({tasks.length})
        </Typography>
        
        {editable && (
          <Button
            startIcon={<Plus size={16} />}
            variant="contained"
            size="small"
            onClick={() => setShowCreateDialog(true)}
            disabled={!participants.length && !record?.contacts?.length}
          >
            Add Action Item
          </Button>
        )}
      </Box>

      {/* No participants message */}
      {!participants.length && !record?.contacts?.length && (
        <Card sx={{ mb: 2, backgroundColor: 'info.50' }}>
          <CardContent>
            <Typography variant="body2" color="info.main">
              Add participants to this event to create action items
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Card sx={{ backgroundColor: 'grey.50' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No action items yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create action items to track tasks and responsibilities for this event
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {tasks.map((task) => (
            <Grid item xs={12} key={task.id}>
              <Card 
                sx={{ 
                  borderLeft: `4px solid`,
                  borderLeftColor: task.status === 'complete' 
                    ? 'success.main' 
                    : isOverdue(task.due_date) 
                      ? 'error.main' 
                      : 'primary.main',
                  opacity: task.status === 'complete' ? 0.7 : 1
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    {/* Completion Checkbox */}
                    <Checkbox
                      checked={task.status === 'complete'}
                      onChange={(e) => handleUpdateTask(task.id, {
                        status: e.target.checked ? 'complete' : 'todo'
                      })}
                      disabled={!editable}
                      sx={{ mt: -0.5 }}
                    />

                    {/* Task Content */}
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography 
                          variant="h6" 
                          component="h3"
                          sx={{ 
                            textDecoration: task.status === 'complete' ? 'line-through' : 'none',
                            color: task.status === 'complete' ? 'text.secondary' : 'text.primary'
                          }}
                        >
                          {task.title}
                        </Typography>
                        
                        <Chip 
                          label={task.priority} 
                          size="small" 
                          color={getPriorityColor(task.priority)}
                          variant="outlined"
                        />
                        
                        <Chip 
                          label={task.status.replace('_', ' ')} 
                          size="small" 
                          color={getStatusColor(task.status)}
                        />
                      </Box>

                      {task.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ mb: 2 }}
                        >
                          {task.description}
                        </Typography>
                      )}

                      {/* Meta information */}
                      <Stack direction="row" spacing={2} alignItems="center">
                        {/* Assigned to */}
                        {task.assigned && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <User size={16} />
                            <Avatar 
                              src={task.assigned.avatar_url} 
                              sx={{ width: 20, height: 20 }}
                            >
                              {task.assigned.title?.[0]}
                            </Avatar>
                            <Typography variant="caption">
                              {task.assigned.title}
                            </Typography>
                          </Box>
                        )}

                        {/* Due date */}
                        {task.due_date && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarBlank size={16} />
                            <Typography 
                              variant="caption"
                              color={isOverdue(task.due_date) ? 'error' : 'text.secondary'}
                              sx={{ fontWeight: isOverdue(task.due_date) ? 'bold' : 'normal' }}
                            >
                              {formatDueDate(task.due_date)}
                              {isOverdue(task.due_date) && ' (Overdue)'}
                            </Typography>
                          </Box>
                        )}

                        {/* Created time */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Clock size={16} />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(task.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    {/* Actions */}
                    {editable && (
                      <Box>
                        <Tooltip title="Delete task">
                          <IconButton
                            onClick={() => handleDeleteTask(task.id)}
                            size="small"
                            color="error"
                          >
                            <Trash size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Task Dialog */}
      <Dialog 
        open={showCreateDialog} 
        onClose={() => setShowCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Action Item</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Task Title"
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
            />
            
            <TextField
              label="Description"
              value={newTask.description}
              onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Assign To</InputLabel>
                  <Select
                    value={newTask.assigned_id}
                    onChange={(e) => setNewTask(prev => ({ ...prev, assigned_id: e.target.value }))}
                    label="Assign To"
                  >
                    {participants.map((participant) => (
                      <MenuItem key={participant.id} value={participant.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar 
                            src={participant.avatar_url} 
                            sx={{ width: 24, height: 24 }}
                          >
                            {participant.title?.[0]}
                          </Avatar>
                          {participant.title}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Due Date"
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={newTask.priority}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                    label="Priority"
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Chip 
                          label={option.label} 
                          size="small" 
                          color={option.color}
                          variant="outlined"
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={newTask.status}
                    onChange={(e) => setNewTask(prev => ({ ...prev, status: e.target.value }))}
                    label="Status"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Chip 
                          label={option.label} 
                          size="small" 
                          color={option.color}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateTask}
            variant="contained"
            disabled={!newTask.title.trim()}
          >
            Create Action Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}