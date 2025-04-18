'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { X as XIcon } from '@phosphor-icons/react';
import { CollectionItemPage } from '@/components/CollectionItemPage';

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
  const refField = searchParams.get('refField');
  const parentId = searchParams.get('id');

  const extendedRecord = {
    ...record,
    id: record.id || parentId,
    [refField]: parentId
  };

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      fullScreen={fullScreen}
      maxWidth="sm"
      onClose={onClose}
      open={open}
      sx={{
        '& .MuiDialog-container': { justifyContent: 'flex-end' },
        '& .MuiDialog-paper': { height: '100%', width: '100%' }
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6">
              {config.label || config.name}
            </Typography>
            {config.subtitleField && record[config.subtitleField] && (
              <Typography variant="body2" color="text.secondary">
                {record[config.subtitleField]}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose}>
            <XIcon />
          </IconButton>
        </Box>
        <CollectionItemPage
          config={config}
          record={extendedRecord}
          isModal
          onClose={onClose}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onRefresh={onRefresh}
          singleColumn
        />
      </DialogContent>
    </Dialog>
  );
}
