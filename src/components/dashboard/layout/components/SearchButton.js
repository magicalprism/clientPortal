"use client";

import * as React from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { MagnifyingGlass as MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { useDialog } from "@/hooks/use-dialog";
import { SearchDialog } from "@/components/dashboard/layout/search-dialog"; // Adjust this path if needed

export default function SearchButton({ iconColor = "var(--NavItem-icon-color)" }) {
  const dialog = useDialog();

  return (
    <>
      <Tooltip title="Search">
        <IconButton
          onClick={dialog.handleOpen}
          sx={{ display: { xs: "none", md: "inline-flex" } }}
        >
          <MagnifyingGlassIcon color={iconColor} />
        </IconButton>
      </Tooltip>
      <SearchDialog onClose={dialog.handleClose} open={dialog.open} />
    </>
  );
}
