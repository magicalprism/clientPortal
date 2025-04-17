'use client';

import React, { useState, useEffect } from 'react';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
  TextField
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';
import { Archive as ArchiveIcon } from '@phosphor-icons/react/dist/ssr/Archive';
import { PencilSimple as PencilIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import dayjs from 'dayjs';
import { FieldRenderer } from '@/components/FieldRenderer';

export function CollectionModal({
  open,
  onClose,
  onUpdate,
  onDelete,
  config,
  record = {},
  onRefresh,
  edit: forceEdit = false
}) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState('overview');
  const [edit, setEdit] = useState(!record?.id || forceEdit);
  const [values, setValues] = useState({});

  const refField = searchParams.get('refField');
  const parentId = searchParams.get('id');

  const isIncludedInView = (field, view) => {
    if (!field.includeInViews) return true;
    if (field.includeInViews.length === 1 && field.includeInViews[0] === 'none') return false;
    return field.includeInViews.includes(view);
  };

  useEffect(() => {
    const initial = {};

    config.fields.forEach((field) => {
      if (field.name === refField && !record?.id) {
        initial[field.name] = parentId;
      } else {
        initial[field.name] = record[field.name] ?? '';
      }
    });

    setValues(initial);
  }, [record, config.fields, refField, parentId]);

  const handleChange = (fieldName, value) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSave = async () => {
    const updateData = {};

    config.fields.forEach((field) => {
      const { name, type } = field;
      let value = values[name];

      if (!isIncludedInView(field, 'edit') || value === undefined || value === '') return;

      if (type === 'date' && value) {
        try {
          value = dayjs(value).toISOString();
        } catch (e) {
          console.warn(`Invalid date for field ${name}:`, value);
        }
      }

      if (['id', 'created', 'updated', 'author_id'].includes(name)) return;

      updateData[name] = value;
    });

    if (!Object.keys(updateData).length) return;

    await onUpdate?.(record.id, updateData);
    setEdit(false);

    // ✅ Let router update first, then reload
    onClose?.();
    setTimeout(() => {
      onRefresh?.();
    }, 100);
  };

  return (
    <Dialog
      maxWidth="sm"
      onClose={onClose}
      open={open}
      sx={{
        '& .MuiDialog-container': { justifyContent: 'flex-end' },
        '& .MuiDialog-paper': { height: '100%', width: '100%' }
      }}
    >
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, p: 0 }}>
        <Box sx={{ flex: '0 0 auto', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {edit && !record?.id
              ? `Add New ${config?.label || config?.name}`
              : `Edit ${config?.label || config?.name}`}
          </Typography>
          <IconButton onClick={onClose}>
            <XIcon />
          </IconButton>
        </Box>

        <Divider />

        <Tabs value={tab} onChange={(_, val) => setTab(val)} sx={{ px: 3 }}>
          <Tab label="Overview" value="overview" />
        </Tabs>

        <Divider />

        <Box sx={{ flex: '1 1 auto', overflowY: 'auto', p: 3 }}>
          {tab === 'overview' && (
            <Stack spacing={4}>
              {edit ? (
                <Stack spacing={2}>
                  {config.fields.map((field) => {
                    if (!isIncludedInView(field, 'edit')) return null;

                    return (
                      <Box key={field.name}>
                        <TextField
                          fullWidth
                          size="small"
                          label={field.label}
                          value={values[field.name]}
                          onChange={(e) => handleChange(field.name, e.target.value)}
                          multiline={field.type === 'textarea'}
                          minRows={field.type === 'textarea' ? 3 : 1}
                        />
                      </Box>
                    );
                  })}
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button onClick={() => setEdit(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>Save</Button>
                  </Stack>
                </Stack>
              ) : (
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Stack spacing={2} sx={{ flex: 1 }}>
                    {config.fields.map((field) => {
                      if (!isIncludedInView(field, 'modal')) return null;
                      return (
                        <Box key={field.name}>
                          <Typography variant="subtitle2">{field.label}</Typography>
                          <FieldRenderer value={values[field.name]} field={field} record={record} />
                        </Box>
                      );
                    })}
                  </Stack>
                  {!edit && record.id && (
                    <IconButton onClick={() => setEdit(true)}>
                      <PencilIcon />
                    </IconButton>
                  )}
                </Stack>
              )}

              {record.author && (
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Created by</Typography>
                  <Stack direction="row" spacing={2}>
                    <Avatar src={record.author.avatar} />
                    <div>
                      <Typography variant="subtitle2">{record.author.name}</Typography>
                      <Typography color="text.secondary" variant="body2">
                        @{record.author.username}
                      </Typography>
                    </div>
                  </Stack>
                </Stack>
              )}

              {record.id && (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    color="error"
                    onClick={() => onDelete?.(record.id)}
                    startIcon={<ArchiveIcon />}
                  >
                    Archive
                  </Button>
                </Box>
              )}
            </Stack>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
