'use client';

import { useState, useCallback, useEffect } from 'react';
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

  // Get essential fields for creation (usually just title and any required fields)
  const getEssentialFields = () => {
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
  };

  const essentialFields = getEssentialFields();

  // ✅ FIX: Initialize form data with URL params and defaults using useEffect
  useEffect(() => {
    const initialData = {};
    
    // Add URL parameters
    searchParams.forEach((value, key) => {
      if (key !== 'modal' && key !== 'id') {
        // ✅ FIX: Convert numeric strings to numbers for foreign keys
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
  }, [searchParams, essentialFields]);

  const handleChange = useCallback((fieldName, value) => {
    console.log(`[SimpleCreateForm] Field changed: ${fieldName} =`, value);
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const now = getPostgresTimestamp();
      const currentContactId = await getCurrentContactId();

      // ✅ FIX: Prepare the payload with just essential data, ensuring proper types
      const payload = {
        ...formData,
        created_at: now,
        updated_at: now,
      };

      // Add author_id if we have a current contact and the field exists
      if (currentContactId && config.fields.some(f => f.name === 'author_id')) {
        payload.author_id = currentContactId;
      }

      // ✅ FIX: Ensure numeric fields are properly typed
      config.fields.forEach(field => {
        if (field.name.endsWith('_id') && payload[field.name]) {
          payload[field.name] = parseInt(payload[field.name], 10);
        }
      });

      console.log('[SimpleCreateForm] Submitting payload:', payload);

      // Insert the record
      const { data: newRecord, error: insertError } = await supabase
        .from(config.name)
        .insert([payload])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      console.log('[SimpleCreateForm] Created record:', newRecord);

      // ✅ FIX: Always trigger refresh before other actions
      if (onSuccess) {
        await onSuccess(newRecord);
      }

      // Close modal if applicable
      if (isModal && onClose) {
        onClose();
        // ✅ FIX: Clean up URL parameters after successful creation
        const currentUrl = new URL(window.location);
        currentUrl.searchParams.delete('modal');
        currentUrl.searchParams.delete('id');
        // Remove any field parameters too
        essentialFields.forEach(field => {
          currentUrl.searchParams.delete(field.name);
        });
        router.replace(currentUrl.pathname + currentUrl.search);
        return;
      }

      // Redirect to edit page for non-modal cases
      if (newRecord?.id) {
        const editUrl = `${config.editPathPrefix}/${newRecord.id}?modal=edit&id=${newRecord.id}`;
        router.push(editUrl);
      }

    } catch (err) {
      console.error('[SimpleCreateForm] Error creating record:', err);
      setError(err.message || 'An error occurred while creating the record');
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
          {/* ✅ DEBUG: Show what data we have */}
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