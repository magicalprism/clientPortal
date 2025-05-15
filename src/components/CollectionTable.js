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
import { useRouter } from 'next/navigation';
import { FieldRenderer } from '@/components/FieldRenderer';
import { DataTable } from '@/components/core/data-table';
import { useCollectionSelection } from '@/components/CollectionSelectionContext';
import { useModal } from '@/components/modals/ModalContext';
import { createClient } from '@/lib/supabase/browser';
import { ViewButtons } from '@/components/buttons/ViewButtons';



export const CollectionTable = ({ config, refresh, data, rows, fieldContext = null, hideHead = false, parentColumns, columns: incomingColumns, expandedRowIds = new Set() }) => {

  const router = useRouter();
  const { openModal } = useModal();
  const supabase = createClient();

  const {
    selectAll,
    selectOne,
    deselectOne,
    deselectAll,
    selected
  } = useCollectionSelection();



  const safeRows = Array.isArray(rows) ? rows : [];


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
              openModal('edit', {
                config,
                defaultValues: row,
              });
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
      formatter: (row) => <ViewButtons config={config} id={row.id} />
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
            borderColor: 'divider',
          
          }}
>

          <CollectionTable
            config={config}
            rows={children}
            expandedRowIds={expandedRowIds}
            rowSx={{
              '& .MuiTableCell-root': { borderBottom: '1px solid #e0e0e0' },
              '& .MuiTableCell-root > .MuiBox-root': { p: '0 !important', m: 0 }
            }}
            onDeleteSuccess={refresh} // ✅ REFRESH ON DELETE
            onEditSuccess={refresh}   // ✅ REFRESH ON EDIT (if supported in modals)
            fieldContext={fieldContext}
            hideHead
            indentLevel={5}
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

      
    </>
  );
};
