import * as React from "react";
import RouterLink from "next/link";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowLeft as ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";

import { appConfig } from "@/config/app";
import { paths } from "@/paths";
import { ContactCreateForm } from "@/components/dashboard/contact/contact-create-form";

// ✅ THIS MUST STAY OUTSIDE THE COMPONENT
export const metadata = {
  title: `Create | Contacts | Dashboard | ${appConfig.title}`,
};

// ✅ THIS MUST BE DEFAULT EXPORTED
export default function Page() {
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
        <Stack spacing={3}>
          <div>
            <Link
              color="text.primary"
              component={RouterLink}
              href={paths.dashboard.contacts.list}
              sx={{ alignItems: "center", display: "inline-flex", gap: 1 }}
              variant="subtitle2"
            >
              <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
              Contacts
            </Link>
          </div>
          <div>
            <Typography variant="h4">Create contact</Typography>
          </div>
        </Stack>
        <ContactCreateForm />
      </Stack>
    </Box>
  );
}
