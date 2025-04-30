'use client';

import * as React from 'react';
import {
  Typography,
  Box,
  IconButton
} from '@mui/material';
import { Eye, CornersOut } from '@phosphor-icons/react'; // ✅ Phosphor icons here
import * as collections from '@/collections';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FieldRenderer } from '@/components/FieldRenderer';
import { DataTable } from '@/components/core/data-table';
import { useCollectionSelection } from '@/components/CollectionSelectionContext';
import { CollectionModal } from '@/components/CollectionModal';
import { createClient } from '@/lib/supabase/browser';
import { hasChildRows } from '@/lib/utils/hasChildRows'; // adjust path as needed


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

  const tableFieldNames = fieldContext?.relation?.tableFields;

  let collectionFields = [];

  if (tableFieldNames?.length) {
    collectionFields = config.fields.filter((f) =>
      tableFieldNames.includes(f.name)
    );
  } else {
    collectionFields = config.fields.filter((f) =>
      f.showInTable || ['title', 'status', 'id'].includes(f.name)
    );

    if (!collectionFields.length && config.fields.length) {
      collectionFields = config.fields.slice(0, 3);
    }
  }

  const columns = collectionFields.map((field) => ({
    title: field.label || field.name,
    field: field.name,
    align: field.align,
    width: field.width,
    formatter: (row) => {
      const value = row[field.name];
    
      // Handle dynamic clickable logic
      if (field.clickable) {
        const handleClick = () => {
          if (field.openMode === 'modal') {
            router.push(`${pathname}?id=${row.id}&modal=edit`);
          } else if (field.openMode === 'full') {
            router.push(`/dashboard/${config.name}/${row.id}`);
          }
        };
    
        return (
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={handleClick}
          >
            {value}
          </Typography>
        );
      }
    
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

  // Add action buttons (modal + full view)
  if (config.showEditButton) {
    columns.push({
      title: '',
      field: 'actions',
      align: 'right',
      width: '80px',
      formatter: (row) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <IconButton
            size="small"
            onClick={() => {
              router.push(`${pathname}?id=${row.id}&modal=edit`);
            }}
          >
            <Eye size={18} weight="regular" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              window.open(`/dashboard/${config.name}/${row.id}`, '_blank');
            }}
          >
            <CornersOut size={18} weight="regular" />
          </IconButton>
        </Box>
      )
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
        childRenderer={(row) => {
          if (!hasChildRows(config, row)) return null;
        
          const childField = config.fields.find(f => f.type === 'multiRelationship');
          const childRows = row[`${childField.name}_details`] || [];
          const childConfig = collections[childField.relation.table];
        
          return (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {childField.label}
              </Typography>
              <CollectionTable
                config={childConfig}
                rows={childRows}
                fieldContext={childField}
              />
            </Box>
          );
        }}
        
        
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
