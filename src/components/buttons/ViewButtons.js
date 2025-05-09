'use client';

import { IconButton, Box } from '@mui/material';
import { Eye, CornersOut } from '@phosphor-icons/react';
import { useModal } from '@/components/modals/ModalContext';
import * as collections from '@/collections';
import { createClient } from '@/lib/supabase/browser';

export const ViewButtons = ({ config, id }) => {
  const { openModal } = useModal();
  const fullConfig = collections[config.name] || config;
  const supabase = createClient();

  const handleOpenModal = async () => {
    const { data, error } = await supabase
      .from(fullConfig.name)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`[ViewButtons] Failed to fetch record ${id}:`, error);
      return;
    }

    openModal('edit', {
      config: fullConfig,
      defaultValues: data
    });
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <IconButton size="small" onClick={handleOpenModal}>
        <Eye size={18} />
      </IconButton>

      <IconButton
        size="small"
        onClick={() => window.open(`/dashboard/${config.name}/${id}`, '_blank')}
      >
        <CornersOut size={18} />
      </IconButton>
    </Box>
  );
};
