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
import { fetchCompaniesWithFilter } from "@/lib/supabase/queries/table/company";
import { fetchProjectsByCompanyId, createProject } from "@/lib/supabase/queries/table/project";
import { fetchOnboardingSectionsWithFields } from "@/lib/supabase/queries/table/onboardingsection";
import { replaceFieldsForOnboarding } from "@/lib/supabase/queries/pivot/field_onboarding";
import { fetchOnboardingsByCompanyAndProjectIds, createOnboarding } from "@/lib/supabase/queries/table/onboarding";
import { linkCompanyToProject } from "@/lib/supabase/queries/pivot/company_project";
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
      const { data, error } = await fetchCompaniesWithFilter(
        { is_client: true }, 
        ['id', 'title'], 
        { column: 'title', ascending: true }
      );

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

      const { data, error } = await fetchProjectsByCompanyId(
        selectedCompanyId, 
        ['id', 'title'], 
        { column: 'title', ascending: true }
      );

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
      const { data, error } = await fetchOnboardingSectionsWithFields();

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

      // Create the project
      const { data: project, error: projectError } = await createProject({
        title: newProjectTitle.trim(),
        company_id: selectedCompanyId,
        created: created.toISOString(),
      });

      if (projectError) throw projectError;

      // Link the project to the company
      await linkCompanyToProject(selectedCompanyId, project.id);

      // Fetch updated projects
      const { data: updatedProjects } = await fetchProjectsByCompanyId(
        selectedCompanyId, 
        ['id', 'title'], 
        { column: 'title', ascending: true }
      );

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
      // Get current user - keep using auth API directly
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        logger.error("Could not get auth user", userError);
        toast.error("Unable to get current user.");
        return;
      }

      const authUserId = userData.user.id;

      // Get contact for user - we could move this to a query function in the future
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

      // Check for existing onboardings with same company/project
      const { data: existing, error: existingError } = await fetchOnboardingsByCompanyAndProjectIds(
        selectedCompanyId,
        selectedProjectId
      );

      if (existingError) throw existingError;

      const version = existing.length + 1;
      const created = new Date();
      const title = `${company.title} – ${project.title} – v${version}`;

      // Create the onboarding
      const { data: onboardingData, error: onboardingError } = await createOnboarding({
        company_id: selectedCompanyId,
        project_id: selectedProjectId,
        author_id: authorId,
        title,
        created: created.toISOString(),
        status: "in_progress", // Set onboarding status
      });

      if (onboardingError) throw onboardingError;

      // Add field relationships if any fields were selected
      if (selectedFieldIds.length) {
        const { error: fieldError } = await replaceFieldsForOnboarding(
          onboardingData.id,
          selectedFieldIds.map(fieldId => ({
            field_id: fieldId,
            visible: true
          }))
        );

        if (fieldError) throw fieldError;
      }

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
