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
  Box
} from '@mui/material';
import { createClient } from '@/lib/supabase/browser';
import { FieldRenderer } from '@/components/FieldRenderer';
import { CollectionModal } from '@/components/CollectionModal';
import * as collections from '@/collections'; // ✅ for dynamic modal config

export const CollectionItemPage = ({ config, record }) => {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(0);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [loadingField, setLoadingField] = useState(null);
  const [localRecord, setLocalRecord] = useState(record);

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

  const saveChange = async (field) => {
    setLoadingField(field.name);
    const { error } = await supabase
      .from(config.name)
      .update({ [field.name]: tempValue })
      .eq('id', localRecord.id);

    if (!error) {
      setLocalRecord((prev) => ({ ...prev, [field.name]: tempValue }));
    }

    setEditingField(null);
    setLoadingField(null);
  };

  // ============================
  // ✅ Modal Handling
  // ============================

  const modal = searchParams.get('modal');
  const refField = searchParams.get('refField');
  const isCreateModal = modal === 'create' && !!refField;

  const relatedField = config.fields.find(f => f.name === refField);
  const relatedCollectionName = relatedField?.relation?.table;
  const relatedConfig = relatedCollectionName ? collections[relatedCollectionName] : null;

  const handleCloseModal = () => {
    router.replace(window.location.pathname); // 👈 remove modal params
  };

  const handleRefreshAfterCreate = () => {
    // ⚠️ Optional: Refresh the page or reload relationships
    // You might want to re-fetch the parent `record` if needed
    window.location.reload();
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
                <Typography variant="h6" gutterBottom>
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
                      'date'
                    ].includes(field.type);

                    return (
                      <Grid item xs={12} sm={6} key={field.name}>
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
                            onBlur={() => saveChange(field)}
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
                              justifyContent: 'space-between'
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
                                editable={!isBasicTextField && editable}
                                onChange={(fieldName, newValue) => {
                                  setTempValue(newValue);
                                  setEditingField(fieldName);
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

      {/* =================== */}
      {/* ✅ Render Modal     */}
      {/* =================== */}
      {isCreateModal && relatedConfig && (
        <CollectionModal
          open={true}
          onClose={handleCloseModal}
          onRefresh={handleRefreshAfterCreate}
          config={relatedConfig}
          record={{}} // create mode
          edit // 👈 force edit mode on mount
        />
      )}

    </>
  );
};
