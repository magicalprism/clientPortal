import * as React from "react";
import RouterLink from "next/link";
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
  LinearProgress,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2"; // <-- Use Grid2 for original spacing

import {
  ArrowLeft as ArrowLeftIcon,
  CaretDown as CaretDownIcon,
  CheckCircle as CheckCircleIcon,
  CreditCard as CreditCardIcon,
  House as HouseIcon,
  PencilSimple as PencilSimpleIcon,
  Plus as PlusIcon,
  ShieldWarning as ShieldWarningIcon,
  User as UserIcon,
} from "@phosphor-icons/react/dist/ssr";

import { appConfig } from "@/config/app";
import { paths } from "@/paths";
import { createClient } from "@/lib/supabase/server";

import { PropertyItem } from "@/components/core/property-item";
import { PropertyList } from "@/components/core/property-list";
import { Notifications } from "@/components/dashboard/company/notifications";
import { Payments } from "@/components/dashboard/company/payments";

export const metadata = {
  title: `Details | Companies | Dashboard | ${appConfig.title}`,
};

export default async function Page(props) {
  const supabase = await createClient();
  const { companyId } = await Promise.resolve(props.params);

  const { data: company, error } = await supabase
  .from("company")
  .select("*")
  .eq("id", companyId)
  .maybeSingle();


  if (error) console.error("Error loading company:", error.message);
  if (!company) {
    return (
      <Box p={4}>
        <Typography variant="h6">Company not found.</Typography>
      </Box>
    );
  }

  const quota = typeof company.quota === "number" ? company.quota : 0;

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
              href={paths.dashboard.companies.list}
              sx={{ alignItems: "center", display: "inline-flex", gap: 1 }}
              variant="subtitle2"
            >
              <ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />
              Companies
            </Link>
          </div>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", flex: "1 1 auto" }}>
              <Avatar src={company.avatar} sx={{ "--Avatar-size": "64px" }}>
                {company.title?.[0]}
              </Avatar>
              <div>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                  <Typography variant="h4">{company.title}</Typography>
                  <Chip
                    icon={<CheckCircleIcon color="var(--mui-palette-success-main)" weight="fill" />}
                    label={company.status || "Active"}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
                <Typography color="text.secondary" variant="body1">
                  {company.billing_email}
                </Typography>
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
          <Grid
            xs={12}
            lg={4}
          >
            <Stack spacing={4}>
              <Card>
                <CardHeader
                  action={<IconButton><PencilSimpleIcon /></IconButton>}
                  avatar={<Avatar><UserIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
                  title="Basic details"
                />
                <PropertyList
                  divider={<Divider />}
                  orientation="vertical"
                  sx={{ "--PropertyItem-padding": "12px 24px" }}
                >
                  <PropertyItem title="Company ID" value={<Chip label={company.id} size="small" variant="soft" />} />
                  <PropertyItem title="Name" value={company.title} />
                  <PropertyItem title="Email" value={company.billing_email} />
                  <PropertyItem title="Phone" value={company.tel || "-"} />
                  {company.company && (
                    <PropertyItem title="Company" value={company.company.title} />
                  )}
                  <PropertyItem
                    title="Quota"
                    value={
                      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                        <LinearProgress value={quota} variant="determinate" sx={{ flex: "1 1 auto" }} />
                        <Typography color="text.secondary" variant="body2">
                          {quota}%
                        </Typography>
                      </Stack>
                    }
                  />
                </PropertyList>
              </Card>

              <Card>
                <CardHeader
                  avatar={<Avatar><ShieldWarningIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
                  title="Security"
                />
                <CardContent>
                  <Stack spacing={1}>
                    <Button color="error" variant="contained">
                      Delete account
                    </Button>
                    <Typography color="text.secondary" variant="body2">
                      A deleted company cannot be restored. All data will be permanently removed.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          <Grid
            xs={12}
            lg={8}
          >
            <Stack spacing={4}>
              <Payments
                ordersValue={0}
                payments={[]}
                refundsValue={0}
                totalOrders={0}
              />

              <Card>
                <CardHeader
                  action={<Button color="secondary" startIcon={<PencilSimpleIcon />}>Edit</Button>}
                  avatar={<Avatar><CreditCardIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
                  title="Billing details"
                />
                <CardContent>
                  <Card sx={{ borderRadius: 1 }} variant="outlined">
                    <PropertyList divider={<Divider />} sx={{ "--PropertyItem-padding": "16px" }}>
                      <PropertyItem title="Credit card" value="**** 4142" />
                      <PropertyItem title="Country" value={company.country} />
                      <PropertyItem title="State" value={company.state} />
                      <PropertyItem title="City" value={company.city} />
                      <PropertyItem title="Address" value={company.address_1} />

                    </PropertyList>
                  </Card>
                </CardContent>
              </Card>

              <Card>
                <CardHeader
                  action={<Button color="secondary" startIcon={<PlusIcon />}>Add</Button>}
                  avatar={<Avatar><HouseIcon fontSize="var(--Icon-fontSize)" /></Avatar>}
                  title="Shipping addresses"
                />
                <CardContent>
                  <Typography>No addresses available.</Typography>
                </CardContent>
              </Card>

              <Notifications notifications={[]} />
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
