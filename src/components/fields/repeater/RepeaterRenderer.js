'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import { X as XIcon } from '@phosphor-icons/react';
import { useModal } from '@/components/modals/ModalContext';
import { createClient } from '@/lib/supabase/browser';
import * as collections from '@/collections';

const supabase = createClient();

export const RepeaterRenderer = ({ field, record, editable, onChange }) => {
  const { openModal } = useModal();
  const [sections, setSections] = useState([]);

  useEffect(() => {
    const details = record?.[`${field.name}_details`] || [];
    setSections(Array.isArray(details) ? details : []);
  }, [record, field.name]);

  const handleSectionAdd = async (newSection) => {
    try {
      const { data, error } = await supabase
        .from('section')
        .select('*')
        .eq('id', newSection.id)
        .single();

      if (error) throw error;

      const updated = [...sections, data];
      setSections(updated);
      if (onChange) onChange({ ids: updated.map((s) => s.id), details: updated });
    } catch (err) {
      console.error('❌ Failed to fetch new section:', err);
    }
  };

  const handleRemove = (idToRemove) => {
    const updated = sections.filter((s) => s.id !== idToRemove);
    setSections(updated);
    if (onChange) onChange({ ids: updated.map((s) => s.id), details: updated });
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {sections.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No sections added yet.
        </Typography>
      ) : (
        sections.map((item, i) => (
          <Box key={item.id || i} sx={{ border: '1px solid #ccc', p: 2, borderRadius: 1, position: 'relative' }}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              {item?.[field.relation?.labelField || 'title'] || `Section ${i + 1}`}
            </Typography>
            {item?.content && (
              <div dangerouslySetInnerHTML={{ __html: item.content }} />
            )}
            {editable && (
              <IconButton
                size="small"
                onClick={() => handleRemove(item.id)}
                sx={{ position: 'absolute', top: 4, right: 4 }}
              >
                <XIcon size={16} />
              </IconButton>
            )}
          </Box>
        ))
      )}

      {editable && (
        <Button
          variant="outlined"
          onClick={() => {
            openModal('create', {
              config: collections.section,
              defaultValues: { [field.relation?.targetKey || 'element_id']: record?.id },
              onSuccess: handleSectionAdd
            });
          }}
        >
          {sections.length ? 'Change Sections' : 'Add Section'}
        </Button>
      )}
    </Box>
  );
};