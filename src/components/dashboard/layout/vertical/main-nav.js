"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  CircularProgress
} from "@mui/material";
import { usePopover } from "@/hooks/use-popover";
import { useDialog } from "@/hooks/use-dialog";

import { Bell as BellIcon } from "@phosphor-icons/react/dist/ssr/Bell";
import { List as ListIcon } from "@phosphor-icons/react/dist/ssr/List";
import { MagnifyingGlass as MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { Users as UsersIcon } from "@phosphor-icons/react/dist/ssr/Users";

import { SearchDialog } from "@/components/dashboard/layout/search-dialog";
import { NotificationsPopover } from "@/components/dashboard/layout/notifications-popover";
import { ContactsPopover } from "@/components/dashboard/layout/contacts-popover";
import { UserPopover } from "@/components/dashboard/layout/user-popover";
import { MobileNav } from "@/components/dashboard/layout/mobile-nav";

import { createClient } from "@/lib/supabase/browser";
import { getCurrentContactId } from "@/lib/utils/getCurrentContactId";
import { useTranslation } from "react-i18next";




const supabase = createClient();

export function MainNav({ items }) {
  const [openNav, setOpenNav] = React.useState(false);

  return (
    <>
      <Box
        component="header"
        sx={{
          "--MainNav-background": "var(--mui-palette-background-default)",
          "--MainNav-divider": "var(--mui-palette-divider)",
          bgcolor: "var(--MainNav-background)",
          left: 0,
          position: "sticky",
          pt: { lg: "var(--Layout-gap)" },
          top: 0,
          width: "100%",
          zIndex: "var(--MainNav-zIndex)",
        }}
      >
        <Box
          sx={{
            borderBottom: "1px solid var(--MainNav-divider)",
            display: "flex",
            flex: "1 1 auto",
            minHeight: "var(--MainNav-height)",
            px: { xs: 2, lg: 3 },
            py: 1,
          }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", flex: "1 1 auto" }}>
            <IconButton onClick={() => setOpenNav(true)} sx={{ display: { lg: "none" } }}>
              <ListIcon />
            </IconButton>
            <SearchButton />
          </Stack>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", flex: "1 1 auto", justifyContent: "flex-end" }}>
            <NotificationsButton />
            <ContactsButton />
            <Divider flexItem orientation="vertical" sx={{ borderColor: "var(--MainNav-divider)", display: { xs: "none", lg: "block" } }} />

            <UserButton />
          </Stack>
        </Box>
      </Box>

      <MobileNav items={items} open={openNav} onClose={() => setOpenNav(false)} />
    </>
  );
}

function SearchButton() {
  const dialog = useDialog();

  return (
    <>
      <Tooltip title="Search">
        <IconButton onClick={dialog.handleOpen} sx={{ display: { xs: "none", lg: "inline-flex" } }}>
          <MagnifyingGlassIcon />
        </IconButton>
      </Tooltip>
      <SearchDialog onClose={dialog.handleClose} open={dialog.open} />
    </>
  );
}

function NotificationsButton() {
  const popover = usePopover();
  return (
    <>
      <Tooltip title="Notifications">
        <IconButton onClick={popover.handleOpen} ref={popover.anchorRef}>
          <BellIcon />
        </IconButton>
      </Tooltip>
      <NotificationsPopover anchorEl={popover.anchorRef.current} onClose={popover.handleClose} open={popover.open} />
    </>
  );
}

function ContactsButton() {
  const popover = usePopover();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      const contactId = await getCurrentContactId();

      const { data: companies, error: companyError } = await supabase
        .from("company_contact")
        .select("company_id")
        .eq("contact_id", contactId);

      if (companyError || !companies?.length) return;

      const companyIds = companies.map((row) => row.company_id);

      const { data: companyContacts, error: contactError } = await supabase
        .from("company_contact")
        .select("contact:contact_id(id, first_name, last_name, email, media:thumbnail_id(url))")
        .in("company_id", companyIds);

      if (contactError) return;

      const unique = new Map();
      companyContacts.forEach(({ contact }) => {
        if (contact?.id) unique.set(contact.id, contact);
      });

      const sorted = Array.from(unique.values()).sort((a, b) =>
        (a.last_name || "").localeCompare(b.last_name || "")
      );

      setContacts(sorted);
      setLoading(false);
    };

    fetchContacts();
  }, []);

  return (
    <>
      <Tooltip title="Contacts">
        <IconButton onClick={popover.handleOpen} ref={popover.anchorRef}>
          <UsersIcon />
        </IconButton>
      </Tooltip>
      <ContactsPopover
        anchorEl={popover.anchorRef.current}
        onClose={popover.handleClose}
        open={popover.open}
        contacts={contacts}
        loading={loading}
      />
    </>
  );
}

function UserButton() {
  const popover = usePopover();
  const [contact, setContact] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const contactId = await getCurrentContactId();
      const { data } = await supabase
        .from("contact")
        .select("first_name, last_name, email, media:thumbnail_id(url)")
        .eq("id", contactId)
        .single();
      setContact(data);
    };

    fetchUser();
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
              border: "2px solid var(--MainNav-background)",
              borderRadius: "50%",
              bottom: "6px",
              height: "12px",
              right: "6px",
              width: "12px",
            },
          }}
        >
          <Avatar src={avatarUrl}>{contact?.first_name?.[0] ?? "?"}</Avatar>
        </Badge>
      </Box>
      <UserPopover anchorEl={popover.anchorRef.current} onClose={popover.handleClose} open={popover.open} contact={contact} />
    </>
  );
}

