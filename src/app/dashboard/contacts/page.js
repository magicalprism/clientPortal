"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Plus as PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import { createClient } from "@/lib/supabase/browser";
import { dayjs } from "@/lib/dayjs";

import { ContactsFilters } from "@/components/dashboard/contact/contact-filters";
import { ContactsPagination } from "@/components/dashboard/contact/contact-pagination";
import { ContactsSelectionProvider } from "@/components/dashboard/contact/contact-selection-context";
import { ContactsTable } from "@/components/dashboard/contact/contact-table";

export default function Page() {
  const searchParams = useSearchParams();

  const title = searchParams.get("title") || "";
  const email = searchParams.get("email") || "";
  const tel = searchParams.get("tel") || "";
  const status = searchParams.get("status") || "";
  const sortDir = searchParams.get("sortDir") || "desc";

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);

      const supabase = createClient();
      const { data, error } = await supabase.from("contact").select("*");

      if (error) {
        console.error("Error loading contacts:", error.message);
        setContacts([]);
        return;
      }

      const enriched = data.map((c) => ({
        ...c,
        createdAt: dayjs(c.createdAt ?? c.created_at).toDate(),
      }));

      const sorted = applySort(enriched, sortDir);
      const filtered = applyFilters(sorted, { title, email, tel, status });

      setContacts(filtered);
      setLoading(false);
    };

    fetchContacts();
  }, [title, email, tel, status, sortDir]);

  return (
    <Box
      sx={{
        maxWidth: "var(--Content-maxWidth)",
        m: "var(--Content-margin)",
        p: "var(--Content-padding)",
        width: "var(--Content-width)",
      }}
    >
      <Stack spacing={4}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          sx={{ alignItems: "flex-start" }}
        >
          <Box sx={{ flex: "1 1 auto" }}>
            <Typography variant="h4">Contacts</Typography>
          </Box>
          <Box>
            <Button
              component={Link}
              href="/dashboard/contacts/create"
              startIcon={<PlusIcon />}
              variant="contained"
            >
              Add
            </Button>
          </Box>
        </Stack>

        <ContactsSelectionProvider contacts={contacts}>
          <Card>
            <ContactsFilters
              filters={{ title, email, tel, status }}
              sortDir={sortDir}
            />
            <Divider />
            <Box sx={{ overflowX: "auto" }}>
              <ContactsTable rows={contacts} />
            </Box>
            <Divider />
            <ContactsPagination count={contacts.length} page={0} />
          </Card>
        </ContactsSelectionProvider>
      </Stack>
    </Box>
  );
}

function applySort(rows, sortDir) {
  return rows.sort((a, b) => {
    if (sortDir === "asc") {
      return a.createdAt.getTime() - b.createdAt.getTime();
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

function applyFilters(rows, { title, email, tel, status }) {
  return rows.filter((item) => {
    if (title && !item.title?.toLowerCase().includes(title.toLowerCase())) return false;
    if (email && !item.email?.toLowerCase().includes(email.toLowerCase())) return false;
    if (tel && !item.tel?.toLowerCase().includes(tel.toLowerCase())) return false;
    if (status && item.status?.toLowerCase() !== status.toLowerCase()) return false;
    return true;
  });
}
