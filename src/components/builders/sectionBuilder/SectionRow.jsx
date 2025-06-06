'use client';

import React from 'react';
import { Box, Typography, IconButton, Stack, MenuItem, Select } from '@mui/material';
import { PencilSimple, Trash } from '@phosphor-icons/react';

export default function SectionRow({ section, templates = [], onEdit, onDelete, onTemplateChange }) {
  return (
    <Box
      sx={{
        p: 2,
        border: '1px solid #ddd',
        borderRadius: 2,
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {section.title || 'Untitled Section'}
        </Typography>
        <Select
          size="small"
          value={section.template_id || ''}
          onChange={(e) => onTemplateChange?.(section.id, e.target.value)}
          displayEmpty
          sx={{ mt: 1, minWidth: 180 }}
        >
          <MenuItem value="">Select Template</MenuItem>
          {templates.map((tpl) => (
            <MenuItem key={tpl.id} value={tpl.id}>
              {tpl.title}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Stack direction="row" spacing={1}>
        <IconButton onClick={() => onEdit?.(section)} aria-label="edit">
          <PencilSimple />
        </IconButton>
        <IconButton onClick={() => onDelete?.(section)} aria-label="delete">
          <Trash />
        </IconButton>
      </Stack>
    </Box>
  );
}
