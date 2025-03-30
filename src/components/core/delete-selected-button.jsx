"use client";

import { Button } from "@mui/material";
import { Trash as TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function DeleteSelectedButton({ selection, tableName, entityLabel = "item" }) {
  const router = useRouter();

  const handleDelete = async () => {
    const ids = Array.from(selection.selected);
    if (ids.length === 0) return;

    const confirmed = window.confirm(`Delete ${ids.length} ${entityLabel}${ids.length > 1 ? "s" : ""}?`);
    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase.from(tableName).delete().in("id", ids);

    if (error) {
      console.error("Delete failed:", error.message);
      alert("Failed to delete.");
    } else {
      selection.deselectAll();
      router.refresh();
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
