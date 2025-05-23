'use client';

import {
  Dialog, DialogContent, DialogTitle, IconButton, DialogActions, Button
} from '@mui/material';
import { X as XIcon } from '@phosphor-icons/react';
import { CollectionItemForm } from '@/components/views/collectionItem/CollectionItemForm';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import * as collections from '@/collections';

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

  // ✅ ALWAYS use media config, regardless of what's passed in
  const mediaConfig = collections.media;

  // Fetch full media record when modal opens
  useEffect(() => {
    const fetchFullRecord = async () => {
      if (open && initialMedia?.id) {
        setLoading(true);
        try {
          // ✅ FIXED: Always use 'media' table, not the parent config table
          const tableName = 'media'; // Force media table
          
          console.log(`[MediaEditModal] Fetching from table: ${tableName}, id: ${initialMedia.id}`);
          
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', initialMedia.id)
            .single();

          if (error) {
            console.error(`❌ Failed to fetch record from ${tableName}:`, error);
            console.log('❌ Using initialMedia as fallback:', initialMedia);
            setMedia(initialMedia);
          } else {
            console.log('✅ Fetched full media record:', data);
            setMedia(data);
          }
        } catch (err) {
          console.error('Error fetching media record:', err);
          console.log('❌ Using initialMedia as fallback:', initialMedia);
          setMedia(initialMedia);
        } finally {
          setLoading(false);
        }
      } else if (open && initialMedia) {
        // Use initialMedia directly if no ID
        console.log('[MediaEditModal] Using initialMedia directly:', initialMedia);
        setMedia(initialMedia);
        setLoading(false);
      }
    };

    if (open) {
      fetchFullRecord();
    } else {
      setMedia(null);
    }
  }, [open, initialMedia?.id, supabase]);

  // ✅ FIXED: Also fix the handleSave function
  const handleSave = async (formData) => {
    console.log('[MediaEditModal] handleSave called with:', formData);
    
    setSaving(true);
    try {
      // ✅ FIXED: Always use 'media' table
      const tableName = 'media';
      
      let result;
      
      if (formData.id) {
        // Update existing record
        console.log('[MediaEditModal] Updating existing record:', formData.id);
        
        // ✅ Get allowed fields from media config
        const allowedFields = mediaConfig.fields
          ?.filter(f => f.database !== false)
          ?.map(f => f.name) || [];
        
        // Add standard fields that are always allowed
        const standardFields = ['id', 'created_at', 'updated_at', 'url', 'title', 'alt_text', 'mime_type'];
        const allAllowedFields = [...new Set([...allowedFields, ...standardFields])];
        
        // Clean data for update - only include allowed fields
        const cleanData = {};
        Object.entries(formData).forEach(([key, value]) => {
          if (allAllowedFields.includes(key) && !['is_external', 'is_folder'].includes(key)) {
            cleanData[key] = value;
          }
        });
        
        console.log('[MediaEditModal] Clean data for update:', cleanData);
        
        const { error } = await supabase
          .from(tableName)
          .update(cleanData)
          .eq('id', formData.id);
          
        if (error) {
          console.error('Failed to update media:', error);
          throw error;
        }
        
        result = formData;
        console.log('✅ Media updated successfully');
      } else {
        // Create new record
        console.log('[MediaEditModal] Creating new record with data:', formData);
        
        // ✅ Get allowed fields from media config
        const allowedFields = mediaConfig.fields
          ?.filter(f => f.database !== false)
          ?.map(f => f.name) || [];
        
        // Add standard fields that are always allowed for creation
        const standardFields = ['url', 'title', 'alt_text', 'mime_type', 'company_id', 'project_id', 'status', 'copyright', 'description', 'original_title', 'author_id'];
        const allAllowedFields = [...new Set([...allowedFields, ...standardFields])];
        
        // Clean the data - only include valid database fields
        const cleanData = {};
        
        Object.entries(formData).forEach(([key, value]) => {
          // Skip undefined, null, empty string values and non-allowed fields
          if (value !== undefined && value !== null && value !== '' && allAllowedFields.includes(key)) {
            // Skip UI-only fields
            if (!['is_external', 'is_folder', 'id'].includes(key)) {
              cleanData[key] = value;
            }
          }
        });
        
        console.log('[MediaEditModal] Clean data for insert:', cleanData);
        console.log('[MediaEditModal] Allowed fields from config:', allAllowedFields);
        
        const { data, error } = await supabase
          .from(tableName)
          .insert(cleanData)
          .select()
          .single();
          
        if (error) {
          console.error('❌ Failed to create media:', {
            error: error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            cleanData
          });
          throw error;
        }
        
        result = data;
        console.log('✅ Media created successfully:', result);
      }
      
      // Call onSave with the result (the parent will handle the relationship)
      if (onSave) {
        console.log('[MediaEditModal] Calling onSave with:', result);
        onSave(result);
      }
      
      onClose();
    } catch (err) {
      console.error('❌ Error saving media:', err);
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
      console.log(`[MediaEditModal] Updated media state:`, updated);
      return updated;
    });
  };

  if (!open) return null;

  const isCreating = !media?.id;
  const modalTitle = isCreating ? 'Add External Link' : 'Edit Media';

  console.log('[MediaEditModal] Using media config:', {
    configName: mediaConfig.name,
    fieldsCount: mediaConfig.fields?.length || 0,
    fields: mediaConfig.fields?.map(f => f.name) || []
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {modalTitle}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <XIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        {loading ? (
          <div>Loading media details...</div>
        ) : media ? (
          <CollectionItemForm
            collection="media" // ✅ Always use "media" collection name
            config={mediaConfig} // ✅ Always use media config
            record={media}
            onFieldChange={handleFieldChange}
            onSave={handleSave}
            edit={true}
            isModal={true}
            formId="media-edit-form"
            // Don't pass these props to avoid useCollectionSave
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
        <Button onClick={onClose} disabled={saving}>
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