"use client";

import * as React from "react";
import {
  Avatar,
  Box,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Popover,
  Typography,
  CircularProgress
} from "@mui/material";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { getCurrentContactId } from "@/lib/utils/getCurrentContactId";

export function ContactsPopover({ anchorEl, onClose, open = false }) {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;

    const fetchContacts = async () => {
      setLoading(true);
      setContacts([]);

      const contactId = await getCurrentContactId();
      if (!contactId) return;

      // Get the companies the current contact is linked to
      const { data: companies, error: companyError } = await supabase
        .from("company_contact")
        .select("company_id")
        .eq("contact_id", contactId);

      if (companyError) {
        console.error("Error fetching companies:", companyError);
        setLoading(false);
        return;
      }

      const companyIds = companies.map((c) => c.company_id);

      // Get all contacts linked to those companies
      const { data: companyContacts, error: contactError } = await supabase
        .from("company_contact")
        .select("contact:contact_id(id, first_name, last_name, thumbnail_id)")
        .in("company_id", companyIds);

      if (contactError) {
        console.error("Error fetching contacts:", contactError);
        setLoading(false);
        return;
      }

      const uniqueContacts = Array.from(
        new Map(
          companyContacts.map(({ contact }) => [contact.id, contact])
        ).values()
      ).sort((a, b) => {
        const nameA = `${a.last_name ?? ""} ${a.first_name ?? ""}`.toLowerCase();
        const nameB = `${b.last_name ?? ""} ${b.first_name ?? ""}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

      const mediaIds = uniqueContacts.map((c) => c.thumbnail_id).filter(Boolean);

      const { data: media } = await supabase
        .from("media")
        .select("id, url")
        .in("id", mediaIds);

      const mediaMap = Object.fromEntries((media || []).map((m) => [m.id, m.url]));

      const contactsWithData = uniqueContacts.map((c) => ({
        id: c.id,
        name: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim(),
        avatar: mediaMap[c.thumbnail_id] || null
      }));

      setContacts(contactsWithData);
      setLoading(false);
    };

    fetchContacts();
  }, [open]);

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: { width: "300px" } } }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
    >
      <Box sx={{ px: 3, py: 2 }}>
        <Typography variant="h6">Contacts</Typography>
      </Box>
      <Box sx={{ maxHeight: "400px", overflowY: "auto", px: 1, pb: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={20} />
          </Box>
        ) : contacts.length === 0 ? (
          <Typography variant="body2" align="center" color="text.secondary" sx={{ py: 2 }}>
            No contacts found.
          </Typography>
        ) : (
          <List disablePadding sx={{ "& .MuiListItemButton-root": { borderRadius: 1 } }}>
            {contacts.map((contact) => (
              <ListItem disablePadding key={contact.id}>
                <ListItemButton>
                  <ListItemAvatar>
                    <Avatar src={contact.avatar || undefined}>
                      {contact.name?.[0] ?? "?"}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    disableTypography
                    primary={
                      <Link color="text.primary" noWrap underline="none" variant="subtitle2">
                        {contact.name}
                      </Link>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Popover>
  );
}
