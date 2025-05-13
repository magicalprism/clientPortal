'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  useMediaQuery, Card, CardContent, Tabs, Tab, Grid, Divider,
  Typography, TextField, CircularProgress, Box, IconButton, Button
} from '@mui/material';
import { useGroupedFields } from '@/components/fields/useGroupedFields';
import { useCollectionSave } from '@/hooks/useCollectionSave';
import { FieldRenderer } from '@/components/FieldRenderer';
import { MiniCollectionTable } from '@/components/tables/MiniCollectionTable';
import { BrandBoardPreview } from '@/components/BrandBoardPreview';
import { ElementMap } from '@/components/ElementMap';
import { useRouter } from 'next/navigation';
import { Plus } from '@phosphor-icons/react';
import { extractSelectValue } from '@/components/fields/SelectField';

export const CollectionItemPage = ({ config, record, isModal = false }) => {
  // Add this ref and counter to track renders
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();

  // IMPORTANT: Add sanitization function
  const sanitizeRecord = (input) => {
    const blacklist = ['modal', 'type', 'view', 'refField', 'variant'];
    return Object.fromEntries(Object.entries(input || {}).filter(([key]) => !blacklist.includes(key)));
  };

  // Start with a clean record
  const initializedRecord = useMemo(() => sanitizeRecord(record), [record]);
  


  const [localRecord, setLocalRecord] = useState(null);

  // Only set once record is initialized
  useEffect(() => {
    if (!record) return;
  
    const sanitized = sanitizeRecord(record);
    setLocalRecord((prev) => {
      const prevJson = JSON.stringify(prev);
      const nextJson = JSON.stringify(sanitized);
      return prevJson !== nextJson ? sanitized : prev;
    });
  }, [record]);
  
  
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
  const { tabNames, currentTabGroups } = useGroupedFields(config?.fields || [], activeTab);

  

/**
 * Handles field value changes in the collection item page
 * This function correctly handles different field types
 * 
 * @param {Object} field - The field configuration object
 * @param {any} value - The new field value
 */
const handleFieldChange = (field, value) => {
  console.log(`✏️ Change in "${field.name}":`, value);

  // Special handling for multiRelationship fields
  if (field.type === 'multiRelationship') {
    if (value?.ids) {
      // Handle object format with ids and details
      setLocalRecord((prev) => ({
        ...prev,
        [field.name]: value.ids,
        [`${field.name}_details`]: value.details,
      }));
    } else if (Array.isArray(value)) {
      // Handle array format with just IDs
      setLocalRecord((prev) => ({
        ...prev,
        [field.name]: value,
      }));
    }
    return;
  } 
  
  // Special handling for select/status fields
  if (field.type === 'select' || field.type === 'status') {
    // Store the complete value/label object for UI display
    // The actual database save in saveRecord will extract just the value
    console.log(`✏️ Select/status field "${field.name}" changed:`, value);
    updateLocalValue(field.name, value);
    return;
  }
  
  // Special handling for relationship fields
  if (field.type === 'relationship' && value !== null && value !== undefined) {
    // If it's an object with id property, extract just the id
    if (typeof value === 'object' && value.id !== undefined) {
      updateLocalValue(field.name, value.id);
    } else {
      // It's already a simple value (likely an ID)
      updateLocalValue(field.name, value);
    }
    return;
  }
  
  // Default handling for other field types
  updateLocalValue(field.name, value);
};
      

    
  
  const startEdit = (fieldName, currentValue) => {
    console.log(`✏️ Start editing "${fieldName}"`);
    setEditingField(fieldName);
    setTempValue(currentValue ?? '');
  };

  return (
    <>
      <Card>
        <CardContent>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3 }}
            variant="scrollable"
          >
            {tabNames.map((tabName) => (
              <Tab key={tabName} label={tabName} />
            ))}
          </Tabs>

          <Grid container spacing={5}>
            {Object.entries(currentTabGroups || {}).map(([groupName, fields]) => (
              <Grid item xs={12} key={groupName}>
                <Typography variant="h6" fontWeight="bold" gutterBottom pb={1}>
                  {groupName}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={4}>
                  {fields.map((field) => {
                    const value = localRecord?.[field.name];
                    const isSystemReadOnly = ['updated_at', 'created_at'].includes(field.name);
                    const editable = !isSystemReadOnly && field.editable !== false;
                    const isEditing = editingField === field.name;
                    const isLoading = loadingField === field.name;

                    const isBasicTextField = ![
                      'relationship', 'multiRelationship', 'boolean', 'status', 'json',
                      'editButton', 'media', 'link', 'date', 'richText', 'timezone',
                      'select', 'color',
                    ].includes(field.type);

                    const isTwoColumn = !isModal && !isSmallScreen;

                    if (!field || typeof field !== 'object') {
                      console.warn('⚠️ Skipping invalid field:', field);
                      return null;
                    }

                    if (field.type === 'custom' && field.component === 'BrandBoardPreview') {
                      return (
                        <Grid item xs={12} key={field.name}>
                          <BrandBoardPreview brand={localRecord} />
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

                    if (field.type === 'multiRelationship' && field.displayMode === 'table') {
                      return (
                        <Grid item xs={12} key={field.name}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2">{field.label}</Typography>
                            <IconButton
                              onClick={() =>
                                router.push(`?modal=create&id=${record.id}`)
                              }
                            >
                              <Plus />
                            </IconButton>
                          </Box>
                          <MiniCollectionTable
                            field={field}
                            config={config}
                            rows={localRecord?.[field.name + '_details'] ?? []}
                            parentId={record.id}
                          />
                        </Grid>
                      );
                    }

                    return (
                      <Grid item xs={12} sm={6} key={field.name}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={500}>
                            {field.label}
                          </Typography>
                          {field.description && (
                            <Typography variant="caption" color="text.secondary">
                              {field.description}
                            </Typography>
                          )}

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
                                  value={
                                    field.type === 'media'
                                      ? localRecord[`${field.name}_details`] || value
                                      : value
                                  }
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
                        
                      </Grid>
                      
                    );
                  })}
                </Grid>
                
              </Grid>
              
            ))}
            

          </Grid>
        </CardContent>
        
      </Card>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              disabled={!hasChanges}
              onClick={saveRecord}
            >
              Save
            </Button>
          </Box>

     
    </>
  );
};
