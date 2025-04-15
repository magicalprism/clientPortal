'use client';

import { useState } from 'react';
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

export const CollectionItemPage = ({ config, record }) => {
  const supabase = createClient();
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
      setLocalRecord({ ...localRecord, [field.name]: tempValue });
    }

    setEditingField(null);
    setLoadingField(null);
  };

  if (!tabNames.length) {
    return <Typography>No fields available to display.</Typography>;
  }

  const currentTabGroups = tabsWithGroups[tabNames[activeTab]];
  if (!currentTabGroups) return null;

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
                <Typography variant="h6" gutterBottom>{groupName}</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {fields.map((field) => {
                    const value = localRecord[field.name];
                    const editable = field.editable !== false;
                    const isEditing = editingField === field.name;
                    const isLoading = loadingField === field.name;

                    return (
                      <Grid item xs={12} sm={6} key={field.name}>
                        <Typography variant="subtitle2">{field.label}</Typography>

                        {isEditing ? (
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
                              cursor: editable ? 'pointer' : 'default',
                              color: editable ? 'primary.main' : 'text.primary',
                              display: 'flex',
                              alignItems: 'center',
                              minHeight: '32px'
                            }}
                            onClick={editable ? () => startEdit(field.name, value) : undefined}
                          >
                            {isLoading
                              ? <CircularProgress size={16} />
                              : <FieldRenderer
                                  value={value}
                                  field={field}
                                  record={localRecord}
                                  config={config}
                                  view="detail"
                                />}
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
    </>
  );
};
