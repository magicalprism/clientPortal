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
    const newValue = overrideValue ?? tempValue;
    setLoadingField(field.name);
  
    try {
      if (field.type !== 'multiRelationship') {
        const { error } = await supabase
          .from(config.name)
          .update({ [field.name]: newValue })
          .eq('id', localRecord.id);
  
        if (!error) {
          setLocalRecord((prev) => ({
            ...prev,
            [field.name]: newValue,
          }));
        } else {
          console.error('❌ Supabase update error', error);
        }
      } else {
        // 🧠 MultiRelationships don't update main table! Update local state only.
        setLocalRecord((prev) => ({
          ...prev,
          [field.name]: newValue,
        }));
      }
    } catch (err) {
      console.error('❌ Unexpected saveChange error:', err);
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
            <Card>
              <CardContent>
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
                    ].includes(field.type);

                    const isTwoColumn = !isModal && !isSmallScreen;

                    if (field.type === 'multiRelationship' && field.displayMode === 'table') {
                      const relatedRows = localRecord?.[field.name + '_details'] ?? [];
                      return (
                        <Grid item xs={12} key={field.name}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2">{field.label}</Typography>
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
                        sm={field.type === 'richText' ? 12 : isTwoColumn ? 6 : 12}
                        key={field.name}
                      >
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          {field.label}
                        </Typography>

                        {isEditing && isBasicTextField ? (
                          <TextField
                            fullWidth
                            size="small"
                            value={tempValue}
                            autoFocus
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={() => {
                              if (!['relationship', 'multiRelationship', 'boolean', 'status', 'json', 'editButton', 'media', 'link', 'date', 'richText', 'timezone'].includes(field.type)) {
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
                              minHeight: '32px',
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
                                  if (field.type === 'multiRelationship') {
                                    setLocalRecord((prev) => ({
                                      ...prev,
                                      [field.name]: newValue.ids,
                                      [`${field.name}_details`]: newValue.details
                                    }));
                                  }
                                   else {
                                    try {
                                      const { error } = await supabase
                                        .from(config.name)
                                        .update({ [field.name]: newValue })
                                        .eq('id', localRecord.id);
                                
                                      if (!error) {
                                        setLocalRecord((prev) => ({
                                          ...prev,
                                          [field.name]: newValue,
                                        }));
                                      }
                                    } catch (err) {
                                      console.error('Update error:', err);
                                    }
                                  }
                                }}
                                
                              />
                            )}
                          </Box>
                        )}
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
