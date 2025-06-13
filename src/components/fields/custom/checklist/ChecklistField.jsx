// components/fields/custom/checklist/ChecklistField.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Plus } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';
import { getCurrentContactId } from '@/lib/utils/getCurrentContactId';
import ChecklistSection from './ChecklistSection';

// Entity configurations for different types
const ENTITY_CONFIGS = {
  event: {
    table: 'event',
    checklistField: 'event_id',
    participantQuery: 'fetchEventParticipants',
    defaultName: 'Action Items',
    createFunction: 'createEventChecklist',
    fetchFunction: 'fetchEventChecklists'
  },
  project: {
    table: 'project',
    checklistField: 'project_id', 
    participantQuery: 'fetchProjectMembers',
    defaultName: 'Project Tasks',
    createFunction: 'createProjectChecklist',
    fetchFunction: 'fetchProjectChecklists'
  },
  contract: {
    table: 'contract',
    checklistField: 'contract_id',
    participantQuery: 'fetchContractParties', 
    defaultName: 'Deliverables',
    createFunction: 'createContractChecklist',
    fetchFunction: 'fetchContractChecklists'
  }
};

export default function ChecklistField({
  entityType = 'event',
  entityId,
  field,
  value,
  editable = true,
  onChange,
  variant = 'embedded', // 'compact', 'embedded', 'full'
  title,
  allowCreate = true,
  allowReorder = true,
  defaultChecklistName,
  assignableContacts = [],
  maxChecklists,
  showProgress = true,
  ...props
}) {
  const [checklists, setChecklists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const supabase = createClient();

  // Get entity configuration
  const entityConfig = ENTITY_CONFIGS[entityType];
  if (!entityConfig) {
    console.error(`Unsupported entity type: ${entityType}`);
    return <Alert severity="error">Unsupported entity type: {entityType}</Alert>;
  }

  const displayTitle = title || field?.label || `${entityType} Checklists`;
  const defaultName = defaultChecklistName || entityConfig.defaultName;

  // Fetch checklists for this entity
  const fetchChecklists = useCallback(async () => {
    if (!entityId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Import the appropriate query function dynamically
      const { table } = await import('@/lib/supabase/queries');
      const entityQueries = table[entityType];
      
      if (!entityQueries) {
        throw new Error(`No queries found for entity type: ${entityType}`);
      }

      if (!entityQueries[entityConfig.fetchFunction]) {
        throw new Error(`Missing query function: ${entityConfig.fetchFunction} for ${entityType}`);
      }

      console.log(`[ChecklistField] Fetching ${entityType} checklists for ID:`, entityId);
      const { data, error } = await entityQueries[entityConfig.fetchFunction](entityId);
      
      if (error) {
        console.error(`Error fetching ${entityType} checklists:`, error);
        setError(error.message || JSON.stringify(error));
        return;
      }

      console.log(`[ChecklistField] Fetched ${entityType} checklists:`, data);
      setChecklists(data || []);

    } catch (err) {
      console.error(`[ChecklistField] Error fetching checklists:`, err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType, entityConfig]);

  // Fetch participants for task assignment
  const fetchParticipants = useCallback(async () => {
    if (!entityId || assignableContacts.length > 0) return;

    try {
      const { table } = await import('@/lib/supabase/queries');
      const entityQueries = table[entityType];
      
      if (entityQueries && entityQueries[entityConfig.participantQuery]) {
        const { data, error } = await entityQueries[entityConfig.participantQuery](entityId);
        
        if (!error && data) {
          setParticipants(data);
        }
      }
    } catch (err) {
      console.error(`[ChecklistField] Error fetching participants:`, err);
    }
  }, [entityId, entityType, entityConfig, assignableContacts]);

  // Initial data fetch
  useEffect(() => {
    fetchChecklists();
    fetchParticipants();
  }, [fetchChecklists, fetchParticipants]);

  // Create a new checklist
  const handleCreateChecklist = async (title) => {
    if (!entityId) return;

    try {
      const currentUserId = await getCurrentContactId();
      const { table } = await import('@/lib/supabase/queries');
      const entityQueries = table[entityType];

      const { data, error } = await entityQueries[entityConfig.createFunction](
        entityId,
        title || defaultName,
        currentUserId,
        entityType
      );

      if (error) {
        console.error('Error creating checklist:', error);
        setError(error.message);
        return;
      }

      console.log('[ChecklistField] Checklist created:', data);
      
      // Add to local state
      setChecklists(prev => [...prev, data]);
      
      // Notify parent component if onChange provided
      if (onChange) {
        onChange([...checklists, data]);
      }

    } catch (err) {
      console.error('[ChecklistField] Error creating checklist:', err);
      setError(err.message);
    }
  };

  // Handle checklist updates
  const handleChecklistUpdate = useCallback((updatedChecklists) => {
    setChecklists(updatedChecklists);
    
    if (onChange) {
      onChange(updatedChecklists);
    }
  }, [onChange]);

  // Check if we can create more checklists
  const canCreateMore = !maxChecklists || checklists.length < maxChecklists;

  // Auto-create default checklist if none exist and we have an entity ID
  useEffect(() => {
    if (entityId && checklists.length === 0 && !isLoading && allowCreate && defaultName) {
      const hasDefaultChecklist = checklists.some(cl => cl.title === defaultName);
      
      if (!hasDefaultChecklist) {
        // Small delay to avoid race conditions
        const timer = setTimeout(() => {
          handleCreateChecklist(defaultName);
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [entityId, checklists.length, isLoading, allowCreate, defaultName]);

  if (!entityId) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">
          Save the {entityType} to manage checklists
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading checklists: {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      {variant !== 'compact' && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2 
        }}>
          

        </Box>
      )}

      {/* Checklist Section */}
      <ChecklistSection
        entityType={entityType}
        entityId={entityId}
        checklists={checklists}
        isLoading={isLoading}
        editable={editable}
        variant={variant}
        allowCreate={allowCreate && canCreateMore}
        allowReorder={allowReorder}
        assignableContacts={assignableContacts.length > 0 ? assignableContacts : participants}
        showProgress={showProgress}
        onChecklistsUpdate={handleChecklistUpdate}
        onCreateChecklist={handleCreateChecklist}
        defaultChecklistName={defaultName}
        {...props}
      />
    </Box>
  );
}