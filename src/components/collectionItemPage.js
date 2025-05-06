'use client';

import { useEffect, useState, useMemo } from 'react';
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
  useMediaQuery,

} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Plus } from '@phosphor-icons/react';

import { createClient } from '@/lib/supabase/browser';
import { FieldRenderer } from '@/components/FieldRenderer';
import { SimpleEditor } from '@/components/tiptap/components/tiptap-templates/simple/simple-editor';
import { CollectionModal } from '@/components/CollectionModal';
import { MiniCollectionTable } from '@/components/tables/MiniCollectionTable';
import { BrandBoardPreview } from '@/components/BrandBoardPreview';
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

    console.log('📥 saveChange called for field:', field.name);
    console.log('    └ overrideValue:', overrideValue);
    console.log('    └ tempValue:', tempValue);
    console.log('    └ newValue:', newValue);
  
    // ✅ Normalize object-type values with `.value`
    const objectTypes = ['select', 'status', 'timezone', 'color'];
    if (objectTypes.includes(field.type) && typeof newValue === 'object' && newValue !== null) {
      if ('value' in newValue) {
        newValue = newValue.value;
      } else {
        console.warn(`🟠 Object value for field "${field.name}" missing 'value' key`, newValue);
      }
    }
  
    if (newValue === undefined || newValue === null) {
      console.warn(`⚠️ Skipping save for "${field.name}" because value is undefined or null`, newValue);
      return;
    }
  
    if (localRecord[field.name] === newValue) {
      console.log(`⏭ No change in "${field.name}", skipping save.`);
      setEditingField(null);
      setLoadingField(null);
      return;
    }
  
    console.log('🟢 saveChange: sending update', {
      table: config.name,
      id: localRecord.id,
      field: field.name,
      value: newValue,
    });
  
    setLoadingField(field.name);
  
    try {
      const now = getPostgresTimestamp();

      //media
      if (field.type === 'media') {
        const { data: updatedMedia, error: mediaFetchError } = await supabase
          .from('media')
          .select('*')
          .eq('id', newValue)
          .single();
      
        if (mediaFetchError) {
          console.error('❌ Failed to fetch media after upload:', mediaFetchError);
        }
      
        setLocalRecord((prev) => ({
          ...prev,
          [field.name]: newValue,
          [`${field.name}_details`]: updatedMedia,
          updated_at: now,
        }));
      } else {
        setLocalRecord((prev) => ({
          ...prev,
          [field.name]: newValue,
          updated_at: now,
        }));
      }
      

  //multirelationship
      if (field.type !== 'multiRelationship') {
        const now = getPostgresTimestamp();
        const payload = {
          [field.name]: newValue,
          ...(localRecord.hasOwnProperty('updated_at') ? { updated_at: now } : {}),
        };

        console.log('🧾 Final payload about to send to Supabase:', {
          table: config.name,
          id: localRecord.id,
          payload
        });
  
        const { error } = await supabase
          .from(config.name)
          .update(payload)
          .eq('id', localRecord.id);
  
          if (error) {
            console.error('❌ Supabase update error:', {
              message: error.message,
              details: error.details,
              hint: error.hint
            });
          
          
        } else {
          console.log('✅ Supabase updated:', payload);
          setLocalRecord((prev) => ({
            ...prev,
            [field.name]: newValue,
            updated_at: now,
          }));
        }
      } else {
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

      <Grid container spacing={5}>
        {Object.entries(currentTabGroups).map(([groupName, fields]) => (
          <Grid item xs={12} key={groupName} spacing={5} >

                <Typography variant="h6" fontWeight="bold" gutterBottom pb={1}>
                  {groupName}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={4}>
                  {fields.map((field) => {
                     const excludedSystemFields = ['updated_at', 'created_at', 'id'];
                     if (field.name === 'id') return null;
                     const isSystemReadOnly = ['updated_at', 'created_at'].includes(field.name);
                    
                     if (field.type === 'custom' && field.component === 'BrandBoardPreview') {
                      return (
                        <Grid item xs={12} key={field.name}>
                          <BrandBoardPreview brand={localRecord} />
                        </Grid>
                      );
                    }
                    
                    
                    const value = localRecord[field.name];
                    const editable = isSystemReadOnly ? false : field.editable !== false;
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

                     

                     // 🔧 Handle multiRelationship with table view
                    if (field.type === 'multiRelationship' && field.displayMode === 'table') {
                      const relatedRows = localRecord?.[field.name + '_details'] ?? [];
                      return (
                        <Grid item xs={12} key={field.name}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, }}>
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
                            ? 6 // 3 across
                 
                            : isTwoColumn || field.type === 'media'
                            ? 6 // ← 2 across for everything else
                            : 12
                        }
                        md={
                          field.type === 'color'
                            ? 6 // 3 across
                            : field.type === 'media'
                            ? 6 // also 4 across for media
                            : 6 // default 1 across
                        }
                        lg={
                          field.type === 'color'
                            ? 3 // 3 across
                            : field.type === 'media'
                            ? 4 // also 4 across for media
                            : 6 // default 1 across
                        } 
                        xl={
                          field.type === 'color'
                            ? 3 // 3 across
                            : field.type === 'media'
                            ? 3 // also 4 across for media
                            : 6 // default 1 across
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
                            onBlur={() => !isSystemReadOnly && saveChange(field)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                saveChange(field); // <-- confirm this is still being called
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
                                onChange={(val) => {
                                  if (!isSystemReadOnly) {
                                    saveChange(field, val); // ✅ pass `field` from scope
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
