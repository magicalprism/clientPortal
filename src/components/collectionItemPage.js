'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
  Box,
  IconButton,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Plus } from '@phosphor-icons/react';

import { createClient } from '@/lib/supabase/browser';
import { FieldRenderer } from '@/components/FieldRenderer';
import { SimpleEditor } from '@/components/tiptap/components/tiptap-templates/simple/simple-editor';
import { CollectionModal } from '@/components/CollectionModal';
import { MiniCollectionTable } from '@/components/tables/MiniCollectionTable';
import * as collections from '@/collections';
import { getPostgresTimestamp } from '@/lib/utils/getPostgresTimestamp';



export const CollectionItemPage = ({ config, record, isModal = false }) => {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const modal = searchParams.get('modal');
  const refField = searchParams.get('refField');
  const parentId = searchParams.get('id');

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [loadingField, setLoadingField] = useState(null);
  const [localRecord, setLocalRecord] = useState(record);

  const relatedField = config.fields.find((f) => f.name === refField);
  const relatedCollectionName = relatedField?.relation?.table;
  const relatedConfig = relatedCollectionName ? collections[relatedCollectionName] : null;
  

  useEffect(() => {
    const shouldOpen = modal === 'create' && !!refField;
    setModalOpen(shouldOpen);
  }, [modal, refField]);

  useEffect(() => {
    if (record?.id !== localRecord?.id) {
      setLocalRecord(record);
    }
  }, [record?.id]);

  const tabsWithGroups = config.fields.reduce((acc, field) => {
    const tab = field.tab || 'General';
    const group = field.group || 'Info';
    if (!acc[tab]) acc[tab] = {};
    if (!acc[tab][group]) acc[tab][group] = [];
    acc[tab][group].push(field);
    return acc;
  }, {});

  const tabNames = Object.keys(tabsWithGroups);
  const currentTabGroups = tabsWithGroups[tabNames[activeTab]];

  const startEdit = (fieldName, currentValue) => {
    setEditingField(fieldName);
    setTempValue(currentValue ?? '');
  };

  const saveChange = async (field, overrideValue = null) => {
    let newValue = overrideValue ?? tempValue;
  
    // 🛡 Normalize value if it’s a select-style object
    if (
      ['select', 'status', 'timezone', 'color'].includes(field.type) &&
      typeof newValue === 'object' &&
      newValue !== null &&
      'value' in newValue
    ) {
    
      console.warn(`⚠️ Overriding object value for field "${field.name}" with`, newValue.value);
      newValue = newValue.value;
    }
  
    console.log('🟢 saveChange: sending update', {
      table: config.name,
      id: localRecord.id,
      field: field.name,
      value: newValue,
    });
  
    setLoadingField(field.name);
  
    try {
      if (field.type !== 'multiRelationship') {
        const now = getPostgresTimestamp(); // ✅ Correct timestamp format

        const payload = {
          [field.name]: newValue,
          updated_at: now,
        };

  
        const { error } = await supabase
          .from(config.name)
          .update(payload)
          .eq('id', localRecord.id);
  
        if (error) {
          console.error('❌ Supabase update error:', error);
        } else {
          console.log('✅ Supabase updated:', payload);
  
          setLocalRecord((prev) => ({
            ...prev,
            [field.name]: newValue,
            updated_at: getPostgresTimestamp(),
          }));
        }
      } else {
        // multiRelationship doesn't update Supabase
        setLocalRecord((prev) => ({
          ...prev,
          [field.name]: newValue,
        }));
      }
    } catch (err) {
      console.error('❌ saveChange unexpected error:', err);
    }
  
    setEditingField(null);
    setLoadingField(null);
  };
  
  
  

  const handleCloseModal = () => {
    setModalOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('modal');
    url.searchParams.delete('refField');
    url.searchParams.delete('id');
    router.replace(url.pathname + url.search);
  };

  const handleCreateRelated = async (_id, values) => {
    const { data: created, error } = await supabase
      .from(relatedConfig.name)
      .insert(values)
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting new record:', error);
      return;
    }

    const relation = relatedField?.relation;
    const junctionTable = relation?.junctionTable;
    const sourceKey = relation?.sourceKey || `${config.name}_id`;
    const targetKey = relation?.targetKey || `${relatedConfig.name}_id`;

    if (junctionTable && sourceKey && targetKey) {
      const pivotPayload = {
        [sourceKey]: record?.id || Number(parentId),
        [targetKey]: created.id,
      };

      const { error: pivotError } = await supabase
        .from(junctionTable)
        .insert(pivotPayload);

      if (pivotError) {
        console.error('❌ Error linking pivot:', pivotError);
        return;
      }
    }

    const updatedList = [...(localRecord[refField] || []), created.id];
    const updatedDetails = [
      ...(record[refField + '_details'] || []),
      created,
    ];

    setLocalRecord((prev) => ({
      ...prev,
      [refField]: updatedList,
      [refField + '_details']: updatedDetails,
    }));

    handleCloseModal();
  };

  if (!tabNames.length) {
    return <Typography>No fields available to display.</Typography>;
  }

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

      <Grid container spacing={3}>
        {Object.entries(currentTabGroups).map(([groupName, fields]) => (
          <Grid item xs={12} key={groupName}>

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {groupName}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  {fields.map((field) => {
                    const value = localRecord[field.name];
                    const editable = field.editable !== false;
                    const isEditing = editingField === field.name;
                    const isLoading = loadingField === field.name;

                    const isBasicTextField = ![
                      'relationship',
                      'multiRelationship',
                      'boolean',
                      'status',
                      'json',
                      'editButton',
                      'media',
                      'link',
                      'date',
                      'richText',
                      'timezone',
                      'select',
                      'color',

                    ].includes(field.type);

                    const isTwoColumn = !isModal && !isSmallScreen;

                    if (field.type === 'multiRelationship' && field.displayMode === 'table') {
                      const relatedRows = localRecord?.[field.name + '_details'] ?? [];
                      return (
                        <Grid item xs={12} key={field.name}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>{field.label}</Typography>
                            <IconButton
                              onClick={() =>
                                router.push(
                                  `${window.location.pathname}?modal=create&refField=${field.name}&id=${record.id}`
                                )
                              }
                            >
                              <Plus />
                            </IconButton>
                          </Box>
                          <MiniCollectionTable
                            field={field}
                            config={collections[field.relation.table]}
                            rows={relatedRows}
                            parentId={record.id}
                          />
                        </Grid>
                      );
                    }

                    return (
                      <Grid
                        item
                        xs={12}
                        sm={
                          field.type === 'richText'
                            ? 12
                            : field.type === 'color'
                            ? 4 // ← 3 across for color fields
                            : isTwoColumn
                            ? 6 // ← 2 across for everything else
                            : 12
                        }
                        
                        key={field.name}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: 1,
                            height: '100%', // ensure full height for alignment
                          }}
                        >
                          {/* Title + Description Block */}
                          <Box>
                            <Typography variant="subtitle2" fontWeight={500}>
                              {field.label}
                            </Typography>
                            {field.description && (
                              <Typography variant="caption" color="text.secondary">
                                {field.description}
                              </Typography>
                            )}
                          </Box>


                        {isEditing && isBasicTextField ? (
                          <TextField
                            fullWidth
                            size="medium"
                            sx={{ mb: 2 }}
                            value={tempValue}
                            autoFocus
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={() => {
                              if (!['relationship', 'multiRelationship', 'boolean', 'status', 'json', 'editButton', 'media', 'link', 'date', 'richText', 'timezone', 'color'].includes(field.type)) {
                                saveChange(field);
                              }
                            }}
                            
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                saveChange(field);
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
                            ) : field.type === 'richText' ? (
                              <SimpleEditor
                                content={value}
                                editable
                                onChange={(html) => saveChange(field, html)}
                              />
                            ) : (
                              <FieldRenderer
                                value={
                                  field.type === 'media'
                                    ? localRecord[`${field.name}_details`] || localRecord[field.name]
                                    : localRecord[field.name]
                                }
                                field={field}
                                record={localRecord}
                                config={config}
                                view="detail"
                                editable={editable}
                                isEditing={isEditing}
                                onChange={async (field, newValue) => {
                                  let safeValue = newValue;
                                
                                  // 🛡 Normalize select-style or object-based values
                                  if (
                                    typeof newValue === 'object' &&
                                    newValue !== null &&
                                    'value' in newValue &&
                                    'name' in newValue &&
                                    'type' in newValue &&
                                    newValue.name === field.name &&
                                    newValue.type === field.type &&
                                    typeof newValue.value !== 'object'
                                  ) {
                                    console.warn(`⚠️ Normalizing object value for "${field.name}":`, newValue);
                                    safeValue = newValue.value;
                                  }
                                
                                  // 🚨 Guard against timestamp errors (e.g. entire field object mistakenly passed)
                                  if (field.type === 'timestamp' && typeof safeValue !== 'string') {
                                    console.error(`❌ Invalid timestamp value for "${field.name}":`, safeValue);
                                    return;
                                  }
                                
                                  console.log(`📤 Sending update to Supabase for "${field.name}":`, safeValue);
                                
                                  if (field.type === 'multiRelationship') {
                                    setLocalRecord((prev) => ({
                                      ...prev,
                                      [field.name]: safeValue.ids,
                                      [`${field.name}_details`]: safeValue.details
                                    }));
                                  } else {
                                    try {
                                      const { error } = await supabase
                                        .from(config.name)
                                        .update({ [field.name]: safeValue })
                                        .eq('id', localRecord.id);
                                
                                      if (error) {
                                        console.error('❌ Supabase update error:', error);
                                      } else {
                                        setLocalRecord((prev) => ({
                                          ...prev,
                                          [field.name]: safeValue,
                                        }));
                                        console.log(`✅ Field "${field.name}" updated successfully.`);
                                      }
                                    } catch (err) {
                                      console.error(`❌ Unexpected error updating "${field.name}":`, err);
                                    }
                                  }
                                }}
                                
                                
                                
                                
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

      {modalOpen && relatedConfig && (
        <CollectionModal
          open={modalOpen}
          onClose={handleCloseModal}
          onUpdate={handleCreateRelated}
          onRefresh={() => {}}
          config={relatedConfig}
          record={{}}
          edit
        />
      )}
    </>
  );
};
