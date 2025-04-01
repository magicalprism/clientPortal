import * as React from "react";
import Link from "next/link";
import { Box, Stack, Typography } from "@mui/material";
import { ArrowLeft as ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";

import { createClient } from "@/lib/supabase/server";
import { paths } from "@/paths";
import { appConfig } from "@/config/app";

import { OnboardingForm } from "@/components/dashboard/onboarding/onboarding-form";

export const metadata = {
  title: `Details | Onboarding | Dashboard | ${appConfig.title}`,
};

export default async function Page({ params }) {
  const supabase = await createClient();
  const onboardingId = params?.onboardingId;

  const { data: onboarding, error } = await supabase
    .from("onboarding")
    .select("*")
    .eq("id", onboardingId)
    .maybeSingle();

  if (error) {
    console.error("Error loading onboarding:", error.message);
  }

  if (!onboarding) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6">Onboarding entry not found.</Typography>
      </Box>
    );
  }

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
            <Typography
              component={Link}
              href={paths.dashboard.onboarding.list}
              sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
              color="text.primary"
              variant="subtitle2"
            >
              <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
              Back to Onboardings
            </Typography>
          </div>

          <Typography variant="h4">Edit Onboarding</Typography>
        </Stack>

        <OnboardingForm onboarding={onboarding} />
      </Stack>
    </Box>
  );
}
