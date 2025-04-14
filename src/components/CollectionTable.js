// src/components/CollectionTable.js
'use client';

import * as React from 'react';
import {
  Typography,
  Box,
  IconButton,
  Chip,
  Switch,
  Link as MuiLink
} from '@mui/material';
import { DataTable } from '@/components/core/data-table';
import { createClient } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import {
  PencilSimple as PencilIcon,
  Clock,
  CheckCircle
} from '@phosphor-icons/react';
import dayjs from 'dayjs';

export const CollectionTable = ({ config, rows, selectionHook }) => {
  const router = useRouter();
  const supabase = createClient();

  const {
    selectAll,
    selectOne,
    deselectOne,
    deselectAll,
    selected
  } = selectionHook || {
    selectAll: () => {},
    selectOne: () => {},
    deselectOne: () => {},
    deselectAll: () => {},
    selected: new Set()
  };
  
  

  const formatCell = (row, field) => {
    const value = row[field.name];

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
        return (
          <IconButton
            component={MuiLink}
            href={config.editRoute(row.id)}
          >
            <PencilIcon size={18} />
          </IconButton>
        );

      default:
        if (field.clickable) {
          return (
            <MuiLink
              component="button"
              onClick={() => router.push(config.editRoute(row.id))}
              sx={{ cursor: 'pointer' }}
            >
              {value}
            </MuiLink>
          );
        }
        return value ?? '—';
    }
  };

  const columns = config.fields.map((field) => ({
    title: field.label,
    field: field.name,
    width: field.width,
    align: field.align,
    formatter: (row) => formatCell(row, field)
  }));

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        selectable
        selected={selected}
        onSelectAll={() => selectAll(rows.map((r) => r.id))} // ✅ fixed
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
    </>
  );
};
