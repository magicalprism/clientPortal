"use client";
import Link from "next/link"; // ✅ This is the Next.js router link

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z as zod } from "zod";

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

const schema = zod.object({
  title: zod.string().min(1, "Name is required"),
  email: zod.string().email("Enter a valid email"),
  tel: zod.string().min(1, "Phone is required"),
  status: zod.string().optional(),
  company_id: zod.string().optional(),
  country: zod.string(),
  state: zod.string(),
  city: zod.string(),
  postal: zod.string(),
  address_1: zod.string(),
  address_2: zod.string().optional(),
  timezone: zod.string(),
  thumbnail: zod.string().optional(),
});

const defaultValues = {
  title: "",
  email: "",
  tel: "",
  status: "active",
  company_id: "",
  country: "us",
  state: "",
  city: "",
  postal: "",
  address_1: "",
  address_2: "",
  timezone: "new_york",
  thumbnail: "",
};

const countryOptions = [
  { label: "United States", value: "us" },
  { label: "Germany", value: "de" },
  { label: "Spain", value: "es" },
];

export function ContactCreateForm() {
  const router = useRouter();
  const supabase = createClient();
  const [companies, setCompanies] = useState([]);
  const thumbnailInputRef = useRef(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues,
    resolver: zodResolver(schema),
  });

  const thumbnail = watch("thumbnail");

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setValue("thumbnail", reader.result);
    reader.onerror = () => toast.error("Image upload failed");
  };

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase.from("company").select("id, title");
      if (error) {
        logger.error("Failed to fetch companies");
        return;
      }
      setCompanies(data || []);
    };

    fetchCompanies();
  }, [supabase]);

  const onSubmit = async (data) => {
    try {
      const { data: result, error } = await supabase
        .from("contact")
        .insert([data])
        .select()
        .single();

      if (error || !result?.id) throw new Error(error?.message || "Insert failed");

      toast.success("Contact created");
      router.push(paths.dashboard.contacts.details(result.id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to create contact");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent>
          <Stack divider={<Divider />} spacing={4}>
            <Typography variant="h6">Contact Details</Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Stack direction="row" spacing={3} alignItems="center">
                  <Box sx={{ border: "1px dashed var(--mui-palette-divider)", borderRadius: "50%", p: 1 }}>
                    <Avatar
                      src={thumbnail}
                      sx={{ width: 100, height: 100, bgcolor: "background.level1" }}
                    >
                      <CameraIcon />
                    </Avatar>
                  </Box>
                  <Stack spacing={1}>
                    <Typography variant="subtitle1">Thumbnail</Typography>
                    <Typography variant="caption">400x400px, PNG or JPEG</Typography>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      Select
                    </Button>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleAvatarChange}
                    />
                  </Stack>
                </Stack>
              </Grid>

              {["title", "email", "tel", "status"].map((field) => (
                <Grid item xs={12} md={6} key={field}>
                  <Controller
                    name={field}
                    control={control}
                    render={({ field: controllerField }) => (
                      <FormControl fullWidth error={!!errors[field]}>
                        <InputLabel required>{field === "title" ? "Name" : field.charAt(0).toUpperCase() + field.slice(1)}</InputLabel>
                        <OutlinedInput {...controllerField} />
                        {errors[field] && <FormHelperText>{errors[field].message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid>
              ))}

              <Grid item xs={12} md={6}>
                <Controller
                  name="company_id"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Company</InputLabel>
                      <Select native {...field}>
                        <option value="">None</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.title}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>

            <Typography variant="h6">Address</Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={countryOptions}
                      getOptionLabel={(o) => o.label}
                      value={countryOptions.find((c) => c.value === field.value) || null}
                      onChange={(_, value) => field.onChange(value?.value || "")}
                      renderInput={(params) => (
                        <FormControl fullWidth error={!!errors.country}>
                          <InputLabel required>Country</InputLabel>
                          <OutlinedInput inputProps={params.inputProps} ref={params.InputProps.ref} />
                          {errors.country && <FormHelperText>{errors.country.message}</FormHelperText>}
                        </FormControl>
                      )}
                    />
                  )}
                />
              </Grid>

              {["state", "city", "postal", "address_1", "address_2"].map((field) => (
                <Grid item xs={12} md={6} key={field}>
                  <Controller
                    name={field}
                    control={control}
                    render={({ field: controllerField }) => (
                      <FormControl fullWidth error={!!errors[field]}>
                        <InputLabel required={field !== "address_2"}>
                          {field.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </InputLabel>
                        <OutlinedInput {...controllerField} />
                        {errors[field] && <FormHelperText>{errors[field].message}</FormHelperText>}
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
                  name="timezone"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.timezone}>
                      <InputLabel required>Timezone</InputLabel>
                      <Select {...field}>
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
        <Button color="secondary" component={Link} href={paths.dashboard.contacts.list}>

            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Create Contact
          </Button>
        </CardActions>
      </Card>
    </form>
  );
}
