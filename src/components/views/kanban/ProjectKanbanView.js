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
  Grid
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import CollectionModal from '@/components/modals/CollectionModal';
import { ProjectKanbanBoard } from '@/components/views/kanban';
import * as collections from '@/collections';
import { table } from '@/lib/supabase/queries';

export default function ProjectKanbanView({ 
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
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [kanbanMode, setKanbanMode] = useState('milestone');
  const [showCompleted, setShowCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
  // Refs to prevent infinite loops
  const companiesLoadedRef = useRef(false);
  const defaultProjectSetRef = useRef(false);

  // Modal state
  const showModal = searchParams.get('modal') === 'create' || searchParams.get('modal') === 'edit';
  const modalType = searchParams.get('type') || 'task';
  const recordId = searchParams.get('id');

  // Get task config for kanban board
  const taskConfig = collections.task;

  // Fetch companies that have projects - memoized to prevent loops
  const fetchCompanies = useCallback(async () => {
    if (companiesLoadedRef.current) return; // Prevent duplicate calls
    
    try {
      const { data, error } = await table.company.fetchCompaniesWithProjects();
      
      if (error) throw error;
      
      setCompanies(data || []);
      companiesLoadedRef.current = true;
      
    } catch (error) {
      console.error('[ProjectKanbanView] Error fetching companies:', error);
      setCompanies([]);
    }
  }, []); // No dependencies to prevent loops

  // Fetch projects for selected company - stabilized dependencies
  const fetchProjectsForCompany = useCallback(async (companyId) => {
    if (!companyId) {
      setProjects([]);
      return;
    }

    setIsLoadingProjects(true);
    
    try {
      const { data, error } = await table.project.fetchProjectsByCompanyId(companyId);
      
      if (error) throw error;
      
      setProjects(data || []);
      
    } catch (error) {
      console.error('[ProjectKanbanView] Error fetching projects:', error);
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  }, []); // No dependencies to prevent loops

  // Initialize with user's default company and project - only run once
  useEffect(() => {
    if (companiesLoadedRef.current || isLoading === false) return;
    
    const initializeDefaults = async () => {
      setIsLoading(true);
      
      try {
        // Get companies first
        await fetchCompanies();
        
        // Try to get user's default project
        const { data: defaultProject, error } = await table.project.fetchDefaultProjectForUser();
        
        if (!error && defaultProject && !defaultProjectSetRef.current) {
          // Set the company and project based on user's default
          setSelectedCompanyId(defaultProject.company_id);
          setSelectedProjectId(defaultProject.id);
          defaultProjectSetRef.current = true;
          
          // Fetch projects for this company
          await fetchProjectsForCompany(defaultProject.company_id);
        } else {
          // Fallback: just fetch companies and let user select
          console.log('[ProjectKanbanView] No default project found, user will need to select');
        }
      } catch (error) {
        console.error('[ProjectKanbanView] Error initializing defaults:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDefaults();
  }, []); // Only run once on mount

  // Handle company selection changes
  useEffect(() => {
    if (!selectedCompanyId || !companiesLoadedRef.current) return;
    
    // Only fetch projects if we don't already have them or company changed
    const currentCompanyProjects = projects.filter(p => p.company_id === selectedCompanyId);
    if (currentCompanyProjects.length === 0) {
      fetchProjectsForCompany(selectedCompanyId);
    }
  }, [selectedCompanyId, fetchProjectsForCompany]); // Stable dependencies

  // Auto-select first project when projects change (but only once per company)
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId && selectedCompanyId) {
      const companyProjects = projects.filter(p => p.company_id === selectedCompanyId);
      if (companyProjects.length > 0) {
        setSelectedProjectId(companyProjects[0].id);
      }
    }
  }, [projects, selectedProjectId, selectedCompanyId]);

  // Get current project and company - memoized to prevent recalculation
  const currentProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const currentCompany = useMemo(() => {
    return companies.find(c => c.id === selectedCompanyId);
  }, [companies, selectedCompanyId]);

  // Handle selections
  const handleCompanyChange = useCallback((event) => {
    const companyId = event.target.value;
    setSelectedCompanyId(companyId);
    setSelectedProjectId(''); // Reset project selection
    
    // Clear projects to force reload for new company
    setProjects([]);
  }, []);

  const handleProjectChange = useCallback((event) => {
    setSelectedProjectId(event.target.value);
  }, []);

  // Handle mode changes
  const handleModeChange = useCallback((mode) => {
    setKanbanMode(mode);
  }, []);

  // Handle modal events - memoized to prevent recreation
  const handleModalClose = useCallback(() => {
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.delete('modal');
    currentUrl.searchParams.delete('type');
    currentUrl.searchParams.delete('id');
    
    // Remove any field parameters
    ['project_id', 'milestone_id', 'company_id', 'title', 'status'].forEach(param => {
      currentUrl.searchParams.delete(param);
    });
    
    router.replace(currentUrl.pathname + currentUrl.search);
  }, [router]);

  const handleModalSuccess = useCallback(async (newRecord) => {
    console.log('[ProjectKanbanView] Modal success:', newRecord);
    
    if (newRecord) {
      // Refresh projects if a new project was created
      if (modalType === 'project' && selectedCompanyId) {
        await fetchProjectsForCompany(selectedCompanyId);
        // Select the new project
        if (newRecord.id) {
          setSelectedProjectId(newRecord.id);
        }
      }
      // For tasks, the kanban board will handle the refresh
    }
    
    return newRecord;
  }, [modalType, selectedCompanyId, fetchProjectsForCompany]);

  // Modal config - memoized
  const modalConfig = useMemo(() => {
    if (modalType === 'task') return collections.task;
    if (modalType === 'project') return collections.project;
    return config;
  }, [modalType, config]);

  // Handle create project button click
  const handleCreateProject = useCallback(() => {
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set('modal', 'create');
    currentUrl.searchParams.set('type', 'project');
    // Pre-fill company if one is selected
    if (selectedCompanyId) {
      currentUrl.searchParams.set('company_id', selectedCompanyId);
    }
    router.push(currentUrl.pathname + currentUrl.search);
  }, [selectedCompanyId, router]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ mr: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Loading projects...
        </Typography>
      </Box>
    );
  }

  if (companies.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No companies with projects found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create a project to start managing tasks with kanban boards
        </Typography>
        <Button variant="contained" onClick={handleCreateProject}>
          Create Project
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">
          Project Kanban Boards
        </Typography>
        
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Mode Toggle */}

          {/* Create Project Button */}
          <Button
            variant="outlined"
            size="small"
            onClick={handleCreateProject}
          >
            New Project
          </Button>
        </Stack>
      </Box>

     
<Box sx={{ 
  display: "flex", 
  justifyContent: "space-between", 
  alignItems: "flex-start",
  mb: 3,
  gap: 3 
}}>
  {/* Left side - Project Info */}
  <Box sx={{ flex: 1 }}>
    {currentProject && currentCompany && (
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {currentProject.title}
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            • {currentCompany.title}
          </Typography>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {kanbanMode === 'milestone' 
            ? 'Tasks organized by project milestones' 
            : 'Support tasks organized by status'}
        </Typography>
      </Box>
    )}
  </Box>
  
  {/* Right side - Company and Project Selection */}
  <Box sx={{ flex: 1, maxWidth: 600 }}>
    <Box >
      <Typography variant="subtitle1" gutterBottom>
        Select Company & Project
      </Typography>
      
      <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
        {/* Company Dropdown */}
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Company</InputLabel>
          <Select
            value={selectedCompanyId}
            label="Company"
            onChange={handleCompanyChange}
          >
            <MenuItem value="">
              <em>Select Company</em>
            </MenuItem>
            {companies.map(company => (
              <MenuItem key={company.id} value={company.id}>
                {company.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Project Dropdown */}
        <FormControl size="small" sx={{ minWidth: 250 }} disabled={!selectedCompanyId}>
          <InputLabel>Project</InputLabel>
          <Select
            value={selectedProjectId}
            label="Project"
            onChange={handleProjectChange}
          >
            <MenuItem value="">
              <em>Select Project</em>
            </MenuItem>
            {projects.map(project => (
              <MenuItem key={project.id} value={project.id}>
                {project.title}
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  • {project.status}
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Loading indicator for projects */}
        {isLoadingProjects && (
          <CircularProgress size={20} />
        )}

        {/* Project count */}
        {selectedCompanyId && (
          <Typography variant="body2" color="text.secondary">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </Typography>
        )}
      </Stack>
    </Box>
  </Box>
</Box>

      {/* Show selection prompt if no project selected */}
      {!selectedProjectId && selectedCompanyId && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Select a project from the dropdown above to view its kanban board
        </Alert>
      )}

      {/* Show company selection prompt if no company selected */}
      {!selectedCompanyId && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Select a company from the dropdown above to see available projects
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Kanban Board - Only render when we have a project */}
      {currentProject && (
        <ProjectKanbanBoard
          key={`projectkanban-${currentProject.id}-${kanbanMode}-${showCompleted}`} // Force re-mount on key changes
          projectId={currentProject.id}
          mode={kanbanMode}
          showCompleted={showCompleted}
          embedded={false}
          config={taskConfig}
          onTaskUpdate={() => {
            // Optional: Add any refresh logic here
            console.log('[ProjectKanbanView] Task updated in project:', currentProject.id);
          }}
        />
      )}

      {/* Fallback messages */}
      {!currentProject && selectedCompanyId && (
        <Alert severity="info">
          Select a project above to view its kanban board
        </Alert>
      )}

      {!currentProject && !selectedCompanyId && (
        <Alert severity="info">
          Select a company and project above to view kanban boards
        </Alert>
      )}

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