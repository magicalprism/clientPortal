'use client';

import * as React from 'react';
import {
  Typography,
  Box,
  IconButton,
  hideHead,
  incomingColumns,
  index
} from '@mui/material';
import { Eye, CornersOut } from '@phosphor-icons/react'; // ✅ Phosphor icons here
import * as collections from '@/collections';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FieldRenderer } from '@/components/FieldRenderer';
import { DataTable } from '@/components/core/data-table';
import { useCollectionSelection } from '@/components/CollectionSelectionContext';
import { CollectionModal } from '@/components/CollectionModal';
import { createClient } from '@/lib/supabase/browser';



export const CollectionTable = ({ config, rows, fieldContext = null, hideHead = false, parentColumns, columns: incomingColumns, expandedRowIds = new Set() }) => {

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

  const tableFieldNames = null;

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

  const columns = incomingColumns ?? collectionFields.map((field, index) => {
    return {
      title: field.label || field.name,
      field: field.name,
      align: field.align,
      width: field.width,
      formatter: (row) => {
        const value = row[field.name];
  
        const content = field.clickable ? (
          <Typography
            variant="body2"
            color="primary"
            sx={{
              cursor: 'pointer',
              textDecoration: 'underline',
              ...(index === 0 ),
            }}
            onClick={() => {
              if (field.openMode === 'modal') {
                router.push(`${pathname}?id=${row.id}&modal=edit`);
              } else {
                router.push(`/dashboard/${config.name}/${row.id}`);
              }
            }}
          >
            {value}
          </Typography>
        ) : (
          <FieldRenderer
            value={value}
            field={field}
            record={row}
            config={config}
            view="table"
          />
        );
  
        return content;
      }
    };
  });
  



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
    const children = row.children || [];
    const isExpanded = expandedRowIds?.has?.(row.id); // safe check in case prop is missing
  
    if (!isExpanded || !children.length) return null;
        
    return (
      <Box
          sx={{
            pl: 0,
            py: 0,
            m: 0,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
>

          <CollectionTable
            config={config}
            rows={children}
            fieldContext={fieldContext}
            hideHead
            indentLevel={5}
            expandedRowIds={expandedRowIds}
          />


      </Box>
    );
  }}
  hideHead={hideHead}
// 👈 or just `hideHead={hideHead}` if you passed it in
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
