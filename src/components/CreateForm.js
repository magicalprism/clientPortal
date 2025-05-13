'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import { createClient } from '@/lib/supabase/browser';
import { FieldRenderer } from '@/components/FieldRenderer';
import { useRouter, usePathname } from 'next/navigation';
import { ModalMultiRelationshipField } from '@/components/fields/relationships/multi/ModalMultiRelationshipField';
import { saveMultiRelationships } from '@/lib/utils/multirelationshipUtils';
import { extractSelectValue } from '@/components/fields/SelectField';

const CreateForm = ({ config, initialRecord = {}, onSuccess, disableRedirect = false }) => {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const { name: table, fields } = config;

  // Process initialRecord to ensure proper formatting
  const processedInitialRecord = { ...initialRecord };
  fields.forEach(field => {
    if (field.type === 'multiRelationship') {
      // Handle different possible formats
      if (initialRecord[field.name]) {
        // Make sure it's an array
        if (!Array.isArray(initialRecord[field.name])) {
          if (initialRecord[field.name].ids) {
            processedInitialRecord[field.name] = initialRecord[field.name].ids;
          } else {
            processedInitialRecord[field.name] = [initialRecord[field.name]];
          }
        }
      } else if (initialRecord[`${field.name}_details`]) {
        // Extract IDs from details
        processedInitialRecord[field.name] = initialRecord[`${field.name}_details`]
          .map(item => String(item.id))
          .filter(Boolean);
      }
    } 
    // Note: We don't normalize select fields here because we want to keep the value/label structure
  });

  const [formData, setFormData] = useState(processedInitialRecord);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debug log for form data changes
  useEffect(() => {
    console.log('[CreateForm] Current form data:', formData);
    
    // Check select fields to make sure they have the expected format
    const selectFields = fields.filter(f => f.type === 'select' || f.type === 'status');
    if (selectFields.length > 0) {
      console.log('[CreateForm] Select fields in form data:', 
        selectFields.map(f => ({ 
          name: f.name, 
          value: formData[f.name], 
          type: typeof formData[f.name] 
        }))
      );
    }
  }, [fields, formData]);

  // Standard field change handler
  const handleChange = (fieldName, value) => {
    console.log(`[CreateForm] Field ${fieldName} changed:`, value);
    
    // Find the field definition
    const fieldDef = fields.find(f => f.name === fieldName);
    
    if (!fieldDef) {
      console.warn(`[CreateForm] No field definition found for ${fieldName}`);
      setFormData(prev => ({ ...prev, [fieldName]: value }));
      return;
    }
    
    // Handle different field types accordingly
    if (fieldDef.type === 'select' || fieldDef.type === 'status') {
      // For select fields, we want to preserve the value/label pair
      // This is important for UI display
      console.log(`[CreateForm] Select field ${fieldName} changed:`, value);
      setFormData(prev => ({ ...prev, [fieldName]: value }));
    } else if (fieldDef.type === 'relationship') {
      // Handle relationship fields - store the ID
      if (value && typeof value === 'object' && value.id !== undefined) {
        setFormData(prev => ({ ...prev, [fieldName]: value.id }));
      } else {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
      }
    } else if (fieldDef.type === 'multiRelationship') {
      // Use specialized handler
      handleMultiRelationshipChange(fieldName, value);
    } else {
      // Default behavior for other fields
      setFormData(prev => ({ ...prev, [fieldName]: value }));
    }
  };
  
  // Special handler for multirelationship fields
  const handleMultiRelationshipChange = (fieldName, value) => {
    console.log(`[CreateForm] MultiRelationship field ${fieldName} changed:`, value);
    
    // Handle different value formats
    if (Array.isArray(value)) {
      // It's an array of IDs
      setFormData(prev => ({
        ...prev,
        [fieldName]: value.map(String).filter(Boolean)
      }));
    } else if (value && (value.ids || value.details)) {
      // It's the {ids, details} format
      setFormData(prev => ({
        ...prev,
        [fieldName]: (value.ids || []).map(String).filter(Boolean),
        [`${fieldName}_details`]: value.details || []
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create a clean copy of the form data for saving
      const cleanData = { ...formData };
      
      // Remove _details fields before saving to database
      const detailsFields = fields
        .filter(f => f.type === 'multiRelationship')
        .map(f => `${f.name}_details`);
        
      detailsFields.forEach(field => {
        delete cleanData[field];
      });
      
      // Process select fields to extract just the raw values for database
      fields.forEach(field => {
        if ((field.type === 'select' || field.type === 'status') && cleanData[field.name]) {
          // Extract raw value if it's an object with value/label
          const rawValue = extractSelectValue(cleanData[field.name]);
          console.log(`[CreateForm] Extracted raw value for ${field.name}:`, 
            { original: cleanData[field.name], raw: rawValue });
          cleanData[field.name] = rawValue;
        }
      });
      
      console.log('[CreateForm] Submitting clean data:', cleanData);
      
      // Save the main record
      const { data, error } = await supabase.from(table).insert([cleanData]).select().single();
      
      if (error) {
        console.error('[CreateForm] Error saving record:', error);
        setError(error.message);
        setLoading(false);
        return;
      }
      
      console.log('[CreateForm] Record saved successfully:', data);
      
      // Prepare record with the new ID for saving multirelationships
      const recordWithId = {
        ...formData,
        id: data.id
      };
      
      // Now save multirelationship fields
      // Only if we have multirelationship fields and the main record was saved successfully
      const multiRelFields = fields.filter(f => f.type === 'multiRelationship' && f.relation?.junctionTable);
      
      if (multiRelFields.length > 0 && data?.id) {
        console.log(`[CreateForm] Saving ${multiRelFields.length} multirelationship fields for new record ${data.id}`);
        
        // Save multirelationship fields to junction tables
        await saveMultiRelationships({
          config,
          record: recordWithId
        });
      }

      // Reset form and handle success
      setFormData({});
      setLoading(false);
      
      if (onSuccess) {
        await onSuccess(data);
      }
      
      // Modal behavior: refresh page to reflect new item
      if (disableRedirect) {
        window.location.reload();
        return;
      }
      
      // Full page behavior: redirect to new item's page
      if (data?.id && config.editPathPrefix) {
        router.push(`${config.editPathPrefix}/${data.id}`);
      }
    } catch (err) {
      console.error('Unexpected error creating record:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  if (!Array.isArray(fields)) {
    return <Typography color="error">Invalid config: missing fields</Typography>;
  }

 return (
  <Box component="form" onSubmit={handleSubmit} sx={{ mx: 'auto', px: 2, border: '2px solid red' }}>
    <Grid container spacing={3}>
      {fields
        .filter((field) => !['created_at', 'updated_at'].includes(field.name))
        .map((field) => {
          const isMultiRel = field.type === 'multiRelationship';
          const isFullWidth = isMultiRel || field.type === 'boolean';

          return (
            <Grid
              item
              xs={12}
              key={field.name}
            >
              <Box display="flex" flexDirection="column" >
                 <Box sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight={500}>
                  {field.label}
                </Typography>
                {field.description && (
                  <Typography variant="caption" color="text.secondary">
                    {field.description}
                  </Typography>
                )}
                </Box>

                {isMultiRel ? (
                  <ModalMultiRelationshipField
                    field={field}
                    record={formData}
                    setRecord={setFormData}
                    config={config}
                    onChange={handleChange}
                    refreshRecord={refreshRecord}
                  />
                ) : (
                  <FieldRenderer
                    field={field}
                    value={currentValue === undefined ? '' : currentValue || ''}
                    record={formData}
                    config={config}
                    mode="create"
                    editable
                    onChange={(value) => handleChange(field.name, value)}
                  />
                )}
              </Box>
            </Grid>
          );
        })}
    </Grid>

    {error && (
      <Typography color="error" mt={2}>
        {error}
      </Typography>
    )}

    <Box mt={4}>
      <Button type="submit" variant="contained" disabled={loading}>
        {loading ? 'Saving...' : 'Create'}
      </Button>
    </Box>
  </Box>
);

};

export default CreateForm;