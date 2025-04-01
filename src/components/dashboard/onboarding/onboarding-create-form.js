"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";

import { createClient } from "@/lib/supabase/browser";
import { toast } from "@/components/core/toaster";
import { logger } from "@/lib/default-logger";
import { paths } from "@/paths";

export function OnboardingCreateForm() {
  const supabase = createClient();
  const router = useRouter();

  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [useClientMap, setUseClientMap] = useState({});
  const [sectionVisibilityMap, setSectionVisibilityMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from("company")
        .select("id, title")
        .eq("is_client", true)
        .order("title");

      if (error) {
        logger.error("Error fetching companies", error);
        toast.error("Could not load companies");
        return;
      }

      setCompanies(data);
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!selectedCompanyId) return;

      const { data, error } = await supabase
        .from("project")
        .select("id, title")
        .eq("company_id", selectedCompanyId)
        .order("title");

      if (error) {
        logger.error("Error fetching projects", error);
        toast.error("Could not load projects");
        return;
      }

      setProjects(data);
      setSelectedProjectId("");
    };

    fetchProjects();
  }, [selectedCompanyId]);

  useEffect(() => {
    const fetchSectionsWithFields = async () => {
      const { data, error } = await supabase
        .from("onboardingsection")
        .select(`
          id,
          title,
          field_onboardingsection (
            order,
            field (
              id,
              title
            )
          )
        `);

      if (error) {
        logger.error("Error fetching onboarding sections", error);
        toast.error("Could not load onboarding sections");
        return;
      }

      const formatted = data.map((section) => {
        const fields = section.field_onboardingsection
          ?.filter((item) => item?.field?.id)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((item) => item.field);

        return {
          id: section.id,
          title: section.title,
          fields,
        };
      });

      const initialFieldMap = {};
      const initialSectionMap = {};

      formatted.forEach((section) => {
        initialSectionMap[section.id] = true;
        section.fields.forEach((field) => {
          initialFieldMap[field.id] = false;
        });
      });

      setSections(formatted);
      setUseClientMap(initialFieldMap);
      setSectionVisibilityMap(initialSectionMap);
      setLoading(false);
    };

    fetchSectionsWithFields();
  }, []);

  const handleCreateNewProject = async () => {
    if (!newProjectTitle.trim()) {
      toast.error("Project title is required.");
      return;
    }

    try {
      const created = new Date();

      const { data: project, error: projectError } = await supabase
        .from("project")
        .insert({
          title: newProjectTitle.trim(),
          company_id: selectedCompanyId,
          created: created.toISOString(),
        })
        .select()
        .single();

      if (projectError) throw projectError;

      await supabase.from("company_project").insert({
        company_id: selectedCompanyId,
        project_id: project.id,
      });

      const { data: updatedProjects } = await supabase
        .from("project")
        .select("id, title")
        .eq("company_id", selectedCompanyId)
        .order("title");

      setProjects(updatedProjects);
      setSelectedProjectId(project.id);
      setNewProjectDialogOpen(false);
      setNewProjectTitle("");

      toast.success("Project created");
    } catch (err) {
      logger.error("Error creating project", err);
      toast.error("Failed to create project");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCompanyId || !selectedProjectId) {
      toast.error("Please select a company and project.");
      return;
    }

    const selectedFieldIds = Object.entries(useClientMap)
      .filter(([_, checked]) => checked)
      .map(([id]) => parseInt(id));

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        logger.error("Could not get auth user", userError);
        toast.error("Unable to get current user.");
        return;
      }

      const authUserId = userData.user.id;

      const { data: contactData, error: contactError } = await supabase
        .from("contact")
        .select("id")
        .eq("supabase_user_id", authUserId)
        .single();

      if (contactError || !contactData?.id) {
        logger.error("Could not get contact for user", contactError);
        toast.error("Contact not found for current user.");
        return;
      }

      const authorId = contactData.id;

      const company = companies.find((c) => c.id === selectedCompanyId);
      const project = projects.find((p) => p.id === selectedProjectId);

      const { data: existing, error: existingError } = await supabase
        .from("onboarding")
        .select("id")
        .eq("company_id", selectedCompanyId)
        .eq("project_id", selectedProjectId);

      if (existingError) throw existingError;

      const version = existing.length + 1;
      const created = new Date();
      const title = `${company.title} – ${project.title} – v${version}`;

      const { data: onboardingData, error: onboardingError } = await supabase
        .from("onboarding")
        .insert({
          company_id: selectedCompanyId,
          project_id: selectedProjectId,
          author_id: authorId,
          title,
          created: created.toISOString(),
          status: "in_progress", // Set onboarding status
        })
        .select()
        .single();

      if (onboardingError) throw onboardingError;

      const onboardingId = onboardingData.id;

      const fieldsToInsert = selectedFieldIds.map((fieldId) => ({
        onboarding_id: onboardingId,
        field_id: fieldId,
        visible: true,
      }));

      const { error: fieldError } = await supabase
        .from("field_onboarding")
        .insert(fieldsToInsert);

      if (fieldError) throw fieldError;

      toast.success("Onboarding created");
      const destination = paths?.dashboard?.onboarding?.index;
      if (typeof destination === "string") {
        router.push(destination);
      } else {
        logger.error("Invalid navigation path", destination);
        window.location.href = "/dashboard/onboarding";
      }
    } catch (err) {
      console.error("Submit error:", err);
      logger.error("Submit error", err?.message || err || "Unknown error");
      toast.error("Failed to create onboarding");
    }
  };

  if (loading) {
    return <Typography sx={{ p: 3 }}>⏳ Loading onboarding...</Typography>;
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent>
            <Stack spacing={4} divider={<Divider />}>

              {/* Company and Project Selectors */}
              <Stack direction="row" spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Company</InputLabel>
                  <Select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    label="Company"
                  >
                    {companies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth disabled={!selectedCompanyId}>
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={selectedProjectId}
                    onChange={(e) => {
                      if (e.target.value === "add-new") {
                        setNewProjectDialogOpen(true);
                      } else {
                        setSelectedProjectId(e.target.value);
                      }
                    }}
                    label="Project"
                  >
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.title}
                      </MenuItem>
                    ))}
                    <MenuItem value="add-new">➕ Add New Project</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {/* Sections & Field Toggles */}
              {sections.map((section) => {
                const isVisible = sectionVisibilityMap[section.id];

                return (
                  <div key={section.id}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">{section.title}</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={isVisible}
                            onChange={(e) =>
                              setSectionVisibilityMap((prev) => ({
                                ...prev,
                                [section.id]: e.target.checked,
                              }))
                            }
                            color="primary"
                          />
                        }
                        label={isVisible ? "Visible" : "Hidden"}
                      />
                    </Stack>

                    {isVisible && section.fields.length > 0 && (
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        {section.fields.map((field) => (
                          <Grid item xs={12} sm={6} md={4} key={field.id}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={useClientMap[field.id] || false}
                                  onChange={(e) =>
                                    setUseClientMap((prev) => ({
                                      ...prev,
                                      [field.id]: e.target.checked,
                                    }))
                                  }
                                  color="primary"
                                />
                              }
                              label={field.title}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </div>
                );
              })}
            </Stack>
          </CardContent>

          <CardActions sx={{ justifyContent: "flex-end" }}>
            <Button type="submit" variant="contained">
              Create Onboarding
            </Button>
          </CardActions>
        </Card>
      </form>

      {/* Add New Project Dialog */}
      <Dialog open={newProjectDialogOpen} onClose={() => setNewProjectDialogOpen(false)}>
        <DialogTitle>Add New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Project Title"
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewProjectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateNewProject} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
