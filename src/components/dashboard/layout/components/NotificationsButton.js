"use client";

import * as React from "react";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Bell as BellIcon } from "@phosphor-icons/react/dist/ssr/Bell";
import { usePopover } from "@/hooks/use-popover";
import { NotificationsPopover } from "@/components/dashboard/layout/notifications-popover"; // Adjust path if necessary

export default function NotificationsButton({ iconColor = "var(--NavItem-icon-color)" }) {
  const popover = usePopover();

  return (
    <>
      <Tooltip title="Notifications">
        <Badge
          color="error"
          variant="dot"
          sx={{
            "& .MuiBadge-dot": {
              borderRadius: "50%",
              height: "10px",
              width: "10px",
              top: "6px",
              right: "6px"
            }
          }}
        >
          <IconButton onClick={popover.handleOpen} ref={popover.anchorRef}>
            <BellIcon color={iconColor} />
          </IconButton>
        </Badge>
      </Tooltip>
      <NotificationsPopover
        anchorEl={popover.anchorRef.current}
        onClose={popover.handleClose}
        open={popover.open}
      />
    </>
  );
}
