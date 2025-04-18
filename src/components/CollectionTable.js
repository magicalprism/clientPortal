'use client';

import * as React from 'react';
import { FieldRenderer } from '@/components/FieldRenderer';
import { EditButton } from '@/components/EditButton';
import {
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import { DataTable } from '@/components/core/data-table';
import { createClient } from '@/lib/supabase/browser';
import { useCollectionSelection } from '@/components/CollectionSelectionContext';
import { CollectionModal } from '@/components/CollectionModal';

export const CollectionTable = ({ config, rows, fieldContext = null }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const supabase = createClient();
  const {
    selectAll,
    selectOne,
    deselectOne,
    deselectAll,
    selected
  } = useCollectionSelection();

  const [selectedRecord, setSelectedRecord] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const editId = searchParams.get('id');
  const modalType = searchParams.get('modal');

  const safeRows = Array.isArray(rows) ? rows : [];

  React.useEffect(() => {
    if (modalType === 'edit' && editId) {
      const row = safeRows.find((r) => r.id === parseInt(editId));
      if (row) {
        setSelectedRecord(row);
        setModalOpen(true);
      }
    } else {
      setModalOpen(false);
      setSelectedRecord(null);
    }
  }, [editId, modalType, safeRows]);

  const closeModal = () => {
    router.push(pathname);
  };

  console.log('🧠 [CollectionTable] Using config for:', config.name);
  console.log('🧠 Available fields:', config.fields.map(f => f.name));

  const tableFieldNames = fieldContext?.relation?.tableFields;

  let collectionFields = [];

  if (tableFieldNames?.length) {
    collectionFields = config.fields.filter((f) => tableFieldNames.includes(f.name));
    console.log('✅ Using tableFields from fieldContext:', tableFieldNames);
  } else {
    collectionFields = config.fields.filter((f) =>
      f.showInTable || ['title', 'status', 'id'].includes(f.name)
    );

    if (!collectionFields.length && config.fields.length) {
      collectionFields = config.fields.slice(0, 3);
    }

    console.log('⚠️ No tableFields found – fallback fields used:', collectionFields.map(f => f.name));
  }

  const columns = collectionFields.map((field) => ({
    title: field.label || field.name,
    field: field.name,
    align: field.align,
    width: field.width,
    formatter: (row) => {
      const value = row[field.name];
      return (
        <FieldRenderer
          value={value}
          field={field}
          record={row}
          config={config}
          view="table"
        />
      );
    }
  }));

  if (config.showEditButton) {
    columns.push({
      title: '',
      field: 'edit',
      align: 'right',
      width: '50px',
      formatter: (row) => <EditButton record={row} config={config} />
    });
  }

  return (
    <>
      <DataTable
        columns={columns}
        rows={safeRows}
        selectable
        selected={selected}
        onSelectAll={() => selectAll(safeRows.map((r) => r.id))}
        onDeselectAll={deselectAll}
        onSelectOne={(_, row) => selectOne(row.id)}
        onDeselectOne={(_, row) => deselectOne(row.id)}
      />

      {safeRows.length === 0 && (
        <Box sx={{ p: 3 }}>
          <Typography
            color="text.secondary"
            sx={{ textAlign: 'center' }}
            variant="body2"
          >
            No records found
          </Typography>
        </Box>
      )}

      {selectedRecord && (
        <CollectionModal
          open={modalOpen}
          onClose={closeModal}
          record={selectedRecord}
          config={config}
          onUpdate={async (id, data) => {
            await supabase.from(config.name).update(data).eq('id', id);
            closeModal();
            window.location.reload();
          }}
          onDelete={async (id) => {
            await supabase.from(config.name).delete().eq('id', id);
            closeModal();
            window.location.reload();
          }}
        />
      )}
    </>
  );
};
