'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  Stack,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  MagnifyingGlass,
  Globe,
  Calendar,
  Users,
  Rocket,
  TrendUp,
  DotsThreeVertical,
  ArrowRight,
  Clock,
  CheckCircle,
  Warning,
  Folder,
  GridFour,
  Pause,
  X,
  ArrowCounterClockwise,
  UserPlus
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { useModal } from '@/components/modals/ModalContext';
import * as collections from '@/collections';
import { getCompanyLogoJoinSelect } from '@/lib/utils/getCompanyLogoJoinSelect';

const ProjectDashboard = () => {
  const router = useRouter();
  const { openModal } = useModal();
  const supabase = createClient();
  
  // State
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    maintained: 0,
    onboarding: 0,
    delayed: 0,
    suspended: 0,
    abandoned: 0,

    
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [showingAll, setShowingAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const config = collections.project;

  // Calculate task completion percentage
  const getTaskCompletion = (project) => {
    if (!project?.tasks || project.tasks.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const total = project.tasks.length;
    const completed = project.tasks.filter(taskRelation => 
      taskRelation?.task?.status === 'complete'
    ).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Use the company logo join function to get proper company data with logos and tasks
      const selectQuery = `
        *,
        company:company_id (
          id,
          title,
          chip_color,
          media:thumbnail_id (
            id,
            url
          )
        ),
        contacts:contact_project(
          contact:contact_id(title, email)
        ),
        tasks:project_task(
          task:task_id(
            id,
            status,
            title
          )
        )
      `;

      const { data: projectsData, error: projectsError } = await supabase
        .from('project')
        .select(selectQuery)
        .order('updated_at', { ascending: false });

      if (projectsError) throw projectsError;

      setProjects(projectsData || []);

      // Calculate stats
      const totalProjects = projectsData?.length || 0;
      const inProgressCount = projectsData?.filter(p => p.status === 'in_progress')?.length || 0;
      const maintainedCount = projectsData?.filter(p => p.status === 'maintained')?.length || 0;
      const onboardingCount = projectsData?.filter(p => p.status === 'onboarding')?.length || 0;
      const delayedCount = projectsData?.filter(p => p.status === 'delayed')?.length || 0;
      const suspendedCount = projectsData?.filter(p => p.status === 'suspended')?.length || 0;
      const abandonedCount = projectsData?.filter(p => p.status === 'abandoned')?.length || 0;


      setStats({
        total: totalProjects,
        inProgress: inProgressCount,
        maintained: maintainedCount,
        onboarding: onboardingCount,
        delayed: delayedCount,
        suspended: suspendedCount,
        abandoned: abandonedCount,
   
      });

      // Filter non-archived projects
      const nonArchivedProjects = projectsData?.filter(p => p.status !== 'archived') || [];

      // Set up initial display with smart sorting
      updateDisplayedProjects(nonArchivedProjects);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Smart sort function - prioritizes outstanding tasks → in progress → onboarding
  const smartSort = (projectsToSort) => {
    return [...projectsToSort].sort((a, b) => {
      const aCompletion = getTaskCompletion(a);
      const bCompletion = getTaskCompletion(b);
      
      // Priority 1: Projects with outstanding tasks (incomplete tasks)
      const aHasOutstandingTasks = aCompletion.total > 0 && aCompletion.percentage < 100;
      const bHasOutstandingTasks = bCompletion.total > 0 && bCompletion.percentage < 100;
      
      // Priority 2: In progress projects
      const aIsInProgress = a.status === 'in_progress';
      const bIsInProgress = b.status === 'in_progress';
      
      // Priority 3: Onboarding projects
      const aIsOnboarding = a.status === 'onboarding';
      const bIsOnboarding = b.status === 'onboarding';
      
      // Sort by priority order
      if (aHasOutstandingTasks && !bHasOutstandingTasks) return -1;
      if (!aHasOutstandingTasks && bHasOutstandingTasks) return 1;
      
      // If both have outstanding tasks, sort by completion percentage (lowest first)
      if (aHasOutstandingTasks && bHasOutstandingTasks) {
        if (aCompletion.percentage !== bCompletion.percentage) {
          return aCompletion.percentage - bCompletion.percentage;
        }
      }
      
      // If neither has outstanding tasks, sort by status priority
      if (!aHasOutstandingTasks && !bHasOutstandingTasks) {
        if (aIsInProgress && !bIsInProgress) return -1;
        if (!aIsInProgress && bIsInProgress) return 1;
        
        if (aIsOnboarding && !bIsOnboarding) return -1;
        if (!aIsOnboarding && bIsOnboarding) return 1;
      }
      
      // Final sort by updated_at (most recent first)
      return new Date(b.updated_at) - new Date(a.updated_at);
    });
  };

  // Update displayed projects based on current filters
  const updateDisplayedProjects = (allProjects) => {
    let filteredProjects = allProjects;

    // Apply status filter if set
    if (statusFilter) {
      filteredProjects = allProjects.filter(p => p.status === statusFilter);
    }

    // Apply smart sorting to filtered results
    const sortedFilteredProjects = smartSort(filteredProjects);

    // Show all or just recent 6
    const projectsToShow = showingAll ? sortedFilteredProjects : sortedFilteredProjects.slice(0, 6);
    setRecentProjects(projectsToShow);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update displayed projects when filters change
  useEffect(() => {
    const nonArchivedProjects = projects.filter(p => p.status !== 'archived');
    updateDisplayedProjects(nonArchivedProjects);
  }, [showingAll, statusFilter, projects]);

  // Handle view all toggle
  const handleViewAll = () => {
    setShowingAll(!showingAll);
    setStatusFilter(null); // Clear any status filter when toggling view all
  };

  // Handle status filter
  const handleStatusFilter = (status) => {
    setStatusFilter(status === statusFilter ? null : status); // Toggle filter
    if (!showingAll) {
      setShowingAll(true); // Show all when filtering
    }
  };

  // Filter projects based on search
  const filteredProjects = projects.filter(project =>
    project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.company?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Status label mapping - converts database values to display labels
  const getStatusLabel = (status) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'maintained': return 'Maintained';
      case 'onboarding': return 'Onboarding';
      case 'delayed': return 'Delayed';
      case 'suspended': return 'Suspended';
      case 'abandoned': return 'Abandoned';
      case 'archived': return 'Archived';

      default: return status?.replace('_', ' ') || 'Unknown';
    }
  };

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress': return 'primary';
      case 'maintained': return 'success';
      case 'onboarding': return 'info'; // Onboarding - yellow
      case 'delayed': return 'warning';
      case 'suspended': return 'error'; // Red
      case 'abandoned': return 'default'; // Will be styled black
      case 'archived': return 'default';

      default: return 'default';
    }
  };

  // Custom chip styling for abandoned (black) and onboarding (yellow)
  const getChipSx = (status) => {
    if (status === 'abandoned') {
      return {
        backgroundColor: '#000000',
        color: '#ffffff',
        '& .MuiChip-label': {
          color: '#ffffff'
        }
      };
    }
    if (status === 'onboarding') { // Onboarding
      return {
        backgroundColor: 'info', // Orange/yellow color
        color: '#ffffff',
        '& .MuiChip-label': {
          color: '#ffffff'
        }
      };
    }
    return {};
  };

  // Get button color for status filters
  const getButtonColor = (status) => {
    switch (status) {
      case 'in_progress': return 'primary';
      case 'onboarding': return 'info';
      case 'delayed': return 'warning';
      case 'suspended': return 'error';
      case 'abandoned': return 'inherit'; // Will use custom styling

      default: return 'primary';
    }
  };

  // Get button styling for abandoned status and onboarding
  const getButtonSx = (status, isActive) => {
    if (status === 'abandoned') {
      return {
        backgroundColor: isActive ? '#000000' : 'transparent',
        color: isActive ? '#ffffff' : '#000000',
        borderColor: '#000000',
        '&:hover': {
          backgroundColor: '#333333',
          color: '#ffffff'
        }
      };
    }
    if (status === 'onboarding' && isActive) { // Onboarding
      return {
        backgroundColor: 'info',
        borderColor: '#ed6c02',
        color: '#ffffff',
        '&:hover': {
          backgroundColor: '#d57102'
        }
      };
    }
    return {};
  };

  // Status progress calculation
  const getStatusProgress = (status) => {
    switch (status) {
      case 'onboarding': return 25;
      case 'in_progress': return 65;
      case 'maintained': return 100;
      case 'delayed': return 40;
      case 'suspended': return 20;
      case 'abandoned': return 10;
      case 'archived': return 100;
      default: return 0;
    }
  };

  // Handle project menu
  const handleMenuClick = (event, project) => {
    setMenuAnchor(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedProject(null);
  };

  // Quick actions
  const handleViewProject = (project) => {
    openModal('edit', {
      config,
      defaultValues: project,
    });
    handleMenuClose();
  };

  const handleEditProject = (project) => {
    openModal('edit', {
      config,
      defaultValues: project,
    });
    handleMenuClose();
  };

  // Get company logo URL
  const getCompanyLogoUrl = (project) => {
    return project?.company?.media?.url || null;
  };

  // Get company initials for avatar fallback
  const getCompanyInitials = (project) => {
    const companyName = project?.company?.title || project?.title;
    if (!companyName) return 'P';
    return companyName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
  };

  // Task completion gauge component
  const TaskCompletionGauge = ({ project }) => {
    const { completed, total, percentage } = getTaskCompletion(project);
    
    if (total === 0 || project.status !== 'in_progress') {
      return null;
    }

    return (
      <Box sx={{ position: 'relative', display: 'inline-flex', ml: 2 }}>
        <CircularProgress
          variant="determinate"
          value={percentage}
          size={40}
          thickness={4}
          sx={{
            color: percentage === 100 ? 'success.500' : 'white',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="caption"
            component="div"
            color="text.secondary"
            fontWeight="bold"
            fontSize="10px"
          >
            {percentage}%
          </Typography>
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          Projects Dashboard
        </Typography>
        
        {/* Search */}
        <TextField
          placeholder="Search projects or companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MagnifyingGlass size={20} />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Projects
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.total}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'white', width: 56, height: 56 }}>
                  <Folder size={28} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    In Progress
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.600">
                    {stats.inProgress}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.100', color: 'primary.600', width: 56, height: 56 }}>
                  <Clock size={28} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Maintained
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.600">
                    {stats.maintained}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.100', color: 'success.600', width: 56, height: 56 }}>
                  <CheckCircle size={28} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Onboarding
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="info.600">
                    {stats.onboarding}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.100', color: 'warning.600', width: 56, height: 56 }}>
                  <Warning size={28} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Projects */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  {showingAll 
                    ? (statusFilter ? `${getStatusLabel(statusFilter)} Projects` : 'All Projects')
                    : 'Recent Projects'
                  }
                </Typography>
                <Button
                  endIcon={<ArrowRight />}
                  onClick={handleViewAll}
                >
                  {showingAll ? 'Show Recent' : 'View All'}
                </Button>
              </Stack>
              
              <List>
                {recentProjects.map((project, index) => (
                  <Box key={project.id}>
                    <ListItem
                      sx={{
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                        cursor: 'pointer'
                      }}
                      onClick={() => handleViewProject(project)}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={getCompanyLogoUrl(project)}
                          sx={{
                            bgcolor: 'white', // Always white background
                            width: 48,
                            height: 48
                          }}
                        >
                          {getCompanyInitials(project)}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {project.title}
                            </Typography>
                            <Chip
                              label={getStatusLabel(project.status)}
                              color={getStatusColor(project.status)}
                              size="small"
                              sx={getChipSx(project.status)}
                            />
                            <TaskCompletionGauge project={project} />
                          </Stack>
                        }
                        secondary={
                          <Box component="div">
                            <Typography variant="body2" color="text.secondary" component="div">
                              {project.company?.title || 'No Company'}
                            </Typography>
                            
                            {/* Progress bar */}
                            <Box sx={{ mt: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={getStatusProgress(project.status)}
                                sx={{ height: 6, borderRadius: 3 }}
                                color={getStatusColor(project.status)}
                              />
                            </Box>
                            
                            {/* Project details */}
                            <Box component="div" sx={{ mt: 1 }}>
                              <Stack direction="row" spacing={2}>
                                {project.url && (
                                  <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <Globe size={14} />
                                    <Typography variant="caption" component="span">Live</Typography>
                                  </Stack>
                                )}

                                {(project.status === 'onboarding' || project.status === 'in_progress') && project.staging_url && (
                                  <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <Globe size={14} style={{ opacity: 0.7 }} />
                                    <Typography variant="caption" component="span">Staging</Typography>
                                  </Stack>
                                )}
                                
                                {project.launch_date && (
                                  <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <Calendar size={14} />
                                    <Typography variant="caption" component="span">
                                      {new Date(project.launch_date).toLocaleDateString()}
                                    </Typography>
                                  </Stack>
                                )}
                                
                                {project.contacts?.length > 0 && (
                                  <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <Users size={14} />
                                    <Typography variant="caption" component="span">
                                      {project.contacts.length} contact{project.contacts.length !== 1 ? 's' : ''}
                                    </Typography>
                                  </Stack>
                                )}

                                {project.tasks?.length > 0 && (
                                  <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <CheckCircle size={14} />
                                    <Typography variant="caption" component="span">
                                      {getTaskCompletion(project).completed}/{getTaskCompletion(project).total} tasks
                                    </Typography>
                                  </Stack>
                                )}
                              </Stack>
                            </Box>
                          </Box>
                        }
                        secondaryTypographyProps={{
                          component: 'div'
                        }}
                      />
                      
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuClick(e, project);
                          }}
                        >
                          <DotsThreeVertical />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    {index < recentProjects.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
              
              {recentProjects.length === 0 && (
                <Alert severity="info">
                  {statusFilter 
                    ? `No ${getStatusLabel(statusFilter).toLowerCase()} projects found.`
                    : 'No projects found. Create your first project to get started!'
                  }
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats & Actions */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Status Distribution */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Project Status
                </Typography>
                
                <Stack spacing={2}>
                  {[
                    { label: 'In Progress', count: stats.inProgress, color: 'primary', status: 'in_progress' },
                    { label: 'Maintained', count: stats.maintained, color: 'success', status: 'maintained' },
                    { label: 'Onboarding', count: stats.onboarding, color: 'info', status: 'onboarding' },

                    { label: 'Delayed', count: stats.delayed, color: 'warning', status: 'delayed' },
                    { label: 'Suspended', count: stats.suspended, color: 'error', status: 'suspended' },
                    { label: 'Abandoned', count: stats.abandoned, color: 'inherit', status: 'abandoned' },
                  ].map((item) => (
                    <Box key={item.label}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2">{item.label}</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {item.count}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={stats.total > 0 ? (item.count / stats.total) * 100 : 0}
                        color={item.color}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          ...(item.status === 'abandoned' && {
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#000000'
                            }
                          }),
                          ...(item.status === 'onboarding' && {
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: 'info'
                            }
                          })
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Quick Filters */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Quick Filters
                </Typography>
                
                <Stack spacing={1}>
                  <Button
                    variant={statusFilter === 'in_progress' ? 'contained' : 'outlined'}
                    color={getButtonColor('in_progress')}
                    startIcon={<TrendUp />}
                    fullWidth
                    onClick={() => handleStatusFilter('in_progress')}
                  >
                    Active Projects
                  </Button>
                  
                  <Button
                    variant={statusFilter === 'onboarding' ? 'contained' : 'outlined'}
                    color={getButtonColor('onboarding')}
                    startIcon={<Warning />}
                    fullWidth
                    onClick={() => handleStatusFilter('onboarding')}
                    sx={getButtonSx('onboarding', statusFilter === 'onboarding')}
                  >
                    Onboarding
                  </Button>



                  <Button
                    variant={statusFilter === 'delayed' ? 'contained' : 'outlined'}
                    color={getButtonColor('delayed')}
                    startIcon={<Warning />}
                    fullWidth
                    onClick={() => handleStatusFilter('delayed')}
                  >
                    Delayed
                  </Button>

                  <Button
                    variant={statusFilter === 'suspended' ? 'contained' : 'outlined'}
                    color={getButtonColor('suspended')}
                    startIcon={<Pause />}
                    fullWidth
                    onClick={() => handleStatusFilter('suspended')}
                  >
                    Suspended
                  </Button>

                  <Button
                    variant={statusFilter === 'abandoned' ? 'contained' : 'outlined'}
                    color={getButtonColor('abandoned')}
                    startIcon={<X />}
                    fullWidth
                    onClick={() => handleStatusFilter('abandoned')}
                    sx={getButtonSx('abandoned', statusFilter === 'abandoned')}
                  >
                    Abandoned
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<GridFour />}
                    fullWidth
                    onClick={() => router.push('/dashboard/project?view=grid')}
                  >
                    Browse All Projects
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewProject(selectedProject)}>
          <Globe size={18} style={{ marginRight: 8 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleEditProject(selectedProject)}>
          <Calendar size={18} style={{ marginRight: 8 }} />
          Edit Project
        </MenuItem>
        {selectedProject?.url && (
          <MenuItem onClick={() => window.open(selectedProject.url, '_blank')}>
            <Rocket size={18} style={{ marginRight: 8 }} />
            Visit Live Site
          </MenuItem>
        )}
        {selectedProject?.staging_url && (
          <MenuItem onClick={() => window.open(selectedProject.staging_url, '_blank')}>
            <Globe size={18} style={{ marginRight: 8, opacity: 0.7 }} />
            Visit Staging Site
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default ProjectDashboard;