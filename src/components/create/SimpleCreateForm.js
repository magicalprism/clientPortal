'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Box, 
  Button, 
  Grid, 
  Typography, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress 
} from '@mui/material';
import { createClient } from '@/lib/supabase/browser';
import { FieldRenderer } from '@/components/FieldRenderer';
import { getPostgresTimestamp } from '@/lib/utils/getPostgresTimestamp';
import { getCurrentContactId } from '@/lib/utils/getCurrentContactId';

const SimpleCreateForm = ({ config, isModal = false, onClose, onSuccess }) => {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ FIX: Memoize essential fields to prevent infinite re-renders
  const essentialFields = useMemo(() => {
    const essentialFieldNames = ['title', 'name', 'company_id', 'project_id', 'checklist_id'];
    const requiredFields = config.fields.filter(field => field.required);
    
    return config.fields.filter(field => {
      // Always include title/name
      if (essentialFieldNames.includes(field.name)) return true;
      
      // Include required fields
      if (requiredFields.some(rf => rf.name === field.name)) return true;
      
      // Include fields with default values from URL
      if (searchParams.get(field.name)) return true;
      
      return false;
    });
  }, [config.fields, searchParams]);

  // ✅ FIX: Only run effect when searchParams or config changes, not essentialFields
  useEffect(() => {
    const initialData = {};
    
    // Add URL parameters (exclude frontend routing parameters)
    const excludedParams = ['modal', 'id', 'view', 'type'];
    searchParams.forEach((value, key) => {
      if (!excludedParams.includes(key)) {
        // Convert numeric strings to numbers for foreign keys
        if (key.endsWith('_id') && !isNaN(value)) {
          initialData[key] = parseInt(value, 10);
        } else {
          initialData[key] = value;
        }
      }
    });

    // Add default values from field configs
    essentialFields.forEach(field => {
      if (field.defaultValue && !initialData[field.name]) {
        initialData[field.name] = field.defaultValue;
      }
    });

    console.log('[SimpleCreateForm] Initialized form data:', initialData);
    setFormData(initialData);
  }, [searchParams, config.fields]); // ✅ Remove essentialFields dependency

  const handleChange = useCallback((fieldName, value) => {
    console.log(`[SimpleCreateForm] Field changed: ${fieldName} =`, value);
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('[SimpleCreateForm] Starting submit process...');
      console.log('[SimpleCreateForm] Config:', config);
      console.log('[SimpleCreateForm] Config name:', config.name);
      console.log('[SimpleCreateForm] Form data:', formData);

      const now = getPostgresTimestamp();
      const currentContactId = await getCurrentContactId();

      // Prepare the payload with just essential data, ensuring proper types
      const payload = {
        ...formData,
        created_at: now,
        updated_at: now,
      };

      // Add author_id if we have a current contact and the field exists
      if (currentContactId && config.fields.some(f => f.name === 'author_id')) {
        payload.author_id = currentContactId;
      }

      // Ensure numeric fields are properly typed
      config.fields.forEach(field => {
        if (field.name.endsWith('_id') && payload[field.name]) {
          payload[field.name] = parseInt(payload[field.name], 10);
        }
      });

      console.log('[SimpleCreateForm] Final payload:', payload);
      console.log('[SimpleCreateForm] Table name:', config.name);

      // Insert the record
      console.log('[SimpleCreateForm] Attempting to insert into table:', config.name);
      const { data: newRecord, error: insertError } = await supabase
        .from(config.name)
        .insert([payload])
        .select()
        .single();

      console.log('[SimpleCreateForm] Supabase response - data:', newRecord);
      console.log('[SimpleCreateForm] Supabase response - error:', insertError);

      if (insertError) {
        console.error('[SimpleCreateForm] Supabase insert error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
          fullError: insertError
        });
        throw insertError;
      }

      console.log('[SimpleCreateForm] Created record successfully:', newRecord);

      // Call onSuccess first for immediate UI update
      if (onSuccess) {
        console.log('[SimpleCreateForm] Calling onSuccess callback with:', newRecord);
        try {
          await onSuccess(newRecord);
        } catch (successError) {
          console.error('[SimpleCreateForm] Error in onSuccess callback:', successError);
        }
      }

      // Handle modal vs non-modal behavior
      if (isModal) {
        // Close modal after success callback
        if (onClose) {
          console.log('[SimpleCreateForm] Closing modal after successful creation');
          onClose();
        }
        
        // Clean up URL parameters
        const currentUrl = new URL(window.location);
        currentUrl.searchParams.delete('modal');
        currentUrl.searchParams.delete('id');
        // Remove any field parameters too
        essentialFields.forEach(field => {
          currentUrl.searchParams.delete(field.name);
        });
        router.replace(currentUrl.pathname + currentUrl.search);
      } else {
        // Redirect to edit page for non-modal cases
        if (newRecord?.id) {
          const editUrl = `${config.editPathPrefix}/${newRecord.id}?modal=edit&id=${newRecord.id}`;
          router.push(editUrl);
        }
      }

    } catch (err) {
      console.error('[SimpleCreateForm] Error creating record - full error object:', err);
      console.error('[SimpleCreateForm] Error type:', typeof err);
      console.error('[SimpleCreateForm] Error constructor:', err.constructor.name);
      console.error('[SimpleCreateForm] Error keys:', Object.keys(err));
      console.error('[SimpleCreateForm] Error message:', err.message);
      console.error('[SimpleCreateForm] Error details:', err.details);
      console.error('[SimpleCreateForm] Error code:', err.code);
      
      let errorMessage = 'An error occurred while creating the record';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.details) {
        errorMessage = err.details;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.code) {
        errorMessage = `Database error (${err.code})`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        {essentialFields.map((field) => (
          <Grid item xs={12} key={field.name}>
            <Box>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                {field.label}
                {field.required && <span style={{ color: 'red' }}> *</span>}
              </Typography>
              {field.description && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  {field.description}
                </Typography>
              )}
              
              <FieldRenderer
                field={field}
                value={formData[field.name] || ''}
                record={formData}
                config={config}
                mode="create"
                editable
                onChange={(value) => handleChange(field.name, value)}
              />
            </Box>
          </Grid>
        ))}
      </Grid>

      {!isModal && (
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button 
            variant="outlined" 
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            variant="contained" 
            disabled={loading || !formData.title}
          >
            {loading ? <CircularProgress size={20} /> : `Create ${config.singularLabel || 'Record'}`}
          </Button>
        </Box>
      )}
    </Box>
  );

  if (isModal) {
    return (
      <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Create New {config.singularLabel || config.label}
          {formData.checklist_id && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              For Checklist ID: {formData.checklist_id}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {content}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained" 
            disabled={loading || !formData.title}
          >
            {loading ? <CircularProgress size={20} /> : `Create ${config.singularLabel || 'Record'}`}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Create New {config.singularLabel || config.label}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Fill in the essential information to create your {config.singularLabel?.toLowerCase() || 'record'}. 
        You can add more details after creation.
      </Typography>

      {content}
    </Box>
  );
};

export default SimpleCreateForm;