'use client';
import dynamic from 'next/dynamic';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  useMediaQuery, Card, CardContent, Tabs, Tab, Grid, Divider,
  Typography, TextField, CircularProgress, Box, IconButton, Button
} from '@mui/material';
const CollectionView = dynamic(() => import('@/components/views/CollectionView'), {
  ssr: false,
  loading: () => <div>Loading collection...</div>,
});
import { useGroupedFields } from '@/components/fields/useGroupedFields';
import { useCollectionSave } from '@/hooks/useCollectionSave';
import { FieldRenderer } from '@/components/FieldRenderer';
import { BrandBoardPreview } from '@/components/BrandBoardPreview';
import { ElementMap } from '@/components/ElementMap';
import { TimeTrackerField } from '@/components/fields/time/timer/TimeTrackerField';
import { useRouter } from 'next/navigation';
import { Plus } from '@phosphor-icons/react';
import TimelineView from '@/components/views/timeline/TimelineView';
import CollectionGridView from '@/components/views/grid/CollectionGridView';
import { RelatedTagsField } from '@/components/fields/relationships/multi/RelatedTagsField';
import * as collections from '@/collections';
import { createClient } from '@/lib/supabase/browser';

export const CollectionItemPage = ({ config, record, isModal = false }) => {
  // Add this ref and counter to track renders
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const [localRecord, setLocalRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const initialValues = useRef(null); // Initialize to null, not formData

  

  // Sync localRecord with formData when localRecord changes
  useEffect(() => {
    if (localRecord) {
      // Initialize formData with localRecord when it becomes available
      setFormData(localRecord);
      initialValues.current = JSON.parse(JSON.stringify(localRecord)); // Create deep copy for comparison
    }
  }, [localRecord]);

  // Add this to fetch elements for the project when it loads
useEffect(() => {
  // Only run this if we have a valid record with an ID
  if (localRecord?.id) {
    // Check if we have the element_id field in config
    const elementField = config?.fields?.find(f => 
      f.name === 'element_id' && 
      f.type === 'multiRelationship' &&
      f.relation?.table === 'element'
    );
    
    if (elementField) {
      console.log('[Collection] Fetching elements for project:', localRecord.id);
      
      // Create the correct filter condition
      const filterCondition = elementField.relation.targetKey || 'project_id';
      
      // Fetch elements from Supabase
      const supabase = createClient();
      supabase
        .from('element')
        .select('*')
        .eq(filterCondition, localRecord.id)
        .then(({ data, error }) => {
          if (error) {
            console.error('Failed to fetch elements:', error);
            return;
          }
          
          console.log(`[Collection] Found ${data.length} elements for project:`, 
            data.map(e => ({ id: e.id, title: e.title }))
          );
          
          if (data.length > 0) {
            // Update the localRecord with the fetched elements
            setLocalRecord(prev => ({
              ...prev,
              element_id: data.map(e => e.id),
              element_id_details: data
            }));
            
            // Also update formData
            setFormData(prev => ({
              ...prev,
              element_id: data.map(e => e.id),
              element_id_details: data
            }));
          }
        });
    }
  }
}, [localRecord?.id]);

  // Only set once record is initialized
  useEffect(() => {
    if (record) {
      setLocalRecord({ ...record }); // shallow clone at least
    }
  }, [JSON.stringify(record)]); // OR make the effect more reactive
  
  // Always call the hook, but guard its usage with a default empty object
  const {
    updateLocalValue,
    saveRecord,
    editingField,
    setEditingField,
    tempValue,
    setTempValue,
    loadingField,
    hasChanges,
  } = useCollectionSave({
    config,
    record: localRecord || {}, // ✅ prevent crash on first render
    setRecord: setLocalRecord,
    mode: 'edit',
  });
  
  const [activeTab, setActiveTab] = useState(0);
  const baseTabs = useGroupedFields(config?.fields || [], activeTab);
  const showTimelineTab = config?.showTimelineTab === true;

  const tabNames = showTimelineTab ? [...baseTabs.tabNames, 'Timeline'] : baseTabs.tabNames;
  const isTimelineTab = showTimelineTab && activeTab === baseTabs.tabNames.length;
  const currentTabGroups = isTimelineTab ? null : baseTabs.currentTabGroups;

  // FIXED: handleMultifieldChange to use newValue parameter
  const handleMultifieldChange = (fieldName, newValue) => {
    // Update formData state
    setFormData(prev => ({
      ...prev,
      [fieldName]: newValue // FIXED: Use newValue instead of value
    }));
    
    // Update localRecord state to keep them in sync
    updateLocalValue(fieldName, newValue);
    
    // Explicitly set form as dirty
    setIsDirty(true);
  };

  // Add this console log to track isDirty changes
  useEffect(() => {
    console.log('isDirty changed:', isDirty);
  }, [isDirty]);

  // FIXED: Add handleSave function
  const handleSave = () => {
    console.log('Saving record...');
    saveRecord(); // Use the saveRecord function from useCollectionSave
    
    // After successful save, reset dirty flags
    setIsDirty(false);
  };

  /**
   * Handles field value changes in the collection item page
   */
  const handleFieldChange = (fieldOrName, value) => {
    // Normalize field input - handle both field object and field name string
    const fieldName = typeof fieldOrName === 'object' ? fieldOrName.name : fieldOrName;
    const field = typeof fieldOrName === 'object' ? fieldOrName : 
      config?.fields?.find(f => f.name === fieldOrName) || { name: fieldOrName };
    
    console.log(`Field change: ${fieldName} = `, value); // Add debug log
    
    if (field.type === 'date') {
      updateLocalValue(fieldName, value);
      return;
    }

    // Special handling for multiRelationship fields
    if (field.type === 'multiRelationship') {
      console.log('MultiRelationship field change:', { fieldName, value }); // Add debug log
      
      if (value?.ids) {
        // Handle object format with ids and details
        setLocalRecord(prev => ({
          ...prev,
          [fieldName]: value.ids,
          [`${fieldName}_details`]: value.details,
        }));
        
        // IMPORTANT: Update formData to trigger isDirty
        setFormData(prev => ({
          ...prev,
          [fieldName]: value.ids,
          [`${fieldName}_details`]: value.details,
        }));
      } else if (Array.isArray(value)) {
        // Handle array format with just IDs
        setLocalRecord(prev => ({
          ...prev,
          [fieldName]: value,
        }));
        
        // IMPORTANT: Update formData to trigger isDirty
        setFormData(prev => ({
          ...prev,
          [fieldName]: value,
        }));
      }
      
      // Explicitly set as dirty
      setIsDirty(true);
      
      // Trigger autoSave if configured
      if (config?.autosave === true && typeof saveRecord === 'function') {
        setTimeout(() => saveRecord(), 100);
      }
      
      return;
    }
    
    // Special handling for select/status fields
    if (field.type === 'select' || field.type === 'status') {
      updateLocalValue(fieldName, value);
      
      // Update formData too
      setFormData(prev => ({
        ...prev,
        [fieldName]: value
      }));
      
      return;
    }
    
    // Special handling for relationship fields
    if (field.type === 'relationship' && value !== null && value !== undefined) {
      // If it's an object with id property, extract just the id
      if (typeof value === 'object' && value.id !== undefined) {
        updateLocalValue(fieldName, value.id);
        
        // Update formData too
        setFormData(prev => ({
          ...prev,
          [fieldName]: value.id
        }));
      } else {
        // It's already a simple value (likely an ID)
        updateLocalValue(fieldName, value);
        
        // Update formData too
        setFormData(prev => ({
          ...prev,
          [fieldName]: value
        }));
      }
      return;
    }
    
    // Default handling for other field types
    updateLocalValue(fieldName, value);
    
    // Update formData too
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Any change should set isDirty
    setIsDirty(true);
  };
    
  const startEdit = (fieldName, currentValue) => {
    setEditingField(fieldName);
    setTempValue(currentValue ?? '');
  };

  const tableRelationships = (config?.fields || [])
    .filter(f => f.type === 'multiRelationship' && f.displayMode === 'table');

  // Add debug logging for every render
  console.log('Render state:', {
    isDirty,
    hasChanges,
    saveButtonDisabled: !isDirty && !hasChanges
  });

  return (
    <>
      <Card elevation={0}>
        <CardContent>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3 }}
            variant="scrollable"
          >
            {tabNames.map((tabName, index) => (
              <Tab key={index} label={tabName} />
            ))}
          </Tabs>
          {currentTabGroups ? (
            <Grid container spacing={5}>
              {Object.entries(currentTabGroups || {}).map(([groupName, fields]) => (
                <Grid item xs={12} key={groupName}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom pb={1}>
                    {groupName}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={3}>
                    {fields.map((field) => {
                      const value = localRecord?.[field.name];
                      const isSystemReadOnly = ['updated_at', 'created_at'].includes(field.name);
                      const editable = !isSystemReadOnly && field.editable !== false;
                      const isEditing = editingField === field.name;
                      const isLoading = loadingField === field.name;

                      const isBasicTextField = ![
                        'relationship', 'multiRelationship', 'boolean', 'status', 'json',
                        'editButton', 'media', 'link', 'date', 'richText', 'timezone',
                        'select', 'color', 'custom', 
                      ].includes(field.type);

                      const isTwoColumn = !isModal && !isSmallScreen;

                      if (!field || typeof field !== 'object') {
                        return null;
                      }

                      if (field.type === 'custom' && field.component === 'BrandBoardPreview') {
                        return (
                          <Grid item xs={12} key={field.name}>
                            <BrandBoardPreview brand={localRecord} />
                          </Grid>
                        );
                      }
                      if (field.type === 'custom' && field.component === 'TimeTrackerField') {
                        return (
                          <Grid item xs={12} key={field.name}>
                            <TimeTrackerField task={localRecord} />
                          </Grid>
                        );
                      }

                      if (field.type === 'custom' && field.component === 'ElementMap') {
                        return (
                          <Grid item xs={12} key={field.name}>
                            <ElementMap projectId={localRecord?.id} />
                          </Grid>
                        );
                      }

                      //tags multirelationship 
                      if (field.type === 'multiRelationship' && field.displayMode === 'tags') {
                        return (
                          <Grid item xs={12} key={field.name}>
                            <RelatedTagsField 
                              field={field} 
                              parentId={localRecord?.id} 
                              value={{
                                ids: localRecord?.[field.name] || [],
                                details: localRecord?.[`${field.name}_details`] || []
                              }}
                              onChange={(val) => handleFieldChange(field, val)}
                            />
                          </Grid>
                        );
                      }

                      if (field.type === 'custom' && field.component === 'CollectionGridView') {
                        const items = localRecord?.[`${field.sourceField}_details`] ?? [];

                        return (
                          <Grid item xs={12} key={field.name}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle2">{field.label || 'Gallery'}</Typography>
                              <IconButton
                                onClick={() =>
                                  router.push(`?modal=create&id=${record.id}&field=${field.sourceField}`)
                                }
                              >
                                <Plus />
                              </IconButton>
                            </Box>
                            <CollectionGridView items={items} />
                          </Grid>
                        );
                      }
                      if (field.type === 'multiRelationship' && field.displayMode === 'table') {
                        const baseConfig = collections[field.relation.table];

                        if (!baseConfig) {
                          console.warn(`Missing collection config for ${field.relation.table}`);
                          return null;
                        }

                        const sourceKey = field.relation.sourceKey;

                        const relatedConfig = {
                          ...baseConfig,
                          label: field.label || baseConfig.label,
                          singularLabel: field.label || baseConfig.singularLabel || baseConfig.label,
                          forcedFilters: {
                            [sourceKey]: localRecord?.id
                          }
                        };

                        return (
                          <Grid item xs={12} key={field.name}>
                            <CollectionView
                              config={relatedConfig}
                              variant="details"
                            />
                          </Grid>
                        );
                      }

                      return (
                        <Grid item xs={12} key={field.name}>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              height: '100%', // or a fixed px value like '120px',
                            }}
                          >
                            <Box>
                              <Typography variant="subtitle2" fontWeight={500} paddingBottom={1}>
                                {field.label}
                              </Typography>
                              {field.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {field.description}
                                </Typography>
                              )}
                            </Box>

                            <Box>
                              {isEditing && isBasicTextField ? (
                                <TextField
                                  fullWidth
                                  size="medium"
                                  value={tempValue}
                                  autoFocus
                                  onChange={(e) => setTempValue(e.target.value)}
                                  onBlur={() => handleFieldChange(field, tempValue)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleFieldChange(field, tempValue);
                                    }
                                  }}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    cursor: editable && isBasicTextField ? 'pointer' : 'default',
                                    color: editable && isBasicTextField ? 'primary.main' : 'text.primary',
                                    display: 'flex',
                                    alignItems: 'center',
                                    minHeight: '35px',
                                    justifyContent: 'space-between',
                                  }}
                                  onClick={
                                    editable && isBasicTextField
                                      ? () => startEdit(field.name, value)
                                      : undefined
                                  }
                                >
                                  {isLoading ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <FieldRenderer
                                      value={value}
                                      field={field}
                                      record={localRecord}
                                      config={config}
                                      view="detail"
                                      editable={editable}
                                      isEditing={isEditing}
                                      onChange={(val) => handleFieldChange(field, val)}
                                    />
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Grid>
              ))}
            </Grid>
          ) : (
            showTimelineTab && isTimelineTab && localRecord?.id && (
              <Box mt={2}>
                <TimelineView projectId={localRecord.id} config={config} />
              </Box>
            )
          )}
        </CardContent>
      </Card>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        {/* REMOVED: MultifieldComponent that was causing errors */}
        
        {/* Save button that uses isDirty state */}
        <Button 
          disabled={!isDirty && !hasChanges} // Use both flags
          onClick={handleSave}
          variant="contained"
          color="primary"
        >
          Save
        </Button>
      </Box>
    </>
  );
};