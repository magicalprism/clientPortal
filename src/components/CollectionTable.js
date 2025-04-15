'use client';

import * as React from 'react';
import { FieldRenderer } from '@/components/FieldRenderer';
import { EditButtonCell } from '@/components/EditButtonCell';
import {
  Typography,
  Box,
  IconButton,
  Chip,
  Switch,
} from '@mui/material';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import dayjs from 'dayjs';
import {
  PencilSimple as PencilIcon,
  Clock,
  CheckCircle,
} from '@phosphor-icons/react';

import { DataTable } from '@/components/core/data-table';
import { createClient } from '@/lib/supabase/browser';
import { useCollectionSelection } from '@/components/CollectionSelectionContext';
import { CollectionModal } from '@/components/CollectionModal';

export const CollectionTable = ({ config, rows }) => {
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

  React.useEffect(() => {
    if (modalType === 'edit' && editId) {
      const row = rows.find((r) => r.id === parseInt(editId));
      if (row) {
        setSelectedRecord(row);
        setModalOpen(true);
      }
    } else {
      setModalOpen(false);
      setSelectedRecord(null);
    }
  }, [editId, modalType, rows]);

  const closeModal = () => {
    router.push(pathname);
  };

  const isIncludedInView = (field, view) => {
    if (!field.includeInViews) return true;
    if (field.includeInViews.length === 1 && field.includeInViews[0] === 'none') return false;
    return field.includeInViews.includes(view);
  };

  const formatCell = (row, field) => {
    const value = row[field.name];
    const mode = field.openMode || config.editMode;

    switch (field.type) {
      case 'date':
        return value ? dayjs(value).format('MMM D, YYYY') : '—';

      case 'status':
        const icons = {
          todo: <Clock size={14} />,
          in_progress: <CheckCircle size={14} color="orange" />,
          complete: <CheckCircle size={14} color="green" />
        };
        return (
          <Chip
            icon={icons[row.status]}
            label={row.status.replace('_', ' ')}
            size="small"
            variant="outlined"
          />
        );

      case 'toggle': {
        const [checked, setChecked] = React.useState(row.status === 'complete');
        const [loading, setLoading] = React.useState(false);

        const handleToggle = async () => {
          setLoading(true);
          const newStatus = checked ? 'todo' : 'complete';
          const { error } = await supabase
            .from(config.name)
            .update({ status: newStatus })
            .eq('id', row.id);
          if (!error) setChecked(!checked);
          setLoading(false);
        };

        return (
          <Switch
            checked={checked}
            onChange={handleToggle}
            disabled={loading}
            size="small"
            color="success"
          />
        );
      }

      case 'editButton':
      case 'iconLink': {
        const handleEditClick = () => {
          if (mode === 'modal') {
            router.push(`${pathname}?modal=edit&id=${row.id}`);
          } else {
            router.push(`${config.editPathPrefix}/${row.id}`
);
          }
        };

        return (
          <IconButton onClick={handleEditClick}>
            <PencilIcon size={18} />
          </IconButton>
        );
      }

      default:
        if (field.clickable) {
          const handleClick = () => {
            if (mode === 'modal') {
              router.push(`${pathname}?modal=edit&id=${row.id}`);
            } else {
              router.push(`${config.editPathPrefix}/${row.id}`);
            }
          };

          return (
            <Typography
              variant="body2"
              onClick={handleClick}
              sx={{
                cursor: 'pointer',
                color: 'text.primary',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {value}
            </Typography>
          );
        }

        return value ?? '—';
    }
  };

  const columns = config.fields
  .filter((field) => field.showInTable === true)
  .map((field) => {
    const isEditColumn = field.type === 'editButton';

    return {
      title: field.label,
      field: field.name,
      width: field.width,
      align: field.align,
      formatter: (row) =>
        isEditColumn
          ? <EditButtonCell record={row} config={config} field={field} />
          : <FieldRenderer
              value={row[field.name]}
              field={field}
              record={row}
              config={config}
              view="table"
            />
    };
  });

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        selectable
        selected={selected}
        onSelectAll={() => selectAll(rows.map((r) => r.id))}
        onDeselectAll={deselectAll}
        onSelectOne={(_, row) => selectOne(row.id)}
        onDeselectOne={(_, row) => deselectOne(row.id)}
      />

      {rows.length === 0 && (
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
            window.location.reload(); // ✅ ensure refresh
          }}
          onDelete={async (id) => {
            await supabase.from(config.name).delete().eq('id', id);
            closeModal();
            window.location.reload(); // ✅ ensure refresh
          }}
        />
      )}
    </>
  );
};
