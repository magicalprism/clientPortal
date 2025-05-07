'use client';

import React, { useEffect, useState } from 'react';
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
import { createClient } from '@/lib/supabase/browser';

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
  const supabase = createClient();
  const searchParams = useSearchParams();
  const refField = searchParams.get('refField');
  const recordId = searchParams.get('id');

  const isCreating = !recordId;
  const [loadedRecord, setLoadedRecord] = useState(null);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!isCreating && !record?.id && recordId) {
        const { data, error } = await supabase
          .from(config.name)
          .select('*')
          .eq('id', recordId)
          .single();

        if (error) {
          console.error(`[CollectionModal] ❌ Failed to load record ID ${recordId}:`, error);
        } else {
          setLoadedRecord(data);
        }
      }
    };

    fetchRecord();
  }, [isCreating, record?.id, recordId, config.name]);

  const extendedRecord = {
    ...(loadedRecord || record || {}),
    ...(isCreating && recordId && refField ? { [refField]: recordId } : {})
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
            {config.subtitleField && extendedRecord?.[config.subtitleField] && (
              <Typography variant="body2" color="text.secondary">
                {extendedRecord[config.subtitleField]}
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
