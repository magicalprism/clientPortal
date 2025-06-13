// components/fields/custom/checklist/ChecklistWidget.jsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  LinearProgress,
  Button
} from '@mui/material';
import { 
  CheckCircle, 
  Circle, 
  Calendar,
  User,
  DotsThreeVertical,
  Plus,
  ArrowRight
} from '@phosphor-icons/react';
import { getCurrentContactId } from '@/lib/utils/getCurrentContactId';
import { useRouter } from 'next/navigation';

export default function ChecklistWidget({
  title = 'My Tasks',
  filter = {},
  entityTypes = ['event'], // Support multiple entity types
  maxItems = 8,
  showCreateButton = false,
  showProgress = true,
  showDueDates = true,
  showAssignees = false,
  onTaskClick,
  onViewAll,
  variant = 'card', // 'card', 'simple'
  height = 'auto'
}) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const router = useRouter();

  // Get current user ID
  useEffect(() => {
    getCurrentContactId().then(setCurrentUserId);
  }, []);

  // Fetch tasks using SOP-compliant task queries
  const fetchTasks = async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Import task queries dynamically following SOP pattern
      const { table } = await import('@/lib/supabase/queries');
      const taskQueries = table.task;

      if (!taskQueries) {
        throw new Error('Task queries not found');
      }

      // Prepare filter object for SOP function
      const taskFilters = {
        assigned_to: filter.assigned_to || currentUserId,
        status: filter.status || undefined, // Don't default here, let function handle it
        due_date: filter.due_date,
        entityTypes: entityTypes
      };

      // Use SOP-compliant fetchTasksForWidget function
      const { data, error } = await taskQueries.fetchTasksForWidget(taskFilters, maxItems);

      if (error) {
        console.error('[ChecklistWidget] Error fetching tasks:', error);
        setError(error.message);
        return;
      }

      // Apply default status filter if none specified (exclude completed by default)
      let filteredData = data || [];
      if (!filter.status) {
        filteredData = data.filter(task => task.status !== 'complete');
      }

      console.log('[ChecklistWidget] Fetched tasks:', filteredData.length);
      setTasks(filteredData);

    } catch (err) {
      console.error('[ChecklistWidget] Error fetching tasks:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentUserId, filter, entityTypes, maxItems]);

  // Handle task completion using SOP function
  const handleToggleComplete = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'complete' ? 'todo' : 'complete';
    
    try {
      // Import task queries dynamically
      const { table } = await import('@/lib/supabase/queries');
      const taskQueries = table.task;

      // Use SOP-compliant update function
      const { data, error } = await taskQueries.updateTaskStatusSimple(taskId, newStatus);
        
      if (error) {
        console.error('[ChecklistWidget] Error updating task:', error);
        return;
      }

      console.log('[ChecklistWidget] Task status updated:', data);

      // Update local state
      if (newStatus === 'complete' && !filter.status?.includes('complete')) {
        // Remove from list if completed and we're not showing completed
        setTasks(prev => prev.filter(task => task.id !== taskId));
      } else {
        // Update task status
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus }
            : task
        ));
      }

    } catch (err) {
      console.error('[ChecklistWidget] Error updating task:', err);
    }
  };

  // Calculate stats from current tasks
  const stats = {
    total: tasks.length,
    overdue: tasks.filter(task => 
      task.due_date && new Date(task.due_date) < new Date() && task.status !== 'complete'
    ).length,
    dueToday: tasks.filter(task => {
      if (!task.due_date) return false;
      const today = new Date().toISOString().split('T')[0];
      return task.due_date === today && task.status !== 'complete';
    }).length
  };

  // Get entity info for a task - UPDATED to handle missing contract field in checklist
  const getEntityInfo = (task) => {
    const checklist = task.checklist;
    if (!checklist) return null;

    if (checklist.event) {
      return {
        type: 'event',
        title: checklist.event.title,
        id: checklist.event.id,
        subtitle: checklist.event.start_time ? new Date(checklist.event.start_time).toLocaleDateString() : null
      };
    }
    
    if (checklist.project) {
      return {
        type: 'project',
        title: checklist.project.title,
        id: checklist.project.id
      };
    }

    // Note: Contract support would require junction table query
    // This is handled in the fetchTasksForWidget function
    
    return null;
  };

  // Render task item
  const TaskItem = ({ task }) => {
    const entityInfo = getEntityInfo(task);
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'complete';
    
    return (
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => onTaskClick ? onTaskClick(task) : null}
          sx={{ borderRadius: 1 }}
        >
          <ListItemIcon 
            sx={{ minWidth: 32, cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleComplete(task.id, task.status);
            }}
          >
            {task.status === 'complete' ? (
              <CheckCircle size={18} weight="fill" color="green" />
            ) : (
              <Circle size={18} />
            )}
          </ListItemIcon>
          
          <ListItemText
            primary={
              <Typography 
                variant="body2" 
                sx={{ 
                  textDecoration: task.status === 'complete' ? 'line-through' : 'none',
                  color: task.status === 'complete' ? 'text.secondary' : 'text.primary',
                  fontWeight: isOverdue ? 500 : 400
                }}
              >
                {task.title}
              </Typography>
            }
            secondary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                {entityInfo && (
                  <Chip 
                    label={entityInfo.title}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
                
                {task.checklist && (
                  <Typography variant="caption" color="text.secondary">
                    {task.checklist.title}
                  </Typography>
                )}
                
                {showDueDates && task.due_date && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Calendar size={12} />
                    <Typography 
                      variant="caption" 
                      color={isOverdue ? 'error.main' : 'text.secondary'}
                      fontWeight={isOverdue ? 500 : 400}
                    >
                      {new Date(task.due_date).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
                
                {showAssignees && task.assigned_contact && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <User size={12} />
                    <Typography variant="caption" color="text.secondary">
                      {task.assigned_contact.title}
                    </Typography>
                  </Box>
                )}
              </Box>
            }
          />
        </ListItemButton>
      </ListItem>
    );
  };

  const content = (
    <Box sx={{ height: height === 'auto' ? 'auto' : height, display: 'flex', flexDirection: 'column' }}>
      {/* Header with stats */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {stats.overdue > 0 && (
            <Chip 
              label={`${stats.overdue} overdue`}
              size="small"
              color="error"
              variant="outlined"
            />
          )}
          
          {stats.dueToday > 0 && (
            <Chip 
              label={`${stats.dueToday} due today`}
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
        </Box>
        
        {showProgress && stats.total > 0 && (
          <Typography variant="caption" color="text.secondary">
            {stats.total} active tasks
          </Typography>
        )}
      </Box>

      {/* Task list */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ p: 2 }}>
            <LinearProgress />
          </Box>
        ) : error ? (
          <Typography variant="body2" color="error" sx={{ p: 2 }}>
            Error: {error}
          </Typography>
        ) : tasks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="body2">
              No tasks found
            </Typography>
            {showCreateButton && (
              <Button
                startIcon={<Plus size={16} />}
                variant="text"
                size="small"
                sx={{ mt: 1 }}
                onClick={() => router.push('/dashboard/task?modal=create')}
              >
                Create Task
              </Button>
            )}
          </Box>
        ) : (
          <List dense>
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </List>
        )}
      </Box>

      {/* Footer actions */}
      {(onViewAll || showCreateButton) && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          {showCreateButton && (
            <Button
              startIcon={<Plus size={16} />}
              variant="text"
              size="small"
              onClick={() => router.push('/dashboard/task?modal=create')}
            >
              New Task
            </Button>
          )}
          
          {onViewAll && (
            <Button
              endIcon={<ArrowRight size={16} />}
              variant="text"
              size="small"
              onClick={onViewAll}
            >
              View All
            </Button>
          )}
        </Box>
      )}
    </Box>
  );

  if (variant === 'simple') {
    return content;
  }

  return (
    <Card sx={{ height: height === 'auto' ? 'auto' : height, boxShadow: 'none !important'  }} >
      <CardHeader
        title={title}
        action={
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <DotsThreeVertical size={16} />
          </IconButton>
        }
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0, height: 'calc(100% - 64px)', display: 'flex', flexDirection: 'column' }}>
        {content}
      </CardContent>
      
      {/* Options menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => { fetchTasks(); setAnchorEl(null); }}>
          Refresh
        </MenuItem>
        {onViewAll && (
          <MenuItem onClick={() => { onViewAll(); setAnchorEl(null); }}>
            View All Tasks
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
}