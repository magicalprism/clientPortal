'use client';

import { Button } from '@mui/material';
import { Trash as TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { deleteWithDependencies } from '@/lib/utils/deleteWithDependencies';

export function DeleteSelectedButton({
  selection,
  tableName,
  entityLabel = 'item',
  onDeleteSuccess
}) {
  const handleDelete = async () => {
    const ids = Array.from(selection.selected);
    if (ids.length === 0) return;

    const confirmed = window.confirm(`Delete ${ids.length} ${entityLabel}${ids.length > 1 ? 's' : ''}?`);
    if (!confirmed) return;

    const { success, error } = await deleteWithDependencies(tableName, ids);

    if (!success) {
      console.error('Delete failed:', error);
      alert('Failed to delete: ' + error);
    } else {
      selection.deselectAll();
      onDeleteSuccess?.(ids); // ✅ Call success handler
    }
  };

  return (
    <Button
      color="error"
      variant="contained"
      startIcon={<TrashIcon />}
      disabled={selection.selected.size === 0}
      onClick={handleDelete}
    >
      Delete
    </Button>
  );
}
