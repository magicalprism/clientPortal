'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Select,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import { CaretLeft, CaretRight, Calendar, CheckCircle } from '@phosphor-icons/react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { useModal } from '@/components/modals/ModalContext';
import { CalendarPage } from '@/components/views/calendar/CalendarPage';
import { getCompanyLogoJoinSelect } from '@/lib/utils/getCompanyLogoJoinSelect';
import * as collections from '@/collections';
import { table } from '@/lib/supabase/queries';

const supabase = createClient();
const allowedViews = ['dayGridMonth', 'timeGridWeek', 'listWeek'];

export default function UniversalCalendarView({ filters = {} }) {
  const [calendarItems, setCalendarItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTasks, setShowTasks] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  
  // Compute visible collections based on switch states
  const visibleCollections = useMemo(() => {
    const collections = [];
    if (showTasks) collections.push('task');
    if (showEvents) collections.push('event');
    return collections;
  }, [showTasks, showEvents]);
  
  const { openModal } = useModal();
  const searchParams = useSearchParams();
  const rawView = searchParams.get('view');
  const view = allowedViews.includes(rawView) ? rawView : 'dayGridMonth';

  const calendarRef = useRef(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Stats
  const [stats, setStats] = useState({
    tasks: { total: 0, completed: 0 },
    events: { total: 0, completed: 0 }
  });

  // Get calendar API reference
  const getCalendarApi = () => calendarRef.current?.getApi();

  // Update calendar date without triggering infinite loops
  const updateCalendarDate = (date) => {
    const api = getCalendarApi();
    if (api) {
      api.gotoDate(date);
      setCurrentDate(new Date(api.getDate()));
    }
  };

  // Navigation handlers
  const handlePrev = () => {
    const api = getCalendarApi();
    if (api) {
      api.prev();
      setCurrentDate(new Date(api.getDate()));
    }
  };

  const handleNext = () => {
    const api = getCalendarApi();
    if (api) {
      api.next();
      setCurrentDate(new Date(api.getDate()));
    }
  };

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    const newDate = new Date(currentDate);
    newDate.setMonth(newMonth);
    updateCalendarDate(newDate);
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    const newDate = new Date(currentDate);
    newDate.setFullYear(newYear);
    updateCalendarDate(newDate);
  };

  // Handle toggle changes
  const handleTasksToggle = (event) => {
    setShowTasks(event.target.checked);
  };
  
  const handleEventsToggle = (event) => {
    setShowEvents(event.target.checked);
  };

  // Use a ref to track if we're already fetching data
  const isFetchingRef = useRef(false);
  
  // Stabilize the filters object
  const stableFilters = useMemo(() => filters, [JSON.stringify(filters)]);
  
  // Fetch data function (not memoized to avoid dependency issues)
  const fetchData = async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      // Get calendar date range
      const api = getCalendarApi();
      let startDate, endDate;
      
      if (api) {
        const view = api.view;
        startDate = view.activeStart;
        endDate = view.activeEnd;
      } else {
        // Fallback: use current month
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
      
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      // Prepare results
      let tasks = [];
      let events = [];
      let taskStats = { total: 0, completed: 0 };
      let eventStats = { total: 0, completed: 0 };
      
      // Fetch tasks if visible
      if (visibleCollections.includes('task')) {
        const taskFilters = { ...stableFilters };
        
        // Apply date range filter for tasks - use range filters instead of exact match
        // We want tasks that:
        // 1. Start within the visible range, OR
        // 2. Are due within the visible range, OR
        // 3. Span across the visible range (start before and due after)
        
        // We'll handle this with a custom filter function after fetching
        // For now, fetch all tasks in a wider date range to ensure we get everything
        
        // Get tasks with start_date or due_date in the visible range
        try {
          // First, get all tasks in the date range with a single query
          // This simplifies our approach and avoids potential query parameter issues
          const { data: allTasksInRange, error: taskError } = await table.task.fetchTasksWithFilters({
            ...stableFilters
          });
          
          // Initialize taskData outside the if block
          let taskData = [];
          
          // If we have tasks, filter them client-side to find those relevant to our date range
          if (allTasksInRange && allTasksInRange.length > 0) {
            console.log(`[UniversalCalendarView] Found ${allTasksInRange.length} tasks, filtering for date range`);
            
            // Convert date strings to Date objects for comparison
            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);
            
            // Filter tasks that are relevant to our date range
            taskData = allTasksInRange.filter(task => {
              // Skip tasks without dates
              if (!task.start_date && !task.due_date) return false;
              
              // Convert task dates to Date objects
              const taskStartDate = task.start_date ? new Date(task.start_date) : null;
              const taskDueDate = task.due_date ? new Date(task.due_date) : null;
              
              // Include task if:
              // 1. It starts within the visible range
              const startsInRange = taskStartDate && taskStartDate >= startDate && taskStartDate <= endDate;
              
              // 2. It's due within the visible range
              const dueInRange = taskDueDate && taskDueDate >= startDate && taskDueDate <= endDate;
              
              // 3. It spans across the visible range (starts before and due after)
              const spansRange = taskStartDate && taskDueDate && 
                                taskStartDate <= startDate && taskDueDate >= endDate;
              
              return startsInRange || dueInRange || spansRange;
            });
            
            console.log(`[UniversalCalendarView] Filtered to ${taskData.length} tasks in the date range`);
          }
          
          // Combine all tasks and remove duplicates
          if (taskError) {
            console.error('[UniversalCalendarView] Error fetching tasks:', taskError);
            setError('Failed to fetch tasks. Please try again.');
          } else if (taskData && taskData.length > 0) {
        
            // Transform tasks for calendar
            tasks = taskData.map(task => ({
              id: task.id, // Top-level ID for FullCalendar
              title: task.title,
              start: new Date(task.start_date || task.due_date || task.created_at),
              end: new Date(task.due_date || task.start_date),
              allDay: task.type !== 'meeting',
              extendedProps: {
                ...task,
                id: task.id, // Include ID in extendedProps too
                collection: 'task',
                type: task.type,
                status: task.status,
                company_thumbnail_url: task.company?.media?.url || null
              }
            }));
            
            // Calculate stats
            taskStats.total = taskData.length;
            taskStats.completed = taskData.filter(task => task.status === 'complete').length;
          } else {
            console.log('[UniversalCalendarView] No tasks found in the date range');
          }
        } catch (taskError) {
          console.error('[UniversalCalendarView] Error fetching tasks:', taskError);
          setError('Failed to fetch tasks. Please try again.');
        }
      }
      
      // Fetch events if visible
      if (visibleCollections.includes('event')) {
        try {
          const { data: eventData, error: eventError } = await table.event.fetchEventsForCalendar(
            startDateStr,
            endDateStr,
            stableFilters
          );
          
          if (eventError) {
            console.error('[UniversalCalendarView] Error fetching events:', eventError);
            setError(prev => prev || 'Failed to fetch events. Please try again.');
          } else if (eventData) {
            // Transform events for calendar
            events = eventData.map(event => ({
              id: event.id, // Top-level ID for FullCalendar
              title: event.title,
              start: new Date(event.start_time),
              end: new Date(event.end_time),
              allDay: event.all_day,
              extendedProps: {
                ...event,
                id: event.id, // Include ID in extendedProps too
                collection: 'event',
                type: event.type,
                status: event.status
              }
            }));
            
            // Calculate stats
            eventStats.total = eventData.length;
            eventStats.completed = eventData.filter(event => event.status === 'completed').length;
          }
        } catch (eventError) {
          console.error('[UniversalCalendarView] Error fetching events:', eventError);
          setError(prev => prev || 'Failed to fetch events. Please try again.');
        }
      }
      
      // Combine and set data
      const combinedItems = [...tasks, ...events];
      setCalendarItems(combinedItems);
      
      // Update stats
      setStats({
        tasks: taskStats,
        events: eventStats
      });
      
    } catch (error) {
      console.error('[UniversalCalendarView] Error fetching data:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
    // We're explicitly listing dependencies to control when fetchData is called
  }, [visibleCollections, stableFilters]);

  // Update calendar when it's mounted and handle view changes
  useEffect(() => {
    const api = getCalendarApi();
    if (api) {
      // Initial setup of the calendar
      setCurrentDate(new Date(api.getDate()));
      
      // Add event listener for view changes
      const handleViewChange = () => {
        fetchData();
      };
      
      // Add event listener to calendar
      api.on('datesSet', handleViewChange);
      
      // Clean up
      return () => {
        if (api) {
          api.off('datesSet', handleViewChange);
        }
      };
    }
  }, []);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  // Calculate total stats
  const totalItems = stats.tasks.total + stats.events.total;
  const totalCompleted = stats.tasks.completed + stats.events.completed;

  return (
    <Box sx={{ px: 2 }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
        flexWrap="wrap"
        gap={2}
      >
        <Typography variant="h5">
          Universal Calendar
        </Typography>
      </Stack>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters and Stats Card */}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="subtitle1">
                  Show/Hide
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showTasks}
                        onChange={handleTasksToggle}
                        color="primary"
                        size="small"
                      />
                    }
                    label={<Typography variant="body1">Tasks</Typography>}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showEvents}
                        onChange={handleEventsToggle}
                        color="primary"
                        size="small"
                      />
                    }
                    label={<Typography variant="body1">Events</Typography>}
                  />
                </Box>
              </Box>
            </Box>
            
            {/* Right side - Stats */}
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle1" gutterBottom>
                Overview
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {totalItems} total
                </Typography>
                {totalCompleted > 0 && (
                  <Chip 
                    icon={<CheckCircle size={14} />}
                    label={`${totalCompleted} completed`}
                    size="small" 
                    color="success" 
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Calendar Navigation */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
        flexWrap="wrap"
        gap={2}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={handlePrev}><CaretLeft /></IconButton>
          <Typography variant="h6">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </Typography>
          <IconButton onClick={handleNext}><CaretRight /></IconButton>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Select size="small" value={month} onChange={handleMonthChange}>
            {Array.from({ length: 12 }).map((_, i) => (
              <MenuItem key={i} value={i}>
                {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
              </MenuItem>
            ))}
          </Select>
          <Select size="small" value={year} onChange={handleYearChange}>
            {Array.from({ length: 10 }).map((_, i) => {
              const y = new Date().getFullYear() - 5 + i;
              return (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              );
            })}
          </Select>
        </Stack>
      </Stack>

      {/* Loading indicator */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, mb: 2 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading calendar data...
          </Typography>
        </Box>
      )}

      {/* Calendar */}
      <CalendarPage
        ref={calendarRef}
        view={view}
        tasks={calendarItems}
        onTaskClick={(eventData) => {
          try {
            // Log the raw event data for debugging
            console.log('[UniversalCalendarView] Raw event data:', eventData);
            
            // Get the ID from the event - it should be in extendedProps now
            const id = eventData.id;
            const configName = eventData.collection || 'task';
            const fullConfig = collections[configName];
            
            if (!fullConfig) {
              console.error(`[UniversalCalendarView] Unknown collection: ${configName}`);
              setError(`Unable to open item: unknown collection type "${configName}"`);
              return;
            }
            
            // Log detailed information for debugging
            console.log('[UniversalCalendarView] Opening edit modal for:', {
              id,
              collection: configName,
              config: fullConfig.name
            });
            
            // Use the direct approach from KanbanTaskCard.js
            openModal('edit', { 
              config: fullConfig,
              recordId: id
            });
          } catch (error) {
            console.error('[UniversalCalendarView] Error opening item:', error);
            setError('Failed to open item. Please try again.');
          }
        }}
      />
    </Box>
  );
}