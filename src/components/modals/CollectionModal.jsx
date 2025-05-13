'use client';

import React, { useEffect, useState, useMemo } from 'react';
import * as collections from '@/collections';
import CreateForm from '@/components/CreateForm';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  Button,
  CircularProgress
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { X as XIcon } from '@phosphor-icons/react';
import { CollectionItemPage } from '@/components/CollectionItemPage';
import { createClient } from '@/lib/supabase/browser';
import { saveMultiRelationships } from '@/lib/utils/multirelationshipUtils';

export default function CollectionModal({
  open,
  onClose,
  onUpdate,
  onDelete,
  config,
  defaultValues = {},
  record = {},
  onRefresh,
  edit: forceEdit = false
}) {
  const theme = useTheme();
  const supabase = createClient();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const type = config?.name;
  const recordId = record?.id || defaultValues?.id;
  const isCreating = !recordId;
  const [fetchedRecord, setFetchedRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const parentId = defaultValues?.id;
  const refField = defaultValues?.refField;
  
  // Helper to ensure tags are properly formatted as arrays
  const parseTagsField = (record) => {
    if (!record) return record;
    
    // Create a copy to modify
    const result = { ...record };
    
    // Look for a tags field
    if ('tags' in result) {
      // If it's a string, try to parse it as JSON
      if (typeof result.tags === 'string') {
        try {
          // Try to parse it as JSON
          const parsedTags = JSON.parse(result.tags);
          if (Array.isArray(parsedTags)) {
            console.log('[CollectionModal] Parsed tags string into array:', parsedTags);
            result.tags = parsedTags.map(String);
          }
        } catch (err) {
          // Not JSON, but could be a comma-separated list
          if (result.tags.includes(',')) {
            const splitTags = result.tags.split(',').map(tag => tag.trim()).filter(Boolean);
            console.log('[CollectionModal] Split tags string into array:', splitTags);
            result.tags = splitTags;
          }
        }
      }
      
      // Ensure it's an array
      if (!Array.isArray(result.tags)) {
        console.log('[CollectionModal] Converting tags to array:', result.tags);
        result.tags = result.tags ? [String(result.tags)] : [];
      }
    }
    
    return result;
  };
  
  // Direct tag fetching (specifically targeting the issue)
  const fetchTagsForRecord = async (recordId) => {
    if (!recordId) return null;
    
    try {
      // 1. Find the tags field in the config
      const tagsField = config.fields.find(f => 
        f.type === 'multiRelationship' && 
        f.name === 'tags' &&
        f.relation?.junctionTable
      );
      
      if (!tagsField) {
        console.log("[CollectionModal] No tags field found in config");
        return null;
      }
      
      const { 
        junctionTable = 'category_task', 
        sourceKey = `${config.name}_id`, 
        targetKey = 'category_id', 
        table = 'category',
        labelField = 'title'
      } = tagsField.relation;
      
      console.log(`[CollectionModal] Fetching tags with:`, {
        junctionTable,
        sourceKey,
        targetKey,
        table,
        recordId
      });
      
      // 2. Fetch tag IDs from junction table
      const { data: junctionData, error: junctionError } = await supabase
        .from(junctionTable)
        .select(targetKey)
        .eq(sourceKey, recordId);
        
      if (junctionError) {
        console.error("[CollectionModal] Error fetching tag IDs:", junctionError);
        return null;
      }
      
      const tagIds = junctionData.map(row => row[targetKey]).filter(Boolean);
      console.log(`[CollectionModal] Found ${tagIds.length} tag IDs:`, tagIds);
      
      if (tagIds.length === 0) {
        return { 
          tags: [],
          tags_details: []
        };
      }
      
      // 3. Fetch tag details
      const { data: tagDetails, error: detailsError } = await supabase
        .from(table)
        .select(`id, ${labelField}`)
        .in('id', tagIds);
        
      if (detailsError) {
        console.error("[CollectionModal] Error fetching tag details:", detailsError);
        return null;
      }
      
      console.log(`[CollectionModal] Fetched ${tagDetails.length} tag details:`, tagDetails);
      
      // 4. Return the tags data
      return {
        tags: tagIds.map(String),
        tags_details: tagDetails
      };
    } catch (err) {
      console.error("[CollectionModal] Error in fetchTagsForRecord:", err);
      return null;
    }
  };
  
  useEffect(() => {
    if (!isCreating && recordId) {
      const fetchRecordWithTags = async () => {
        setIsLoading(true);
        setFetchError(null);
        
        console.log(`[CollectionModal] Fetching record ${recordId} from ${config.name}`);
        
        try {
          // Step 1: Fetch the main record
          const { data, error } = await supabase
            .from(config.name)
            .select('*')
            .eq('id', recordId)
            .single();
            
          if (error) {
            console.error(`[CollectionModal] Failed to fetch record ${recordId}:`, error);
            setFetchError(error.message);
            setIsLoading(false);
            return;
          }
          
          console.log(`[CollectionModal] Successfully fetched record:`, data);
          
          // Step 2: Ensure tags are properly formatted
          const parsedRecord = parseTagsField(data);
          
          // Step 3: Fetch tags from junction table (more reliable)
          const tagsData = await fetchTagsForRecord(recordId);
          
          // Step 4: Combine the data
          if (tagsData) {
            const recordWithTags = {
              ...parsedRecord,
              ...tagsData
            };
            
            console.log(`[CollectionModal] Final record with tags:`, recordWithTags);
            setFetchedRecord(recordWithTags);
          } else {
            console.log('[CollectionModal] Using parsed record without additional tags.');
            setFetchedRecord(parsedRecord);
          }
        } catch (err) {
          console.error(`[CollectionModal] Unexpected error:`, err);
          setFetchError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchRecordWithTags();
    }
  }, [recordId, config.name, isCreating, record?.id]);
  
  // For debugging - manually refresh the record
  const refreshRecord = async () => {
    if (!recordId) return;
    
    console.log(`[CollectionModal] Manually refreshing record ${recordId}`);
    setIsLoading(true);
    
    try {
      // Fetch main record
      const { data, error } = await supabase
        .from(config.name)
        .select('*')
        .eq('id', recordId)
        .single();
        
      if (error) {
        console.error(`[CollectionModal] Error fetching record:`, error);
        return;
      }
      
      // Parse tags field
      const parsedRecord = parseTagsField(data);
      
      // Fetch tags
      const tagsData = await fetchTagsForRecord(recordId);
      
      // Combine data
      const combinedData = tagsData 
        ? { ...parsedRecord, ...tagsData }
        : parsedRecord;
        
      console.log(`[CollectionModal] Manual refresh result:`, combinedData);
      setFetchedRecord(combinedData);
    } catch (err) {
      console.error(`[CollectionModal] Error in refresh:`, err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Merge any existing record data with fetched data and additional values
  const extendedRecord = useMemo(() => {
    // Start with the fetched record or the passed record
    const baseRecord = fetchedRecord || record || {};
    
    // Parse tags if needed
    const parsedBaseRecord = parseTagsField(baseRecord);
    
    // Add additional values for creating mode
    const withDefaults = isCreating && parentId && refField 
      ? { ...parsedBaseRecord, [refField]: parentId }
      : parsedBaseRecord;
      
    // Add any default values for creating mode
    const result = {
      ...withDefaults,
      ...(isCreating ? defaultValues : {})
    };
    
    console.log(`[CollectionModal] Final extended record:`, result);
    
    return result;
  }, [fetchedRecord, record, isCreating, parentId, refField, defaultValues]);

  // Check if the record has tags data
  const hasTagsData = useMemo(() => {
    if (!extendedRecord) return false;
    
    const hasTags = Array.isArray(extendedRecord.tags) && extendedRecord.tags.length > 0;
    const hasTagDetails = Array.isArray(extendedRecord.tags_details) && extendedRecord.tags_details.length > 0;
    
    return hasTags || hasTagDetails;
  }, [extendedRecord]);
  
  return (
    <Dialog
      fullScreen={fullScreen}
      maxWidth="sm"
      onClose={onClose}
      open={open}
      sx={{
        '& .MuiDialog-container': { justifyContent: 'flex-end' },
        '& .MuiDialog-paper': { height: '100%', width: '100%' }
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6">
              {config.label || config.name}
            </Typography>
            {config.subtitleField && extendedRecord?.[config.subtitleField] && (
              <Typography variant="body2" color="text.secondary">
                {extendedRecord[config.subtitleField]}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose}>
            <XIcon />
          </IconButton>
        </Box>
        
        {/* Debug info */}
        <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, fontSize: '12px' }}>
          <Typography variant="caption" fontWeight="bold">DEBUG INFO</Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption">
              <strong>Record ID:</strong> {recordId}
            </Typography>
          </Box>
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="caption">
              <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
            </Typography>
          </Box>
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="caption">
              <strong>Fetch Error:</strong> {fetchError || 'None'}
            </Typography>
          </Box>
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="caption">
              <strong>Raw Tags Value:</strong> {record?.tags ? JSON.stringify(record.tags) : 'None'}
            </Typography>
          </Box>
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="caption">
              <strong>Has Tags Data:</strong> {hasTagsData ? 'Yes' : 'No'}
            </Typography>
          </Box>
          {hasTagsData && (
            <Box sx={{ mt: 0.5 }}>
              <Typography variant="caption">
                <strong>Tag IDs:</strong> {extendedRecord.tags?.join(', ') || 'None'}
              </Typography>
            </Box>
          )}
          <Button 
            size="small" 
            variant="outlined" 
            onClick={refreshRecord}
            disabled={isLoading}
            sx={{ mt: 1, fontSize: '10px' }}
          >
            {isLoading ? <CircularProgress size={12} /> : 'Refresh Record'}
          </Button>
        </Box>

        {isCreating ? (
          <CreateForm
            config={config}
            initialRecord={extendedRecord}
            disableRedirect
            onSuccess={async (data) => {
              console.log('[CollectionModal] Create form success:', data);
              
              // After creating the record, save multirelationship fields
              if (data && data.id) {
                await saveMultiRelationships({
                  config,
                  record: data
                });
              }
              
              if (onRefresh) await onRefresh(data);
              onClose();
            }}
          />
        ) : (
          <>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <CollectionItemPage
                config={config}
                record={extendedRecord}
                isModal
                onClose={onClose}
                onUpdate={async (updatedRecord) => {
                  console.log('[CollectionModal] Record updated:', updatedRecord);
                  
                  // Save multirelationships after record update
                  if (updatedRecord && updatedRecord.id) {
                    await saveMultiRelationships({
                      config,
                      record: updatedRecord
                    });
                  }
                  
                  // Then call the original onUpdate
                  if (onUpdate) onUpdate(updatedRecord);
                }}
                onDelete={onDelete}
                onRefresh={onRefresh}
                singleColumn
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}