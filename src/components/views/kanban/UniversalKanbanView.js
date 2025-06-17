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
  Chip,
  Avatar
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  DndContext, 
  DragOverlay,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Kanban, ListChecks, Calendar, CheckCircle, FunnelSimple, User } from '@phosphor-icons/react';

import CollectionModal from '@/components/modals/CollectionModal';
import { KanbanColumn } from '@/components/views/kanban/KanbanColumn';
import { KanbanTaskCard } from '@/components/views/kanban/KanbanTaskCard';
import { useUniversalKanban } from '@/hooks/kanban/useUniversalKanban';
import { useCurrentContact } from '@/hooks/useCurrentContact';
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
  
  // Get current contact for default selection
  const { contact: currentContact, loading: currentContactLoading } = useCurrentContact();
  
  // Local state for filters and UI
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedContactId, setSelectedContactId] = useState('current'); // Default to current user
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  
  // Refs to prevent infinite loops
  const companiesLoadedRef = useRef(false);
  const currentContactSetRef = useRef(false);

  // Get task config
  const taskConfig = collections.task;

  // Use the universal kanban hook with contact filtering
  const {
    loading: kanbanLoading,
    error: kanbanError,
    tasks,
    containers,
    tasksByContainer,
    moveTask,
    reorderTasks,
    updateTask,
    loadData,
    clearError,
    getTotalTaskCount,
    getCompletedTaskCount,
    getPendingTaskCount,
    getOverdueTaskCount
  } = useUniversalKanban({
    companyId: selectedCompanyId,
    projectId: selectedProjectId,
    contactId: selectedContactId === 'current' ? currentContact?.id : selectedContactId,
    showCompleted: true,
    searchQuery,
    filters,
    config: taskConfig
  });

  // Modal state
  const showModal = searchParams.get('modal') === 'create' || searchParams.get('modal') === 'edit';
  const modalType = searchParams.get('type') || 'task';
  const recordId = searchParams.get('id');

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

  // Set current contact as default when loaded
  useEffect(() => {
    if (currentContact && !currentContactLoading && !currentContactSetRef.current) {
      console.log('[UniversalKanbanView] Setting current contact as default:', currentContact);
      setSelectedContactId(currentContact.id);
      currentContactSetRef.current = true;
    }
  }, [currentContact, currentContactLoading]);

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
        // Only filter by company when a specific company is selected
        ({ data, error } = await table.project.fetchProjectsByCompanyId(companyId));
        console.log('[UniversalKanbanView] Fetching projects for company:', companyId, 'Found:', data?.length || 0);
      } else {
        // Default: Show ALL projects regardless of company
        console.log('[UniversalKanbanView] Fetching all projects');
        
        // Try different methods to get all projects
        const projectQueryMethods = [
          () => table.project.fetchAllProjects(),
          () => table.project.fetchProjects(),
          () => table.project.fetchAll(),
          () => table.project.fetch(),
          async () => {
            // Fallback: Get projects from companies
            const { data: companiesData, error: companiesError } = await table.company.fetchCompaniesWithProjects();
            if (companiesError) throw companiesError;
            
            const allProjects = [];
            companiesData?.forEach(company => {
              if (company.projects) {
                allProjects.push(...company.projects);
              }
            });
            return { data: allProjects, error: null };
          }
        ];

        let success = false;
        for (const method of projectQueryMethods) {
          try {
            const result = await method();
            if (result && result.data) {
              data = result.data;
              error = result.error;
            } else if (Array.isArray(result)) {
              data = result;
              error = null;
            }
            
            if (data && data.length >= 0) { // Allow empty arrays
              success = true;
              break;
            }
          } catch (methodError) {
            console.log('[UniversalKanbanView] Project query method failed:', methodError.message);
            continue;
          }
        }

        if (!success) {
          console.warn('[UniversalKanbanView] All project query methods failed');
          data = [];
          error = null;
        }
      }
      
      if (error) throw error;
      
      console.log('[UniversalKanbanView] Setting projects:', data?.length || 0);
      setProjects(data || []);
      
    } catch (error) {
      console.error('[UniversalKanbanView] Error fetching projects:', error);
      setProjects([]);
    }
  }, []);

  // Fetch contacts that are assigned to active tasks in current filter context
  const fetchContacts = useCallback(async () => {
    try {
      console.log('[UniversalKanbanView] Fetching contacts with active tasks for context:', {
        companyId: selectedCompanyId,
        projectId: selectedProjectId
      });

      // Use the centralized query function to fetch contacts with active tasks
      const filters = {};
      if (selectedCompanyId && selectedCompanyId !== 'all') {
        filters.company_id = selectedCompanyId;
      }
      if (selectedProjectId && selectedProjectId !== 'all') {
        filters.project_id = selectedProjectId;
      }

      const { data, error } = await table.contact.fetchContactsWithActiveTasks(filters);
      
      if (error) {
        console.error('[UniversalKanbanView] Error fetching contacts with active tasks:', error);
        setContacts([]);
        return;
      }
      
      console.log('[UniversalKanbanView] Successfully fetched contacts with active tasks:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('[UniversalKanbanView] Sample contact structure:', data[0]);
      } else {
        console.log('[UniversalKanbanView] No contacts have active task assignments in current context');
      }
      
      setContacts(data || []);
    } catch (error) {
      console.error('[UniversalKanbanView] Error fetching contacts with active tasks:', error);
      setContacts([]);
    }
  }, [selectedCompanyId, selectedProjectId]); // Re-run when company/project filters change (NOT when selectedContactId changes)

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      
      try {
        await Promise.all([
          fetchCompanies(),
          fetchProjects(), // Fetch all projects initially
          fetchContacts()
        ]);
      } catch (error) {
        console.error('[UniversalKanbanView] Error initializing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Refetch projects and contacts when company changes
  useEffect(() => {
    if (selectedCompanyId !== 'all') {
      // When a specific company is selected, filter projects to that company
      fetchProjects(selectedCompanyId);
      setSelectedProjectId('all'); // Reset project filter when company changes
    } else {
      // When "All Companies" is selected, show all projects
      fetchProjects(); // This will fetch all projects
    }
    
    // Always refetch contacts when company filter changes
    fetchContacts();
  }, [selectedCompanyId, fetchProjects, fetchContacts]);

  // Refetch contacts when project changes
  useEffect(() => {
    fetchContacts();
  }, [selectedProjectId, fetchContacts]);

  // Handle selections
  const handleCompanyChange = useCallback((event) => {
    setSelectedCompanyId(event.target.value);
  }, []);

  const handleProjectChange = useCallback((event) => {
    setSelectedProjectId(event.target.value);
  }, []);

  const handleContactChange = useCallback((event) => {
    setSelectedContactId(event.target.value);
  }, []);

  // Drag and drop handlers
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    const taskId = active.id.toString().replace('task-', '');
    const task = tasks.find(t => t.id.toString() === taskId);
    setActiveTask(task);
    
    console.log('[UniversalKanbanView] Drag started:', { 
      activeId: active.id, 
      taskId, 
      taskTitle: task?.title,
      taskStatus: task?.status 
    });
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
    
    if (activeTask?.parent_id) return;
    
    if (activeIsTask && (overIsContainer || overIsTask)) {
      return;
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveTask(null);
    
    if (!over) {
      console.log('[UniversalKanbanView] Drag cancelled - no drop target');
      return;
    }
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) {
      console.log('[UniversalKanbanView] Drag cancelled - same position');
      return;
    }
    
    const activeIsTask = activeId.toString().startsWith('task-');
    
    if (!activeIsTask) {
      console.log('[UniversalKanbanView] Drag cancelled - not a task');
      return;
    }
    
    if (!activeTask) {
      console.log('[UniversalKanbanView] Drag cancelled - no active task');
      return;
    }
    
    const targetContainer = containers.find(c => c.id === overId);
    
    if (!targetContainer) {
      console.log('[UniversalKanbanView] Drag cancelled - not dropped on a valid column');
      return;
    }
    
    const newStatus = targetContainer.id;
    const oldStatus = activeTask.status || 'todo';
    
    if (newStatus === oldStatus) {
      console.log('[UniversalKanbanView] Drag cancelled - same status');
      return;
    }
    
    const taskId = activeId.toString().replace('task-', '');
    
    console.log('[UniversalKanbanView] Moving task between columns:', { 
      taskId, 
      taskTitle: activeTask.title,
      from: oldStatus, 
      to: newStatus,
      isParent: !activeTask.parent_id
    });
    
    try {
      await moveTask(taskId, oldStatus, newStatus, 0);
      
      if (!activeTask.parent_id) {
        const childTasks = tasks.filter(task => task.parent_id === activeTask.id);
        console.log('[UniversalKanbanView] Moving child tasks with parent:', childTasks.length, 'children');
        
        for (const childTask of childTasks) {
          try {
            await moveTask(childTask.id, childTask.status || 'todo', newStatus, 0);
          } catch (childError) {
            console.error('[UniversalKanbanView] Error moving child task:', childError);
          }
        }
      }
      
      console.log('[UniversalKanbanView] Task move completed successfully');
    } catch (error) {
      console.error('[UniversalKanbanView] Error moving task:', error);
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
      await loadData();
      // Refetch contacts in case new assignments were made
      await fetchContacts();
    }
    
    return newRecord;
  }, [loadData, fetchContacts]);

  const handleTaskUpdate = useCallback(async () => {
    await loadData();
    // Refetch contacts in case assignments changed
    await fetchContacts();
  }, [loadData, fetchContacts]);

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
    
    if (selectedProjectId !== 'all') {
      currentUrl.searchParams.set('project_id', selectedProjectId);
    }
    
    if (selectedContactId && selectedContactId !== 'all') {
      currentUrl.searchParams.set('assigned_id', selectedContactId);
    }
    
    router.push(currentUrl.pathname + currentUrl.search);
  }, [selectedProjectId, selectedContactId, router]);

  const handleClearError = useCallback(() => {
    clearError();
  }, [clearError]);

  // Get contact display info
  const getContactDisplayInfo = useCallback((contact) => {
    if (!contact) return { name: 'Unknown', avatar: null };
    
    const name = contact.title || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email || 'Unknown';
    const avatar = contact.thumbnail_id_details?.url || contact.thumbnail_id?.url || null;
    
    // Debug logging
    if (contact.id === 15 || contact.id === 47 || contact.id === 25) {
      console.log(`[UniversalKanbanView] getContactDisplayInfo for contact ${contact.id}:`, {
        contact,
        extractedName: name,
        title: contact.title,
        firstName: contact.first_name,
        lastName: contact.last_name,
        email: contact.email
      });
    }
    
    return { name, avatar };
  }, []);

  // Get stats using the hook
  const totalTasks = getTotalTaskCount();
  const completedTasks = getCompletedTaskCount();
  const pendingTasks = getPendingTaskCount();
  const overdueTasks = getOverdueTaskCount();

  if (isLoading || currentContactLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ mr: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Loading universal kanban view...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">
          Universal Task Board
        </Typography>
            
      </Box>

      {/* Error Alert */}
      {kanbanError && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={handleClearError}
        >
          {kanbanError}
        </Alert>
      )}

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
                    {[...companies]
                      .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
                      .map(company => (
                        <MenuItem key={company.id} value={company.id}>
                          {company.title}
                        </MenuItem>
                      ))
                    }
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
                    {[...projects]
                      .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
                      .map(project => (
                        <MenuItem key={project.id} value={project.id}>
                          {project.title}
                        </MenuItem>
                      ))
                    }
                  </Select>
                </FormControl>

                {/* Contact Filter */}
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Assigned To</InputLabel>
                  <Select
                    value={selectedContactId}
                    label="Assigned To"
                    onChange={handleContactChange}
                    renderValue={(value) => {
                      console.log('[UniversalKanbanView] renderValue called with:', value, typeof value);
                      console.log('[UniversalKanbanView] contacts available:', contacts.map(c => ({ id: c.id, idType: typeof c.id, title: c.title })));
                      
                      if (value === 'all') return 'All Contacts';
                      if (value === 'current' || value === currentContact?.id) {
                        const { name } = getContactDisplayInfo(currentContact);
                        return `${name} (You)`;
                      }
                      const contact = contacts.find(c => c.id == value); // Use == instead of === for loose comparison
                      console.log('[UniversalKanbanView] Found contact for renderValue:', contact);
                      const { name } = getContactDisplayInfo(contact);
                      console.log('[UniversalKanbanView] Display name:', name);
                      return name;
                    }}
                  >
                    <MenuItem value="all">All Contacts</MenuItem>
                    {currentContact && (
                      <MenuItem value={currentContact.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar 
                            src={getContactDisplayInfo(currentContact).avatar} 
                            sx={{ width: 20, height: 20, fontSize: '0.75rem' }}
                          >
                            <User size={12} />
                          </Avatar>
                          {getContactDisplayInfo(currentContact).name} (You)
                        </Box>
                      </MenuItem>
                    )}
                    {contacts
                      .filter(contact => contact.id !== currentContact?.id)
                      .map(contact => {
                        const { name, avatar } = getContactDisplayInfo(contact);
                        console.log('[UniversalKanbanView] Rendering MenuItem for contact:', { id: contact.id, name, contact });
                        return (
                          <MenuItem key={contact.id} value={contact.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar 
                                src={avatar} 
                                sx={{ width: 20, height: 20, fontSize: '0.75rem' }}
                              >
                                <User size={12} />
                              </Avatar>
                              {name}
                            </Box>
                          </MenuItem>
                        );
                      })}
                  </Select>
                </FormControl>
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
                {overdueTasks > 0 && (
                  <Chip 
                    label={`${overdueTasks} overdue`}
                    size="small" 
                    color="error" 
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ mb: 3 }} />

      {/* Loading indicator for kanban data */}
      {kanbanLoading && (
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
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
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
          {containers.length === 0 && !kanbanLoading ? (
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
            containers.map((container, index) => (
              <KanbanColumn
                key={container.id}
                container={container}
                tasks={tasksByContainer[container.id] || []}
                config={taskConfig}
                mode="universal"
                milestoneIndex={index}
                onTaskUpdate={handleTaskUpdate}
              />
            ))
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