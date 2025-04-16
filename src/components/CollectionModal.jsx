'use client';

import React from 'react';
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
  OutlinedInput
} from '@mui/material';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';
import { Archive as ArchiveIcon } from '@phosphor-icons/react/dist/ssr/Archive';
import { PencilSimple as PencilIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import dayjs from 'dayjs';
import { FieldRenderer } from '@/components/FieldRenderer'; // ✅ use your shared component

export function CollectionModal({
  open,
  onClose,
  onUpdate,
  onDelete,
  config,
  record = {},
  onRefresh
}) {
  const [tab, setTab] = React.useState('overview');
  const [edit, setEdit] = React.useState(false);
  const [values, setValues] = React.useState({});

  const isIncludedInView = (field, view) => {
    if (!field.includeInViews) return true;
    if (field.includeInViews.length === 1 && field.includeInViews[0] === 'none') return false;
    return field.includeInViews.includes(view);
  };

  React.useEffect(() => {
    const initial = {};
    config.fields.forEach((field) => {
      initial[field.name] = record[field.name] ?? '';
    });
    setValues(initial);
  }, [record, config.fields]);

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

      if (["id", "created", "updated", "author_id"].includes(name)) return;

      updateData[name] = value;
    });

    if (!Object.keys(updateData).length) return;

    await onUpdate?.(record.id, updateData);
    setEdit(false);

    setTimeout(() => {
      window.location.reload();
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
        <Box sx={{ flex: '0 0 auto', p: 3 }}>
          <IconButton onClick={onClose}>
            <XIcon />
          </IconButton>
        </Box>

        <Divider />

        <Tabs value={tab} onChange={(_, val) => setTab(val)} sx={{ px: 3 }}>
          <Tab label="Overview" value="overview" />
        </Tabs>

        <Divider />

        <Box sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column', overflowY: 'auto', p: 3 }}>
          {tab === 'overview' && (
            <Stack spacing={4}>
              {edit ? (
                <Stack spacing={2}>
                  {config.fields.map((field) => {
                    if (!isIncludedInView(field, 'edit')) return null;

                    return (
                      <OutlinedInput
                        key={field.name}
                        value={values[field.name]}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.label}
                        multiline={field.type === 'textarea'}
                        minRows={field.type === 'textarea' ? 3 : 1}
                      />
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
                          <FieldRenderer
                            value={values[field.name]}
                            field={field}
                            record={record}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                  <IconButton onClick={() => setEdit(true)}>
                    <PencilIcon />
                  </IconButton>
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

              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button color="error" onClick={() => onDelete?.(record.id)} startIcon={<ArchiveIcon />}>
                  Archive
                </Button>
              </Box>
            </Stack>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}