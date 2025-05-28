"use client";

import * as React from "react";
import RouterLink from "next/link";
import {
  Box,
  Divider,
  List,
  ListItemIcon,
  MenuItem,
  Popover,
  Typography,
  Avatar
} from "@mui/material";
import {
  CreditCard as CreditCardIcon,
  LockKey as LockKeyIcon,
  User as UserIcon
} from "@phosphor-icons/react/dist/ssr";

import { appConfig } from "@/config/app";
import { paths } from "@/paths";
import { AuthStrategy } from "@/lib/auth-strategy";
import { createClient } from "@/lib/supabase/browser";
import { getCurrentContactId } from "@/lib/utils/getCurrentContactId";

function SignOutButton() {
  let signOutUrl = paths.home;

  if (appConfig.authStrategy === AuthStrategy.SUPABASE) {
    signOutUrl = paths.auth.supabase.signOut;
  }

  return (
    <MenuItem component="a" href={signOutUrl} sx={{ justifyContent: "center" }}>
      Sign out
    </MenuItem>
  );
}

export function UserPopover({ anchorEl, onClose, open }) {
  const [userData, setUserData] = React.useState(null);
  const supabase = createClient();

  React.useEffect(() => {
    if (!open) return;

    const fetchUser = async () => {
      const contactId = await getCurrentContactId();
      if (!contactId) return;

      const { data: contact, error } = await supabase
        .from("contact")
        .select("id, first_name, last_name, email, thumbnail_id")
        .eq("id", contactId)
        .single();

      if (error) {
        console.error("Failed to fetch contact:", error);
        return;
      }

      let avatarUrl = null;

      if (contact.thumbnail_id) {
        const { data: media } = await supabase
          .from("media")
          .select("url")
          .eq("id", contact.thumbnail_id)
          .single();

        avatarUrl = media?.url || null;
      }

      const full_name = `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim();

      setUserData({ ...contact, full_name, avatar: avatarUrl });
    };

    fetchUser();
  }, [open]);

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      onClose={onClose}
      open={Boolean(open)}
      slotProps={{ paper: { sx: { width: "280px" } } }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
    >
      <Box sx={{ p: 2 }}>
        {userData ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar src={userData.avatar} />
            <Box>
              <Typography>{userData.full_name}</Typography>
              <Typography color="text.secondary" variant="body2">
                {userData.email}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2">Loading...</Typography>
        )}
      </Box>

      <Divider />

      <List sx={{ p: 1 }}>
        <MenuItem component={RouterLink} href={paths.dashboard.settings.account} onClick={onClose}>
          <ListItemIcon><UserIcon /></ListItemIcon>
          Account
        </MenuItem>
        <MenuItem component={RouterLink} href={paths.dashboard.settings.security} onClick={onClose}>
          <ListItemIcon><LockKeyIcon /></ListItemIcon>
          Security
        </MenuItem>
        <MenuItem component={RouterLink} href={paths.dashboard.settings.billing} onClick={onClose}>
          <ListItemIcon><CreditCardIcon /></ListItemIcon>
          Billing
        </MenuItem>
      </List>

      <Divider />

      <Box sx={{ p: 1 }}>
        <SignOutButton />
      </Box>
    </Popover>
  );
}
