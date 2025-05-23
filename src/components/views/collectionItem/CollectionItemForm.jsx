'use client';
import { useGroupedFields } from '@/components/fields/useGroupedFields';
import {
  Grid, Divider,
  Typography, TextField, CircularProgress, Box, IconButton
} from '@mui/material';
import { BrandBoardPreview } from '@/components/fields/custom/BrandBoardPreview';
import { ElementMap } from '@/components/fields/custom/ElementMap';
import { TimeTrackerField } from '@/components/fields/dateTime/timer/TimeTrackerField';
import CollectionGridView from '@/components/views/grid/CollectionGridView';
import CollectionView from '@/components/views/CollectionView';
import { RelatedTagsField } from '@/components/fields/relationships/multi/RelatedTagsField';
import { FieldRenderer } from '@/components/FieldRenderer';
import { Plus } from '@phosphor-icons/react';
import * as collections from '@/collections';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export const CollectionItemForm = ({
  config,
  record,
  onFieldChange,
  isEditingField,
  setEditingField,
  loadingField,
  activeTab = 0,
  isModal = false,
  isSmallScreen = false,
  tempValue,
  setTempValue,
  localRecord, // This might be passed in some cases
  onSave, // For modal save handling
  onCancel, // For modal cancel handling
  edit = false, // Edit mode flag
  formId // For form submission
}) => {
  const router = useRouter();
  
  // Use localRecord if provided, otherwise use record
  const workingRecord = localRecord || record;
  
  // Local state for form data in modal mode
  const [formData, setFormData] = useState(workingRecord || {});
  

  
  // Sync formData when record changes
  useEffect(() => {
    if (workingRecord) {
      setFormData(prev => {
        // Only update if actually different to avoid unnecessary re-renders
        if (JSON.stringify(prev) !== JSON.stringify(workingRecord)) {
          return workingRecord;
        }
        return prev;
      });
    }
  }, [workingRecord]);

  const baseTabs = useGroupedFields(config?.fields || [], activeTab);
  const showTimelineTab = config?.showTimelineTab === true;

  const currentTabGroups = showTimelineTab && activeTab === baseTabs.tabNames.length
    ? null
    : baseTabs.currentTabGroups;

  const startEdit = (fieldName, value) => {
    if (setEditingField && setTempValue) {
      setEditingField(fieldName);
      setTempValue(value);
    }
  };

  // Handle field changes - update both local state and propagate up
  const handleFieldChange = (field, value) => {
    const fieldName = typeof field === 'string' ? field : field.name;
    
    // Update local form data
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Propagate change up if handler provided
    if (onFieldChange) {
      onFieldChange(field, value);
    }
  };

  // Handle form submission (for modals)
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (onSave) {
      onSave(formData);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit}>
      <Grid container spacing={5}>
        {Object.entries(currentTabGroups || {}).map(([groupName, fields]) => (
          <Grid item xs={12} key={groupName}>
            {groupName !== 'Fields' && (
              <Typography variant="h6" fontWeight="bold" gutterBottom pb={1}>
                {groupName}
              </Typography>
            )}
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              {fields.map((field) => {
                const value = formData?.[field.name];
                const isSystemReadOnly = ['updated_at', 'created_at'].includes(field.name);
                const fieldIsEditable = !isSystemReadOnly && field.editable !== false;
                const isEditing = isEditingField === field.name;
                const isLoading = loadingField === field.name;

                const isBasicTextField = ![
                  'relationship', 'multiRelationship', 'boolean', 'status', 'json',
                  'editButton', 'media', 'link', 'date', 'richText', 'timezone',
                  'select', 'color', 'custom', 
                ].includes(field.type);

                if (!field || typeof field !== 'object') {
                  return null;
                }

                if (field.type === 'custom' && field.component === 'BrandBoardPreview') {
                  return (
                    <Grid item xs={12} key={field.name}>
                      <BrandBoardPreview brand={formData} />
                    </Grid>
                  );
                }
                
                if (field.type === 'custom' && field.component === 'TimeTrackerField') {
                  return (
                    <Grid item xs={12} key={field.name}>
                      <TimeTrackerField task={formData} />
                    </Grid>
                  );
                }

                if (field.type === 'custom' && field.component === 'ElementMap') {
                  return (
                    <Grid item xs={12} key={field.name}>
                      <ElementMap projectId={formData?.id} />
                    </Grid>
                  );
                }

                // Tags multirelationship 
                if (field.type === 'multiRelationship' && field.displayMode === 'tags') {
                  return (
                    <Grid item xs={12} key={field.name}>
                      <RelatedTagsField 
                        field={field} 
                        parentId={formData?.id} 
                        value={{
                          ids: formData?.[field.name] || [],
                          details: formData?.[`${field.name}_details`] || []
                        }}
                        onChange={(newValue) => handleFieldChange(field, newValue)}
                      />
                    </Grid>
                  );
                }

                if (field.type === 'custom' && field.component === 'CollectionGridView') {
                  const items = formData?.[`${field.sourceField}_details`] ?? [];

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
                      [sourceKey]: formData?.id
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
                        height: '100%',
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
                            onChange={(e) => setTempValue && setTempValue(e.target.value)}
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
                              color: fieldIsEditable && isBasicTextField ? 'primary.main' : 'text.primary',
                              cursor: fieldIsEditable && isBasicTextField ? 'pointer' : 'default',
                              display: 'flex',
                              alignItems: 'center',
                              minHeight: '35px',
                              justifyContent: 'space-between',
                            }}
                            onClick={
                              fieldIsEditable && isBasicTextField
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
                                record={formData}
                                config={config}
                                view="detail"
                                editable={fieldIsEditable}
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
    </form>
  );
};