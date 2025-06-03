// MediaEditModal.jsx - Fixed version
'use client';

import {
  Dialog, DialogContent, DialogTitle, IconButton, DialogActions, Button
} from '@mui/material';
import { X as XIcon } from '@phosphor-icons/react';
import { CollectionItemForm } from '@/components/views/collectionItem/CollectionItemForm';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import * as collections from '@/collections';



const extractRelationshipIds = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'object' && item?.id ? item.id : item))
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));
  }

  if (typeof value === 'object' && Array.isArray(value?.ids)) {
    return value.ids
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));
  }

  if (typeof value === 'number' || typeof value === 'string') {
    const parsed = parseInt(value);
    return isNaN(parsed) ? [] : [parsed];
  }

  return [];
};

// ✅ FIXED: Enhanced fetchMultiRelationshipValues with proper form data structure
const fetchMultiRelationshipValues = async (supabase, mediaId, multiFields) => {
  console.log(`[fetchMultiRelationshipValues] Starting fetch for media ID: ${mediaId}`);
  console.log(`[fetchMultiRelationshipValues] Processing ${multiFields.length} multiRelationship fields:`, multiFields.map(f => f.name));
  
  const relatedData = {};

  for (const field of multiFields) {
    const {
      name,
      relation: {
        junctionTable,
        sourceKey,
        targetKey,
        table
      }
    } = field;

    console.log(`[fetchMultiRelationshipValues] Processing field: ${name}`, {
      junctionTable,
      sourceKey,
      targetKey,
      table
    });

    if (!junctionTable || !sourceKey || !targetKey || !table) {
      console.warn(`[fetchMultiRelationshipValues] Missing config for ${name}:`, {
        junctionTable: !!junctionTable,
        sourceKey: !!sourceKey,
        targetKey: !!targetKey,
        table: !!table
      });
      // Set empty array for form compatibility
      relatedData[name] = [];
      continue;
    }

    try {
      // 1. Fetch related IDs from the junction table
      console.log(`[fetchMultiRelationshipValues] Query: SELECT ${targetKey} FROM ${junctionTable} WHERE ${sourceKey} = ${mediaId}`);
      
      const { data: junctionData, error: junctionError } = await supabase
        .from(junctionTable)
        .select(`${targetKey}`)
        .eq(sourceKey, mediaId);

      if (junctionError) {
        console.warn(`[fetchMultiRelationshipValues] Junction query error for ${name}:`, junctionError);
        relatedData[name] = [];
        continue;
      }

      console.log(`[fetchMultiRelationshipValues] Junction data for ${name}:`, junctionData);

      const relatedIds = junctionData?.map(row => row[targetKey]) || [];
      console.log(`[fetchMultiRelationshipValues] Related IDs for ${name}:`, relatedIds);

      // 2. Fetch the actual records from the related table (only if we have IDs)
      if (relatedIds.length > 0) {
        const { data: relatedRecords, error: relatedError } = await supabase
          .from(table)
          .select('*')
          .in('id', relatedIds);

        if (relatedError) {
          console.warn(`[fetchMultiRelationshipValues] Related records query error for ${name}:`, relatedError);
          relatedData[name] = relatedIds; // Just IDs as fallback
          continue;
        }

        console.log(`[fetchMultiRelationshipValues] Related records for ${name}:`, relatedRecords);

        // ✅ CRITICAL FIX: Store as array of IDs for form compatibility
        // The RelatedTagsField expects just an array of IDs: [1, 2, 3]
        relatedData[name] = relatedIds;
        
        console.log(`[fetchMultiRelationshipValues] Form-compatible data for ${name}:`, relatedData[name]);
      } else {
        // No relationships found - set empty array
        relatedData[name] = [];
        console.log(`[fetchMultiRelationshipValues] No relationships found for ${name}, setting empty array`);
      }

      console.log(`[fetchMultiRelationshipValues] Final data structure for ${name}:`, relatedData[name]);

    } catch (err) {
      console.error(`[fetchMultiRelationshipValues] Unexpected error for ${name}:`, err);
      relatedData[name] = [];
      console.log(`[fetchMultiRelationshipValues] Error recovery for ${name}, setting empty array`);
    }
  }

  console.log(`[fetchMultiRelationshipValues] Complete related data:`, relatedData);
  return relatedData;
};

export const MediaEditModal = ({
  open,
  onClose,
  config, // This might be project config, but we'll override it
  initialMedia,
  onSave
}) => {
  const supabase = createClient();
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // ✅ ALWAYS use media config, regardless of what's passed in
  const mediaConfig = collections.media;

  // ✅ FIXED: Enhanced useEffect with proper form data structure
  useEffect(() => {
    const fetchFullRecord = async () => {
      if (open && initialMedia?.id) {
        setLoading(true);
        try {
          console.log(`[MediaEditModal] Fetching media record with ID: ${initialMedia.id}`);
          
          // First fetch the base media record
          const { data, error } = await supabase
            .from('media')
            .select('*')
            .eq('id', initialMedia.id)
            .single();

          if (error) {
            console.error(`❌ Failed to fetch media record:`, error);
            setMedia(initialMedia);
            setError(`Failed to load media details: ${error.message}`);
            return;
          } 

          console.log('✅ Fetched full media record:', data);

          // Then fetch multiRelationship data
          const multiFields = mediaConfig.fields?.filter(f => f.type === 'multiRelationship') || [];
          console.log(`[MediaEditModal] Found ${multiFields.length} multiRelationship fields:`, multiFields.map(f => f.name));

          if (multiFields.length > 0) {
            console.log(`[MediaEditModal] Fetching multiRelationship data...`);
            const relatedValues = await fetchMultiRelationshipValues(supabase, data.id, multiFields);
            console.log(`[MediaEditModal] Received multiRelationship data:`, relatedValues);

            // ✅ FIXED: Merge the related data with proper structure
            const patchedMedia = {
              ...data,
              ...relatedValues
            };

            console.log(`[MediaEditModal] Final patched media object:`, patchedMedia);
            setMedia(patchedMedia);
          } else {
            console.log(`[MediaEditModal] No multiRelationship fields found, using base data`);
            setMedia(data);
          }

        } catch (err) {
          console.error('❌ Error fetching media record:', err);
          setMedia(initialMedia);
          setError(`Failed to load media: ${err.message}`);
        } finally {
          setLoading(false);
        }
      } else if (open && initialMedia) {
        console.log('[MediaEditModal] Using initialMedia directly (no ID):', initialMedia);
        
        // ✅ FIXED: Ensure new records have proper multiRelationship structure
        const multiFields = mediaConfig.fields?.filter(f => f.type === 'multiRelationship') || [];
        const patchedInitialMedia = { ...initialMedia };
        
        // Initialize multiRelationship fields as empty arrays if not present
        multiFields.forEach(field => {
          if (!patchedInitialMedia[field.name]) {
            patchedInitialMedia[field.name] = [];
          }
        });
        
        setMedia(patchedInitialMedia);
        setLoading(false);
      }
    };

    if (open) {
      setError(null); // Reset error when opening
      fetchFullRecord();
    } else {
      setMedia(null);
      setError(null);
    }
  }, [open, initialMedia?.id, supabase]);

  // ✅ FIXED: Better field filtering and automatic mime_type detection using existing utility
  const getCleanDataForUpdate = (formData, isCreating = false) => {
    // Get all database fields from media config
    const databaseFields = mediaConfig.fields
      ?.filter(field => {
        // Include field if it's not explicitly marked as non-database
        return field.database !== false && 
               field.type !== 'custom' && 
               field.name !== 'id'; // Never update ID
      })
      ?.map(field => field.name) || [];

    // Always include these standard fields
    const standardFields = [
      'url', 'title', 'alt_text', 'mime_type', 'description', 'copyright', 
      'original_title', 'company_id', 'author_id', 'status', 'parent_id',
      'is_folder', 'is_external'
    ];

    const allAllowedFields = [...new Set([...databaseFields, ...standardFields])];
    
    console.log('[MediaEditModal] Allowed fields for update:', allAllowedFields);
    console.log('[MediaEditModal] All form data keys:', Object.keys(formData));

    const cleanData = {};
    
    Object.entries(formData).forEach(([key, value]) => {
      // Skip certain fields that shouldn't be updated
      if (['id', 'created_at'].includes(key)) {
        return;
      }

      // Handle multiRelationship fields - these are handled separately
      const fieldConfig = mediaConfig.fields?.find(f => f.name === key);
      if (fieldConfig?.type === 'multiRelationship') {
        console.log(`[MediaEditModal] Skipping multiRelationship field: ${key}`);
        return;
      }

      // Include field if it's in allowed list or is a standard field
      if (allAllowedFields.includes(key)) {
        // Convert empty strings to null for database consistency
        cleanData[key] = value === '' ? null : value;
      } else {
        console.log(`[MediaEditModal] Skipping non-database field: ${key}`);
      }
    });

    // ✅ FIXED: Auto-detect mime_type on creation using your existing utility
    if (isCreating && cleanData.url && !cleanData.mime_type) {
      // Import your existing getMimeTypeFromUrl function
      try {
        const { getMimeTypeFromUrl } = require('@/data/fileTypes');
        cleanData.mime_type = getMimeTypeFromUrl(cleanData.url);
        console.log(`[MediaEditModal] Auto-detected mime_type: ${cleanData.mime_type} for URL: ${cleanData.url}`);
      } catch (err) {
        console.warn(`[MediaEditModal] Could not auto-detect mime_type:`, err);
      }
    }

    // ✅ FIXED: Set default values for new records
    if (isCreating) {
      // Set default status if not provided
      if (!cleanData.status) {
        cleanData.status = 'linked'; // Default for external URLs
      }
      
      // Set is_external for external URLs
      if (cleanData.url && !cleanData.url.startsWith('/') && (cleanData.url.startsWith('http://') || cleanData.url.startsWith('https://'))) {
        cleanData.is_external = true;
      }
    }

    return cleanData;
  };

  // ✅ FIXED: Enhanced multiRelationship debugging and handling
  const handleMultiRelationshipUpdates = async (formData, mediaId) => {
    const multiRelationshipFields = mediaConfig.fields?.filter(f => f.type === 'multiRelationship') || [];
    
    console.log(`[MediaEditModal] Processing ${multiRelationshipFields.length} multiRelationship fields for media ID: ${mediaId}`);
    console.log(`[MediaEditModal] Full form data:`, formData);
    console.log(`[MediaEditModal] MultiRelationship fields found:`, multiRelationshipFields.map(f => ({
      name: f.name,
      junctionTable: f.relation?.junctionTable,
      sourceKey: f.relation?.sourceKey,
      targetKey: f.relation?.targetKey
    })));
    
    for (const field of multiRelationshipFields) {
      const fieldValue = formData[field.name];
      
      console.log(`[MediaEditModal] Processing field: ${field.name}`);
      console.log(`[MediaEditModal] Field value:`, fieldValue);
      console.log(`[MediaEditModal] Field value type:`, Array.isArray(fieldValue) ? 'array' : typeof fieldValue);
      console.log(`[MediaEditModal] Field value length:`, Array.isArray(fieldValue) ? fieldValue.length : 'N/A');
      
      // Debug the field configuration
      console.log(`[MediaEditModal] Field config:`, {
        name: field.name,
        type: field.type,
        relation: field.relation
      });

      if (!field.relation?.junctionTable || !field.relation?.sourceKey || !field.relation?.targetKey) {
        console.warn(`[MediaEditModal] Missing junction table config for ${field.name}:`, {
          junctionTable: field.relation?.junctionTable,
          sourceKey: field.relation?.sourceKey,
          targetKey: field.relation?.targetKey
        });
        continue;
      }

      try {
        // First, delete existing relationships
        console.log(`[MediaEditModal] Deleting existing ${field.name} relationships for media ID: ${mediaId}`);
        console.log(`[MediaEditModal] Delete query: FROM ${field.relation.junctionTable} WHERE ${field.relation.sourceKey} = ${mediaId}`);
        
        const { error: deleteError } = await supabase
          .from(field.relation.junctionTable)
          .delete()
          .eq(field.relation.sourceKey, mediaId);

        if (deleteError) {
          console.error(`❌ Failed to delete existing ${field.name} relationships:`, deleteError);
          // Don't throw here - continue with insert attempt
        } else {
          console.log(`✅ Deleted existing ${field.name} relationships`);
        }

        // Then, insert new relationships if we have values
        if (fieldValue !== null && fieldValue !== undefined) {
          console.log(`[MediaEditModal] Field value is not null/undefined, checking if it's a valid array...`);
          
          const idsToInsert = extractRelationshipIds(fieldValue);
          console.log(`[MediaEditModal] Clean IDs to insert for ${field.name}:`, idsToInsert);

          if (idsToInsert.length > 0) {
            const insertData = idsToInsert.map(relatedId => {
              const record = {
                [field.relation.sourceKey]: parseInt(mediaId),
                [field.relation.targetKey]: relatedId
              };
              console.log(`[MediaEditModal] Creating junction record for ${field.name}:`, record);
              return record;
            });

            console.log(`[MediaEditModal] Inserting ${insertData.length} new ${field.name} relationships into ${field.relation.junctionTable}:`, insertData);

            const { error: insertError } = await supabase
              .from(field.relation.junctionTable)
              .insert(insertData);

            if (insertError) {
              console.error(`❌ Failed to insert ${field.name} relationships:`, {
                error: insertError,
                message: insertError.message,
                details: insertError.details,
                insertData,
                junctionTable: field.relation.junctionTable
              });
              // Don't throw - log and continue
            } else {
              console.log(`✅ Successfully inserted ${insertData.length} ${field.name} relationships`);
            }
          } else {
            console.log(`[MediaEditModal] No valid IDs found in ${field.name} field value:`, fieldValue);
          }
        } else {
          console.log(`[MediaEditModal] Field value for ${field.name} is null/undefined, no relationships to insert`);
        }
      } catch (err) {
        console.error(`❌ Error updating ${field.name} relationships:`, err);
        // Don't throw - log and continue with other fields
      }
    }
  };

  // ✅ FIXED: Comprehensive error handling and save logic with enhanced debugging
  const handleSave = async (formData) => {
    console.log('[MediaEditModal] handleSave called with full formData:', formData);
    console.log('[MediaEditModal] Form data keys:', Object.keys(formData));
    console.log('[MediaEditModal] Form data entries:', Object.entries(formData));
    
    // Debug multiRelationship fields specifically
    const multiFields = mediaConfig.fields?.filter(f => f.type === 'multiRelationship') || [];
    console.log('[MediaEditModal] MultiRelationship fields in config:', multiFields.map(f => f.name));
    
    multiFields.forEach(field => {
      const value = formData[field.name];
      console.log(`[MediaEditModal] MultiRelationship field ${field.name} value:`, value, typeof value);
    });
    
    setSaving(true);
    setError(null);
    
    try {
      let result;
      
      if (formData.id) {
        // Update existing record
        console.log('[MediaEditModal] Updating existing media record:', formData.id);
        
        const cleanData = getCleanDataForUpdate(formData, false); // false = updating
        console.log('[MediaEditModal] Clean data for update:', cleanData);

        // Update the main media record (excluding multiRelationship fields)
        const { data, error } = await supabase
          .from('media')
          .update(cleanData)
          .eq('id', formData.id)
          .select()
          .single();
          
        if (error) {
          console.error('❌ Failed to update media record:', {
            error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            cleanData
          });
          throw new Error(`Database update failed: ${error.message}`);
        }

        console.log('✅ Main media record updated successfully:', data);

        // Handle multiRelationship fields separately
        console.log('[MediaEditModal] About to handle multiRelationship updates...');
        await handleMultiRelationshipUpdates(formData, formData.id);

        result = { ...formData }; // Use formData since it has all the fields including relationships
        
      } else {
        // Create new record
        console.log('[MediaEditModal] Creating new media record');
        
        const cleanData = getCleanDataForUpdate(formData, true); // true = creating
        console.log('[MediaEditModal] Clean data for insert:', cleanData);

        const { data, error } = await supabase
          .from('media')
          .insert(cleanData)
          .select()
          .single();
          
        if (error) {
          console.error('❌ Failed to create media record:', {
            error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            cleanData
          });
          throw new Error(`Database insert failed: ${error.message}`);
        }

        console.log('✅ Media record created successfully:', data);

        // Handle multiRelationship fields for new record
        if (data.id) {
          console.log('[MediaEditModal] About to handle multiRelationship updates for new record...');
          await handleMultiRelationshipUpdates(formData, data.id);
        }

        result = { ...formData, id: data.id };
      }
      
      // Call onSave with the result
      if (onSave) {
        console.log('[MediaEditModal] Calling onSave with:', result);
        onSave(result);
      }
      
      onClose();
      
    } catch (err) {
      console.error('❌ Error saving media:', err);
      setError(err.message || 'Failed to save media. Please try again.');
      // Don't close modal on error so user can fix issues
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    const fieldName = typeof field === 'string' ? field : field.name;
    
    console.log(`[MediaEditModal] Field change: ${fieldName} =`, value);
    
    setMedia(prev => {
      const updated = {
        ...prev,
        [fieldName]: value
      };
      console.log(`[MediaEditModal] Updated media state for ${fieldName}:`, updated[fieldName]);
      return updated;
    });
  };

  const handleClose = () => {
    if (!saving) {
      setError(null);
      onClose();
    }
  };

  if (!open) return null;

  const isCreating = !media?.id;
  const modalTitle = isCreating ? 'Add External Link' : 'Edit Media';

  console.log('[MediaEditModal] Rendering with media config:', {
    configName: mediaConfig.name,
    fieldsCount: mediaConfig.fields?.length || 0,
    hasMedia: !!media,
    mediaId: media?.id,
    error: error
  });

  // ✅ ADDED: Debug the media object structure before rendering
  if (media) {
    const multiFields = mediaConfig.fields?.filter(f => f.type === 'multiRelationship') || [];
    console.log('[MediaEditModal] Media object keys:', Object.keys(media));
    console.log('[MediaEditModal] MultiRelationship field values in media:');
    multiFields.forEach(field => {
      const value = media[field.name];
      console.log(`  ${field.name}:`, value);
      if (Array.isArray(value)) {
        console.log(`    - Array length: ${value.length}`);
        console.log(`    - Sample items:`, value.slice(0, 3));
      }
    });
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>
        {modalTitle}
        <IconButton
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
          disabled={saving}
        >
          <XIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        {/* Error Display */}
        {error && (
          <div style={{ 
            color: 'red', 
            marginBottom: '16px', 
            padding: '12px', 
            backgroundColor: '#ffebee', 
            borderRadius: '4px',
            border: '1px solid #ffcdd2'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div>Loading media details...</div>
        ) : media ? (
          <CollectionItemForm
            collection="media"
            config={mediaConfig}
            record={media}
            onFieldChange={handleFieldChange}
            onSave={handleSave}
            edit={true}
            isModal={true}
            formId="media-edit-form"
            // Don't pass these props to avoid conflicts
            isEditingField={null}
            setEditingField={() => {}}
            loadingField={null}
            tempValue=""
            setTempValue={() => {}}
          />
        ) : (
          <div>No media data available</div>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          form="media-edit-form"
          type="submit"
          variant="contained"
          disabled={!media || saving}
        >
          {saving ? 'Saving...' : (isCreating ? 'Create' : 'Save Changes')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};