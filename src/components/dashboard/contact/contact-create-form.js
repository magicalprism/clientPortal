"use client";
import Link from "next/link";
import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z as zod } from "zod";
import {
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
  MenuItem,
} from "@mui/material";
import { Camera as CameraIcon } from "@phosphor-icons/react/dist/ssr/Camera";
import { Option } from "@/components/core/option";
import { toast } from "@/components/core/toaster";
import { logger } from "@/lib/default-logger";
import { paths } from "@/paths";
import { createClient } from "@/lib/supabase/browser";
import { COUNTRIES, STATES, TIMEZONES } from "@/data/lists";


const schema = zod.object({
  title: zod.string().min(1, "Name is required"),
  email: zod.string().email("Enter a valid email"),
  tel: zod.string().min(1, "Phone is required"),
  status: zod.string().optional(),
  company_id: zod.coerce.number().optional(),
  country: zod.string(),
  state: zod.string(),
  city: zod.string(),
  postal: zod.string(),
  timezone: zod.string(),
  thumbnail: zod.string().optional(),
  first_name: zod.string().optional(),
  last_name: zod.string().optional(),
  bio: zod.string().optional(),
  prof_title: zod.string().optional(),
  has_access: zod.boolean().optional(),
  role: zod.string().optional(),
  address_1: zod.string().optional(),
  address_2: zod.string().optional(),

});


const defaultValues = {
  title: "",
  email: "",
  tel: "",
  status: "active",
  company_id: undefined,
  country: "US",
  state: "",
  city: "",
  postal: "",
  timezone: "new_york",
  thumbnail: "",
  first_name: "",
  last_name: "",
  bio: "",
  prof_title: "",
  has_access: false,
  role: "",
  address_1: "",
  address_2: "",
};


export function ContactCreateForm() {
  const router = useRouter();
  const supabase = createClient();
  const [companies, setCompanies] = useState([]);
  const thumbnailInputRef = useRef(null);

  const [currentUserRole, setCurrentUserRole] = useState("viewer"); // Fallback role
  const ROLE_OPTIONS = ["viewer", "editor", "manager", "super-admin"];
  const roleHierarchy = ["viewer", "editor", "manager", "super-admin"];

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("No authenticated user found:", userError);
        return;
      }
  
      const { data, error } = await supabase
        .from("contact")
        .select("role")
        .eq("supabase_user_id", user.id)
        .single();
  
      if (error) {
        console.error("Failed to fetch role from contact table:", error.message);
      } else if (data?.role) {
        console.log("✅ User role:", data.role);
        setCurrentUserRole(data.role);
      } else {
        console.warn("User has no role in contact table");
      }
    };
  
    fetchUserRole();
  }, []);
  

  const visibleRoles = ROLE_OPTIONS.filter(
    (role) =>
      roleHierarchy.indexOf(role) <= roleHierarchy.indexOf(currentUserRole)
  );

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
      const { company_id, ...contactData } = data;

      const { data: result, error } = await supabase
        .from("contact")
        .insert([contactData])
        .select("id")
        .single();

      if (error || !result?.id) throw new Error(error?.message || "Insert failed");

      if (company_id) {
        const { error: pivotError } = await supabase
          .from("company_contact") // name of your pivot table
          .insert([{ contact_id: result.id, company_id }]);

        if (pivotError) {
          throw new Error(`Failed to link company: ${pivotError.message}`);
        }
      }

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
    {/* --- Contact Details Section --- */}
    <Typography variant="h6">Contact Details</Typography>

    <Grid container spacing={3}>
      {/* Avatar Upload */}
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

      {/* Primary Fields */}
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

      {/* Optional Info */}
      {["first_name", "last_name", "prof_title"].map((field) => (
        <Grid item xs={12} md={6} key={field}>
          <Controller
            name={field}
            control={control}
            render={({ field: controllerField }) => (
              <FormControl fullWidth>
                <InputLabel>{field.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</InputLabel>
                <OutlinedInput {...controllerField} />
              </FormControl>
            )}
          />
        </Grid>
      ))}

      {/* Role & Access */}
      <Grid item xs={12} md={6}>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select {...field}>
                <MenuItem value="">Select Role</MenuItem>
                {visibleRoles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller
          name="has_access"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel shrink>Has Access</InputLabel>
              <Select
                {...field}
                value={field.value ? "true" : "false"}
                onChange={(e) => field.onChange(e.target.value === "true")}
              >
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Grid>

      {/* Bio */}
      <Grid item xs={12}>
        <Controller
          name="bio"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Bio</InputLabel>
              <OutlinedInput {...field} multiline minRows={3} />
            </FormControl>
          )}
        />
      </Grid>

      {/* Company & Timezone */}
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
      <Grid item xs={12} md={6}>
        <Controller
          name="timezone"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.timezone}>
              <InputLabel>Timezone</InputLabel>
              <Select {...field}>
                {TIMEZONES.map(({ value, label }) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>

              {errors.timezone && <FormHelperText>{errors.timezone.message}</FormHelperText>}
            </FormControl>
          )}
        />
      </Grid>
    </Grid>

    {/* --- Address Section --- */}
<Typography variant="h6">Address</Typography>

<Grid container spacing={3}>
  <Grid item xs={12} md={6}>
    <Controller
      name="address_1"
      control={control}
      render={({ field }) => (
        <FormControl fullWidth>
          <InputLabel>Address 1</InputLabel>
          <OutlinedInput {...field} />
        </FormControl>
      )}
    />
  </Grid>
  <Grid item xs={12} md={6}>
    <Controller
      name="address_2"
      control={control}
      render={({ field }) => (
        <FormControl fullWidth>
          <InputLabel>Address 2</InputLabel>
          <OutlinedInput {...field} />
        </FormControl>
      )}
    />
  </Grid>

  


  <Grid item xs={12} md={6}>
    <Controller
      name="city"
      control={control}
      render={({ field }) => (
        <FormControl fullWidth error={!!errors.city}>
          <InputLabel required>City</InputLabel>
          <OutlinedInput {...field} />
          {errors.city && <FormHelperText>{errors.city.message}</FormHelperText>}
        </FormControl>
      )}
    />
  </Grid>
  <Grid item xs={12} md={6}>
  <Controller
    name="state"
    control={control}
    render={({ field }) => (
      <FormControl fullWidth error={!!errors.state}>
        <InputLabel required>State / Province</InputLabel>
        <Select {...field}>
          {STATES.map(({ value, label }) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </Select>
        {errors.state && <FormHelperText>{errors.state.message}</FormHelperText>}
      </FormControl>
    )}
  />
</Grid>

<Grid item xs={12} md={6}>
  <Controller
    name="country"
    control={control}
    render={({ field }) => (
      <FormControl fullWidth error={!!errors.country}>
        <InputLabel required>Country</InputLabel>
        <Select {...field}>
          {COUNTRIES.map(({ value, label }) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
</Select>
        {errors.country && <FormHelperText>{errors.country.message}</FormHelperText>}
      </FormControl>
    )}
  />
</Grid>

  <Grid item xs={12} md={6}>
    <Controller
      name="postal"
      control={control}
      render={({ field }) => (
        <FormControl fullWidth error={!!errors.postal}>
          <InputLabel required>Postal</InputLabel>
          <OutlinedInput {...field} />
          {errors.postal && <FormHelperText>{errors.postal.message}</FormHelperText>}
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