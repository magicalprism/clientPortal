'use client';

import React from 'react';
import { Box, Button, MenuItem, Select } from '@mui/material';
import { Plus } from '@phosphor-icons/react';

export default function AddSectionBar({ onAdd, sectionTemplates }) {
  const [selectedTemplate, setSelectedTemplate] = React.useState('');

  const handleAdd = () => {
    if (selectedTemplate) onAdd(selectedTemplate);
  };

  return (
    <Box sx={{ mt: 3, textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Select
        value={selectedTemplate}
        onChange={(e) => setSelectedTemplate(e.target.value)}
        displayEmpty
        sx={{ minWidth: 240 }}
      >
        <MenuItem value="" disabled>Select a section template</MenuItem>
        {sectionTemplates.map((template) => (
          <MenuItem key={template.id} value={template.id}>
            {template.title}
          </MenuItem>
        ))}
      </Select>

      <Button
        variant="contained"
        startIcon={<Plus />}
        onClick={handleAdd}
        sx={{ borderRadius: 2 }}
        disabled={!selectedTemplate}
      >
        Add Section
      </Button>
    </Box>
  );
}
