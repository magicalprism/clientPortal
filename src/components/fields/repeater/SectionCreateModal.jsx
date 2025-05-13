// components/fields/relationships/repeater/SectionCreateModal.jsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton } from '@mui/material';
import { X } from '@phosphor-icons/react';
import CreateForm from '@/components/CreateForm'; // assumes you use this
import * as collections from '@/collections';

export const SectionCreateModal = ({ open, onClose, parentId, onSuccess }) => {
  const config = collections.section;

  useEffect(() => {
    if (open) console.log('📦 SectionCreateModal is now open');
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Add New Section
        <IconButton onClick={onClose}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <CreateForm
          config={config}
          initialRecord={{ element_id: parentId }}
          disableRedirect
          onSuccess={(created) => {
            if (onSuccess) onSuccess(created);
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
