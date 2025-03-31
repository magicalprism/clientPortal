"use client";

import * as React from "react";
import RouterLink from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z as zod } from "zod";
import { Controller, useForm } from "react-hook-form";

import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  OutlinedInput,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { Camera as CameraIcon } from "@phosphor-icons/react/dist/ssr/Camera";

import { Option } from "@/components/core/option";
import { toast } from "@/components/core/toaster";
import { logger } from "@/lib/default-logger";
import { paths } from "@/paths";

import { createClient } from "@/lib/supabase/browser";

const countryOptions = [
  { label: "United States", value: "us" },
  { label: "Germany", value: "de" },
  { label: "Spain", value: "es" },
];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Error converting file to base64"));
  });
}

const schema = zod.object({
  thumbnail: zod.string().optional(),
  title: zod.string().min(1, "Title is required").max(255),
  billing_email: zod.string().email("Must be a valid billing email").max(255),
  tel: zod.string().min(1, "Phone is required").max(15),
  country: zod.string().min(1, "Country is required"),
  state: zod.string().min(1, "State is required"),
  city: zod.string().min(1, "City is required"),
  postal: zod.string().min(1, "Zip code is required"),
  address_1: zod.string().min(1, "Address is required"),
  taxId: zod.string().optional(),
  timezone: zod.string().min(1, "Timezone is required"),
});

const defaultValues = {
  thumbnail: "",
  title: "",
  billing_email: "",
  tel: "",
  country: "us",
  state: "",
  city: "",
  postal: "",
  address_1: "",
  taxId: "",
  timezone: "new_york",
};

export function OnboardingCreateForm() {
  const router = useRouter();
  const supabase = createClient();
  const thumbnailInputRef = React.useRef(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues,
    resolver: zodResolver(schema),
  });

  const thumbnail = watch("thumbnail");

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = await fileToBase64(file);
      setValue("thumbnail", url);
    }
  };

  const onSubmit = async (data) => {
    try {
      const { data: result, error } = await supabase
        .from("company")
        .insert({
          thumbnail: data.thumbnail,
          title: data.title,
          billing_email: data.billing_email,
          tel: data.tel,
          country: data.country,
          state: data.state,
          city: data.city,
          postal: data.postal,
          address_1: data.address_1,
          tax_id: data.taxId,
          timezone: data.timezone,
        })
        .select()
        .single();

      if (error) throw new Error(error.message || "Supabase insert failed");
      if (!result?.id) throw new Error("Missing company ID");

      toast.success("Onboarding created");
      router.push(paths.dashboard.onboarding.details(result.id));
    } catch (err) {
      console.error("Submit error:", err);
      logger.error(err?.message || JSON.stringify(err));
      toast.error("Failed to create company");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent>
          <Stack divider={<Divider />} spacing={4}>
            <Typography variant="h6">Onboarding Details</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Stack direction="row" spacing={3} alignItems="center">
                  <Box
                    sx={{
                      border: "1px dashed var(--mui-palette-divider)",
                      borderRadius: "50%",
                      display: "inline-flex",
                      p: "4px",
                    }}
                  >
                    <Avatar
                      src={thumbnail}
                      sx={{
                        width: 100,
                        height: 100,
                        bgcolor: "background.level1",
                        color: "text.primary",
                      }}
                    >
                      <CameraIcon />
                    </Avatar>
                  </Box>
                  <Stack spacing={1}>
                    <Typography variant="subtitle1">Thumbnail</Typography>
                    <Typography variant="caption">400x400px, PNG or JPEG</Typography>
                    <Button
                      color="secondary"
                      variant="outlined"
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      Select
                    </Button>
                    <input
                      hidden
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </Stack>
                </Stack>
              </Grid>

              {[
                { name: "title", label: "Title", required: true },
                { name: "billing_email", label: "Billing Email", required: true },
                { name: "tel", label: "Phone", required: true },
              ].map(({ name, label, required }) => (
                <Grid item xs={12} md={6} key={name}>
                  <Controller
                    control={control}
                    name={name}
                    render={({ field }) => (
                      <FormControl fullWidth error={Boolean(errors[name])}>
                        <InputLabel required={required}>{label}</InputLabel>
                        <OutlinedInput {...field} type={name === "billing_email" ? "email" : "text"} />
                        {errors[name] && <FormHelperText>{errors[name].message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid>
              ))}
            </Grid>

            <Typography variant="h6">Address Info</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  control={control}
                  name="country"
                  render={({ field }) => (
                    <Autocomplete
                      options={countryOptions}
                      getOptionLabel={(opt) => opt.label}
                      value={countryOptions.find((opt) => opt.value === field.value) || null}
                      onChange={(_, val) => field.onChange(val?.value || "")}
                      renderInput={(params) => (
                        <FormControl fullWidth error={Boolean(errors.country)}>
                          <InputLabel required>Country</InputLabel>
                          <OutlinedInput inputProps={params.inputProps} ref={params.InputProps.ref} />
                          {errors.country && <FormHelperText>{errors.country.message}</FormHelperText>}
                        </FormControl>
                      )}
                    />
                  )}
                />
              </Grid>

              {["state", "city", "postal", "address_1", "taxId"].map((key) => (
                <Grid item xs={12} md={6} key={key}>
                  <Controller
                    control={control}
                    name={key}
                    render={({ field }) => (
                      <FormControl fullWidth error={Boolean(errors[key])}>
                        <InputLabel required={key !== "taxId"}>
                          {key === "address_1" ? "Address" : key.charAt(0).toUpperCase() + key.slice(1)}
                        </InputLabel>
                        <OutlinedInput {...field} />
                        {errors[key] && <FormHelperText>{errors[key].message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid>
              ))}
            </Grid>

            <Typography variant="h6">Preferences</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  control={control}
                  name="timezone"
                  render={({ field }) => (
                    <FormControl fullWidth error={Boolean(errors.timezone)}>
                      <InputLabel required>Timezone</InputLabel>
                      <Select {...field}>
                        <Option value="">Select a timezone</Option>
                        <Option value="new_york">US - New York</Option>
                        <Option value="california">US - California</Option>
                        <Option value="london">UK - London</Option>
                      </Select>
                      {errors.timezone && <FormHelperText>{errors.timezone.message}</FormHelperText>}
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </Stack>
        </CardContent>

        <CardActions sx={{ justifyContent: "flex-end" }}>
          <Button color="secondary" component={RouterLink} href={paths.dashboard.onboarding.list}>
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Create Onboarding
          </Button>
        </CardActions>
      </Card>
    </form>
  );
}
