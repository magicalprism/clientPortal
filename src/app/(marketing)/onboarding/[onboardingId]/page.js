"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Stack,
  Typography,
  Avatar,
  TextField,
  Link,
  Tabs,
  Tab,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";

import { paths } from "@/paths";
import { createClient } from "@/lib/supabase/browser";





function uploadFile(file, folder = "uploads") {
  const supabase = createClient();
  const filename = `${folder}/${Date.now()}-${file.name}`;
  return supabase.storage.from("media").upload(filename, file).then(({ error }) => {
    if (error) throw error;
    return supabase.storage.from("media").getPublicUrl(filename).data.publicUrl;
  });
}

export default function OnboardingDetailsPage(props) {
  const { onboardingId } = React.use(props.params);
  const supabase = createClient();

  const [onboarding, setOnboarding] = useState(null);
  const [sections, setSections] = useState([]);
  const [prefillMap, setPrefillMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          { data: onboardingData },
          { data: sectionsData },
          { data: fieldSectionLinks },
          { data: fields },
          { data: fieldOnboardingLinks },
        ] = await Promise.all([
          supabase.from("onboarding").select("*, company:company_id(*), project:project_id(*)").eq("id", onboardingId).maybeSingle(),
          supabase.from("onboardingsection").select("*"),
          supabase.from("field_onboardingsection").select("*"),
          supabase.from("field").select("*"),
          supabase.from("field_onboarding").select("*").eq("onboarding_id", onboardingId),
        ]);

        if (!onboardingData) {
          setError("Onboarding not found.");
          return;
        }

        const fieldMap = Object.fromEntries(fields.map((f) => [f.id, f]));
        const onboardingFieldIds = new Set(fieldOnboardingLinks.map((f) => f.field_id));

        const structuredSections = sectionsData.map((section) => {
          const links = fieldSectionLinks.filter(
            (link) => link.onboardingsection_id === section.id && onboardingFieldIds.has(link.field_id)
          );
          const linkedFields = links.map((link) => ({ ...link, field: fieldMap[link.field_id] }));
          return { ...section, fields: linkedFields };
        });

        const uniqueTables = [...new Set(fields.map((f) => f.table_name).filter(Boolean))];
        const tableData = await Promise.all(
          uniqueTables.map(async (table) => {
            const { data } = await supabase.from(table).select("*").eq("onboarding_id", onboardingId).maybeSingle();
            return { table, data: data || {} };
          })
        );

        const map = Object.fromEntries(tableData.map((t) => [t.table, t.data]));
        if (onboardingData.company) map.company = onboardingData.company;
        if (onboardingData.project) map.project = onboardingData.project;

        setOnboarding(onboardingData);
        setPrefillMap(map);
        setSections(structuredSections);
      } catch (err) {
        console.error("❌ Error loading onboarding:", err);
        setError("Failed to load onboarding data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [onboardingId]);

  if (loading) return <Box p={4}><Typography>Loading onboarding data...</Typography></Box>;
  if (error) return <Box p={4}><Typography color="error">{error}</Typography></Box>;

  return (
    <Box sx={{ maxWidth: "100%", px: 4, py: 3 }}>
      <Stack spacing={3} mb={4}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar>{onboarding?.name?.[0]}</Avatar>
          <div>
            <Typography variant="h4">{onboarding?.name}</Typography>
            <Typography color="text.secondary">ID: {onboarding?.id}</Typography>
          </div>
        </Stack>

        <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} variant="scrollable">
          {sections.map((section, idx) => (
            <Tab key={section.id} label={section.title} />
          ))}
        </Tabs>
      </Stack>

      {sections.map((section, idx) => (
        tabIndex === idx && (
          <SectionForm
            key={section.id}
            section={section}
            onboardingId={onboardingId}
            onboarding={onboarding}
            prefill={prefillMap}
          />
        )
      ))}
    </Box>
  );
}

OnboardingDetailsPage.getLayout = (page) => page;

function SectionForm({ section, onboardingId, onboarding, prefill }) {
  const supabase = createClient();
  const tableName = section.fields[0]?.field.table_name;

  const defaultValues = section.fields.reduce((acc, f) => {
    acc[f.field.column_name] = prefill[tableName]?.[f.field.column_name] || onboarding?.[`${tableName}`]?.[f.field.column_name] || "";
    return acc;
  }, {});

  const { control, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues });

  const onSubmit = async (values) => {
    if (!section.fields.length || !tableName) return;

    const existingId = prefill[tableName]?.id || onboarding?.[`${tableName}_id`];
    const payload = { ...values, onboarding_id: onboardingId, ...(existingId ? { id: existingId } : {}) };

    try {
      const result = await supabase.from(tableName).upsert([payload]);
      if (result.error) console.error(`❌ Supabase error saving to ${tableName}:`, result.error);
    } catch (err) {
      console.error(`🔥 JS Error during save to ${tableName}:`, err);
    }
  };

  return (
    <Card component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mb: 4 }}>
      <CardHeader title={section.title} />
      <CardContent>
        <Grid container spacing={3}>
          {section.fields.map((f) => {
            const col = f.field.column_name.toLowerCase();
            const isHidden = col.includes("id");
            const isMedia = col.includes("media") || col.includes("link") || col.includes("logo");

            return (
              <Grid
                key={f.field_id}
                item
                xs={12}
                md={isHidden || isMedia ? 12 : 6}
                sx={{ display: isHidden ? "none" : "block" }}
              >
                <Controller
                  control={control}
                  name={f.field.column_name}
                  render={({ field }) => (
                    <Box>
                      {isMedia ? (
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            {field.value && (field.value.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <img
                                src={field.value}
                                alt={f.field.title}
                                style={{ width: "100%", maxWidth: 100, height: 100, objectFit: "cover", borderRadius: 4 }}
                              />
                            ) : (
                              <Link href={field.value} target="_blank" rel="noopener noreferrer">
                                📄 {field.value.split("/").pop()}
                              </Link>
                            ))}
                          </Grid>
                          <Grid item xs={12} sm={8}>
                            <TextField {...field} type="url" fullWidth placeholder="Enter or paste file URL" sx={{ mb: 1 }} />
                            <Button variant="outlined" component="label" fullWidth>
                              Upload File (mock)
                              <input
                                hidden
                                type="file"
                                accept="image/*,.pdf,.doc,.docx"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) field.onChange(URL.createObjectURL(file));
                                }}
                              />
                            </Button>
                          </Grid>
                        </Grid>
                      ) : (
                        <TextField
                          {...field}
                          label={f.field.title || `Field ${f.field_id}`}
                          type={f.field.form_field_type || "text"}
                          fullWidth
                        />
                      )}
                      {!isHidden && !isMedia && f.field.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {f.field.description}
                        </Typography>
                      )}
                    </Box>
                  )}
                />
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
      <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          Save Section
        </Button>
      </Box>
    </Card>
  );
}



