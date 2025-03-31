// ❌ No "use client" here!

import * as React from "react"
import RouterLink from "next/link"
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material"
import Grid from "@mui/material/Grid2"

import {
  ArrowLeft as ArrowLeftIcon,
  CaretDown as CaretDownIcon,
  CheckCircle as CheckCircleIcon,
  PencilSimple as PencilSimpleIcon,
  User as UserIcon,
} from "@phosphor-icons/react/dist/ssr"

import { appConfig } from "@/config/app"
import { paths } from "@/paths"
import { createClient } from "@/lib/supabase/server"
import { dayjs } from "@/lib/dayjs"

import { PropertyItem } from "@/components/core/property-item"
import { PropertyList } from "@/components/core/property-list"

export const metadata = {
  title: `Details | Onboarding | Dashboard | ${appConfig.title}`,
}

export default async function Page({ params }) {
  const supabase = await createClient()
  const { onboardingId } = params

  const { data: onboarding, error } = await supabase
    .from("onboarding")
    .select("*")
    .eq("id", onboardingId)
    .maybeSingle()

  if (error) console.error("Error loading onboarding:", error.message)

  if (!onboarding) {
    return (
      <Box p={4}>
        <Typography variant="h6">Onboarding not found.</Typography>
      </Box>
    )
  }

  const createdAt = onboarding.created_at
    ? dayjs(onboarding.created_at).format("MMMM D, YYYY")
    : "-"

  return (
    <Box sx={{ maxWidth: "var(--Content-maxWidth)", m: "var(--Content-margin)", p: "var(--Content-padding)", width: "var(--Content-width)" }}>
      <Stack spacing={4}>
        <Stack spacing={3}>
          <div>
            <Link
              color="text.primary"
              component={RouterLink}
              href={paths.dashboard.onboarding.list}
              sx={{ alignItems: "center", display: "inline-flex", gap: 1 }}
              variant="subtitle2"
            >
              <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
              Onboardings
            </Link>
          </div>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", flex: "1 1 auto" }}>
              <Avatar sx={{ "--Avatar-size": "64px" }}>{onboarding.title?.[0]}</Avatar>
              <div>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                  <Typography variant="h4">{onboarding.title}</Typography>
                  <Chip
                    icon={<CheckCircleIcon color="var(--mui-palette-success-main)" weight="fill" />}
                    label={onboarding.status || "Active"}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </div>
            </Stack>
            <div>
              <Button endIcon={<CaretDownIcon />} variant="contained">
                Action
              </Button>
            </div>
          </Stack>
        </Stack>

        <Grid container spacing={4}>
          <Grid xs={12}>
            <Card>
              <CardHeader
                title="Onboarding Details"
                action={
                  <IconButton>
                    <PencilSimpleIcon />
                  </IconButton>
                }
                avatar={
                  <Avatar>
                    <UserIcon fontSize="var(--Icon-fontSize)" />
                  </Avatar>
                }
              />
              <CardContent>
                <PropertyList divider={<Divider />} sx={{ "--PropertyItem-padding": "12px 24px" }}>
                  <PropertyItem title="Onboarding ID" value={<Chip label={onboarding.id} size="small" />} />
                  <PropertyItem title="Title" value={onboarding.title} />
                  <PropertyItem title="Project ID" value={onboarding.project_id || "-"} />
                  <PropertyItem title="Created At" value={createdAt} />
                  <PropertyItem title="Status" value={onboarding.status || "Approved"} />
                </PropertyList>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  )
}
