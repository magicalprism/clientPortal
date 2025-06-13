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
import { FieldRenderer } from '@/components/FieldRenderer';
import { getPostgresTimestamp } from '@/lib/utils/getPostgresTimestamp';
import { getCurrentContactId } from '@/lib/utils/getCurrentContactId';

const SimpleCreateForm = ({ config, isModal = false, onClose, onSuccess }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryModule, setQueryModule] = useState(null);

  // ✅ Load query module dynamically for better performance
  useEffect(() => {
    const loadQueryModule = async () => {
      try {
        const { table } = await import('@/lib/supabase/queries');
        const entityQueries = table[config.name];
        
        if (!entityQueries) {
          console.error(`[SimpleCreateForm] No queries found for table: ${config.name}`);
          console.log('[SimpleCreateForm] Available tables:', Object.keys(table || {}));
          setError(`Query module not found for table: ${config.name}`);
          return;
        }
        
        setQueryModule(entityQueries);
      } catch (err) {
        console.error('[SimpleCreateForm] Error loading query module:', err);
        setError('Failed to load query functions');
      }
    };
    
    loadQueryModule();
  }, [config.name]);

  // ✅ Optimized field filtering - only show fields that should appear in quick create
  const displayFields = useMemo(() => {
    return config.fields.filter(field => {
      // Skip system fields
      if (['id', 'created_at', 'updated_at', 'deleted_at', 'is_deleted'].includes(field.name)) {
        return false;
      }
      
      // Skip fields marked as hidden in create mode
      if (field.hideInCreate || field.hideWhen?.includes('create')) {
        return false;
      }
      
      // Show required fields
      if (field.required) {
        return true;
      }
      
      // Show fields with URL parameters
      if (searchParams.get(field.name)) {
        return true;
      }
      
      // Show fields marked for quick create
      if (field.showInQuickCreate) {
        return true;
      }
      
      // Show title/name fields
      if (['title', 'name'].includes(field.name)) {
        return true;
      }
      
      // Show fields with default values
      if (field.defaultValue !== undefined) {
        return true;
      }
      
      return false;
    });
  }, [config.fields, searchParams]);

  // ✅ Initialize form data with URL params and defaults
  useEffect(() => {
    const initialData = {};
    
    // Add URL parameters (exclude frontend routing parameters)
    const excludedParams = ['modal', 'id', 'view', 'type', 'tab'];
    searchParams.forEach((value, key) => {
      if (!excludedParams.includes(key)) {
        // Convert numeric strings to numbers for foreign keys
        if (key.endsWith('_id') && !isNaN(value) && value !== '') {
          initialData[key] = parseInt(value, 10);
        } else if (value !== '') {
          initialData[key] = value;
        }
      }
    });

    // Add default values from field configs
    displayFields.forEach(field => {
      if (field.defaultValue !== undefined && !initialData[field.name]) {
        initialData[field.name] = field.defaultValue;
      }
    });

    console.log('[SimpleCreateForm] Initialized form data:', initialData);
    setFormData(initialData);
  }, [searchParams, displayFields]);

  const handleChange = useCallback((fieldName, value) => {
    console.log(`[SimpleCreateForm] Field changed: ${fieldName} =`, value);
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  }, []);

  // ✅ Get the correct function name based on SOP conventions with fallbacks
  const getCreateFunctionName = useCallback(() => {
    if (!queryModule) return null;
    
    // Capitalize first letter of table name
    const capitalizedTable = config.name.charAt(0).toUpperCase() + config.name.slice(1);
    
    // Try different naming patterns in order of preference
    const possibleNames = [
      `insert${capitalizedTable}`,     // SOP standard: insertEvent
      `create${capitalizedTable}`,     // Common alternative: createEvent
      'insert',                        // Generic: insert
      'create',                        // Generic: create
      'add',                          // Alternative: add
      'new'                           // Alternative: new
    ];
    
    // Find the first function that exists
    for (const functionName of possibleNames) {
      if (queryModule[functionName] && typeof queryModule[functionName] === 'function') {
        console.log(`[SimpleCreateForm] Found create function: ${functionName}`);
        return functionName;
      }
    }
    
    console.error(`[SimpleCreateForm] No create function found. Available functions:`, Object.keys(queryModule));
    return null;
  }, [config.name, queryModule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!queryModule) {
      setError('Query module not loaded');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      console.log('[SimpleCreateForm] Starting submit process...');
      
      const now = getPostgresTimestamp();
      const currentContactId = await getCurrentContactId();

      // Prepare the payload
      const payload = {
        ...formData,
        created_at: now,
        updated_at: now,
      };

      // Add author_id if we have a current contact and the field exists
      if (currentContactId && config.fields.some(f => f.name === 'author_id')) {
        payload.author_id = currentContactId;
      }

      // Ensure proper data types
      config.fields.forEach(field => {
        if (payload[field.name] !== undefined && payload[field.name] !== '') {
          if (field.name.endsWith('_id') || field.type === 'integer') {
            payload[field.name] = parseInt(payload[field.name], 10);
          } else if (field.type === 'boolean') {
            payload[field.name] = Boolean(payload[field.name]);
          }
        }
      });

      console.log('[SimpleCreateForm] Final payload:', payload);

      // ✅ Use the standardized query function with intelligent fallback
      const createFunctionName = getCreateFunctionName();
      
      if (!createFunctionName) {
        throw new Error(`No create function found for table: ${config.name}. Available functions: ${Object.keys(queryModule).join(', ')}`);
      }
      
      const createFunction = queryModule[createFunctionName];
      console.log(`[SimpleCreateForm] Using create function: ${createFunctionName}`);
      
      const { data: newRecord, error: insertError } = await createFunction(payload);

      if (insertError) {
        console.error('[SimpleCreateForm] Insert error:', insertError);
        throw insertError;
      }

      console.log('[SimpleCreateForm] Created record successfully:', newRecord);
      await handleSuccess(newRecord);

    } catch (err) {
      console.error('[SimpleCreateForm] Error creating record:', err);
      
      let errorMessage = 'An error occurred while creating the record';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.details) {
        errorMessage = err.details;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (newRecord) => {
    // Call onSuccess first for immediate UI update
    if (onSuccess) {
      console.log('[SimpleCreateForm] Calling onSuccess callback');
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
      
      // Remove field parameters
      displayFields.forEach(field => {
        currentUrl.searchParams.delete(field.name);
      });
      
      router.replace(currentUrl.pathname + currentUrl.search);
    } else {
      // Redirect to edit page for non-modal cases
      if (newRecord?.id && config.editPathPrefix) {
        const editUrl = `${config.editPathPrefix}/${newRecord.id}`;
        router.push(editUrl);
      }
    }
  };

  // ✅ Check if form has minimum required data
  const canSubmit = useMemo(() => {
    const requiredFields = displayFields.filter(f => f.required);
    return requiredFields.every(field => {
      const value = formData[field.name];
      return value !== undefined && value !== '' && value !== null;
    });
  }, [displayFields, formData]);

  const content = (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {!queryModule && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" sx={{ ml: 1 }}>
            Loading...
          </Typography>
        </Box>
      )}

      {queryModule && (
        <Grid container spacing={3}>
          {displayFields.map((field) => (
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
      )}

      {!isModal && queryModule && (
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
            disabled={loading || !canSubmit}
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
          {Object.keys(formData).length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {Object.entries(formData)
                .filter(([key]) => key.endsWith('_id'))
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
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
            disabled={loading || !canSubmit || !queryModule}
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