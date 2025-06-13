// components/fields/custom/checklist/ChecklistSummary.jsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  LinearProgress, 
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Collapse
} from '@mui/material';
import { 
  CheckCircle, 
  Circle, 
  ChevronDown, 
  ChevronRight,
  Calendar,
  User
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';

export default function ChecklistSummary({
  entityType = 'event',
  entityId,
  showProgress = true,
  maxItems = 5,
  onClick,
  variant = 'compact', // 'compact', 'detailed', 'card'
  showDueDates = false,
  showAssignees = false,
  expandable = false,
  title
}) {
  const [checklists, setChecklists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(null);
  const supabase = createClient();

  // Fetch checklist summary data
  const fetchChecklistSummary = async () => {
    if (!entityId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { table } = await import('@/lib/supabase/queries');
      const entityQueries = table[entityType];
      
      if (!entityQueries || !entityQueries.fetchEventChecklists) {
        throw new Error(`Missing query function for ${entityType}`);
      }

      const { data, error } = await entityQueries.fetchEventChecklists(entityId);
      
      if (error) {
        console.error(`Error fetching ${entityType} checklists:`, error);
        setError(error.message);
        return;
      }

      setChecklists(data || []);

    } catch (err) {
      console.error(`[ChecklistSummary] Error:`, err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklistSummary();
  }, [entityId, entityType]);

  // Calculate summary statistics
  const stats = checklists.reduce((acc, checklist) => {
    const tasks = checklist.tasks || [];
    const completedTasks = tasks.filter(task => task.status === 'complete');
    
    return {
      totalChecklists: acc.totalChecklists + 1,
      totalTasks: acc.totalTasks + tasks.length,
      completedTasks: acc.completedTasks + completedTasks.length,
      overdueTasks: acc.overdueTasks + tasks.filter(task => 
        task.due_date && new Date(task.due_date) < new Date() && task.status !== 'complete'
      ).length
    };
  }, { totalChecklists: 0, totalTasks: 0, completedTasks: 0, overdueTasks: 0 });

  // Get flattened task list for display
  const allTasks = checklists.flatMap(checklist => 
    (checklist.tasks || []).map(task => ({
      ...task,
      checklistTitle: checklist.title
    }))
  ).slice(0, maxItems);

  const progress = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  if (!entityId) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">
          No {entityType} selected
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, color: 'error.main' }}>
        <Typography variant="body2">
          Error loading checklists: {error}
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinearProgress sx={{ flexGrow: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (checklists.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">
          No checklists found
        </Typography>
      </Box>
    );
  }

  const SummaryContent = () => (
    <Box>
      {/* Header with progress */}
      <Box sx={{ mb: 2 }}>
        {title && (
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {stats.completedTasks} of {stats.totalTasks} tasks completed
          </Typography>
          
          {stats.overdueTasks > 0 && (
            <Chip 
              label={`${stats.overdueTasks} overdue`}
              size="small"
              color="error"
              variant="outlined"
            />
          )}
        </Box>
        
        {showProgress && (
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 6, 
              borderRadius: 3,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3
              }
            }}
          />
        )}
      </Box>

      {/* Task list */}
      {variant !== 'compact' && (
        <List dense>
          {allTasks.map((task) => (
            <ListItem 
              key={task.id}
              sx={{ 
                px: 0,
                cursor: onClick ? 'pointer' : 'default',
                borderRadius: 1,
                '&:hover': onClick ? { backgroundColor: 'action.hover' } : {}
              }}
              onClick={() => onClick && onClick(task)}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {task.status === 'complete' ? (
                  <CheckCircle size={16} color="green" />
                ) : (
                  <Circle size={16} color="gray" />
                )}
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      textDecoration: task.status === 'complete' ? 'line-through' : 'none',
                      color: task.status === 'complete' ? 'text.secondary' : 'text.primary'
                    }}
                  >
                    {task.title}
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {task.checklistTitle}
                    </Typography>
                    
                    {showDueDates && task.due_date && (
                      <>
                        <Typography variant="caption" color="text.secondary">•</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Calendar size={12} />
                          <Typography 
                            variant="caption" 
                            color={
                              new Date(task.due_date) < new Date() ? 'error.main' : 'text.secondary'
                            }
                          >
                            {new Date(task.due_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </>
                    )}
                    
                    {showAssignees && task.assigned_contact && (
                      <>
                        <Typography variant="caption" color="text.secondary">•</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <User size={12} />
                          <Typography variant="caption" color="text.secondary">
                            {task.assigned_contact.title}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* Show more indicator */}
      {stats.totalTasks > maxItems && (
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ display: 'block', textAlign: 'center', mt: 1 }}
        >
          ... and {stats.totalTasks - maxItems} more tasks
        </Typography>
      )}
    </Box>
  );

  // Render based on variant
  if (variant === 'card') {
    return (
      <Card sx={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
        <CardContent>
          <SummaryContent />
        </CardContent>
      </Card>
    );
  }

  if (expandable) {
    return (
      <Box>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            p: 1,
            borderRadius: 1,
            '&:hover': { backgroundColor: 'action.hover' }
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <IconButton size="small" sx={{ mr: 1 }}>
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </IconButton>
          
          <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
            {title || `${stats.totalChecklists} Checklists`}
          </Typography>
          
          <Typography variant="caption" color="text.secondary">
            {stats.completedTasks}/{stats.totalTasks}
          </Typography>
        </Box>
        
        <Collapse in={expanded}>
          <Box sx={{ pl: 4, pt: 1 }}>
            <SummaryContent />
          </Box>
        </Collapse>
      </Box>
    );
  }

  return <SummaryContent />;
}