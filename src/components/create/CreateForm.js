'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Box, 
  Button, 
  Grid, 
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { FieldRenderer } from '@/components/FieldRenderer';
import { getPostgresTimestamp } from '@/lib/utils/getPostgresTimestamp';
import { getCurrentContactId } from '@/lib/utils/getCurrentContactId';

const CreateForm = ({ config, disableRedirect = false, onCancel, onSuccess }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryModule, setQueryModule] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // ✅ Load query module dynamically
  useEffect(() => {
    const loadQueryModule = async () => {
      try {
        const { table } = await import('@/lib/supabase/queries');
        const entityQueries = table[config.name];
        
        if (!entityQueries) {
          console.error(`[CreateForm] No queries found for table: ${config.name}`);
          setError(`Query module not found for table: ${config.name}`);
          return;
        }
        
        setQueryModule(entityQueries);
      } catch (err) {
        console.error('[CreateForm] Error loading query module:', err);
        setError('Failed to load query functions');
      }
    };
    
    loadQueryModule();
  }, [config.name]);

  // ✅ Organize fields by tabs or steps
  const fieldGroups = useMemo(() => {
    // Group fields by tab configuration
    const tabs = config.tabs || [{ label: 'General', fields: config.fields }];
    
    return tabs.map(tab => ({
      ...tab,
      fields: tab.fields.filter(field => {
        // Skip system fields
        if (['id', 'created_at', 'updated_at', 'deleted_at', 'is_deleted'].includes(field.name)) {
          return false;
        }
        
        // Skip fields marked as hidden in create mode
        if (field.hideInCreate || field.hideWhen?.includes('create')) {
          return false;
        }
        
        return true;
      })
    })).filter(tab => tab.fields.length > 0);
  }, [config]);

  // ✅ Get all fields for form processing
  const allFields = useMemo(() => {
    return fieldGroups.flatMap(group => group.fields);
  }, [fieldGroups]);

  // ✅ Initialize form data
  useEffect(() => {
    const initialData = {};
    
    // Add URL parameters
    const excludedParams = ['modal', 'id', 'view', 'type', 'tab'];
    searchParams.forEach((value, key) => {
      if (!excludedParams.includes(key)) {
        if (key.endsWith('_id') && !isNaN(value) && value !== '') {
          initialData[key] = parseInt(value, 10);
        } else if (value !== '') {
          initialData[key] = value;
        }
      }
    });

    // Add default values
    allFields.forEach(field => {
      if (field.defaultValue !== undefined && !initialData[field.name]) {
        initialData[field.name] = field.defaultValue;
      }
    });

    console.log('[CreateForm] Initialized form data:', initialData);
    setFormData(initialData);
  }, [searchParams, allFields]);

  const handleChange = useCallback((fieldName, value) => {
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
        console.log(`[CreateForm] Found create function: ${functionName}`);
        return functionName;
      }
    }
    
    console.error(`[CreateForm] No create function found. Available functions:`, Object.keys(queryModule));
    return null;
  }, [config.name, queryModule]);

  // ✅ Validation for current step/tab
  const validateCurrentFields = useCallback(() => {
    const currentFields = fieldGroups[activeTab]?.fields || [];
    const requiredFields = currentFields.filter(f => f.required);
    
    return requiredFields.every(field => {
      const value = formData[field.name];
      return value !== undefined && value !== '' && value !== null;
    });
  }, [fieldGroups, activeTab, formData]);

  // ✅ Check if entire form is valid
  const isFormValid = useMemo(() => {
    const requiredFields = allFields.filter(f => f.required);
    return requiredFields.every(field => {
      const value = formData[field.name];
      return value !== undefined && value !== '' && value !== null;
    });
  }, [allFields, formData]);

  const handleNext = () => {
    if (validateCurrentFields()) {
      if (activeTab < fieldGroups.length - 1) {
        setActiveTab(activeTab + 1);
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!queryModule) {
      setError('Query module not loaded');
      return;
    }
    
    if (!isFormValid) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const now = getPostgresTimestamp();
      const currentContactId = await getCurrentContactId();

      // Prepare the payload
      const payload = {
        ...formData,
        created_at: now,
        updated_at: now,
      };

      // Add author_id if available
      if (currentContactId && config.fields.some(f => f.name === 'author_id')) {
        payload.author_id = currentContactId;
      }

      // Ensure proper data types
      allFields.forEach(field => {
        if (payload[field.name] !== undefined && payload[field.name] !== '') {
          if (field.name.endsWith('_id') || field.type === 'integer') {
            payload[field.name] = parseInt(payload[field.name], 10);
          } else if (field.type === 'boolean') {
            payload[field.name] = Boolean(payload[field.name]);
          }
        }
      });

      console.log('[CreateForm] Final payload:', payload);

      // ✅ Use the standardized query function with intelligent fallback
      const createFunctionName = getCreateFunctionName();
      
      if (!createFunctionName) {
        throw new Error(`No create function found for table: ${config.name}. Available functions: ${Object.keys(queryModule).join(', ')}`);
      }
      
      const createFunction = queryModule[createFunctionName];
      console.log(`[CreateForm] Using create function: ${createFunctionName}`);
      
      const { data: newRecord, error: insertError } = await createFunction(payload);

      if (insertError) {
        throw insertError;
      }

      console.log('[CreateForm] Created record successfully:', newRecord);
      await handleSuccess(newRecord);

    } catch (err) {
      console.error('[CreateForm] Error creating record:', err);
      setError(err.message || 'An error occurred while creating the record');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (newRecord) => {
    if (onSuccess) {
      try {
        await onSuccess(newRecord);
      } catch (successError) {
        console.error('[CreateForm] Error in onSuccess callback:', successError);
      }
    }

    if (!disableRedirect) {
      if (newRecord?.id && config.editPathPrefix) {
        const editUrl = `${config.editPathPrefix}/${newRecord.id}`;
        router.push(editUrl);
      }
    }
  };

  if (!queryModule && !error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading form...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Create New {config.singularLabel || config.label}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Fill in the information below to create your {config.singularLabel?.toLowerCase() || 'record'}.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* ✅ Multi-step progress indicator */}
      {fieldGroups.length > 1 && (
        <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
          {fieldGroups.map((group, index) => (
            <Step key={index}>
              <StepLabel>{group.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      <Paper sx={{ p: 3 }}>
        {/* ✅ Tabs for multi-section forms */}
        {fieldGroups.length > 1 && (
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3 }}
          >
            {fieldGroups.map((group, index) => (
              <Tab key={index} label={group.label} />
            ))}
          </Tabs>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {fieldGroups.map((group, groupIndex) => (
            <Box 
              key={groupIndex}
              sx={{ 
                display: activeTab === groupIndex ? 'block' : 'none' 
              }}
            >
              {group.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {group.description}
                </Typography>
              )}

              <Grid container spacing={3}>
                {group.fields.map((field) => (
                  <Grid 
                    item 
                    xs={12} 
                    md={field.width === 'half' ? 6 : 12}
                    key={field.name}
                  >
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
            </Box>
          ))}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Box>
              {onCancel && (
                <Button 
                  variant="outlined" 
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {fieldGroups.length > 1 && (
                <>
                  <Button 
                    variant="outlined" 
                    onClick={handleBack}
                    disabled={loading || activeTab === 0}
                  >
                    Back
                  </Button>
                  
                  {activeTab < fieldGroups.length - 1 ? (
                    <Button 
                      variant="contained" 
                      onClick={handleNext}
                      disabled={loading || !validateCurrentFields()}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button 
                      type="submit"
                      variant="contained" 
                      disabled={loading || !isFormValid}
                    >
                      {loading ? <CircularProgress size={20} /> : `Create ${config.singularLabel || 'Record'}`}
                    </Button>
                  )}
                </>
              )}
              
              {fieldGroups.length === 1 && (
                <Button 
                  type="submit"
                  variant="contained" 
                  disabled={loading || !isFormValid}
                >
                  {loading ? <CircularProgress size={20} /> : `Create ${config.singularLabel || 'Record'}`}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateForm;