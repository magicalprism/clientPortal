'use client';

import { useState } from 'react';
import { Button } from '@mui/material';
import { Wrench } from '@phosphor-icons/react';
import SectionBuilderModal from '@/components/builders/sectionBuilder/SectionBuilderModal';

export default function SectionBuilderButton({ sx = {}, record }) {
  const [builderOpen, setBuilderOpen] = useState(false);

    const hasId = Boolean(record?.id);

  return (
    <>
      <Button
        variant="outlined"
        size="medium"
        startIcon={<Wrench />}
        onClick={() => setBuilderOpen(true)}
        sx={{ minWidth: 'auto', ...sx }}
        disabled={!hasId}
      >
        Builder
      </Button>

      <SectionBuilderModal 
        open={builderOpen} 
        onClose={() => setBuilderOpen(false)} 
        parentId={record?.id}
      />
    </>
  );
}
