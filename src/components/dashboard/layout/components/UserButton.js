"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import { usePopover } from "@/hooks/use-popover";
import { UserPopover } from "@/components/dashboard/layout/user-popover";
import { createClient } from "@/lib/supabase/browser";
import { getCurrentContactId } from "@/lib/utils/getCurrentContactId";

export default function UserButton({
  backgroundColor = "var(--MainNav-background)",
}) {
  const popover = usePopover();
  const supabase = createClient();
  const [contact, setContact] = React.useState(null);

  React.useEffect(() => {
    const fetchContact = async () => {
      const contactId = await getCurrentContactId();
      if (!contactId) return;

      const { data, error } = await supabase
        .from("contact")
        .select("first_name, last_name, email, media:thumbnail_id(url)")
        .eq("id", contactId)
        .single();

      if (!error) {
        setContact(data);
      }
    };

    fetchContact();
  }, []);

  const avatarUrl = contact?.media?.url || "/assets/avatar.png";

  return (
    <>
      <Box
        component="button"
        onClick={popover.handleOpen}
        ref={popover.anchorRef}
        sx={{ border: "none", background: "transparent", cursor: "pointer", p: 0 }}
      >
        <Badge
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          color="success"
          variant="dot"
          sx={{
            "& .MuiBadge-dot": {
              border: `2px solid ${backgroundColor}`,
              borderRadius: "50%",
              bottom: "6px",
              height: "12px",
              right: "6px",
              width: "12px",
            },
          }}
        >
          <Avatar src={avatarUrl}>
            {contact?.first_name?.[0] || "?"}
          </Avatar>
        </Badge>
      </Box>
      <UserPopover
        anchorEl={popover.anchorRef.current}
        onClose={popover.handleClose}
        open={popover.open}
      />
    </>
  );
}
