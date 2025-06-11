'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Alert, 
  CircularProgress,
  Stack,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Chip
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  DndContext, 
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { 
  restrictToFirstScrollableAncestor,
} from '@dnd-kit/modifiers';
import { Kanban, ListChecks, Calendar, CheckCircle, FunnelSimple } from '@phosphor-icons/react';

import CollectionModal from '@/components/modals/CollectionModal';
import { KanbanColumn } from '@/components/views/kanban/KanbanColumn';
import { KanbanTaskCard } from '@/components/views/kanban/KanbanTaskCard';
import * as collections from '@/collections';
import { table } from '@/lib/supabase/queries';

export default function UniversalKanbanView({ 
  config, 
  filters = {}, 
  searchQuery = '',
  selectedRecords = []
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  
  // Refs to prevent infinite loops
  const companiesLoadedRef = useRef(false);

  // Modal state
  const showModal = searchParams.get('modal') === 'create' || searchParams.get('modal') === 'edit';
  const modalType = searchParams.get('type') || 'task';
  const recordId = searchParams.get('id');

  // Get task config
  const taskConfig = collections.task;

  // Define standard task statuses (customize based on your needs)
  const standardStatuses = [
    { id: 'todo', label: 'To Do', color: '#6B7280' },
    { id: 'in_progress', label: 'In Progress', color: '#3B82F6' },
    { id: 'review', label: 'Review', color: '#F59E0B' },
    { id: 'complete', label: 'Complete', color: '#10B981' },
    { id: 'on_hold', label: 'On Hold', color: '#EF4444' }
  ];

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    if (companiesLoadedRef.current) return;
    
    try {
      const { data, error } = await table.company.fetchCompaniesWithProjects();
      
      if (error) throw error;
      
      setCompanies(data || []);
      companiesLoadedRef.current = true;
      
    } catch (error) {
      console.error('[UniversalKanbanView] Error fetching companies:', error);
      setCompanies([]);
    }
  }, []);

  // Fetch projects
  const fetchProjects = useCallback(async (companyId = null) => {
    try {
      let data, error;
      
      if (companyId && companyId !== 'all') {
        ({ data, error } = await table.project.fetchProjectsByCompanyId(companyId));
      } else {
        // For "all" projects, we need to get them through companies or use a different method
        // Let's try to get all projects by fetching from all companies
        const { data: companiesData, error: companiesError } = await table.company.fetchCompaniesWithProjects();
        if (companiesError) throw companiesError;
        
        // Extract all projects from companies
        const allProjects = [];
        companiesData?.forEach(company => {
          if (company.projects) {
            allProjects.push(...company.projects);
          }
        });
        data = allProjects;
        error = null;
      }
      
      if (error) throw error;
      
      setProjects(data || []);
      
    } catch (error) {
      console.error('[UniversalKanbanView] Error fetching projects:', error);
      setProjects([]);
    }
  }, []);

  // Fetch all tasks with filters
  const fetchTasks = useCallback(async () => {
    setIsLoadingTasks(true);
    
    try {
      let data = [];
      let error = null;
      
      if (selectedProjectId !== 'all') {
        // Try different methods to fetch tasks for a specific project
        const methodsToTry = [
          () => table.task.fetchTasksByProjectId(selectedProjectId),
          () => table.task.fetchByProjectId(selectedProjectId),
          () => table.task.getByProjectId(selectedProjectId),
          () => table.task.fetchTasks({ project_id: selectedProjectId }),
          () => table.task.fetch({ project_id: selectedProjectId })
        ];
        
        for (const method of methodsToTry) {
          try {
            const result = await method();
            data = result.data || result;
            error = result.error || null;
            break; // Success, exit loop
          } catch (methodError) {
            console.log('[UniversalKanbanView] Method failed, trying next:', methodError.message);
            continue; // Try next method
          }
        }
      } else {
        // For all tasks, try to fetch from all projects
        let allTasks = [];
        
        for (const project of projects) {
          const methodsToTry = [
            () => table.task.fetchTasksByProjectId(project.id),
            () => table.task.fetchByProjectId(project.id),
            () => table.task.getByProjectId(project.id),
            () => table.task.fetchTasks({ project_id: project.id }),
            () => table.task.fetch({ project_id: project.id })
          ];
          
          for (const method of methodsToTry) {
            try {
              const result = await method();
              const projectTasks = result.data || result || [];
              allTasks.push(...projectTasks);
              break; // Success, exit method loop
            } catch (methodError) {
              continue; // Try next method
            }
          }
        }
        
        data = allTasks;
      }
      
      if (error) throw error;
      
      let filteredTasks = data || [];
      
      // Apply company filter client-side if needed
      if (selectedCompanyId !== 'all') {
        filteredTasks = filteredTasks.filter(task => 
          task.project?.company_id === selectedCompanyId || 
          projects.find(p => p.id === task.project_id)?.company_id === selectedCompanyId
        );
      }
      
      // Apply completion filter
      if (!showCompleted) {
        filteredTasks = filteredTasks.filter(task => task.status !== 'complete');
      }
      
      // Apply search query client-side
      if (searchQuery) {
        filteredTasks = filteredTasks.filter(task =>
          task.title?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply additional filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          filteredTasks = filteredTasks.filter(task => task[key] === value);
        }
      });
      
      setTasks(filteredTasks);
      
    } catch (error) {
      console.error('[UniversalKanbanView] Error fetching tasks:', error);
      
      // If all methods fail, set empty tasks array and show message
      setTasks([]);
      
      // Show a user-friendly error
      alert(`Unable to fetch tasks. Please check that your task API methods are available. Error: ${error.message}`);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [selectedCompanyId, selectedProjectId, showCompleted, searchQuery, filters, projects]);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      
      try {
        await fetchCompanies();
        await fetchProjects();
        await fetchTasks();
      } catch (error) {
        console.error('[UniversalKanbanView] Error initializing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Refetch data when filters change
  useEffect(() => {
    if (!companiesLoadedRef.current) return;
    
    fetchTasks();
  }, [fetchTasks]);

  // Refetch projects when company changes
  useEffect(() => {
    if (selectedCompanyId !== 'all') {
      fetchProjects(selectedCompanyId);
      setSelectedProjectId('all'); // Reset project filter
    } else {
      fetchProjects();
    }
  }, [selectedCompanyId, fetchProjects]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped = {};
    
    // Initialize all statuses
    standardStatuses.forEach(status => {
      grouped[status.id] = [];
    });
    
    // Group tasks
    tasks.forEach(task => {
      const status = task.status || 'todo';
      if (grouped[status]) {
        grouped[status].push(task);
      } else {
        // Handle custom statuses
        if (!grouped[status]) {
          grouped[status] = [];
        }
        grouped[status].push(task);
      }
    });
    
    return grouped;
  }, [tasks]);

  // Create containers for kanban columns
  const containers = useMemo(() => {
    const statusContainers = [];
    
    // Add standard statuses
    standardStatuses.forEach(status => {
      if (tasksByStatus[status.id] && tasksByStatus[status.id].length > 0) {
        statusContainers.push({
          id: `status-${status.id}`,
          title: status.label,
          color: status.color,
          data: status
        });
      }
    });
    
    // Add custom statuses
    Object.keys(tasksByStatus).forEach(statusId => {
      if (!standardStatuses.find(s => s.id === statusId) && tasksByStatus[statusId].length > 0) {
        statusContainers.push({
          id: `status-${statusId}`,
          title: statusId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          color: '#6B7280',
          data: { id: statusId, label: statusId }
        });
      }
    });
    
    return statusContainers;
  }, [tasksByStatus]);

  // Handle selections
  const handleCompanyChange = useCallback((event) => {
    setSelectedCompanyId(event.target.value);
  }, []);

  const handleProjectChange = useCallback((event) => {
    setSelectedProjectId(event.target.value);
  }, []);

  const handleShowCompletedToggle = useCallback((event) => {
    setShowCompleted(event.target.checked);
  }, []);

  // Drag and drop handlers
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    // Find the task being dragged
    const taskId = active.id.toString().replace('task-', '');
    const task = tasks.find(t => t.id.toString() === taskId);
    setActiveTask(task);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    const activeIsTask = activeId.toString().startsWith('task-');
    const overIsTask = overId.toString().startsWith('task-');
    const overIsContainer = containers.some(c => c.id === overId);
    
    if (!activeIsTask) return;
    
    // Prevent dragging subtasks
    if (activeTask?.parent_id) return;
    
    // Handle task dropped on container or other task
    if (activeIsTask && (overIsContainer || overIsTask)) {
      // This will be handled in handleDragEnd
      return;
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveTask(null);
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    const activeIsTask = activeId.toString().startsWith('task-');
    const overIsContainer = containers.some(c => c.id === overId);
    
    if (!activeIsTask) return;
    
    // Prevent dragging subtasks
    if (activeTask?.parent_id) return;
    
    // Handle task movement to different status
    if (activeIsTask && overIsContainer) {
      const newStatus = overId.replace('status-', '');
      const taskId = activeId.toString().replace('task-', '');
      
      try {
        // Try different methods to update the task
        const updateMethods = [
          () => table.task.updateTask(taskId, { status: newStatus }),
          () => table.task.update(taskId, { status: newStatus }),
          () => table.task.patch(taskId, { status: newStatus }),
          () => table.task.edit(taskId, { status: newStatus })
        ];
        
        let success = false;
        for (const method of updateMethods) {
          try {
            const { data, error } = await method();
            if (error) throw error;
            success = true;
            break; // Success, exit loop
          } catch (methodError) {
            console.log('[UniversalKanbanView] Update method failed, trying next:', methodError.message);
            continue; // Try next method
          }
        }
        
        if (!success) {
          throw new Error('No working update method found. Please check your task API methods.');
        }
        
        // Refresh tasks
        await fetchTasks();
        
      } catch (error) {
        console.error('[UniversalKanbanView] Error updating task status:', error);
      }
    }
  };

  // Handle modal events
  const handleModalClose = useCallback(() => {
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.delete('modal');
    currentUrl.searchParams.delete('type');
    currentUrl.searchParams.delete('id');
    
    router.replace(currentUrl.pathname + currentUrl.search);
  }, [router]);

  const handleModalSuccess = useCallback(async (newRecord) => {
    console.log('[UniversalKanbanView] Modal success:', newRecord);
    
    if (newRecord) {
      // Refresh tasks
      await fetchTasks();
    }
    
    return newRecord;
  }, [fetchTasks]);

  // Handle task updates
  const handleTaskUpdate = useCallback((updatedTask) => {
    // Refresh tasks to reflect changes
    fetchTasks();
  }, [fetchTasks]);

  // Modal config
  const modalConfig = useMemo(() => {
    if (modalType === 'task') return collections.task;
    if (modalType === 'project') return collections.project;
    return config;
  }, [modalType, config]);

  // Handle create task button click
  const handleCreateTask = useCallback(() => {
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set('modal', 'create');
    currentUrl.searchParams.set('type', 'task');
    
    // Pre-fill project if one is selected
    if (selectedProjectId !== 'all') {
      currentUrl.searchParams.set('project_id', selectedProjectId);
    }
    
    router.push(currentUrl.pathname + currentUrl.search);
  }, [selectedProjectId, router]);

  // Get stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'complete').length;
  const pendingTasks = totalTasks - completedTasks;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ mr: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Loading universal kanban view...
        </Typography>
      </Box>
    );
  }

    console.log(tasks);

  return (
    <Box sx={{ pt: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">
          Universal Task Board
        </Typography>
        
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            onClick={handleCreateTask}
          >
            New Task
          </Button>
        </Stack>
      </Box>

      {/* Filters and Stats */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "flex-start",
            gap: 3,
            flexWrap: 'wrap'
          }}>
            {/* Left side - Filters */}
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FunnelSimple size={18} />
                Filters
              </Typography>
              
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={1}>
                {/* Company Filter */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Company</InputLabel>
                  <Select
                    value={selectedCompanyId}
                    label="Company"
                    onChange={handleCompanyChange}
                  >
                    <MenuItem value="all">All Companies</MenuItem>
                    {companies.map(company => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Project Filter */}
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={selectedProjectId}
                    label="Project"
                    onChange={handleProjectChange}
                  >
                    <MenuItem value="all">All Projects</MenuItem>
                    {projects.map(project => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Show Completed Toggle */}
                <FormControlLabel
                  control={
                    <Switch 
                      checked={showCompleted} 
                      onChange={handleShowCompletedToggle}
                      size="small"
                    />
                  }
                  label="Show completed"
                />
              </Stack>
            </Box>
            
            {/* Right side - Stats */}
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle1" gutterBottom>
                Task Overview
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {totalTasks} total
                </Typography>
                <Chip 
                  icon={<CheckCircle size={14} />}
                  label={`${completedTasks} done`}
                  size="small" 
                  color="success" 
                  variant="outlined"
                />
                {pendingTasks > 0 && (
                  <Chip 
                    icon={<Calendar size={14} />}
                    label={`${pendingTasks} pending`}
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ mb: 3 }} />

      {/* Loading indicator for tasks */}
      {isLoadingTasks && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, mb: 2 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading tasks...
          </Typography>
        </Box>
      )}

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToFirstScrollableAncestor]}
      >
        <Box 
          sx={{ 
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 3,
            minHeight: 450,
            maxHeight: 'calc(100vh - 300px)',
            justifyContent: containers.length === 0 ? 'center' : 'flex-start',
            alignItems: containers.length === 0 ? 'center' : 'flex-start',
            
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: 4,
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.3)',
              }
            },
          }}
        >
          {containers.length === 0 ? (
            <Card sx={{ maxWidth: 500, width: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Box sx={{ mb: 2 }}>
                  <Kanban size={48} color="#9CA3AF" />
                </Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No tasks found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto', mb: 3 }}>
                  {searchQuery || Object.keys(filters).length > 0 
                    ? 'Try adjusting your search criteria or filters to find tasks.'
                    : 'Create your first task to get started with the kanban board.'}
                </Typography>
                <Button variant="contained" onClick={handleCreateTask}>
                  Create Task
                </Button>
              </CardContent>
            </Card>
          ) : (
            <SortableContext 
              items={containers.map(c => c.id)}
              strategy={horizontalListSortingStrategy}
            >
              {containers.map((container, index) => (
                <KanbanColumn
                  key={container.id}
                  container={container}
                  tasks={tasksByStatus[container.data.id] || []}
                  config={taskConfig}
                  mode="universal"
                  milestoneIndex={index}
                  onTaskUpdate={handleTaskUpdate}
                />
              ))}
            </SortableContext>
          )}
        </Box>

        <DragOverlay>
          {activeTask ? (
            <KanbanTaskCard 
              task={activeTask} 
              config={taskConfig}
              isDragging
              onTaskUpdate={handleTaskUpdate}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modal */}
      {showModal && (
        <CollectionModal
          open={showModal}
          config={modalConfig}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          mode={recordId ? 'edit' : 'create'}
          recordId={recordId}
        />
      )}
    </Box>
  );
}