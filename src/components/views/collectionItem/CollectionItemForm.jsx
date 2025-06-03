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
import { useState, useEffect, useMemo } from 'react';
import TimelineView from '@/components/fields/custom/timeline/TimelineView';
import { CommentThread } from '@/components/fields/custom/comments/CommentThread';
import { SectionThread } from '@/components/fields/custom/sections/SectionThread';
import { PaymentThread } from '@/components/fields/custom/payments/PaymentThread';

// NEW: Import Google Drive components
import { GoogleDriveFolderStatus } from '@/components/google/GoogleDriveFolderStatus';
import { GoogleDriveRenameStatus } from '@/components/google/GoogleDriveRenameStatus';

// Helper function to ensure all field values are defined (never undefined)
const normalizeFormValue = (value, field) => {
  if (value === undefined || value === null) {
    // Return appropriate default based on field type
    switch (field?.type) {
      case 'multiRelationship':
        return [];
      case 'boolean':
        return false;
      case 'select':
      case 'status':
        return field.defaultValue || '';
      case 'richText':
        return '';
      case 'date':
        return null; // Date fields can be null
      case 'number':
        return 0;
      default:
        return ''; // String fields
    }
  }
  return value;
};

// Helper to normalize entire record
const normalizeRecord = (record, config) => {
  if (!record || !config?.fields) return {};
  
  const normalized = { ...record };
  
  config.fields.forEach(field => {
    normalized[field.name] = normalizeFormValue(record[field.name], field);
  });
  
  return normalized;
};

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
  tempValue = '', // Ensure this is never undefined
  setTempValue,
  localRecord,
  onSave,
  onCancel,
  edit = false,
  formId
}) => {
  const router = useRouter();
  
  // Use localRecord if provided, otherwise use record, with proper normalization
  const workingRecord = useMemo(() => {
    const baseRecord = localRecord || record || {};
    return normalizeRecord(baseRecord, config);
  }, [localRecord, record, config]);
  
  // Initialize formData with normalized values - NEVER undefined
  const [formData, setFormData] = useState(() => workingRecord);
  const [pendingPayments, setPendingPayments] = useState([]);

  // Sync formData when workingRecord changes - with proper undefined checking
  useEffect(() => {
    if (workingRecord && Object.keys(workingRecord).length > 0) {
      setFormData(prev => {
        // Compare stringified versions, but avoid setting if truly identical
        const prevString = JSON.stringify(prev);
        const newString = JSON.stringify(workingRecord);
        
        if (prevString !== newString) {
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
      // Ensure tempValue is never undefined
      setTempValue(value !== undefined && value !== null ? String(value) : '');
    }
  };

  // Handle field changes with proper undefined handling
  const handleFieldChange = (field, value) => {
    const fieldName = typeof field === 'string' ? field : field.name;
    const fieldConfig = typeof field === 'object' ? field : config?.fields?.find(f => f.name === fieldName);
    
    // Normalize the value to ensure it's never undefined
    const normalizedValue = normalizeFormValue(value, fieldConfig);
    
    // Update local form data
    setFormData(prev => ({
      ...prev,
      [fieldName]: normalizedValue
    }));
    
    // Propagate change up if handler provided
    if (onFieldChange) {
      onFieldChange(field, normalizedValue);
    }
  };

  // NEW: Handle record updates from Google Drive components
  const handleRecordUpdate = (updatedRecord) => {
    setFormData(prev => ({
      ...prev,
      ...updatedRecord
    }));
    
    // If there's a parent update handler, call it too
    if (onFieldChange) {
      Object.entries(updatedRecord).forEach(([key, value]) => {
        onFieldChange(key, value);
      });
    }
  };

  // Handle form submission (for modals)
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (onSave) {
      onSave(formData);
    }
  };

  // Check if we're on the timeline tab
  const isTimelineTab = showTimelineTab && activeTab === baseTabs.tabNames.length;

  // NEW: Check if this collection supports Google Drive
  const supportsGoogleDrive = config?.create_folder === true;

  return (
    <form id={formId} onSubmit={handleSubmit}>
      {/* NEW: Google Drive Integration - Only show if config supports it */}
      {supportsGoogleDrive && formData?.id && (
        <Box sx={{ mb: 3 }}>
          <GoogleDriveFolderStatus
            record={formData}
            config={config}
            onRecordUpdate={handleRecordUpdate}
            variant={isModal ? "compact" : "full"}
          />
          
          <GoogleDriveRenameStatus
            record={formData}
            config={config}
            onRecordUpdate={handleRecordUpdate}
            variant={isModal ? "compact" : "full"}
            showActions={!isModal} // Only show action buttons in full view
          />
        </Box>
      )}

      {isTimelineTab ? (
        // Only render TimelineView if we have actual record data
        formData?.id ? (
          <TimelineView projectId={formData.id} config={config} />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )
      ) : (
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
                // Get value with proper defaulting - NEVER undefined
                const value = normalizeFormValue(formData?.[field.name], field);
                const isSystemReadOnly = ['updated_at', 'created_at'].includes(field.name);
                const fieldIsEditable = !isSystemReadOnly && field.editable !== false;
                const isEditing = isEditingField === field.name;
                const isLoading = loadingField === field.name;

                const isBasicTextField = ![
                  'relationship', 'multiRelationship', 'boolean', 'status', 'json',
                  'editButton', 'media', 'link', 'date', 'richText', 'timezone',
                  'select', 'color', 'custom', 'comments', 'sections', 'payments'
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

                if (field.type === 'comments') {
                  return (
                    <Grid item xs={12} key={field.name}>
                      <Typography variant="subtitle2" fontWeight={500} paddingBottom={1}>
                        {field.label}
                      </Typography>
                      <CommentThread
                        entity={field.props?.entity}
                        entityId={formData?.id}
                      />
                    </Grid>
                  );
                }

                if (field.type === 'sections') {
                  return (
                    <Grid item xs={12} key={field.name}>
                      <SectionThread
                        pivotTable={field.props?.pivotTable}
                        entityField={field.props?.entityField}
                        entityId={formData?.id}
                        label={field.label}
                        record={formData}
                        mediaPivotTable={field.props?.mediaPivotTable || 'media_section'}
                      />
                    </Grid>
                  );
                }

                if (field.type === 'payments') {
                  return (
                    <Grid item xs={12} key={field.name}>
                      <PaymentThread
                        pivotTable={field.props?.pivotTable || 'contract_payment'}
                        entityField={field.props?.entityField || 'contract_id'}
                        entityId={formData?.id}
                        label={field.label || 'Payment Schedule'}
                        record={formData}
                        showInvoiceButton={field.props?.showInvoiceButton !== false}
                        onCreatePendingPayment={(payment) =>
                          setPendingPayments(prev => [...prev, payment])
                        }
                      />
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
                          ids: Array.isArray(formData?.[field.name]) ? formData[field.name] : [],
                          details: Array.isArray(formData?.[`${field.name}_details`]) ? formData[`${field.name}_details`] : []
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
                            value={tempValue || ''} // Ensure never undefined
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
      )}
    </form>
  );
};