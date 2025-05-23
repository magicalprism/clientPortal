'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Alert
} from '@mui/material';
import { X as XIcon, PencilSimple, Plus } from '@phosphor-icons/react';
import { CollectionItemPage } from '@/components/views/collectionItem/CollectionItemPage';
import { createClient } from '@/lib/supabase/browser';
import { saveMultiRelationships } from '@/lib/utils/multirelationshipUtils';

export const CollectionEditPopover = ({
  open,
  onClose,
  onComplete,
  config, // Collection configuration (e.g., media config)
  record = null, // Existing record for editing, null for creating
  defaultValues = {},
  isEditing = false,
  title = null // Custom title override
}) => {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [localRecord, setLocalRecord] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Determine if we're creating or editing
  const isCreating = !record?.id && !isEditing;
  const modalTitle = title || (isCreating ? 
    `Create ${config?.singularLabel || config?.label || 'Item'}` : 
    `Edit ${config?.singularLabel || config?.label || 'Item'}`
  );

  // Initialize local record
  useEffect(() => {
    if (open) {
      if (isCreating) {
        // For creating, start with default values
        const initialRecord = {
          ...defaultValues,
          // Add any required defaults based on config
          ...getDefaultValuesFromConfig(config)
        };
        console.log('[CollectionEditModal] Initializing for create:', initialRecord);
        setLocalRecord(initialRecord);
      } else if (record) {
        // For editing, use the provided record
        console.log('[CollectionEditModal] Initializing for edit:', JSON.stringify(record, null, 2));
        setLocalRecord({ ...record });
      }
      setError('');
      setHasUnsavedChanges(false);
    } else {
      // Clean up when modal closes
      setLocalRecord(null);
      setError('');
      setHasUnsavedChanges(false);
    }
  }, [open, record?.id, defaultValues, isCreating, config]); // Be more specific with dependencies

  // Get default values based on field configuration
  const getDefaultValuesFromConfig = (config) => {
    const defaults = {};
    
    if (!config?.fields) return defaults;
    
    config.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue;
      } else {
        // Set type-based defaults
        switch (field.type) {
          case 'boolean':
            defaults[field.name] = false;
            break;
          case 'multiRelationship':
            defaults[field.name] = [];
            break;
          case 'select':
          case 'status':
            if (field.options?.[0]?.value) {
              defaults[field.name] = field.options[0].value;
            }
            break;
          default:
            // Don't set defaults for other types
            break;
        }
      }
    });
    
    return defaults;
  };

  // Handle record updates from CollectionItemPage
  const handleRecordUpdate = useCallback((updatedRecord) => {
    console.log('[CollectionEditModal] Record updated:', updatedRecord);
    setLocalRecord(prevRecord => {
      // Only update if the record actually changed
      if (JSON.stringify(prevRecord) !== JSON.stringify(updatedRecord)) {
        setHasUnsavedChanges(true);
        return updatedRecord;
      }
      return prevRecord;
    });
  }, []);

  // Handle save action
  const handleSave = async () => {
    if (!localRecord || !config) {
      setError('Missing record or configuration data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let savedRecord;

      if (isCreating) {
        // Create new record
        const createData = { ...localRecord };
        
        // Remove any undefined or null values that shouldn't be inserted
        Object.keys(createData).forEach(key => {
          if (createData[key] === undefined) {
            delete createData[key];
          }
          // Handle empty arrays for multiRelationship fields
          if (Array.isArray(createData[key]) && createData[key].length === 0) {
            const field = config.fields?.find(f => f.name === key);
            if (field?.type === 'multiRelationship') {
              delete createData[key]; // Don't insert empty arrays
            }
          }
        });

        console.log('[CollectionItemModal] Creating record:', createData);

        const { data, error: createError } = await supabase
          .from(config.name)
          .insert(createData)
          .select()
          .single();

        if (createError) throw createError;
        savedRecord = data;

        // Handle multiRelationships for new record
        if (savedRecord?.id) {
          await saveMultiRelationships({ config, record: { ...localRecord, id: savedRecord.id } });
        }
      } else {
        // Update existing record
        const updateData = { ...localRecord };
        
        // Remove fields that shouldn't be updated
        delete updateData.id;
        delete updateData.created_at;
        delete updateData.updated_at;
        
        // Remove detail fields (they're handled by saveMultiRelationships)
        Object.keys(updateData).forEach(key => {
          if (key.endsWith('_details')) {
            delete updateData[key];
          }
        });

        console.log('[CollectionItemModal] Updating record:', updateData);

        const { data, error: updateError } = await supabase
          .from(config.name)
          .update(updateData)
          .eq('id', localRecord.id)
          .select()
          .single();

        if (updateError) throw updateError;
        savedRecord = data;

        // Handle multiRelationships for updated record
        await saveMultiRelationships({ config, record: localRecord });
      }

      console.log('[CollectionItemModal] Successfully saved:', savedRecord);

      // Call completion handler
      onComplete(savedRecord);
      handleClose();

    } catch (err) {
      console.error('[CollectionItemModal] Save error:', err);
      setError(err.message || `Failed to ${isCreating ? 'create' : 'update'} ${config.singularLabel || 'item'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setLocalRecord(null);
    setError('');
    setHasUnsavedChanges(false);
    onClose();
  };

  // Don't render if no record is ready
  if (!localRecord) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      fullWidth 
      maxWidth="md"
      // Ensure this modal appears above other modals and doesn't interfere
      sx={{
        '& .MuiDialog-paper': {
          zIndex: 1500, // Higher than other modals
          maxHeight: '90vh'
        }
      }}
      // Prevent backdrop clicks from closing when nested
      disableEscapeKeyDown={false}
      keepMounted={false} // Don't keep in DOM when closed
    >
      {/* Custom Header */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 3, 
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isCreating ? <Plus size={20} /> : <PencilSimple size={20} />}
            {modalTitle}
          </Typography>
          {config?.subtitleField && localRecord?.[config.subtitleField] && (
            <Typography variant="body2" color="text.secondary">
              {localRecord[config.subtitleField]}
            </Typography>
          )}
        </Box>
        <IconButton onClick={handleClose} disabled={loading}>
          <XIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {error && (
          <Box sx={{ p: 3, pb: 0 }}>
            <Alert severity="error">
              {error}
            </Alert>
          </Box>
        )}

        {/* This is where the magic happens - reuse CollectionItemPage */}
        <Box sx={{ p: 3 }} key={localRecord?.id || 'new'}>
          <CollectionItemPage
            config={config}
            record={localRecord}
            isModal={true}
            onUpdate={handleRecordUpdate}
            onRefresh={(updatedRecord) => {
              if (updatedRecord) {
                console.log('[CollectionEditModal] Refreshing with:', updatedRecord);
                setLocalRecord(updatedRecord);
              }
            }}
            // Don't show the save button in CollectionItemPage since we handle it here
            hideSaveButton={true}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || (!hasUnsavedChanges && !isCreating)}
        >
          {loading ? 
            (isCreating ? 'Creating...' : 'Updating...') : 
            (isCreating ? 'Create' : 'Update')
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};