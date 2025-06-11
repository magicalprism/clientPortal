// TaskTemplateEditModal.js - Modal for editing task templates

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Box,
  Typography,
  Chip,
  IconButton,
  Divider,
  Alert,
  Switch,
  FormControlLabel,
  Autocomplete,
} from '@mui/material';
import {
  X,
  Clock,
  Flag,
  User,
  Calendar,
  Tag,
  FileText,
} from '@phosphor-icons/react';
import { updateTask } from '@/lib/supabase/queries/table/task';

const TaskTemplateEditModal = ({ 
  open, 
  onClose, 
  task, 
  milestones = [],
  onSave,
  projectId 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    task_type: 'task',
    estimated_duration: '',
    milestone_id: null,
    parent_id: null,
    tags: [],
    content: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newTag, setNewTag] = useState('');

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        task_type: task.task_type || 'task',
        estimated_duration: task.estimated_duration || '',
        milestone_id: task.milestone_id || null,
        parent_id: task.parent_id || null,
        tags: task.tags || [],
        content: task.content || '',
      });
    }
  }, [task]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData = {
        ...formData,
        title: formData.title.trim(),
        estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null,
        milestone_id: formData.milestone_id || null,
        parent_id: formData.parent_id || null,
      };

      const { data, error } = await updateTask(task.id, updateData);
      
      if (error) {
        throw error;
      }

      console.log('✅ Updated task template:', data);
      
      if (onSave) {
        onSave(data);
      }
      
      onClose();
    } catch (err) {
      console.error('❌ Error updating task template:', err);
      setError(err.message || 'Failed to update task template');
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'var(--colors-blue-500)' },
    { value: 'medium', label: 'Medium', color: 'var(--colors-gray-500)' },
    { value: 'high', label: 'High', color: 'var(--colors-orange-500)' },
    { value: 'urgent', label: 'Urgent', color: 'var(--colors-red-500)' },
  ];

  const taskTypeOptions = [
    { value: 'task', label: 'Task' },
    { value: 'milestone', label: 'Milestone' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'review', label: 'Review' },
    { value: 'documentation', label: 'Documentation' },
  ];

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? mins + 'm' : ''}`;
    }
    return `${mins}m`;
  };

  if (!task) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--colors-gray-200)',
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          backgroundColor: 'var(--colors-gray-50)',
          borderBottom: '1px solid var(--colors-gray-200)',
          color: 'var(--colors-gray-900)'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            Edit Task Template
          </Typography>
          <IconButton 
            onClick={onClose}
            sx={{ color: 'var(--colors-gray-500)' }}
          >
            <X size={20} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              m: 3, 
              mb: 0,
              backgroundColor: 'var(--colors-red-50)',
              color: 'var(--colors-red-800)',
              border: '1px solid var(--colors-red-200)'
            }}
          >
            {error}
          </Alert>
        )}

        <Box sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Basic Info */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'var(--colors-gray-900)' }}>
                Basic Information
              </Typography>
              
              <Stack spacing={2}>
                <TextField
                  label="Template Title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  fullWidth
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: 'var(--colors-primary-400)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--colors-primary-500)',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'var(--colors-primary-600)',
                    },
                  }}
                />

                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: 'var(--colors-primary-400)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--colors-primary-500)',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'var(--colors-primary-600)',
                    },
                  }}
                />
              </Stack>
            </Box>

            <Divider />

            {/* Assignment & Categorization */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'var(--colors-gray-900)' }}>
                Assignment & Categorization
              </Typography>
              
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      label="Priority"
                      sx={{
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'var(--colors-primary-500)',
                        },
                      }}
                    >
                      {priorityOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Flag size={16} color={option.color} />
                            <Typography>{option.label}</Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Task Type</InputLabel>
                    <Select
                      value={formData.task_type}
                      onChange={(e) => handleInputChange('task_type', e.target.value)}
                      label="Task Type"
                      sx={{
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'var(--colors-primary-500)',
                        },
                      }}
                    >
                      {taskTypeOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Milestone</InputLabel>
                    <Select
                      value={formData.milestone_id || ''}
                      onChange={(e) => handleInputChange('milestone_id', e.target.value || null)}
                      label="Milestone"
                      sx={{
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'var(--colors-primary-500)',
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>No Milestone</em>
                      </MenuItem>
                      {milestones.map(milestone => (
                        <MenuItem key={milestone.id} value={milestone.id}>
                          {milestone.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Estimated Duration (minutes)"
                    type="number"
                    value={formData.estimated_duration}
                    onChange={(e) => handleInputChange('estimated_duration', e.target.value)}
                    fullWidth
                    InputProps={{
                      startAdornment: <Clock size={16} style={{ marginRight: 8, color: 'var(--colors-gray-400)' }} />,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'var(--colors-primary-400)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'var(--colors-primary-500)',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'var(--colors-primary-600)',
                      },
                    }}
                  />
                </Stack>
              </Stack>
            </Box>

            <Divider />

            {/* Tags */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'var(--colors-gray-900)' }}>
                Tags
              </Typography>
              
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      size="small"
                      sx={{
                        backgroundColor: 'var(--colors-primary-100)',
                        color: 'var(--colors-primary-700)',
                        '& .MuiChip-deleteIcon': {
                          color: 'var(--colors-primary-600)',
                          '&:hover': {
                            color: 'var(--colors-primary-800)',
                          },
                        },
                      }}
                    />
                  ))}
                </Stack>
                
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Add Tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    size="small"
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'var(--colors-primary-400)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'var(--colors-primary-500)',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'var(--colors-primary-600)',
                      },
                    }}
                  />
                  <Button
                    onClick={handleAddTag}
                    variant="outlined"
                    sx={{
                      borderColor: 'var(--colors-primary-300)',
                      color: 'var(--colors-primary-600)',
                      '&:hover': {
                        borderColor: 'var(--colors-primary-500)',
                        backgroundColor: 'var(--colors-primary-50)',
                      },
                    }}
                  >
                    Add
                  </Button>
                </Stack>
              </Stack>
            </Box>

            <Divider />

            {/* Content */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'var(--colors-gray-900)' }}>
                Detailed Content
              </Typography>
              
              <TextField
                label="Template Content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                multiline
                rows={4}
                fullWidth
                placeholder="Add detailed instructions, notes, or requirements for this template..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'var(--colors-primary-400)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--colors-primary-500)',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'var(--colors-primary-600)',
                  },
                }}
              />
            </Box>

            {/* Preview */}
            {formData.estimated_duration && (
              <Box 
                sx={{ 
                  p: 2, 
                  backgroundColor: 'var(--colors-gray-50)', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--colors-gray-200)'
                }}
              >
                <Typography variant="body2" sx={{ color: 'var(--colors-gray-600)' }}>
                  <strong>Estimated Duration:</strong> {formatDuration(parseInt(formData.estimated_duration))}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions 
        sx={{ 
          p: 3, 
          backgroundColor: 'var(--colors-gray-50)',
          borderTop: '1px solid var(--colors-gray-200)' 
        }}
      >
        <Button 
          onClick={onClose}
          sx={{ color: 'var(--colors-gray-600)' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !formData.title.trim()}
          sx={{
            backgroundColor: 'var(--colors-primary-500)',
            '&:hover': { backgroundColor: 'var(--colors-primary-600)' },
            '&:disabled': { backgroundColor: 'var(--colors-gray-300)' }
          }}
        >
          {loading ? 'Saving...' : 'Save Template'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskTemplateEditModal;