"use client";

import * as React from "react";
import RouterLink from "next/link";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

import { PencilSimple as PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { CheckCircle as CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { Minus as MinusIcon } from "@phosphor-icons/react/dist/ssr/Minus";

import { paths } from "@/paths";
import { DataTable } from "@/components/core/data-table";
import { useOnboardingSelection } from "./onboarding-selection-context";
import { createClient } from "@/lib/supabase/browser";

export function OnboardingTable({ rows, onRefresh }) {
  const supabase = createClient();

  const {
  deselectAll = () => {},
  deselectOne = () => {},
  selectAll = () => {},
  selectOne = () => {},
  selected = new Set(),
  selectedIds = [],
} = useOnboardingSelection() || {};


  const [loadingIds, setLoadingIds] = React.useState(new Set());

  const handleToggleStatus = async (id, newStatus) => {

    setLoadingIds((prev) => new Set(prev).add(id));

    const { error } = await supabase
      .from("onboarding")
      .update({ status: newStatus })
      .eq("id", id);

    setLoadingIds((prev) => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });

    if (error) {
      console.error("Failed to update status", error);
    } else {
      onRefresh?.(); // Optional refresh callback
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    const { error } = await supabase
      .from("onboarding")
      .delete()
      .in("id", selectedIds);

    if (error) {
      console.error("Failed to delete", error);
    } else {
      deselectAll();
      onRefresh?.(); // Optional refresh callback
    }
  };

  const columns = React.useMemo(
    () => [
      {
        formatter: (row) => (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Avatar>{row.title?.[0]}</Avatar>
            <div>
              <Link
                color="inherit"
                component={RouterLink}
                href={paths.onboarding(row.id)}
                sx={{ whiteSpace: "nowrap" }}
                variant="subtitle2"
              >
                {row.title}
              </Link>
              <Typography color="text.secondary" variant="body2">
                {row.value}
              </Typography>
            </div>
          </Stack>
        ),
        title: "Onboarding Form",
        width: "300px",
      },
      { field: "title", title: "Form Title", width: "200px" },
      { field: "project_id", title: "Project", width: "150px" },
      {
        field: "status",
        title: "Status",
        width: "150px",
        formatter: (row) => {
          const isLoading = loadingIds.has(row.id);
      
          const statusMap = {
            approved: {
              label: "Approved",
              icon: <CheckCircleIcon color="var(--mui-palette-success-main)" weight="fill" />,
              color: "success",
            },
            in_progress: {
              label: "In Progress",
              icon: <MinusIcon color="var(--mui-palette-warning-main)" />,
              color: "warning",
            },
          };
          
      
          const fallback = {
            label: "Unknown",
            icon: <MinusIcon color="var(--mui-palette-text-secondary)" />,
            color: "default",
          };
      
          const { label, icon, color } = statusMap[row.status] || fallback;
      
          return (
            <Chip
              icon={isLoading ? <CircularProgress size={16} /> : icon}
              label={label}
              size="small"
              color={color}
              variant="outlined"
              clickable={!isLoading}
              onClick={() => {
                if (isLoading) return;
                const newStatus = row.status === "approved" ? "in_progress" : "approved";
                handleToggleStatus(row.id, newStatus);
              }}
              
            />
          );
        },
      },
      {
        title: "Actions",
        hideName: true,
        width: "100px",
        align: "right",
        formatter: (row) => (
          <IconButton
            component={RouterLink}
            href={paths.dashboard.onboarding.details(row.id)}            aria-label="Edit"
          >
            <PencilSimpleIcon />
          </IconButton>
        ),
      },
    ],
    [loadingIds]
  );

  return (
    <>
      {selectedIds.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteSelected}
          >
            Delete Selected ({selectedIds.length})
          </Button>
        </Box>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        selectable
        selected={selected}
        onSelectAll={selectAll}
        onSelectOne={(_, row) => selectOne(row.id)}
        onDeselectAll={deselectAll}
        onDeselectOne={(_, row) => deselectOne(row.id)}
        uniqueRowId={(row) => row.id}
      />

      {rows.length === 0 && (
        <Box sx={{ p: 3 }}>
          <Typography
            color="text.secondary"
            sx={{ textAlign: "center" }}
            variant="body2"
          >
            No onboarding entries found
          </Typography>
        </Box>
      )}
    </>
  );
}
