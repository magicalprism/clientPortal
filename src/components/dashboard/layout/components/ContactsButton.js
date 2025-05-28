"use client";

import * as React from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Users as UsersIcon } from "@phosphor-icons/react/dist/ssr/Users";
import { usePopover } from "@/hooks/use-popover";
import { ContactsPopover } from "@/components/dashboard/layout/contacts-popover"; // Adjust path if relocated

export default function ContactsButton({ iconColor = "var(--NavItem-icon-color)" }) {
  const popover = usePopover();

  return (
    <>
      <Tooltip title="Contacts">
        <IconButton onClick={popover.handleOpen} ref={popover.anchorRef}>
          <UsersIcon color={iconColor} />
        </IconButton>
      </Tooltip>
      <ContactsPopover
        anchorEl={popover.anchorRef.current}
        onClose={popover.handleClose}
        open={popover.open}
      />
    </>
  );
}
