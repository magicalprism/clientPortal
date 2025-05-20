'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Stack,
  Typography
} from '@mui/material';
import { MediaUploadModal } from '@/components/fields/media/MediaUploadModal';
import { MediaLibraryPicker } from '@/components/fields/media/MediaLibraryPicker';
import CollectionGridView from '@/components/views/grid/CollectionGridView';
import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

export const GalleryRelationshipField = ({ field, value = [], onChange, config, record }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [items, setItems] = useState([]);
  const initialized = useRef(false);

  const showAll = field?.showAll === true;
  const relation = field.relation || {};
  const table = relation.table || 'media';

  useEffect(() => {
    if (initialized.current) return;

    const fetchItems = async () => {
      let query = supabase.from(table).select('*');

      if (showAll && relation.filter && typeof relation.filter === 'object') {
        Object.entries(relation.filter).forEach(([key, val]) => {
          if (typeof val === 'string' && val.startsWith('record.')) {
            const recordKey = val.split('record.')[1];
            const resolvedVal = record?.[recordKey];
            if (resolvedVal) query = query.eq(key, resolvedVal);
          } else {
            query = query.eq(key, val);
          }
        });
      } else {
        const ids = Array.isArray(value)
          ? value.filter(Boolean)
          : value?.ids || [];

        if (!ids.length) return setItems([]);
        query = query.in('id', ids);
      }

      const { data, error } = await query;
      if (error) {
        console.error(`[GalleryField] Failed to fetch ${table}:`, error);
      } else {
        setItems(data || []);
      }

      initialized.current = true;
    };

    fetchItems();
  }, [value, record]);

  const handleAdd = (media) => {
    if (!media?.id || showAll) return;
    const next = [...items, media];
    setItems(next);
    onChange?.({
      ids: next.map((m) => m.id),
      details: next
    });
  };

const handleRemove = async (mediaId) => {
  if (!record?.id || !config?.name) return;

  const foreignKey = config.name === 'project'
    ? 'project_id'
    : config.name === 'company'
    ? 'company_id'
    : null;

  if (!foreignKey) {
    console.warn('[GalleryRelationshipField] No valid foreign key for this config');
    return;
  }

  console.log(`[GalleryRelationshipField] Unsetting ${foreignKey} from media ID: ${mediaId}`);

  const { error } = await supabase
    .from('media')
    .update({ [foreignKey]: null })
    .eq('id', mediaId)
    .eq(foreignKey, record.id); // 🔒 Make sure you're only unsetting it if it's still assigned to this record

  if (error) {
    console.error(`[GalleryRelationshipField] Failed to unset ${foreignKey}:`, error);
    return;
  }

  const next = items.filter((m) => m.id !== mediaId);
  setItems(next);

  onChange?.({
    ids: next.map((m) => m.id),
    details: next
  });
};



  return (
    <Box onClick={(e) => e.stopPropagation()} sx={{ width: '100%' }}>
      <Stack spacing={2} width="100%">

          
     
        {items.length > 0 ? (
          <CollectionGridView
            items={items}
            field={field}
            onDelete={(item) => {
                console.log('[GalleryRelationshipField] Removing media ID:', item.id);
                handleRemove(item.id);
            }}
            />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No media found
          </Typography>
        )}
        <Stack direction="row" spacing={2} width="100%">
            <Button variant="outlined" fullWidth onClick={() => setModalOpen(true)}>
              Upload Media
            </Button>
            <Button variant="outlined" fullWidth onClick={() => setLibraryOpen(true)}>
              Choose from Library
            </Button>
          </Stack>
      </Stack>

      <MediaUploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUploadComplete={handleAdd}
        config={config}
        field={field}
        record={record}
      />

      <MediaLibraryPicker
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={(media) => {
          handleAdd(media);
          setLibraryOpen(false);
        }}
        record={record}
      />
    </Box>
  );
};
